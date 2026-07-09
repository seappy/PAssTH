"use client";

import { trpc } from "@/lib/trpc/client";
import { useDriverStore } from "@/stores/driver.store";
import { ellipsis, formatWon } from "@/lib/driver/format";
import { ArrowRightIcon } from "@/components/driver/Icons";
import type { OrderStatus } from "@/types/domain";

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "접수 대기",
  accepted: "수락됨",
  preparing: "준비 중",
  ready: "픽업 가능",
  done: "완료",
  rejected: "거절",
};

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

function isActive(status: OrderStatus) {
  return status !== "done" && status !== "rejected";
}

/** Driver nav "주문" tab when nothing is in progress — past orders for this car. */
export default function OrderHistoryScreen() {
  const carNumber = useDriverStore((s) => s.car.number);
  const goto = useDriverStore((s) => s.goto);
  const resumeOrder = useDriverStore((s) => s.resumeOrder);

  const { data: orders, isLoading } = trpc.driver.orderHistory.useQuery(
    { carNumber },
    { enabled: !!carNumber.trim() },
  );

  const active = (orders ?? []).filter((o) => isActive(o.status as OrderStatus));
  const history = (orders ?? []).filter((o) => !isActive(o.status as OrderStatus));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "22px 28px" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#8B95A1", marginBottom: 14 }}>
        {carNumber ? `${carNumber} · 주문 기록` : "주문 기록"}
      </div>

      {isLoading && <CenterNote text="주문 기록을 불러오는 중…" />}
      {!isLoading && (orders?.length ?? 0) === 0 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ fontSize: 17, color: "#8B95A1", fontWeight: 600 }}>아직 주문 기록이 없어요</div>
          <div
            onClick={() => goto(2)}
            style={{
              height: 56,
              padding: "0 28px",
              borderRadius: 14,
              background: "#3182F6",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 17,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            가는 길에 주문하기
            <ArrowRightIcon size={20} color="#fff" strokeWidth={2.4} />
          </div>
        </div>
      )}

      {(orders?.length ?? 0) > 0 && (
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }} className="pl-scroll">
          {active.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              highlight
              onClick={() => resumeOrder({ id: o.id, orderNo: o.orderNo, storeId: o.storeId })}
            />
          ))}
          {history.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({
  order,
  highlight,
  onClick,
}: {
  order: {
    id: string;
    orderNo: string;
    status: string;
    createdAt: Date;
    totalPrice: number;
    storeName: string;
    itemSummary: string;
  };
  highlight?: boolean;
  onClick?: () => void;
}) {
  const status = order.status as OrderStatus;
  const done = status === "done" || status === "rejected";

  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        border: highlight ? "1.5px solid #3182F6" : "1px solid #EDF0F3",
        borderRadius: 16,
        padding: "16px 18px",
        cursor: onClick ? "pointer" : "default",
        boxShadow: "0 2px 8px rgba(20,40,80,.03)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
        <span className="num" style={{ fontSize: 18, fontWeight: 800, color: "#191F28", flex: "0 0 auto" }}>
          {order.orderNo}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: done ? "#8B95A1" : "#3182F6",
            flex: "0 0 auto",
          }}
        >
          {STATUS_LABEL[status] ?? order.status}
        </span>
      </div>
      <div style={{ ...ellipsis, fontSize: 16, fontWeight: 700, color: "#191F28", marginBottom: 4 }} title={order.storeName}>
        {order.storeName}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ ...ellipsis, fontSize: 14, color: "#8B95A1", flex: 1, minWidth: 0 }}>{order.itemSummary}</span>
        <span className="num" style={{ fontSize: 14, color: "#4E5968", fontWeight: 600, flex: "0 0 auto" }}>
          {formatWon(order.totalPrice)}원
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: "#B0B8C1", marginTop: 6 }}>{fmtWhen(order.createdAt)}</div>
    </div>
  );
}

function CenterNote({ text }: { text: string }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#8B95A1", fontSize: 16, fontWeight: 600 }}>
      {text}
    </div>
  );
}
