"use client";

import { Fragment, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useDriverStore } from "@/stores/driver.store";
import {
  DRIVER_ORIGIN,
  ORDER_STEPS,
  drivingEtaSeconds,
  ellipsis,
  formatClock,
  formatCountdown,
  formatDistance,
  formatWon,
  haversineMeters,
  stepIndex,
} from "@/lib/driver/format";
import { DriverMap } from "@/components/driver/DriverMap";
import { ArrowRightIcon, CheckIcon } from "@/components/driver/Icons";
import type { OrderStatus } from "@/types/domain";

type HistoryRow = {
  id: string;
  orderNo: string;
  status: string;
  storeId: string;
  createdAt: Date;
  totalPrice: number;
  storeName: string;
  itemSummary: string;
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "접수 대기",
  accepted: "수락됨",
  preparing: "준비 중",
  ready: "픽업 가능",
  done: "완료",
  rejected: "거절",
};

function isActive(status: string) {
  return status !== "done" && status !== "rejected";
}

function fmtWhen(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const time = date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `오늘 ${time}`;
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

/** Driver nav "주문" tab — left list, right status / promo / map. */
export default function OrdersTabScreen() {
  const carNumber = useDriverStore((s) => s.car.number);
  const placedOrder = useDriverStore((s) => s.placedOrder);
  const driverLoc = useDriverStore((s) => s.driverLoc) ?? DRIVER_ORIGIN;
  const goto = useDriverStore((s) => s.goto);
  const resetOrder = useDriverStore((s) => s.resetOrder);
  const resumeOrder = useDriverStore((s) => s.resumeOrder);
  const clearPlacedOrder = useDriverStore((s) => s.clearPlacedOrder);
  const reorderFromHistory = useDriverStore((s) => s.reorderFromHistory);

  const { data: orders, isLoading: listLoading } = trpc.driver.orderHistory.useQuery(
    { carNumber },
    { enabled: !!carNumber.trim() },
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mountTime] = useState(() => Date.now());

  // Keep a valid selection as the list loads / updates.
  useEffect(() => {
    if (!orders?.length) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) => {
      if (prev && orders.some((o) => o.id === prev)) return prev;
      if (placedOrder && orders.some((o) => o.id === placedOrder.id)) return placedOrder.id;
      const active = orders.find((o) => isActive(o.status));
      return active?.id ?? orders[0].id;
    });
  }, [orders, placedOrder?.id]);

  const selectedRow = orders?.find((o) => o.id === selectedId) ?? null;
  const detailActive = selectedRow ? isActive(selectedRow.status) : false;

  const { data: detail, isLoading: detailLoading } = trpc.driver.order.useQuery(
    { id: selectedId as string },
    { enabled: !!selectedId, refetchInterval: detailActive ? 4000 : false },
  );

  const status = detail?.status ?? selectedRow?.status ?? "new";
  const now = useNow(detailActive && (status === "accepted" || status === "preparing"));

  // Pickup complete → feedback (only for the order we just placed).
  useEffect(() => {
    if (status !== "done" || !placedOrder || placedOrder.id !== selectedId) return;
    const t = setTimeout(() => goto(8), 1500);
    return () => clearTimeout(t);
  }, [status, placedOrder, selectedId, goto]);

  const onSelect = (row: HistoryRow) => {
    setSelectedId(row.id);
    if (isActive(row.status)) {
      resumeOrder({ id: row.id, orderNo: row.orderNo, storeId: row.storeId });
    } else {
      clearPlacedOrder();
    }
  };

  const storeLoc =
    detail?.store?.lat != null && detail?.store?.lng != null
      ? { lat: detail.store.lat, lng: detail.store.lng }
      : null;
  const distanceM = storeLoc ? haversineMeters(driverLoc, storeLoc) : null;
  const arrivalMs = distanceM != null ? mountTime + drivingEtaSeconds(distanceM) * 1000 : null;
  const updatedMs = detail?.updatedAt ? new Date(detail.updatedAt).getTime() : null;
  const prepMs = (detail?.prepMinutes ?? 10) * 60000;
  const readyMs = updatedMs != null ? updatedMs + prepMs : null;
  const remaining = readyMs != null ? readyMs - now : null;
  const progressed = stepIndex(status);
  const rejected = status === "rejected";
  const showTimeline = status === "accepted" || status === "preparing" || status === "ready";

  return (
    <div style={{ height: "100%", display: "flex", gap: 20, padding: "22px 28px" }}>
      {/* left — order list */}
      <div
        style={{
          flex: "0 0 38%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          border: "1px solid #EDF0F3",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(20,40,80,.03)",
        }}
      >
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #F2F4F6", flex: "0 0 auto" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#8B95A1" }}>주문 기록</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#191F28", marginTop: 2 }}>
            {carNumber || "내 차량"}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }} className="pl-scroll">
          {listLoading && <CenterNote text="불러오는 중…" />}
          {!listLoading && (orders?.length ?? 0) === 0 && (
            <CenterNote text="아직 주문 기록이 없어요" />
          )}
          {(orders ?? []).map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              selected={o.id === selectedId}
              onClick={() => onSelect(o)}
            />
          ))}
        </div>
      </div>

      {/* right — detail / promo / map */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        {!selectedRow && !listLoading && (
          <PromoPanel onOrder={() => goto(2)} />
        )}

        {selectedRow && detailActive && (
          <>
            <div style={{ flex: "1 1 42%", minHeight: 160 }}>
              <DriverMap store={storeLoc} driver={driverLoc} distanceM={distanceM} />
            </div>
            <div style={{ flex: "1 1 58%", minHeight: 0, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }} className="pl-scroll">
              {status === "new" && <WaitCard />}
              {showTimeline && (
                <TimelineCard
                  status={status}
                  arrivalMs={arrivalMs}
                  distanceM={distanceM}
                  readyMs={readyMs}
                  remaining={remaining}
                  prepMinutes={detail?.prepMinutes ?? 10}
                />
              )}
              {rejected && <RejectCard />}
              <OrderSummaryCard
                orderNo={detail?.orderNo ?? selectedRow.orderNo}
                carNumber={detail?.car.number}
                itemCount={detail?.items.length}
                totalPrice={detail?.totalPrice ?? selectedRow.totalPrice}
                storeName={selectedRow.storeName}
                itemSummary={selectedRow.itemSummary}
              />
              {!rejected && status !== "ready" && status !== "done" && (
                <HintBanner />
              )}
              {(status === "ready" || status === "done") && !rejected && (
                <ActionButton label="픽업 완료 · 평가하기" onClick={() => goto(8)} pulse />
              )}
              {rejected && (
                <ActionButton
                  label="다시 주문하기"
                  onClick={() => {
                    resetOrder();
                    goto(2);
                  }}
                />
              )}
            </div>
          </>
        )}

        {selectedRow && !detailActive && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
            <CompletedSummary row={selectedRow} status={status as OrderStatus} detail={detail} />
            <ActionButton
              label={detailLoading ? "주문 내역 불러오는 중…" : "이대로 주문하기?"}
              onClick={() => {
                if (!detail?.items.length) return;
                reorderFromHistory({
                  storeId: detail.storeId ?? selectedRow.storeId,
                  items: detail.items,
                  customerMemo: detail.customerMemo,
                });
              }}
              pulse={!detailLoading && !!detail?.items.length}
              disabled={detailLoading || !detail?.items.length}
            />
            <PromoPanel compact onOrder={() => goto(2)} />
          </div>
        )}
      </div>
    </div>
  );
}

