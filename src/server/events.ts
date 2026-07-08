import { EventEmitter } from "node:events";
import { Client } from "pg";
import type { RealtimeEvent } from "@/types/domain";

// Single Postgres channel; per-store filtering happens in `subscribe`.
// NOTIFY payloads are small JSON, well under Postgres' 8000-byte limit.
const CHANNEL = "pleos_events";

type Globals = {
  __pleosBus?: EventEmitter;
  __pleosListenerP?: Promise<Client>;
};
const g = globalThis as unknown as Globals;

function bus(): EventEmitter {
  if (!g.__pleosBus) {
    g.__pleosBus = new EventEmitter();
    g.__pleosBus.setMaxListeners(0); // many SSE subscribers
  }
  return g.__pleosBus;
}

/**
 * Lazily create ONE dedicated LISTEN connection for the process. Every NOTIFY
 * (from this app OR an external order app on the same DB) lands here and is
 * fanned out to in-process SSE subscribers via the EventEmitter.
 */
function listener(): Promise<Client> {
  if (g.__pleosListenerP) return g.__pleosListenerP;
  g.__pleosListenerP = (async () => {
    // LISTEN/NOTIFY needs a direct (session) connection — a transaction pooler
    // like Supabase's pgBouncer does not support it. Prefer DIRECT_URL; fall
    // back to DATABASE_URL for local Docker (where they're the same).
    const client = new Client({
      connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    });
    client.on("notification", (msg) => {
      if (!msg.payload) return;
      try {
        bus().emit("event", JSON.parse(msg.payload) as RealtimeEvent);
      } catch {
        /* ignore malformed payloads */
      }
    });
    client.on("error", (err) => {
      console.error("[events] listener connection error:", err);
      // Force re-init on next use.
      g.__pleosListenerP = undefined;
    });
    await client.connect();
    await client.query(`LISTEN ${CHANNEL}`);
    return client;
  })();
  return g.__pleosListenerP;
}

/** Broadcast an event to all listeners (round-trips through Postgres NOTIFY). */
export async function notify(evt: RealtimeEvent): Promise<void> {
  const client = await listener();
  await client.query("SELECT pg_notify($1, $2)", [CHANNEL, JSON.stringify(evt)]);
}

/** Subscribe to events for a single store. Returns an unsubscribe function. */
export async function subscribe(
  storeId: string,
  onEvent: (e: RealtimeEvent) => void,
): Promise<() => void> {
  await listener(); // ensure the LISTEN connection is live
  const handler = (e: RealtimeEvent) => {
    if (e.storeId === storeId) onEvent(e);
  };
  bus().on("event", handler);
  return () => bus().off("event", handler);
}
