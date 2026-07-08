"use client";

import { useDriverStore } from "@/stores/driver.store";
import { ArrowRightIcon, CheckIcon } from "@/components/driver/Icons";

export default function DoneScreen() {
  const placedOrder = useDriverStore((s) => s.placedOrder);
  const goToPickup = useDriverStore((s) => s.goToPickup);

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
      <div style={{ fontSize: 18, color: "#8B95A1", marginBottom: 32 }}>도착 시간에 맞춰 준비를 시작해요</div>
      <div style={{ display: "flex", gap: 16, marginBottom: 36 }}>
        <div style={{ background: "#fff", border: "1px solid #EDF0F3", borderRadius: 18, padding: "22px 44px", boxShadow: "0 3px 12px rgba(20,40,80,.04)" }}>
          <div style={{ fontSize: 13, color: "#8B95A1", fontWeight: 600, marginBottom: 8 }}>주문번호</div>
          <div className="num" style={{ fontSize: 36, fontWeight: 800, color: "#3182F6" }}>{placedOrder?.orderNo ?? "-"}</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #EDF0F3", borderRadius: 18, padding: "22px 44px", boxShadow: "0 3px 12px rgba(20,40,80,.04)" }}>
          <div style={{ fontSize: 13, color: "#8B95A1", fontWeight: 600, marginBottom: 8 }}>상태</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#191F28" }}>접수 대기</div>
        </div>
      </div>
      <div
        onClick={goToPickup}
        style={{ height: 70, padding: "0 52px", borderRadius: 16, background: "#3182F6", color: "#fff", display: "flex", alignItems: "center", gap: 12, fontSize: 22, fontWeight: 800, cursor: "pointer", boxShadow: "0 12px 28px rgba(49,130,246,.32)" }}
      >
        픽업 진행 상황 보기
        <ArrowRightIcon size={24} color="#fff" strokeWidth={2.4} />
      </div>
    </div>
  );
}
