"use client";

import { Fragment } from "react";
import { CheckIcon, PinIcon } from "@/components/driver/Icons";

const steps = [
  { label: "접수" },
  { label: "준비중" },
  { label: "준비완료" },
];

export default function PickupScreen() {
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
            2번 드라이브스루 레인
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#3182F6", borderRadius: 20, padding: "24px 26px", marginBottom: 14, boxShadow: "0 14px 30px rgba(49,130,246,.28)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -30, top: -30, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.8)" }}>매장 도착까지</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            <span className="num" style={{ fontSize: 56, fontWeight: 800, color: "#fff", lineHeight: 1 }}>2:14</span>
            <span style={{ fontSize: 18, color: "rgba(255,255,255,.85)", fontWeight: 600 }}>남음</span>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #EDF0F3", borderRadius: 18, padding: "18px 22px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(20,40,80,.03)" }}>
          <div>
            <div style={{ fontSize: 13, color: "#8B95A1", fontWeight: 600, marginBottom: 6 }}>내 차량</div>
            <div className="num" style={{ fontSize: 30, fontWeight: 800, color: "#191F28", letterSpacing: ".02em" }}>12가 3456</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#EAF9F0", borderRadius: 999, padding: "10px 18px" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#15C47E", animation: "pxblink 1.3s infinite" }} />
            <span style={{ fontSize: 16, fontWeight: 800, color: "#0FA968" }}>준비 완료</span>
          </div>
        </div>

        {/* progress */}
        <div style={{ background: "#fff", border: "1px solid #EDF0F3", borderRadius: 18, padding: "20px 22px", marginBottom: 14, boxShadow: "0 2px 8px rgba(20,40,80,.03)" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {steps.map((step, i) => (
              <Fragment key={step.label}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ width: 38, height: 38, margin: "0 auto 8px", borderRadius: "50%", background: "#15C47E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckIcon />
                  </div>
                  <div style={{ fontSize: 13, color: i === steps.length - 1 ? "#191F28" : "#4E5968", fontWeight: i === steps.length - 1 ? 800 : 600 }}>{step.label}</div>
                </div>
                {i < steps.length - 1 && <div style={{ flex: 1, height: 3, background: "#15C47E", marginBottom: 22, borderRadius: 2 }} />}
              </Fragment>
            ))}
          </div>
        </div>

        <div style={{ background: "#FFF6E9", borderRadius: 16, padding: "15px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <PinIcon color="#FF8A00" size={22} />
          <div style={{ fontSize: 16, color: "#191F28", fontWeight: 600 }}>
            <span style={{ color: "#B5710A", fontWeight: 700 }}>2번 드라이브스루 레인</span> · 창구에서 차량번호로 확인해요
          </div>
        </div>
      </div>
    </div>
  );
}
