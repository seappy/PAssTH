"use client";

import { Fragment, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useDriverStore } from "@/stores/driver.store";
import {
  DRIVER_ORIGIN,
  ORDER_STEPS,
  drivingEtaSeconds,
  formatClock,
  formatCountdown,
  formatDistance,
  formatWon,
  haversineMeters,
  stepIndex,
} from "@/lib/driver/format";
import { DriverMap } from "@/components/driver/DriverMap";
import { ArrowRightIcon, CheckIcon } from "@/components/driver/Icons";
import OrderHistoryScreen from "./OrderHistoryScreen";

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

export default function PickupScreen() {
  const placedOrder = useDriverStore((s) => s.placedOrder);
  const resetOrder = useDriverStore((s) => s.resetOrder);
  const goto = useDriverStore((s) => s.goto);
  const driverLoc = useDriverStore((s) => s.driverLoc) ?? DRIVER_ORIGIN;

  const { data: order, isLoading } = trpc.driver.order.useQuery(
    { id: placedOrder?.id as string },
    { enabled: !!placedOrder, refetchInterval: 4000 },
  );

  const status = order?.status ?? "new";
  const hasActiveOrder =
    !!placedOrder &&
    (isLoading || (status !== "done" && status !== "rejected"));

  if (!hasActiveOrder) {
    return <OrderHistoryScreen />;
  }

  const now = useNow(status === "accepted" || status === "preparing");
  const [mountTime] = useState(() => Date.now());

  // Pickup complete → move to the feedback screen automatically.
  useEffect(() => {
    if (status === "done") {
      const t = setTimeout(() => goto(8), 1500);
      return () => clearTimeout(t);
    }
  }, [status, goto]);

  const storeLoc = order?.store?.lat != null && order?.store?.lng != null
    ? { lat: order.store.lat, lng: order.store.lng }
    : null;
  const distanceM = storeLoc ? haversineMeters(driverLoc, storeLoc) : null;
  const arrivalMs = distanceM != null ? mountTime + drivingEtaSeconds(distanceM) * 1000 : null;

  const updatedMs = order?.updatedAt ? new Date(order.updatedAt).getTime() : null;
  const prepMs = (order?.prepMinutes ?? 10) * 60000;
  const readyMs = updatedMs != null ? updatedMs + prepMs : null;
  const remaining = readyMs != null ? readyMs - now : null;

  const progressed = stepIndex(status);
  const rejected = status === "rejected";
  const showTimeline = status === "accepted" || status === "preparing" || status === "ready";

  return (
    <div style={{ height: "100%", display: "flex", gap: 20, padding: "22px 28px" }}>
      {/* real map: store + car + route */}
      <div style={{ flex: 1.25, minWidth: 0 }}>
        <DriverMap store={storeLoc} driver={driverLoc} distanceM={distanceM} />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {status === "new" && <WaitCard />}
        {showTimeline && (
          <TimelineCard
            status={status}
            arrivalMs={arrivalMs}
            distanceM={distanceM}
            readyMs={readyMs}
            remaining={remaining}
            prepMinutes={order?.prepMinutes ?? 10}
          />
        )}
        {rejected && <RejectCard />}

        {/* order + car */}
        <div style={{ background: "#fff", border: "1px solid #EDF0F3", borderRadius: 18, padding: "16px 22px", margin: "14px 0", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(20,40,80,.03)" }}>
          <div>
            <div style={{ fontSize: 13, color: "#8B95A1", fontWeight: 600, marginBottom: 4 }}>주문번호 · 내 차량</div>
            <div className="num" style={{ fontSize: 24, fontWeight: 800, color: "#191F28", letterSpacing: ".02em" }}>
              {order?.orderNo ?? placedOrder?.orderNo ?? "-"} <span style={{ color: "#8B95A1", fontWeight: 700 }}>·</span> {order?.car.number ?? "-"}
            </div>
          </div>
          {order && (
            <div className="num" style={{ fontSize: 15, color: "#8B95A1", fontWeight: 600 }}>{order.items.length}개 · {formatWon(order.totalPrice)}원</div>
          )}
        </div>

        {rejected ? (
          <div
            onClick={resetOrder}
            style={{ marginTop: "auto", height: 66, borderRadius: 16, background: "#3182F6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 19, fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 24px rgba(49,130,246,.3)" }}
          >
            다시 주문하기
            <ArrowRightIcon size={22} color="#fff" strokeWidth={2.4} />
          </div>
        ) : (
          <>
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

            {status === "ready" || status === "done" ? (
              <div
                onClick={() => goto(8)}
                style={{ height: 62, borderRadius: 16, background: "#3182F6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 19, fontWeight: 800, cursor: "pointer", animation: "pxcta 1.6s ease-in-out infinite" }}
              >
                <CheckIcon size={22} strokeWidth={2.6} /> 픽업 완료 · 평가하기
              </div>
            ) : (
              <div style={{ background: "#FFF6E9", borderRadius: 16, padding: "15px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>📍</span>
                <div style={{ fontSize: 16, color: "#191F28", fontWeight: 600 }}>
                  창구에서 <span style={{ color: "#B5710A", fontWeight: 700 }}>차량번호</span>로 확인해요
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Two-timeline hero: 내 도착 vs 준비 완료, with a convergence verdict. */
function TimelineCard({
  status,
  arrivalMs,
  distanceM,
  readyMs,
  remaining,
  prepMinutes,
}: {
  status: string;
  arrivalMs: number | null;
  distanceM: number | null;
  readyMs: number | null;
  remaining: number | null;
  prepMinutes: number;
}) {
  const v = verdict(status, arrivalMs, readyMs);
  const readyIsNow = status === "ready";

  return (
    <div style={{ background: "#fff", border: "1px solid #EDF0F3", borderRadius: 20, padding: "20px 22px", boxShadow: "0 6px 18px rgba(20,40,80,.06)" }}>
      <div style={{ display: "flex" }}>
        {/* arrival */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "#8B95A1", fontWeight: 700, marginBottom: 6 }}>🚗 내 도착</div>
          <div className="num" style={{ fontSize: 34, fontWeight: 800, color: "#191F28", lineHeight: 1 }}>
            {arrivalMs != null ? formatClock(arrivalMs) : "--:--"}
          </div>
          <div className="num" style={{ fontSize: 14, color: "#8B95A1", fontWeight: 600, marginTop: 5 }}>
            {distanceM != null ? `${formatDistance(distanceM)} 남음` : ""}
          </div>
        </div>
        <div style={{ width: 1, background: "#EDF0F3", margin: "2px 18px" }} />
        {/* ready */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "#8B95A1", fontWeight: 700, marginBottom: 6 }}>🍳 준비 완료</div>
          <div className="num" style={{ fontSize: 34, fontWeight: 800, color: readyIsNow ? "#3182F6" : "#191F28", lineHeight: 1 }}>
            {readyIsNow ? "완료" : readyMs != null ? formatClock(readyMs) : "--:--"}
          </div>
          <div className="num" style={{ fontSize: 14, color: "#8B95A1", fontWeight: 600, marginTop: 5 }}>
            {status === "preparing" && remaining != null
              ? `완료까지 ${formatCountdown(remaining)}`
              : readyIsNow
                ? "지금 픽업 가능"
                : `약 ${prepMinutes}분`}
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #F2F4F6", marginTop: 16, paddingTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: v.color }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: v.color }}>{v.text}</span>
      </div>
    </div>
  );
}

function verdict(status: string, arrivalMs: number | null, readyMs: number | null): { text: string; color: string } {
  const GREEN = "#3182F6"; // positive verdicts use the brand blue (per design)
  const ORANGE = "#E8890C";
  if (status === "ready") return { text: "준비 완료! 도착하면 바로 픽업", color: GREEN };
  if (arrivalMs == null || readyMs == null) return { text: "도착 시간에 맞춰 준비해요", color: "#3182F6" };
  const diffMin = Math.round((arrivalMs - readyMs) / 60000);
  if (Math.abs(diffMin) <= 2) return { text: "도착 시간에 딱 맞춰 준비돼요 ✨", color: GREEN };
  if (diffMin > 2) return { text: "도착 전 미리 준비돼요 · 바로 픽업", color: GREEN };
  return { text: `도착 후 약 ${-diffMin}분 대기`, color: ORANGE };
}

function WaitCard() {
  return (
    <div style={{ background: "#4E5968", borderRadius: 20, padding: "22px 26px", boxShadow: "0 14px 30px rgba(78,89,104,.2)" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.8)" }}>매장 확인 중</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "#fff", marginTop: 4 }}>접수 대기 중</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,.8)", marginTop: 4 }}>매장이 주문을 확인하면 알려드려요</div>
    </div>
  );
}

function RejectCard() {
  return (
    <div style={{ background: "linear-gradient(135deg,#F04452,#D6303E)", borderRadius: 20, padding: "22px 26px", boxShadow: "0 14px 30px rgba(240,68,82,.24)" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.9)" }}>주문 상태</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "#fff", marginTop: 4 }}>주문이 거절되었어요</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,.9)", marginTop: 4 }}>매장 사정으로 주문을 받지 못했어요. 다시 시도해 주세요.</div>
    </div>
  );
}
