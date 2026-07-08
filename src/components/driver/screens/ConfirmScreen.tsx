"use client";

import { useDriverStore } from "@/stores/driver.store";
import { formatWon } from "@/lib/driver/format";
import { CarIcon, CardIcon, ChevronRightIcon, MinusIcon, PlusIcon } from "@/components/driver/Icons";

export default function ConfirmScreen() {
  const cart = useDriverStore((s) => s.cart);
  const car = useDriverStore((s) => s.car);
  const memo = useDriverStore((s) => s.memo);
  const placing = useDriverStore((s) => s.placing);
  const orderError = useDriverStore((s) => s.orderError);
  const setLineQty = useDriverStore((s) => s.setLineQty);
  const placeOrder = useDriverStore((s) => s.placeOrder);

  const total = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);

  return (
    <div style={{ height: "100%", display: "flex", gap: 20, padding: "22px 28px" }}>
      <div style={{ flex: 1.28, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#8B95A1", marginBottom: 12 }}>주문 상품</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, overflow: "auto", minHeight: 0 }} className="pl-scroll">
          {cart.length === 0 && <div style={{ color: "#8B95A1", fontSize: 15 }}>장바구니가 비어 있어요.</div>}
          {cart.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", border: "1px solid #EDF0F3", borderRadius: 16, padding: "15px 18px", boxShadow: "0 2px 8px rgba(20,40,80,.03)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 19, fontWeight: 700, color: "#191F28" }}>{c.name}</div>
                <div style={{ fontSize: 14, color: "#8B95A1" }}>{c.optionsText ?? "옵션 없음"}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div onClick={() => setLineQty(i, c.qty - 1)} style={qtyBtn}>
                  <MinusIcon size={18} />
                </div>
                <span className="num" style={{ fontSize: 17, fontWeight: 700, color: "#191F28", width: 22, textAlign: "center" }}>{c.qty}</span>
                <div onClick={() => setLineQty(i, c.qty + 1)} style={qtyBtn}>
                  <PlusIcon size={18} />
                </div>
              </div>
              <div className="num" style={{ fontSize: 19, fontWeight: 700, color: "#191F28", minWidth: 90, textAlign: "right" }}>{formatWon(c.unitPrice * c.qty)}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <div style={{ flex: 1, background: "#fff", border: "1px solid #EDF0F3", borderRadius: 16, padding: "16px 20px", boxShadow: "0 2px 8px rgba(20,40,80,.03)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
              <CarIcon />
              <span style={{ fontSize: 13, color: "#8B95A1", fontWeight: 600 }}>차량</span>
            </div>
            <div className="num" style={{ fontSize: 24, fontWeight: 800, color: "#191F28", letterSpacing: ".02em" }}>{car.number}</div>
            <div style={{ fontSize: 14, color: "#8B95A1", marginTop: 2 }}>{car.color} {car.model}</div>
          </div>
          <div style={{ flex: 1.2, background: "#EAF2FF", borderRadius: 16, padding: "16px 20px" }}>
            <div style={{ fontSize: 13, color: "#3182F6", fontWeight: 700, marginBottom: 8 }}>픽업 요청사항</div>
            <div style={{ fontSize: 15, color: "#191F28", fontWeight: 500, lineHeight: 1.4 }}>{memo || "요청사항 없음"}</div>
          </div>
        </div>
      </div>

      {/* payment */}
      <div style={{ flex: 1, minWidth: 0, background: "#fff", border: "1px solid #EDF0F3", borderRadius: 20, padding: 26, display: "flex", flexDirection: "column", boxShadow: "0 4px 16px rgba(20,40,80,.05)" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#B0B8C1", fontWeight: 600, letterSpacing: ".05em", marginBottom: 18 }}>PAYMENT</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, color: "#4E5968", marginBottom: 12 }}>
          <span>상품 금액</span>
          <span className="num" style={{ fontWeight: 600 }}>{formatWon(total)}원</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, color: "#4E5968", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #F2F4F6" }}>
          <span>픽업 수수료</span>
          <span className="num" style={{ fontWeight: 600, color: "#15C47E" }}>무료</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "auto" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#191F28" }}>총 결제금액</span>
          <span className="num" style={{ fontSize: 28, fontWeight: 800, color: "#3182F6" }}>{formatWon(total)}원</span>
        </div>

        {orderError && (
          <div style={{ background: "#FFF0F0", color: "#E03131", borderRadius: 12, padding: "12px 16px", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            {orderError}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F7F8FA", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ width: 42, height: 30, borderRadius: 7, background: "linear-gradient(135deg,#2B2F36,#454B54)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, color: "#191F28", fontWeight: 700 }}>Pleos Pay</div>
            <div style={{ fontSize: 13, color: "#8B95A1" }}>현대카드 ·· 4821</div>
          </div>
          <ChevronRightIcon />
        </div>
        <div
          onClick={() => !placing && cart.length > 0 && placeOrder()}
          style={{
            height: 74,
            borderRadius: 16,
            background: !placing && cart.length > 0 ? "#3182F6" : "#C4CBD3",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontSize: 22,
            fontWeight: 800,
            cursor: !placing && cart.length > 0 ? "pointer" : "default",
            boxShadow: !placing && cart.length > 0 ? "0 10px 26px rgba(49,130,246,.32)" : "none",
          }}
        >
          <CardIcon size={24} strokeWidth={2} />
          {placing ? "결제 중…" : "Pleos Pay로 결제"}
        </div>
      </div>
    </div>
  );
}

const qtyBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  background: "#F2F4F6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#4E5968",
};
