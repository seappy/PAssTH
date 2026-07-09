"use client";

import type { ScreenId } from "@/lib/driver/types";
import { GearIcon, HomeIcon, OrderIcon, SearchIcon, UserIcon } from "./Icons";

const NAV_ON_BG = "#EAF2FF";
const NAV_ON_FG = "#3182F6";
const NAV_OFF_BG = "transparent";
const NAV_OFF_FG = "#8B95A1";

function navItemStyle(active: boolean): React.CSSProperties {
  return {
    width: 72,
    height: 66,
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    cursor: "pointer",
    background: active ? NAV_ON_BG : NAV_OFF_BG,
    color: active ? NAV_ON_FG : NAV_OFF_FG,
  };
}

export default function NavRail({
  screen,
  onNavigate,
  onToggleVoice,
}: {
  screen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onToggleVoice: () => void;
}) {
  const navHome = screen === 1;
  const navOrd = screen === 5 || screen === 6;
  const navSrch = screen === 2 || screen === 3 || screen === 4;
  const navMy = screen === 7;

  return (
    <div
      style={{
        width: 104,
        flex: "0 0 104px",
        background: "#FFFFFF",
        borderRight: "1px solid #EDF0F3",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "22px 0 20px",
      }}
    >
      <div
        onClick={onToggleVoice}
        role="button"
        aria-label="GLEO 음성 비서"
        style={{
          width: 48,
          height: 48,
          borderRadius: 15,
          backgroundImage: "url('/assets/logo.png')",
          backgroundSize: "132%", // crop the logo's white padding to fill the tile
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          cursor: "pointer",
          boxShadow: "0 6px 16px rgba(49,130,246,.35)",
          marginBottom: 30,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", width: "100%" }}>
        <div onClick={() => onNavigate(1)} style={navItemStyle(navHome)}>
          <HomeIcon />
          <span style={{ fontSize: 11, fontWeight: 600 }}>홈</span>
        </div>
        <div onClick={() => onNavigate(6)} style={navItemStyle(navOrd)}>
          <OrderIcon />
          <span style={{ fontSize: 11, fontWeight: 600 }}>주문</span>
        </div>
        <div onClick={() => onNavigate(2)} style={navItemStyle(navSrch)}>
          <SearchIcon />
          <span style={{ fontSize: 11, fontWeight: 600 }}>검색</span>
        </div>
        <div onClick={() => onNavigate(7)} style={navItemStyle(navMy)}>
          <UserIcon />
          <span style={{ fontSize: 11, fontWeight: 600 }}>마이</span>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div
        onClick={() => onNavigate(7)}
        style={{
          width: 52,
          height: 52,
          borderRadius: 15,
          background: "#F2F4F6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#4E5968",
        }}
      >
        <GearIcon />
      </div>
    </div>
  );
}
