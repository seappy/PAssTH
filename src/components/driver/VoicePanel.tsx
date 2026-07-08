"use client";

import { chatMessages } from "@/lib/driver/mockData";
import { CloseIcon, MicIcon } from "./Icons";

export default function VoicePanel({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        width: 400,
        flex: "0 0 400px",
        background: "#fff",
        borderLeft: "1px solid #EDF0F3",
        display: "flex",
        flexDirection: "column",
        padding: "20px 22px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: "#EAF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MicIcon size={17} color="#3182F6" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#191F28" }}>GLEO AI</div>
            <div style={{ fontSize: 11, color: "#8B95A1", fontWeight: 500 }}>음성 주문</div>
          </div>
        </div>
        <div
          onClick={onClose}
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            background: "#F2F4F6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8B95A1",
            cursor: "pointer",
          }}
        >
          <CloseIcon />
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", gap: 12 }}>
        {chatMessages.map((msg, i) =>
          msg.ai ? (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", maxWidth: "92%" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  flex: "0 0 28px",
                  borderRadius: 9,
                  background: "#EAF2FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: "#3182F6",
                  fontWeight: 700,
                }}
              >
                AI
              </div>
              <div style={{ background: "#F2F4F6", borderRadius: "4px 14px 14px 14px", padding: "11px 14px", fontSize: 15, lineHeight: 1.5, color: "#191F28" }}>
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ background: "#3182F6", color: "#fff", borderRadius: "14px 4px 14px 14px", padding: "11px 14px", fontSize: 15, lineHeight: 1.5, maxWidth: "88%", fontWeight: 500 }}>
                {msg.text}
              </div>
            </div>
          )
        )}
      </div>

      <div style={{ marginTop: 14, background: "#F2F4F6", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, height: 28 }}>
          {[0, 0.15, 0.3, 0.45, 0.6].map((delay) => (
            <div
              key={delay}
              style={{
                width: 4,
                height: "100%",
                background: "#3182F6",
                borderRadius: 2,
                animation: `pxpulse 1s ease-in-out ${delay}s infinite`,
              }}
            />
          ))}
        </div>
        <div style={{ flex: 1, color: "#4E5968", fontSize: 14, lineHeight: 1.4, fontWeight: 500 }}>
          듣고 있어요…
          <br />
          <span style={{ color: "#8B95A1" }}>&ldquo;주문 확정해줘&rdquo;</span>
        </div>
      </div>
    </div>
  );
}
