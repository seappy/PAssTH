/**
 * Client-side types + helper for the conversational voice endpoint.
 *
 * The AI team's FastAPI (`api/`) owns the dialogue: `POST /order/turn` takes a
 * session id + utterance and returns a full turn (speech + screen hints + quick
 * actions + order summary). We proxy it through `/api/voice/turn` to keep the
 * service URL server-side. See `ai_docs.md` (POST /order/turn).
 */

export interface QuickAction {
  label: string;
  value: string;
}

export interface OrderSummaryItem {
  name?: string;
  quantity?: number;
  price?: number;
  options?: Record<string, unknown> | string | null;
}

export interface OrderSummary {
  order_id?: string;
  store_name?: string;
  items?: OrderSummaryItem[];
  total_price?: number;
  eta_minutes?: number;
  /** Set by our proxy once the order is mirrored into the merchant DB. */
  merchant_order_id?: string;
  merchant_order_no?: string;
  merchant_store_id?: string;
  merchant_store_name?: string;
  bridged?: boolean;
  [k: string]: unknown;
}

/** The driver's vehicle info, forwarded so the bridged merchant order carries it. */
export interface VoiceCarInfo {
  number?: string;
  color?: string;
  model?: string;
  type?: string;
}

/** A pickable menu item the AI offers during the menu_confirm turn. */
export interface MenuOption {
  menu_id: string;
  name: string;
  price?: number;
}

export interface TurnResponse {
  speech_text: string;
  screen: string | null;
  conversation_state: string;
  quick_actions: QuickAction[] | null;
  menu_options: MenuOption[] | null;
  order_summary: OrderSummary | null;
}

/**
 * Send one conversation turn through our proxy to the AI service. `car` is
 * forwarded so a completed order can be mirrored into the merchant DB with the
 * driver's vehicle info (the proxy strips it before calling the AI service).
 */
export async function postVoiceTurn(
  sessionId: string,
  utterance: string,
  car?: VoiceCarInfo,
): Promise<TurnResponse> {
  const res = await fetch("/api/voice/turn", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, utterance, car }),
  });
  if (!res.ok) throw new Error(`voice turn failed: ${res.status}`);
  return (await res.json()) as TurnResponse;
}