function OrderRow({
  order,
  selected,
  onClick,
}: {
  order: HistoryRow;
  selected: boolean;
  onClick: () => void;
}) {
  const status = order.status as OrderStatus;
  const done = status === "done" || status === "rejected";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        background: selected ? "#EAF2FF" : "#F7F8FA",
        border: selected ? "1.5px solid #3182F6" : "1.5px solid transparent",
        borderRadius: 14,
        padding: "14px 14px",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
        <span className="num" style={{ fontSize: 16, fontWeight: 800, color: "#191F28" }}>
          {order.orderNo}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: done ? "#8B95A1" : "#3182F6" }}>
          {STATUS_LABEL[status] ?? order.status}
        </span>
      </div>
      <div style={{ ...ellipsis, fontSize: 14, fontWeight: 700, color: "#191F28" }} title={order.storeName}>
        {order.storeName}
      </div>
      <div style={{ ...ellipsis, fontSize: 13, color: "#8B95A1", marginTop: 2 }}>{order.itemSummary}</div>
      <div style={{ fontSize: 12, color: "#B0B8C1", marginTop: 6 }}>{fmtWhen(order.createdAt)}</div>
    </button>
  );
}

function OrderSummaryCard({
  orderNo,
  carNumber,
  itemCount,
  totalPrice,
  storeName,
  itemSummary,
}: {
  orderNo: string;
  carNumber?: string | null;
  itemCount?: number;
  totalPrice: number;
  storeName: string;
  itemSummary: string;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #EDF0F3", borderRadius: 18, padding: "16px 20px", boxShadow: "0 2px 8px rgba(20,40,80,.03)" }}>
      <div style={{ ...ellipsis, fontSize: 14, fontWeight: 700, color: "#8B95A1", marginBottom: 8 }} title={storeName}>
        {storeName}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "#8B95A1", fontWeight: 600, marginBottom: 4 }}>주문번호 · 차량</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 800, color: "#191F28" }}>
            {orderNo} <span style={{ color: "#8B95A1" }}>·</span> {carNumber ?? "-"}
          </div>
        </div>
        {itemCount != null && (
          <div className="num" style={{ fontSize: 14, color: "#8B95A1", fontWeight: 600, flex: "0 0 auto" }}>
            {itemCount}개 · {formatWon(totalPrice)}원
          </div>
        )}
      </div>
      <div style={{ ...ellipsis, fontSize: 14, color: "#4E5968", marginTop: 10 }}>{itemSummary}</div>
    </div>
  );
}

