"use client";

import { useDriverStore } from "@/stores/driver.store";
import { carColorDefs, prefLabels } from "@/lib/driver/config";

export default function SettingsScreen() {
  const car = useDriverStore((s) => s.car);
  const carColor = useDriverStore((s) => s.carColor);
  const prefs = useDriverStore((s) => s.prefs);
  const memo = useDriverStore((s) => s.memo);
  const pickColor = useDriverStore((s) => s.pickColor);
  const setCar = useDriverStore((s) => s.setCar);
  const togglePref = useDriverStore((s) => s.togglePref);
  const setMemo = (v: string) => useDriverStore.setState({ memo: v });

  return (
    <div style={{ height: "100%", display: "flex", gap: 20, padding: "20px 28px" }}>
      {/* LEFT car info */}
      <div style={{ flex: 1.05, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#191F28", marginBottom: 3 }}>매장에 표시될 차량 정보</div>
        <div style={{ fontSize: 13, color: "#8B95A1", marginBottom: 16 }}>픽업 시 직원이 차량을 알아볼 수 있도록 전달돼요</div>

        <div style={{ fontSize: 14, fontWeight: 700, color: "#8B95A1", marginBottom: 10 }}>차량 색상</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {carColorDefs.map((c, i) => {
            const sel = carColor === i;
            return (
              <div key={c.name} onClick={() => pickColor(i)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, cursor: "pointer" }}>
                <div
                  style={{
                    width: "100%",
                    height: 50,
                    borderRadius: 13,
                    background: c.swatch,
                    border: "1px solid rgba(0,0,0,.06)",
                    boxShadow: sel ? "0 0 0 2px #fff, 0 0 0 4px #3182F6" : "none",
                  }}
                />
                <div style={{ fontSize: 12, color: sel ? "#3182F6" : "#8B95A1", fontWeight: sel ? 700 : 500 }}>{c.name}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#8B95A1", marginBottom: 8 }}>차종</div>
            <input
              value={car.model}
              onChange={(e) => setCar({ model: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#8B95A1", marginBottom: 8 }}>차량 번호</div>
            <input
              value={car.number}
              onChange={(e) => setCar({ number: e.target.value })}
              className="num"
              style={{ ...inputStyle, fontWeight: 700, letterSpacing: ".02em" }}
            />
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: "#8B95A1", marginBottom: 8 }}>픽업 요청사항</div>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: 일회용 수저는 빼주세요"
          style={{
            flex: 1,
            minHeight: 0,
            background: "#fff",
            border: "1px solid #EDF0F3",
            borderRadius: 14,
            padding: "16px 18px",
            fontSize: 17,
            color: "#191F28",
            lineHeight: 1.55,
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* RIGHT */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0, gap: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#191F28" }}>주문 · 결제</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {prefLabels.map((p) => {
            const on = prefs[p.key];
            return (
              <div
                key={p.key}
                onClick={() => togglePref(p.key)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "1px solid #EDF0F3", borderRadius: 14, padding: "15px 18px", cursor: "pointer" }}
              >
                <div style={{ fontSize: 16, color: "#191F28", fontWeight: 600 }}>{p.label}</div>
                <div
                  style={{
                    width: 52,
                    height: 30,
                    borderRadius: 999,
                    background: on ? "#3182F6" : "#DDE2E7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: on ? "flex-end" : "flex-start",
                    padding: 3,
                    transition: "background .2s",
                  }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 5px rgba(0,0,0,.2)" }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: "#F7F8FA", borderRadius: 14, padding: "16px 18px", fontSize: 14, color: "#8B95A1", lineHeight: 1.5 }}>
          결제수단은 Pleos Pay(현대카드 ·· 4821)로 연결되어 있어요. 주문 시 차량 정보와
          요청사항이 매장에 함께 전달됩니다.
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 58,
  background: "#fff",
  border: "1px solid #EDF0F3",
  borderRadius: 14,
  padding: "0 18px",
  fontSize: 18,
  color: "#191F28",
  fontWeight: 600,
  outline: "none",
  fontFamily: "inherit",
};
