"use client";

import { trpc } from "@/lib/trpc/client";
import { useDriverStore } from "@/stores/driver.store";
import { formatDistance, formatEta, ellipsis } from "@/lib/driver/format";
import { ArrowRightIcon, ChevronRightIcon, MicIcon, SearchIcon } from "@/components/driver/Icons";

export default function HomeScreen() {
  const driverLoc = useDriverStore((s) => s.driverLoc);
  const goto = useDriverStore((s) => s.goto);
  const toggleVoice = useDriverStore((s) => s.toggleVoice);
  const selectStore = useDriverStore((s) => s.selectStore);
  const placedOrder = useDriverStore((s) => s.placedOrder);

  const { data: stores } = trpc.driver.stores.useQuery(driverLoc!, { enabled: !!driverLoc });
  const nearby = (stores ?? []).filter((s) => s.open).slice(0, 3);

  return (
    <div style={{ height: "100%", display: "flex", gap: 20, padding: "24px 28px" }}>
      {/* LEFT */}
      <div style={{ flex: 1.32, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          onClick={() => goto(2)}
          style={{ height: 56, flex: "0 0 56px", background: "#FFFFFF", border: "1px solid #EDF0F3", borderRadius: 16, display: "flex", alignItems: "center", gap: 12, padding: "0 20px", cursor: "pointer" }}
        >
          <SearchIcon size={21} color="#8B95A1" />
          <span style={{ fontSize: 17, color: "#8B95A1", fontWeight: 500 }}>매장 · 메뉴 검색</span>
        </div>

        {/* HERO */}
        <div
          style={{
            flex: 1,
            background: "linear-gradient(135deg,#3182F6 0%,#2B6EE0 100%)",
            borderRadius: 24,
            padding: "32px 34px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 20px 44px rgba(49,130,246,.3)",
          }}
        >
          <div style={{ position: "absolute", right: -40, top: -40, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
          <div style={{ position: "absolute", right: 40, bottom: -70, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.75)", letterSpacing: ".08em", marginBottom: 12 }}>
            PASSTH · 가는 길에 주문
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", lineHeight: 1.24, letterSpacing: "-.02em" }}>
            가는 길에,
            <br />
            미리 주문하세요
          </div>
          <div style={{ fontSize: 16, color: "rgba(255,255,255,.85)", marginTop: 10, fontWeight: 500 }}>경로 주변 매장을 ETA 순으로 보여드려요</div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 12, position: "relative" }}>
            <div
              onClick={() => goto(2)}
              style={{ flex: 1, height: 64, borderRadius: 16, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", boxShadow: "0 8px 20px rgba(0,0,0,.14)" }}
            >
              <span style={{ fontSize: 19, fontWeight: 800, color: "#191F28" }}>주문 시작하기</span>
              <ArrowRightIcon strokeWidth={2.4} />
            </div>
            <div
              onClick={() => toggleVoice()}
              style={{ width: 64, height: 64, flex: "0 0 64px", borderRadius: 16, background: "rgba(255,255,255,.16)", border: "1.5px solid rgba(255,255,255,.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <MicIcon />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        {placedOrder && (
          <div
            onClick={() => goto(6)}
            style={{ background: "#EAF2FF", borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#3182F6", fontWeight: 700 }}>진행 중인 주문</div>
              <div className="num" style={{ fontSize: 20, fontWeight: 800, color: "#191F28" }}>{placedOrder.orderNo}</div>
            </div>
            <ChevronRightIcon color="#3182F6" />
          </div>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#8B95A1", marginBottom: 10 }}>경로 주변 추천</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {nearby.length === 0 && <div style={{ color: "#B0B8C1", fontSize: 14 }}>주변 매장을 불러오는 중…</div>}
            {nearby.map((s) => (
              <div
                key={s.id}
                onClick={() => selectStore(s.id)}
                style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", border: "1px solid #EDF0F3", borderRadius: 16, padding: "16px 18px", cursor: "pointer", boxShadow: "0 2px 8px rgba(20,40,80,.03)" }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...ellipsis, fontSize: 18, fontWeight: 700, color: "#191F28" }} title={s.name}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: 14, color: "#8B95A1" }}>경로에서 {formatDistance(s.distanceM)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#EAF2FF", borderRadius: 10, padding: "7px 12px" }}>
                  <span className="num" style={{ fontSize: 17, fontWeight: 800, color: "#3182F6" }}>{formatEta(s.etaSeconds)}</span>
                  <span style={{ fontSize: 11, color: "#3182F6", fontWeight: 600 }}>ETA</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
