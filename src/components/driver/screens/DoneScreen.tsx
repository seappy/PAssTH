"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { useDriverStore } from "@/stores/driver.store";
import { ArrowRightIcon, CheckIcon } from "@/components/driver/Icons";

const STATUS_TEXT: Record<string, string> = {
  new: "접수 대기",
  accepted: "주문 수락됨",
  preparing: "준비중",
  ready: "준비 완료",
  done: "픽업 완료",
  rejected: "주문 거절됨",
};

export default function DoneScreen() {
  const placedOrder = useDriverStore((s) => s.placedOrder);
  const goto = useDriverStore((s) => s.goto);
  const utils = trpc.useUtils();

  // Live status — the "주문 완료" card is a confirmation, but it must not look
  // frozen: poll the order, and once the store acts on it (accepted/preparing/…)
  // move the driver to the live pickup tracker automatically.
  const { data: order } = trpc.driver.order.useQuery(
    { id: placedOrder?.id as string },
    { enabled: !!placedOrder, refetchInterval: 3000 },
  );

  const status = order?.status ?? "new";

  useEffect(() => {
    if (status === "new") return;
    void utils.driver.orderHistory.invalidate();
    goto(6); // store acted → pickup tracker
  }, [status, goto, utils]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center", position: "relative" }}>
      <div style={{ position: "relative", width: 112, height: 112, marginBottom: 26 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#15C47E", animation: "pxring 1.8s ease-out infinite" }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "#15C47E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 14px 34px rgba(21,196,126,.4)",
            animation: "pxpop .5s ease-out both",
          }}
        >
          <CheckIcon size={52} strokeWidth={2.6} />
        </div>
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, color: "#191F28", marginBottom: 10, letterSpacing: "-.02em" }}>주문이 매장에 전달되었습니다</div>
      <div style={{ fontSize: 18, color: "#8B95A1", marginBottom: 32 }}>매장이 확인하면 바로 진행 상황을 알려드려요</div>
      <div style={{ display: "flex", gap: 16, marginBottom: 36 }}>
        <div style={{ background: "#fff", border: "1px solid #EDF0F3", borderRadius: 18, padding: "22px 44px", boxShadow: "0 3px 12px rgba(20,40,80,.04)" }}>
          <div style={{ fontSize: 13, color: "#8B95A1", fontWeight: 600, marginBottom: 8 }}>주문번호</div>
          <div className="num" style={{ fontSize: 36, fontWeight: 800, color: "#3182F6" }}>{placedOrder?.orderNo ?? "-"}</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #EDF0F3", borderRadius: 18, padding: "22px 44px", boxShadow: "0 3px 12px rgba(20,40,80,.04)" }}>
          <div style={{ fontSize: 13, color: "#8B95A1", fontWeight: 600, marginBottom: 8 }}>상태</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 26, fontWeight: 800, color: "#191F28" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#8B95A1", animation: "pxblink 1.3s infinite" }} />
            {STATUS_TEXT[status] ?? "접수 대기"}
          </div>
        </div>
      </div>
      <div
        onClick={() => goto(6)}
        style={{ height: 70, padding: "0 52px", borderRadius: 16, background: "#3182F6", color: "#fff", display: "flex", alignItems: "center", gap: 12, fontSize: 22, fontWeight: 800, cursor: "pointer", boxShadow: "0 12px 28px rgba(49,130,246,.32)" }}
      >
        픽업 진행 상황 보기
        <ArrowRightIcon size={24} color="#fff" strokeWidth={2.4} />
      </div>
    </div>
  );
}
