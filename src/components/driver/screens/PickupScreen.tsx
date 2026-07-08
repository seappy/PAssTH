"use client";

import { Fragment } from "react";
import { trpc } from "@/lib/trpc/client";
import { useDriverStore } from "@/stores/driver.store";
import { ORDER_STEPS, formatWon, stepIndex } from "@/lib/driver/format";
import { CheckIcon, PinIcon } from "@/components/driver/Icons";

const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  new: { text: "접수 대기", color: "#8B95A1", bg: "#F2F4F6" },
  accepted: { text: "접수됨", color: "#3182F6", bg: "#EAF2FF" },
  preparing: { text: "준비중", color: "#B5710A", bg: "#FFF6E9" },
  ready: { text: "준비 완료", color: "#0FA968", bg: "#EAF9F0" },
  done: { text: "픽업 완료", color: "#0FA968", bg: "#EAF9F0" },
  rejected: { text: "주문 거절됨", color: "#E03131", bg: "#FFF0F0" },
};

export default function PickupScreen() {
  const placedOrder = useDriverStore((s) => s.placedOrder);
  const { data: order } = trpc.driver.order.useQuery(
    { id: placedOrder?.id as string },
    { enabled: !!placedOrder, refetchInterval: 4000 },
  );

  const status = order?.status ?? "new";
  const label = STATUS_LABEL[status] ?? STATUS_LABEL.new;
  const progressed = stepIndex(status);

  return (
    <div style={{ height: "100%", display: "flex", gap: 20, padding: "22px 28px" }}>
      <div
        style={{
          flex: 1.25,
          minWidth: 0,
          borderRadius: 20,
          backgroundImage: "repeating-linear-gradient(135deg,#EAEEF2 0 14px,#E1E6EB 14px 28px)",
          border: "1px solid #E4E8ED",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: 20, top: 18, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#AEB6BF", fontWeight: 600 }}>MAP · 픽업 위치</div>
        <div style={{ position: "absolute", left: "50%", top: "46%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", width: 26, height: 26 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#3182F6", animation: "pxring 1.8s ease-out infinite" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#3182F6", border: "3px solid #fff", boxShadow: "0 4px 12px rgba(49,130,246,.5)" }} />
          </div>
          <div style={{ background: "#fff", borderRadius: 12, padding: "9px 15px", fontSize: 15, color: "#191F28", fontWeight: 700, whiteSpace: "nowrap", boxShadow: "0 6px 18px rgba(20,40,80,.14)" }}>
            드라이브스루 픽업
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#3182F6", borderRadius: 20, padding: "22px 26px", marginBottom: 14, boxShadow: "0 14px 30px rgba(49,130,246,.28)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -30, top: -30, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.8)" }}>주문번호</div>
          <div className="num" style={{ fontSize: 40, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginTop: 2 }}>{order?.orderNo ?? placedOrder?.orderNo ?? "-"}</div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,.85)", marginTop: 6, fontWeight: 600 }}>
            {order ? `${order.items.length}개 상품 · ${formatWon(order.totalPrice)}원` : ""}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #EDF0F3", borderRadius: 18, padding: "18px 22px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(20,40,80,.03)" }}>
          <div>
            <div style={{ fontSize: 13, color: "#8B95A1", fontWeight: 600, marginBottom: 6 }}>내 차량</div>
            <div className="num" style={{ fontSize: 28, fontWeight: 800, color: "#191F28", letterSpacing: ".02em" }}>{order?.car.number ?? "-"}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: label.bg, borderRadius: 999, padding: "10px 18px" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: label.color, animation: "pxblink 1.3s infinite" }} />
            <span style={{ fontSize: 16, fontWeight: 800, color: label.color }}>{label.text}</span>
          </div>
        </div>

        {/* progress */}
        <div style={{ background: "#fff", border: "1px solid #EDF0F3", borderRadius: 18, padding: "20px 22px", marginBottom: 14, boxShadow: "0 2px 8px rgba(20,40,80,.03)" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {ORDER_STEPS.map((step, i) => {
              const doneStep = i <= progressed;
              const isLast = i === ORDER_STEPS.length - 1;
              return (
                <Fragment key={step.key}>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ width: 38, height: 38, margin: "0 auto 8px", borderRadius: "50%", background: doneStep ? "#15C47E" : "#E5E8EB", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckIcon />
                    </div>
                    <div style={{ fontSize: 13, color: doneStep ? "#191F28" : "#8B95A1", fontWeight: doneStep ? 800 : 600 }}>{step.label}</div>
                  </div>
                  {!isLast && <div style={{ flex: 1, height: 3, background: i < progressed ? "#15C47E" : "#E5E8EB", marginBottom: 22, borderRadius: 2 }} />}
                </Fragment>
              );
            })}
          </div>
        </div>

        <div style={{ background: "#FFF6E9", borderRadius: 16, padding: "15px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <PinIcon color="#FF8A00" size={22} />
          <div style={{ fontSize: 16, color: "#191F28", fontWeight: 600 }}>
            창구에서 <span style={{ color: "#B5710A", fontWeight: 700 }}>차량번호</span>로 확인해요
          </div>
        </div>
      </div>
    </div>
  );
}
