"use client";

import Placeholder from "@/components/driver/Placeholder";
import { CarIcon, CardIcon, ChevronRightIcon, ClockIcon } from "@/components/driver/Icons";
import { cart } from "@/lib/driver/mockData";

export default function ConfirmScreen({ onToDone }: { onToDone: () => void }) {
  return (
    <div style={{ height: "100%", display: "flex", gap: 20, padding: "22px 28px" }}>
      <div style={{ flex: 1.28, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#8B95A1", marginBottom: 12 }}>주문 상품</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {cart.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", border: "1px solid #EDF0F3", borderRadius: 16, padding: "15px 18px", boxShadow: "0 2px 8px rgba(20,40,80,.03)" }}>
              <Placeholder size={52} borderRadius={12} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 19, fontWeight: 700, color: "#191F28" }}>{c.name}</div>
                <div style={{ fontSize: 14, color: "#8B95A1" }}>{c.opt}</div>
              </div>
              <div className="num" style={{ fontSize: 15, color: "#8B95A1", fontWeight: 600 }}>×{c.qty}</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 700, color: "#191F28", minWidth: 82, textAlign: "right" }}>{c.price}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <div style={{ flex: 1, background: "#fff", border: "1px solid #EDF0F3", borderRadius: 16, padding: "16px 20px", boxShadow: "0 2px 8px rgba(20,40,80,.03)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
              <CarIcon />
              <span style={{ fontSize: 13, color: "#8B95A1", fontWeight: 600 }}>차량 번호</span>
            </div>
            <div className="num" style={{ fontSize: 26, fontWeight: 800, color: "#191F28", letterSpacing: ".02em" }}>12가 3456</div>
          </div>
          <div style={{ flex: 1.2, background: "#EAF2FF", borderRadius: 16, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
              <ClockIcon color="#3182F6" />
              <span style={{ fontSize: 13, color: "#3182F6", fontWeight: 700 }}>ETA 자동 전달</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#191F28" }}>
              도착 <span className="num">14:47</span> <span style={{ fontSize: 15, color: "#4E5968", fontWeight: 600 }}>· 12분 후</span>
            </div>
            <div style={{ fontSize: 13, color: "#4E7BC0", marginTop: 4, fontWeight: 500 }}>도착 시간에 맞춰 매장이 준비를 시작해요</div>
          </div>
        </div>
      </div>

      {/* payment */}
      <div style={{ flex: 1, minWidth: 0, background: "#fff", border: "1px solid #EDF0F3", borderRadius: 20, padding: 26, display: "flex", flexDirection: "column", boxShadow: "0 4px 16px rgba(20,40,80,.05)" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#B0B8C1", fontWeight: 600, letterSpacing: ".05em", marginBottom: 18 }}>PAYMENT</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, color: "#4E5968", marginBottom: 12 }}>
          <span>상품 금액</span>
          <span className="num" style={{ fontWeight: 600 }}>14,200원</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, color: "#4E5968", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #F2F4F6" }}>
          <span>픽업 수수료</span>
          <span className="num" style={{ fontWeight: 600, color: "#15C47E" }}>무료</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "auto" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#191F28" }}>총 결제금액</span>
          <span className="num" style={{ fontSize: 28, fontWeight: 800, color: "#3182F6" }}>14,200원</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F7F8FA", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ width: 42, height: 30, borderRadius: 7, background: "linear-gradient(135deg,#2B2F36,#454B54)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, color: "#191F28", fontWeight: 700 }}>Pleos Pay</div>
            <div style={{ fontSize: 13, color: "#8B95A1" }}>현대카드 ·· 4821</div>
          </div>
          <ChevronRightIcon />
        </div>
        <div
          onClick={onToDone}
          style={{ height: 74, borderRadius: 16, background: "#3182F6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 22, fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 26px rgba(49,130,246,.32)" }}
        >
          <CardIcon size={24} strokeWidth={2} />
          Pleos Pay로 결제
        </div>
      </div>
    </div>
  );
}
