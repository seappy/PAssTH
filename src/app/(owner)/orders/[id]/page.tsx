"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { BackHeader } from "@/components/BackHeader";
import { PrepStepper } from "@/components/PrepStepper";
import { IconCar, IconMessage } from "@/components/icons";
import { useOrderActions } from "@/lib/hooks";
import { useLiveClock } from "@/lib/useLiveClock";
import { ADVANCE_LABEL, ADVANCE_NEXT, carLine, liveEta, won } from "@/lib/format";
import type { OrderStatus } from "@/types/domain";

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const now = useLiveClock();
  const { advance, accept, reject, setPrep } = useOrderActions();

  const orderQ = trpc.order.byId.useQuery({ id });
  const order = orderQ.data;

  if (!order) {
    return (
      <>
        <BackHeader title="주문" fallbackHref="/orders" />
        <div className="flex-1 flex items-center justify-center text-ink-4 text-sm bg-canvas">
          {orderQ.isLoading ? "불러오는 중…" : "주문을 찾을 수 없어요"}
        </div>
      </>
    );
  }

  const status = order.status as OrderStatus;
  const isNew = status === "new";
  const eta = liveEta(order.etaSeconds, orderQ.dataUpdatedAt || Date.now(), now);
  const min = Math.floor(eta / 60);
  const sec = String(eta % 60).padStart(2, "0");
  const pct = Math.min(96, Math.max(6, 100 - (order.etaSeconds / 900) * 100));
  const terminal = status === "done" || status === "rejected";

  const ctaLabel = isNew
    ? `${order.prepMinutes}분으로 수락`
    : (ADVANCE_LABEL[status] ??
      (status === "done" ? "완료된 주문" : "거절된 주문"));
  const ctaDisabled = !isNew && !ADVANCE_NEXT[status];

  const onCta = () => {
    if (isNew) {
      accept.mutate({ id: order.id, prepMinutes: order.prepMinutes });
    } else if (ADVANCE_NEXT[status]) {
      const wasLast = status === "ready";
      advance.mutate({ id: order.id });
      if (wasLast) router.push("/orders");
    }
  };

  return (
    <>
      <BackHeader
        title={`주문 ${order.orderNo}`}
        status={status}
        fallbackHref="/orders"
      />

      <div className="flex-1 min-h-0 overflow-y-auto pl-scroll px-5 pt-4 pb-5 bg-canvas">
        {/* big ETA */}
        <div
          className="rounded-[22px] px-5 py-[22px] text-center text-white mb-3.5"
          style={{
            background: "linear-gradient(135deg, var(--color-accent), #1b64da)",
            boxShadow: "0 12px 28px -10px color-mix(in srgb, var(--color-accent) 65%, transparent)",
          }}
        >
          <div className="text-[13.5px] opacity-90 font-semibold">
            {terminal ? "픽업 상태" : "고객 도착까지"}
          </div>
          {terminal ? (
            <div className="font-extrabold text-[40px] leading-tight my-1">
              {status === "done" ? "픽업 완료" : "주문 거절"}
            </div>
          ) : (
            <div
              className="font-extrabold text-[56px] leading-none tracking-tighter my-1"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {min}
              <span className="text-[30px] opacity-85">:{sec}</span>
            </div>
          )}
          <div
            className="h-1.5 rounded-full overflow-hidden mt-3.5 mx-1 mb-2"
            style={{ background: "rgba(255,255,255,.28)" }}
          >
            <div
              className="h-full bg-white rounded-full transition-[width] duration-1000 ease-linear"
              style={{ width: `${terminal ? 100 : pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-semibold opacity-90">
            <span>주문접수</span>
            <span>이동중</span>
            <span>도착</span>
          </div>
        </div>

        {/* car */}
        <div className="bg-white rounded-[18px] p-[18px] mb-3.5 shadow-sm">
          <span className="flex items-center gap-1.5 text-[13px] text-ink-3 font-semibold">
            <IconCar size={18} />
            차량 번호
          </span>
          <div
            className="font-extrabold text-[32px] tracking-tight mt-1.5 mb-3.5"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {order.carNumber ?? "-"}
          </div>
          <div className="flex gap-2">
            {[
              { k: "색상", v: order.carColor },
              { k: "차종", v: order.carModel },
              { k: "유형", v: order.carType },
            ].map((c) => (
              <div key={c.k} className="flex-1 bg-canvas rounded-xl p-2.5 text-center">
                <div className="text-[11px] text-ink-4 font-semibold">{c.k}</div>
                <div className="font-bold text-[15px] mt-0.5">{c.v ?? "-"}</div>
              </div>
            ))}
          </div>
          {order.customerMemo ? (
            <div
              className="flex gap-2 mt-3 rounded-xl p-3"
              style={{ background: "color-mix(in srgb, var(--color-accent) 7%, #fff)" }}
            >
              <span className="text-accent flex-none mt-px">
                <IconMessage size={18} />
              </span>
              <div className="text-[13.5px] text-[#3f4c5a] leading-snug">
                <b className="text-ink">고객 메모</b> · {order.customerMemo}
              </div>
            </div>
          ) : null}
        </div>

        {/* items */}
        <div className="font-bold text-base mx-0.5 mb-2.5">주문 상품</div>
        <div className="bg-white rounded-[18px] px-[18px] pt-1.5 pb-4 shadow-sm">
          {order.items.map((it) => (
            <div
              key={it.id}
              className="flex items-start justify-between py-3 border-b border-line"
            >
              <div>
                <div className="font-bold text-[15px]">
                  {it.nameSnap} <span className="text-ink-3 font-semibold">x{it.quantity}</span>
                </div>
                {it.optionsText ? (
                  <div className="text-[13px] text-ink-3 mt-0.5">{it.optionsText}</div>
                ) : null}
              </div>
              <span className="font-bold text-[15px]">
                {won(it.priceSnap * it.quantity)}
              </span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3.5 pb-1">
            <span className="font-bold text-[15px]">합계</span>
            <span className="font-extrabold text-xl">{won(order.totalPrice)}</span>
          </div>
        </div>

        {/* prep (new only) */}
        {isNew ? (
          <div className="bg-white rounded-[18px] px-[18px] py-4 mt-3.5 shadow-sm flex items-center justify-between">
            <div>
              <div className="font-bold text-[15px]">예상 조리시간</div>
              <div className="text-[13px] text-ink-3 mt-0.5">수락 시 고객에게 안내돼요</div>
            </div>
            <PrepStepper
              size="lg"
              minutes={order.prepMinutes}
              onDown={() => setPrep.mutate({ id: order.id, delta: -5 })}
              onUp={() => setPrep.mutate({ id: order.id, delta: 5 })}
            />
          </div>
        ) : null}
      </div>

      {/* CTA */}
      <div
        className="flex-none px-5 pt-3 pb-7 bg-white flex gap-2.5"
        style={{ boxShadow: "0 -4px 16px rgba(0,0,0,.04)" }}
      >
        {isNew ? (
          <button
            type="button"
            onClick={() => {
              reject.mutate({ id: order.id });
              router.push("/orders");
            }}
            className="flex-1 border-[1.5px] border-line-2 rounded-[14px] py-[15px] font-bold text-[15px] text-ink-2"
          >
            거절
          </button>
        ) : null}
        <button
          type="button"
          disabled={ctaDisabled}
          onClick={onCta}
          className="flex-[2] rounded-[14px] py-[15px] font-bold text-base text-white disabled:cursor-default"
          style={{
            background: ctaDisabled ? "#adb5bd" : "var(--color-accent)",
            boxShadow: ctaDisabled
              ? "none"
              : "0 6px 16px -6px color-mix(in srgb, var(--color-accent) 60%, transparent)",
          }}
        >
          {ctaLabel}
        </button>
      </div>
    </>
  );
}
