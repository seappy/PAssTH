import { z } from "zod";
import { prisma } from "@/server/db";
import { createOrder } from "@/server/services/order.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public ingest endpoint for an external customer/order app. Authenticated with
// a shared store key (x-store-key header), NOT an owner session — the poster is
// a machine, not the merchant. Creates a new order and NOTIFYs the merchant app.
const bodySchema = z.object({
  storeId: z.string().optional(),
  customerMemo: z.string().optional(),
  prepMinutes: z.number().int().min(5).max(60).optional(),
  etaSeconds: z.number().int().min(0).optional(),
  distanceM: z.number().int().min(0).optional(),
  car: z
    .object({
      number: z.string().optional(),
      color: z.string().optional(),
      model: z.string().optional(),
      type: z.string().optional(),
    })
    .optional(),
  custLat: z.number().optional(),
  custLng: z.number().optional(),
  items: z
    .array(
      z.object({
        menuId: z.string().optional(),
        name: z.string().min(1),
        price: z.number().int().min(0),
        quantity: z.number().int().min(1).optional(),
        optionsText: z.string().optional(),
      }),
    )
    .min(1, "items must not be empty"),
});

export async function POST(req: Request) {
  const key = req.headers.get("x-store-key");
  if (!process.env.INGEST_API_KEY || key !== process.env.INGEST_API_KEY) {
    return Response.json({ error: "invalid store key" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // Resolve target store: explicit id, else the single/first store (demo).
  const store = input.storeId
    ? await prisma.store.findUnique({ where: { id: input.storeId } })
    : await prisma.store.findFirst({ orderBy: { createdAt: "asc" } });
  if (!store) {
    return Response.json({ error: "store not found" }, { status: 404 });
  }

  const order = await createOrder(store.id, {
    items: input.items,
    customerMemo: input.customerMemo ?? null,
    prepMinutes: input.prepMinutes,
    etaSeconds: input.etaSeconds,
    distanceM: input.distanceM,
    car: input.car,
    custLat: input.custLat ?? null,
    custLng: input.custLng ?? null,
  });

  return Response.json(
    { ok: true, id: order.id, orderNo: order.orderNo, storeId: store.id },
    { status: 201 },
  );
}