function CompletedSummary({
  row,
  status,
  detail,
}: {
  row: HistoryRow;
  status: OrderStatus;
  detail?: {
    items: { name: string; price: number; quantity: number; optionsText?: string | null }[];
    customerMemo?: string | null;
  };
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #EDF0F3", borderRadius: 20, padding: "24px 26px", boxShadow: "0 4px 16px rgba(20,40,80,.05)" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#8B95A1", marginBottom: 8 }}>{STATUS_LABEL[status]}</div>
      <div className="num" style={{ fontSize: 32, fontWeight: 800, color: "#191F28", marginBottom: 6 }}>{row.orderNo}</div>
      <div style={{ ...ellipsis, fontSize: 18, fontWeight: 700, color: "#191F28", marginBottom: 4 }} title={row.storeName}>
        {row.storeName}
      </div>
      {detail?.items.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {detail.items.map((it, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 15, color: "#4E5968" }}>
              <span style={{ ...ellipsis, flex: 1 }}>
                {it.name}
                {it.optionsText ? ` · ${it.optionsText}` : ""}
              </span>
              <span className="num" style={{ fontWeight: 700, flex: "0 0 auto" }}>
                {it.quantity}개 · {formatWon(it.price * it.quantity)}원
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 15, color: "#4E5968", marginBottom: 4 }}>{row.itemSummary}</div>
      )}
      <div className="num" style={{ fontSize: 20, fontWeight: 800, color: "#3182F6" }}>{formatWon(row.totalPrice)}원</div>
      {detail?.customerMemo ? (
        <div style={{ fontSize: 14, color: "#8B95A1", marginTop: 10, lineHeight: 1.4 }}>
          요청: {detail.customerMemo}
        </div>
      ) : null}
      <div style={{ fontSize: 13, color: "#B0B8C1", marginTop: 10 }}>{fmtWhen(row.createdAt)}</div>
    </div>
  );
}

