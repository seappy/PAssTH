// Client-safe domain constants (no Prisma import — usable in the browser bundle).

export const ORDER_STATUSES = [
  "new",
  "accepted",
  "preparing",
  "ready",
  "done",
  "rejected",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CONGESTION_LEVELS = ["low", "mid", "high"] as const;
export type Congestion = (typeof CONGESTION_LEVELS)[number];

// Realtime events pushed over SSE (and round-tripped through Postgres NOTIFY).
export type RealtimeEvent = {
  type: "order.created" | "order.updated" | "order.removed" | "hello";
  storeId: string;
  orderId?: string;
  orderNo?: string;
  status?: OrderStatus;
};
