"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { useUIStore } from "@/stores/ui.store";
import type { RealtimeEvent } from "@/types/domain";

/**
 * Opens the SSE stream and reflects server-pushed order events into the UI:
 * invalidates cached order/store queries (TanStack Query refetches) and raises
 * the arrival overlay for brand-new orders — including orders created by an
 * external order app that NOTIFYs the shared Postgres.
 */
export function RealtimeBridge() {
  const utils = trpc.useUtils();
  const showArrival = useUIStore((s) => s.showArrival);

  useEffect(() => {
    const es = new EventSource("/api/events");

    es.onmessage = (ev) => {
      let e: RealtimeEvent;
      try {
        e = JSON.parse(ev.data) as RealtimeEvent;
      } catch {
        return;
      }
      if (e.type === "hello") return;

      // Any order change: refresh lists/detail/nearby.
      void utils.order.invalidate();

      if (e.type === "order.created" && e.orderId && e.orderNo) {
        showArrival({ orderId: e.orderId, orderNo: e.orderNo });
      }
    };

    es.onerror = () => {
      // EventSource reconnects automatically; nothing to do.
    };

    return () => es.close();
  }, [utils, showArrival]);

  return null;
}
