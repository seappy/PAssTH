"use client";

import { BackIcon, PinIcon, SunIcon } from "./Icons";

export default function TopBar({
  title,
  showBack,
  onBack,
}: {
  title: string;
  showBack: boolean;
  onBack: () => void;
}) {
  return (
    <div
      style={{
        height: 64,
        flex: "0 0 64px",
        background: "#FFFFFF",
        borderBottom: "1px solid #EDF0F3",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {showBack && (
          <div
            onClick={onBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "#F2F4F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#4E5968",
            }}
          >
            <BackIcon />
          </div>
        )}
        {title === "PAssTH" ? (
          // name.png is a wide wordmark with lots of vertical white padding — clip
          // to the centered text band so the logo reads at a proper size, and
          // multiply-blend the near-white background into the white top bar.
          <div style={{ height: 30, display: "flex", alignItems: "center", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/name.png" alt="PAssTH" style={{ height: 96, width: "auto", display: "block", mixBlendMode: "multiply" }} />
          </div>
        ) : (
          <div style={{ fontSize: 21, fontWeight: 700, color: "#191F28", letterSpacing: "-.02em" }}>{title}</div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#EAF2FF", borderRadius: 12, padding: "9px 15px" }}>
          <PinIcon size={16} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#3182F6" }}>동탄IC 방면 · 12분</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#4E5968", fontSize: 15, fontWeight: 600 }}>
          <SunIcon />
          23°
        </div>
        <div className="num" style={{ fontSize: 17, fontWeight: 700, color: "#191F28" }}>
          14:35
        </div>
      </div>
    </div>
  );
}
