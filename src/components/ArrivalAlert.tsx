"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useUIStore } from "@/stores/ui.store";
import { carLine, fmtDist, menuSummary } from "@/lib/format";
import { IconCar } from "./icons";

/**
 * Full-frame overlay raised by RealtimeBridge when a new order arrives.
 * Fetches the order's details for the card body.
 */
export function ArrivalAlert() {
  const router = useRouter();
  const arrival = useUIStore((s) => s.arrival);
  const hide = useUIStore((s) => s.hideArrival);

  const { data: order } = trpc.order.byId.useQuery(
    { id: arrival?.orderId ?? "" },
    { enabled: !!arrival },
  );

  if (!arrival) return null;

  const dist = order ? fmtDist(order.distanceM) : "";

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(15,20,30,.5)", backdropFilter: "blur(2px)", animation: "plFade .2s ease" }}
    >
      <div
        className="w-full bg-white rounded-[26px] px-[22px] pt-[26px] pb-5 text-center"
        style={{ boxShadow: "0 24px 60px rgba(0,0,0,.35)", animation: "plUp .28s cubic-bezier(.2,.8,.3,1.2)" }}
      >
        <div
          className="w-16 h-16 rounded-[22px] flex items-center justify-center mx-auto mb-3.5"
          style={{ background: "color-mix(in srgb, var(--color-accent) 12%, #fff)", color: "var(--color-accent)" }}
        >
          <IconCar size={34} />
        </div>
        <div className="font-extrabold text-[22px] text-accent">신규 주문 도착!</div>
        <div className="text-[15px] text-ink-2 mt-1">
          {dist ? (
            <>
              매장 <b className="text-ink">{dist}</b> 이내 접근 중
            </>
          ) : (
            "새 픽업 주문이 들어왔어요"
          )}
        </div>

        <div className="bg-canvas rounded-2xl px-4 py-3.5 mt-4 text-left">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-base">{arrival.orderNo}</span>
            <span className="font-extrabold text-base tracking-tight">
              {order?.carNumber ?? ""}
            </span>
          </div>
          <div className="text-[13px] text-ink-3 mt-1">
            {order ? `${carLine(order)} · ${menuSummary(order.items)}` : "불러오는 중…"}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            hide();
            router.push(`/orders/${arrival.orderId}`);
          }}
          className="w-full rounded-[15px] py-[15px] font-bold text-base text-white mt-4"
          style={{ background: "var(--color-accent)", boxShadow: "0 8px 20px -6px color-mix(in srgb, var(--color-accent) 60%, transparent)" }}
        >
          주문 상세 보기
        </button>
        <button
          type="button"
          onClick={hide}
          className="w-full py-3.5 font-semibold text-[15px] text-ink-3"
        >
          나중에
        </button>
      </div>
    </div>
  );
}