function PromoPanel({ onOrder, compact }: { onOrder: () => void; compact?: boolean }) {
  return (
    <div
      style={{
        flex: compact ? "0 0 auto" : 1,
        background: "linear-gradient(135deg,#3182F6 0%,#2B6EE0 100%)",
        borderRadius: 20,
        padding: compact ? "22px 24px" : "32px 34px",
        display: "flex",
        flexDirection: "column",
        justifyContent: compact ? "flex-start" : "center",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 16px 36px rgba(49,130,246,.28)",
      }}
    >
      <div style={{ position: "absolute", right: -30, top: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
      <div style={{ fontSize: compact ? 22 : 28, fontWeight: 800, color: "#fff", lineHeight: 1.3, letterSpacing: "-.02em", position: "relative" }}>
        {compact ? (
          "다음 픽업도 미리 주문하세요"
        ) : (
          <>
            가는 길에,
            <br />
            미리 주문하세요
          </>
        )}
      </div>
      <div style={{ fontSize: 15, color: "rgba(255,255,255,.85)", marginTop: 8, fontWeight: 500, position: "relative" }}>
        경로 주변 매장을 ETA 순으로 추천해 드려요
      </div>
      <div
        onClick={onOrder}
        style={{
          marginTop: compact ? 16 : 24,
          alignSelf: "flex-start",
          height: 52,
          padding: "0 24px",
          borderRadius: 14,
          background: "#fff",
          color: "#191F28",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 16,
          fontWeight: 800,
          cursor: "pointer",
          position: "relative",
          boxShadow: "0 6px 16px rgba(0,0,0,.12)",
        }}
      >
        주문 시작하기
        <ArrowRightIcon strokeWidth={2.4} />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  pulse,
  disabled,
}: {
  label: string;
  onClick: () => void;
  pulse?: boolean;
  disabled?: boolean;
}) {
  const inactive = disabled;
  return (
    <div
      onClick={() => !inactive && onClick()}
      style={{
        height: 58,
        borderRadius: 16,
        background: inactive ? "#C4CBD3" : "#3182F6",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        fontSize: 18,
        fontWeight: 800,
        cursor: inactive ? "default" : "pointer",
        boxShadow: inactive ? "none" : "0 10px 24px rgba(49,130,246,.3)",
        animation: pulse ? "pxcta 1.6s ease-in-out infinite" : undefined,
      }}
    >
      <CheckIcon size={20} strokeWidth={2.6} />
      {label}
    </div>
  );
}

function HintBanner() {
  return (
    <div style={{ background: "#FFF6E9", borderRadius: 16, padding: "15px 20px", display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 20 }}>📍</span>
      <div style={{ fontSize: 15, color: "#191F28", fontWeight: 600 }}>
        창구에서 <span style={{ color: "#B5710A", fontWeight: 700 }}>차량번호</span>로 확인해요
      </div>
    </div>
  );
}

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
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "#8B95A1", fontWeight: 700, marginBottom: 6 }}>🚗 내 도착</div>
          <div className="num" style={{ fontSize: 30, fontWeight: 800, color: "#191F28", lineHeight: 1 }}>
            {arrivalMs != null ? formatClock(arrivalMs) : "--:--"}
          </div>
          <div className="num" style={{ fontSize: 13, color: "#8B95A1", fontWeight: 600, marginTop: 5 }}>
            {distanceM != null ? `${formatDistance(distanceM)} 남음` : ""}
          </div>
        </div>
        <div style={{ width: 1, background: "#EDF0F3", margin: "2px 14px" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "#8B95A1", fontWeight: 700, marginBottom: 6 }}>🍳 준비 완료</div>
          <div className="num" style={{ fontSize: 30, fontWeight: 800, color: readyIsNow ? "#3182F6" : "#191F28", lineHeight: 1 }}>
            {readyIsNow ? "완료" : readyMs != null ? formatClock(readyMs) : "--:--"}
          </div>
          <div className="num" style={{ fontSize: 13, color: "#8B95A1", fontWeight: 600, marginTop: 5 }}>
            {status === "preparing" && remaining != null
              ? `완료까지 ${formatCountdown(remaining)}`
              : readyIsNow
                ? "지금 픽업 가능"
                : `약 ${prepMinutes}분`}
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid #F2F4F6", marginTop: 14, paddingTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: v.color }} />
        <span style={{ fontSize: 15, fontWeight: 700, color: v.color }}>{v.text}</span>
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center" }}>
        {ORDER_STEPS.map((step, i) => {
          const doneStep = i <= stepIndex(status);
          const isLast = i === ORDER_STEPS.length - 1;
          return (
            <Fragment key={step.key}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ width: 32, height: 32, margin: "0 auto 6px", borderRadius: "50%", background: doneStep ? "#15C47E" : "#E5E8EB", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckIcon size={14} />
                </div>
                <div style={{ fontSize: 11, color: doneStep ? "#191F28" : "#8B95A1", fontWeight: doneStep ? 800 : 600 }}>{step.label}</div>
              </div>
              {!isLast && <div style={{ flex: 1, height: 3, background: i < stepIndex(status) ? "#15C47E" : "#E5E8EB", marginBottom: 18, borderRadius: 2 }} />}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function verdict(status: string, arrivalMs: number | null, readyMs: number | null): { text: string; color: string } {
  const GREEN = "#3182F6";
  const ORANGE = "#E8890C";
  if (status === "ready") return { text: "준비 완료! 도착하면 바로 픽업", color: GREEN };
  if (arrivalMs == null || readyMs == null) return { text: "도착 시간에 맞춰 준비해요", color: GREEN };
  const diffMin = Math.round((arrivalMs - readyMs) / 60000);
  if (Math.abs(diffMin) <= 2) return { text: "도착 시간에 딱 맞춰 준비돼요 ✨", color: GREEN };
  if (diffMin > 2) return { text: "도착 전 미리 준비돼요 · 바로 픽업", color: GREEN };
  return { text: `도착 후 약 ${-diffMin}분 대기`, color: ORANGE };
}

function WaitCard() {
  return (
    <div style={{ background: "#4E5968", borderRadius: 20, padding: "22px 26px", boxShadow: "0 14px 30px rgba(78,89,104,.2)" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.8)" }}>매장 확인 중</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginTop: 4 }}>접수 대기 중</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,.8)", marginTop: 4 }}>매장이 주문을 확인하면 알려드려요</div>
    </div>
  );
}

function RejectCard() {
  return (
    <div style={{ background: "linear-gradient(135deg,#F04452,#D6303E)", borderRadius: 20, padding: "22px 26px", boxShadow: "0 14px 30px rgba(240,68,82,.24)" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.9)" }}>주문 상태</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginTop: 4 }}>주문이 거절되었어요</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,.9)", marginTop: 4 }}>매장 사정으로 주문을 받지 못했어요. 다시 시도해 주세요.</div>
    </div>
  );
}

function CenterNote({ text }: { text: string }) {
  return (
    <div style={{ padding: "24px 12px", textAlign: "center", color: "#8B95A1", fontSize: 14, fontWeight: 600 }}>
      {text}
    </div>
  );
}
