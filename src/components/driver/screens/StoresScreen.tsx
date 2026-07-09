"use client";

import { trpc } from "@/lib/trpc/client";
import { useDriverStore } from "@/stores/driver.store";
import { congestionLabel, ellipsis, formatDistance, formatEta } from "@/lib/driver/format";

export default function StoresScreen() {
  const driverLoc = useDriverStore((s) => s.driverLoc);
  const selectStore = useDriverStore((s) => s.selectStore);
  const { data: stores, isLoading, isError } = trpc.driver.stores.useQuery(driverLoc ?? undefined);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "22px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#8B95A1" }}>경로 주변 매장 · 가까운 순</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 14, color: "#8B95A1", fontWeight: 600 }}>경로순 정렬</div>
      </div>

      {isLoading && <CenterNote text="매장을 불러오는 중…" />}
      {isError && <CenterNote text="매장을 불러오지 못했어요." />}
      {stores && stores.length === 0 && <CenterNote text="주변에 매장이 없어요." />}

      {stores && stores.length > 0 && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            // Fixed (not minmax/shrinkable) so cards never get squashed as the
            // store count grows — overflow scrolls instead of compressing rows.
            gridAutoRows: "220px",
            alignContent: "start",
            gap: 16,
            overflowY: "auto",
          }}
          className="pl-scroll"
        >
          {stores.map((s) => {
            const cong = congestionLabel(s.congestion);
            return (
              <div
                key={s.id}
                onClick={() => s.open && selectStore(s.id)}
                style={{
                  background: "#fff",
                  border: "1px solid #EDF0F3",
                  borderRadius: 18,
                  overflow: "hidden",
                  cursor: s.open ? "pointer" : "default",
                  opacity: s.open ? 1 : 0.6,
                  boxShadow: "0 3px 12px rgba(20,40,80,.04)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    height: 88,
                    flex: "0 0 88px",
                    backgroundImage: s.imageUrl
                      ? `url(${s.imageUrl})`
                      : "repeating-linear-gradient(135deg,#EEF1F4 0 11px,#E4E8ED 11px 22px)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
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
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,.85)", borderRadius: 999, padding: "5px 11px" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: cong.color }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: cong.color }}>{cong.text}</span>
                  </div>
                </div>
                <div style={{ flex: 1, padding: "14px 18px", display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <div style={{ ...ellipsis, fontSize: 21, fontWeight: 700, color: "#191F28" }} title={s.name}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: 14, color: "#8B95A1", marginTop: 3 }}>
                    경로에서 <span className="num">{formatDistance(s.distanceM)}</span>
                  </div>
                  <div style={{ flex: 1 }} />
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <span className="num" style={{ fontSize: 15, fontWeight: 600, color: s.open ? "#15C47E" : "#8B95A1" }}>{s.hoursText}</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span className="num" style={{ fontSize: 26, fontWeight: 800, color: "#3182F6" }}>{formatEta(s.etaSeconds)}</span>
                      <span style={{ fontSize: 12, color: "#8B95A1", fontWeight: 600 }}>픽업 ETA</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CenterNote({ text }: { text: string }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#8B95A1", fontSize: 16, fontWeight: 600 }}>
      {text}
    </div>
  );
}
