"use client";

import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { useOrderActions } from "@/lib/hooks";
import { useLiveClock } from "@/lib/useLiveClock";
import {
  ADVANCE_LABEL,
  carLine,
  fmtEta,
  fmtTime,
  isUrgent,
  liveEta,
  menuSummary,
} from "@/lib/format";
import type { OrderDTO } from "@/lib/trpc/types";
import type { OrderStatus } from "@/types/domain";

const ACTIONABLE: OrderStatus[] = ["accepted", "preparing", "ready"];

/** Compact order card. `showAdvance` adds the status-progress CTA (orders list). */
export function OrderCard({
  order,
  fetchedAt,
  showAdvance,
}: {
  order: OrderDTO;
  fetchedAt: number;
  showAdvance?: boolean;
}) {
  const router = useRouter();
  const now = useLiveClock();
  const { advance } = useOrderActions();
  const eta = liveEta(order.etaSeconds, fetchedAt, now);
  const urgent = isUrgent(order.status, eta);
  const canAdvance = showAdvance && ACTIONABLE.includes(order.status as OrderStatus);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm" style={{ animation: "plUp .25s ease" }}>
      <button
        type="button"
        onClick={() => router.push(`/orders/${order.id}`)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base">{order.orderNo}</span>
            <StatusBadge status={order.status} />
          </div>
          <span
            className="font-bold text-sm"
            style={{ color: urgent ? "#f04452" : "#4e5968" }}
          >
            {order.status === "done"
              ? "완료"
              : order.status === "rejected"
                ? "거절됨"
                : fmtEta(eta)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-ink-2">{menuSummary(order.items)}</span>
          <span className="text-[13px] text-ink-3">{order.carNumber}</span>
        </div>
      </button>

      {canAdvance ? (
        <button
          type="button"
          onClick={() => advance.mutate({ id: order.id })}
          className="mt-3.5 w-full text-white rounded-xl py-3 font-bold text-[15px]"
          style={{ background: "var(--color-accent)" }}
        >
          {ADVANCE_LABEL[order.status as OrderStatus]}
        </button>
      ) : null}
    </div>
  );
}

/** One-line completed-order row (home "최근 주문"). */
export function RecentRow({ order }: { order: OrderDTO }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(`/orders/${order.id}`)}
      className="w-full flex items-center justify-between px-4 py-3.5 border-t border-line first:border-t-0 text-left"
    >
      <div>
        <div className="font-bold text-[15px] text-ink-2">
          {order.orderNo} · {menuSummary(order.items)}
        </div>
        <div className="text-[12.5px] text-ink-4 mt-0.5">{fmtTime(order.createdAt)}</div>
      </div>
      <span className="text-[13px] font-bold text-ink-4">
        {order.status === "rejected" ? "거절" : "완료"}
      </span>
    </button>
  );
}
