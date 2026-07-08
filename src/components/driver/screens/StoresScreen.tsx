"use client";

import { StarIcon } from "@/components/driver/Icons";
import { routeStores } from "@/lib/driver/mockData";

const categories = ["전체", "카페", "베이커리", "음식"];

export default function StoresScreen({ onSelectStore }: { onSelectStore: () => void }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "22px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        {categories.map((cat, i) => (
          <div
            key={cat}
            style={
              i === 0
                ? { padding: "9px 16px", borderRadius: 12, background: "#3182F6", color: "#fff", fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }
                : { padding: "9px 16px", borderRadius: 12, background: "#fff", border: "1px solid #EDF0F3", color: "#4E5968", fontSize: 15, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }
            }
          >
            {cat}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 14, color: "#8B95A1", fontWeight: 600 }}>경로순 정렬</div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 16 }}>
        {routeStores.map((s, i) => (
          <div
            key={i}
            onClick={onSelectStore}
            style={{ background: "#fff", border: "1px solid #EDF0F3", borderRadius: 18, overflow: "hidden", cursor: "pointer", boxShadow: "0 3px 12px rgba(20,40,80,.04)", display: "flex", flexDirection: "column" }}
          >
            <div
              style={{
                height: 96,
                flex: "0 0 96px",
                backgroundImage: "repeating-linear-gradient(135deg,#EEF1F4 0 11px,#E4E8ED 11px 22px)",
                position: "relative",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "12px 14px",
              }}
            >
              {s.open ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#EAF9F0", borderRadius: 999, padding: "6px 12px" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#15C47E" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0FA968" }}>픽업 가능</span>
                </div>
              ) : (
                <div style={{ background: "#F2F4F6", borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 600, color: "#8B95A1" }}>준비 마감</div>
              )}
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#AEB6BF", fontWeight: 600 }}>{s.logo}</div>
            </div>
            <div style={{ flex: 1, padding: "14px 18px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 21, fontWeight: 700, color: "#191F28" }}>{s.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <StarIcon />
                  <span className="num" style={{ fontSize: 15, fontWeight: 700, color: "#191F28" }}>{s.rating}</span>
                  <span className="num" style={{ fontSize: 13, color: "#B0B8C1" }}>({s.reviews})</span>
                </div>
              </div>
              <div style={{ fontSize: 14, color: "#8B95A1", marginTop: 3 }}>
                {s.cat} · 경로에서 <span className="num">{s.dist}</span>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                <div>
                  <span className="num" style={{ fontSize: 15, fontWeight: 600, color: "#15C47E" }}>{s.hours}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span className="num" style={{ fontSize: 26, fontWeight: 800, color: "#3182F6" }}>{s.eta}</span>
                  <span style={{ fontSize: 12, color: "#8B95A1", fontWeight: 600 }}>픽업 ETA</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
