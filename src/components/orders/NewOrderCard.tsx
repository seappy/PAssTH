"use client";

import { useRouter } from "next/navigation";
import { PrepStepper } from "@/components/PrepStepper";
import { IconClock } from "@/components/icons";
import { useOrderActions } from "@/lib/hooks";
import { useLiveClock } from "@/lib/useLiveClock";
import { carLine, fmtEta, liveEta, menuSummary } from "@/lib/format";
import type { OrderDTO } from "@/lib/trpc/types";

export function NewOrderCard({
  order,
  fetchedAt,
}: {
  order: OrderDTO;
  fetchedAt: number;
}) {
  const router = useRouter();
  const now = useLiveClock();
  const { accept, setPrep } = useOrderActions();
  const eta = liveEta(order.etaSeconds, fetchedAt, now);

  return (
    <div
      className="border-[1.5px] rounded-[18px] p-4"
      style={{
        borderColor: "var(--color-accent)",
        background: "color-mix(in srgb, var(--color-accent) 5%, #fff)",
        animation: "plUp .3s ease",
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-extrabold text-[17px]">{order.orderNo}</span>
        <span
          className="flex items-center gap-1.5 text-white font-bold text-[13px] rounded-full px-2.5 py-1"
          style={{ background: "var(--color-accent)" }}
        >
          <IconClock size={13} />
          {fmtEta(eta)}
        </span>
      </div>
      <div className="text-[15px] font-semibold mb-0.5">{menuSummary(order.items)}</div>
      <div className="text-[13px] text-ink-3">
        {order.carNumber} · {carLine(order)}
      </div>

      <div className="flex items-center justify-between mt-3.5 bg-white rounded-xl py-2 pl-3.5 pr-2.5">
        <span className="text-[13px] text-ink-3 font-semibold">예상 조리시간</span>
        <PrepStepper
          minutes={order.prepMinutes}
          onDown={() => setPrep.mutate({ id: order.id, delta: -5 })}
          onUp={() => setPrep.mutate({ id: order.id, delta: 5 })}
        />
      </div>

      <div className="flex gap-2 mt-2.5">
        <button
          type="button"
          onClick={() => router.push(`/orders/${order.id}`)}
          className="flex-1 border-[1.5px] border-line-2 rounded-xl text-center py-3 font-bold text-sm text-ink-2"
        >
          상세 보기
        </button>
        <button
          type="button"
          onClick={() => accept.mutate({ id: order.id, prepMinutes: order.prepMinutes })}
          className="flex-[1.4] text-white rounded-xl text-center py-3 font-bold text-[15px]"
          style={{
            background: "var(--color-accent)",
            boxShadow: "0 4px 12px -3px color-mix(in srgb, var(--color-accent) 60%, transparent)",
          }}
        >
          {order.prepMinutes}분 수락
        </button>
      </div>
    </div>
  );
}
