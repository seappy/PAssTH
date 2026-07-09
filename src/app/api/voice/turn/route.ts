export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/server/db";
import { placeDriverOrder } from "@/server/services/driver.service";

/**
 * Proxy for the AI team's conversational endpoint. Forwards {session_id,
 * utterance} to `${VOICE_SERVICE_URL}/order/turn` (FastAPI) and returns the
 * turn. Keeps the service URL server-side; the browser only ever talks to us.
 *
 * When a turn completes an order (`conversation_state: "completed"` with an
 * `order_summary.order_id`), we ALSO bridge it into the merchant DB via the
 * shared `placeDriverOrder` (→ NOTIFY → shows up live on `/orders`). The AI
 * service owns the dialogue + its own order id; the merchant order is a mirror
 * so the store actually sees the voice order. We enrich the response with the
 * merchant order number so the UI can confirm "사장님 접수됨".
 */
const SERVICE_URL = process.env.VOICE_SERVICE_URL ?? "http://localhost:8000";
// The merchant `/orders` screen (storeProcedure) shows the demo owner's earliest
// store, so we mirror voice orders into that exact store — otherwise the order
// would land on a store the owner never sees.
const DEMO_OWNER_EMAIL = process.env.DEMO_OWNER_EMAIL ?? "owner@pleos.dev";

interface OrderSummaryItem {
  name?: string;
  quantity?: number;
  price?: number;
  options?: unknown;
}
interface OrderSummary {
  order_id?: string;
  store_name?: string;
  items?: OrderSummaryItem[];
  total_price?: number;
  eta_minutes?: number;
  merchant_order_id?: string;
  merchant_order_no?: string;
  merchant_store_id?: string;
  merchant_store_name?: string;
  bridged?: boolean;
  [k: string]: unknown;
}
interface TurnResponse {
  speech_text?: string;
  conversation_state?: string;
  order_summary?: OrderSummary | null;
  [k: string]: unknown;
}
interface CarInfo {
  number?: string;
  color?: string;
  model?: string;
  type?: string;
}

// Dedupe: never create two merchant orders for the same AI order id (the same
// completed turn could be resent, e.g. on a retry). Process-local is enough for
// this demo.
const bridgedOrderIds = new Set<string>();

/** Normalize a store name for fuzzy matching: drop spaces, parentheticals, case. */
function normalizeStoreName(s: string): string {
  return s
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

/**
 * Match the AI's chosen store (from Kakao) to a real merchant store by name, so
 * the voice order lands on the actual branch when it exists in the DB. The DB
 * stores come from the same Kakao Pangyo dataset, so names line up closely
 * (e.g. "카페몬지 판교점", "폭스트롯(fxtrt)"). Falls back to null if no confident
 * match, and the caller routes to the owner's default store instead.
 */
function matchStoreByName<T extends { id: string; name: string }>(
  stores: T[],
  aiName?: string,
): T | null {
  const target = aiName ? normalizeStoreName(aiName) : "";
  if (!target) return null;
  const exact = stores.find((s) => normalizeStoreName(s.name) === target);
  if (exact) return exact;
  return (
    stores.find((s) => {
      const n = normalizeStoreName(s.name);
      return n.length > 1 && (n.includes(target) || target.includes(n));
    }) ?? null
  );
}

/** Build merchant order line items from the AI summary, with a safe fallback. */
function toMerchantItems(summary: OrderSummary) {
  const raw = Array.isArray(summary.items) ? summary.items : [];
  const items = raw
    .filter((it) => (it?.name ?? "").trim().length > 0)
    .map((it) => ({
      name: String(it.name).trim(),
      price: Math.max(0, Math.round(Number(it.price ?? 0)) || 0),
      quantity: Math.max(1, Math.round(Number(it.quantity ?? 1)) || 1),
      optionsText: typeof it.options === "string" ? it.options : undefined,
    }));
  if (items.length > 0) return items;
  // Fallback: the AI turn gives no line breakdown at completion — mirror it as a
  // single summary line so the total still matches on the merchant side.
  return [
    {
      name: summary.store_name ? `${summary.store_name} 음성주문` : "음성주문",
      price: Math.max(0, Math.round(Number(summary.total_price ?? 0)) || 0),
      quantity: 1,
      optionsText: undefined,
    },
  ];
}

/**
 * Mirror a completed AI order into the merchant DB. Best-effort: any failure is
 * swallowed so it never breaks the conversational turn. Returns the merchant
 * order number when created.
 */
async function bridgeOrder(
  summary: OrderSummary,
  car?: CarInfo,
): Promise<{ id: string; orderNo: string; storeId: string; storeName: string } | null> {
  const aiOrderId = summary.order_id;
  if (!aiOrderId || bridgedOrderIds.has(aiOrderId)) return null;

  // Resolve the merchant. The demo owner's stores are what the merchant app can
  // see (storeProcedure uses this owner). The real brand/store name is also kept
  // in the memo + item name for traceability.
  const owner =
    (await prisma.user.findUnique({ where: { email: DEMO_OWNER_EMAIL } })) ??
    (await prisma.user.findFirst({ orderBy: { createdAt: "asc" } }));
  if (!owner) return null;

  // Prefer the actual branch the AI picked when it exists in the DB; otherwise
  // fall back to the owner's earliest store (what /orders shows by default).
  const stores = await prisma.store.findMany({
    where: { ownerId: owner.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
  if (stores.length === 0) return null;
  const store = matchStoreByName(stores, summary.store_name) ?? stores[0];

  bridgedOrderIds.add(aiOrderId);
  try {
    const memo = ["음성주문", summary.store_name, aiOrderId].filter(Boolean).join(" · ");
    const result = await placeDriverOrder(store.id, {
      items: toMerchantItems(summary),
      car: car ?? undefined,
      customerMemo: memo,
      etaSeconds: summary.eta_minutes != null ? Math.round(Number(summary.eta_minutes) * 60) : undefined,
      custLat: null,
      custLng: null,
    });
    return result?.id
      ? { id: result.id, orderNo: result.orderNo, storeId: store.id, storeName: store.name }
      : null;
  } catch {
    bridgedOrderIds.delete(aiOrderId); // allow a later retry
    return null;
  }
}

export async function POST(req: Request) {
  let body: { session_id?: string; utterance?: string; car?: CarInfo } | undefined;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const car = body?.car;
  const upstreamBody = { session_id: body?.session_id, utterance: body?.utterance };

  try {
    const res = await fetch(`${SERVICE_URL}/order/turn`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(upstreamBody),
      // Voice turns can call an LLM; give it room but don't hang forever.
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      return Response.json({ error: "voice service error", status: res.status }, { status: 502 });
    }
    const turn = (await res.json()) as TurnResponse;

    // Bridge on completion so the store actually receives the voice order.
    if (turn.conversation_state === "completed" && turn.order_summary?.order_id) {
      const bridged = await bridgeOrder(turn.order_summary, car);
      if (bridged) {
        turn.order_summary = {
          ...turn.order_summary,
          merchant_order_id: bridged.id,
          merchant_order_no: bridged.orderNo,
          merchant_store_id: bridged.storeId,
          merchant_store_name: bridged.storeName,
          bridged: true,
        };
      }
    }

    return Response.json(turn);
  } catch {
    return Response.json(
      { error: "voice service unreachable", serviceUrl: SERVICE_URL },
      { status: 503 },
    );
  }
}
