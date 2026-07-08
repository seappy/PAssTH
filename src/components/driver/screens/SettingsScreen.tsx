"use client";

import Placeholder from "@/components/driver/Placeholder";
import { ChevronRightIcon } from "@/components/driver/Icons";
import { carColorDefs, favMenus, favStores, prefLabels } from "@/lib/driver/mockData";
import type { Prefs } from "@/lib/driver/types";

export default function SettingsScreen({
  carColor,
  onPickColor,
  prefs,
  onTogglePref,
}: {
  carColor: number;
  onPickColor: (i: number) => void;
  prefs: Prefs;
  onTogglePref: (key: keyof Prefs) => void;
}) {
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
              <div key={c.name} onClick={() => onPickColor(i)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, cursor: "pointer" }}>
                <div
                  style={{
                    width: "100%",
                    height: 50,
                    borderRadius: 13,
                    background: c.swatch,
                    border: "1px solid rgba(0,0,0,.06)",
                    boxShadow: sel ? "0 0 0 2px #fff, 0 0 0 4px #3182F6" : "none",
                    position: "relative",
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
            <div style={{ height: 58, background: "#fff", border: "1px solid #EDF0F3", borderRadius: 14, display: "flex", alignItems: "center", padding: "0 18px", fontSize: 18, color: "#191F28", fontWeight: 600 }}>아이오닉 6</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#8B95A1", marginBottom: 8 }}>차량 번호</div>
            <div className="num" style={{ height: 58, background: "#fff", border: "1px solid #EDF0F3", borderRadius: 14, display: "flex", alignItems: "center", padding: "0 18px", fontSize: 18, color: "#191F28", fontWeight: 700, letterSpacing: ".02em" }}>12가 3456</div>
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: "#8B95A1", marginBottom: 8 }}>픽업 요청사항</div>
        <div style={{ flex: 1, minHeight: 0, background: "#fff", border: "1px solid #EDF0F3", borderRadius: 14, padding: "16px 18px", fontSize: 17, color: "#191F28", lineHeight: 1.55 }}>
          일회용 수저는 빼주세요. 도착 전 미리 준비 부탁드립니다.
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0, gap: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#191F28" }}>자주 가는 매장</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#EAF2FF", borderRadius: 999, padding: "6px 13px", fontSize: 13, color: "#3182F6", fontWeight: 700, cursor: "pointer" }}>+ 추가</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {favStores.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, background: "#fff", border: "1px solid #EDF0F3", borderRadius: 14, padding: "11px 15px" }}>
                <Placeholder size={38} borderRadius={11} stripe={7} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#191F28" }}>{f.name}</div>
                  <div style={{ fontSize: 13, color: "#8B95A1" }}>{f.cat}</div>
                </div>
                <ChevronRightIcon />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#191F28" }}>자주 주문하는 메뉴</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#EAF2FF", borderRadius: 999, padding: "6px 13px", fontSize: 13, color: "#3182F6", fontWeight: 700, cursor: "pointer" }}>+ 추가</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {favMenus.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, background: "#fff", border: "1px solid #EDF0F3", borderRadius: 14, padding: "11px 15px" }}>
                <Placeholder size={38} borderRadius={11} stripe={7} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#191F28" }}>{m.name}</div>
                  <div style={{ fontSize: 13, color: "#8B95A1" }}>{m.store}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#191F28", marginBottom: 8 }}>주문 · 결제</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {prefLabels.map((p) => {
              const on = prefs[p.key];
              return (
                <div
                  key={p.key}
                  onClick={() => onTogglePref(p.key)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "1px solid #EDF0F3", borderRadius: 14, padding: "13px 18px", cursor: "pointer" }}
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
        </div>
      </div>
    </div>
  );
}
