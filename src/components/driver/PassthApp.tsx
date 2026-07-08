"use client";

import { useFitScale } from "@/lib/driver/useFitScale";
import { SCREEN_TITLES } from "@/lib/driver/config";
import { useDriverStore } from "@/stores/driver.store";
import NavRail from "./NavRail";
import TopBar from "./TopBar";
import VoicePanel from "./VoicePanel";
import HomeScreen from "./screens/HomeScreen";
import StoresScreen from "./screens/StoresScreen";
import MenuScreen from "./screens/MenuScreen";
import ConfirmScreen from "./screens/ConfirmScreen";
import DoneScreen from "./screens/DoneScreen";
import PickupScreen from "./screens/PickupScreen";
import SettingsScreen from "./screens/SettingsScreen";

/**
 * Shell for the driver infotainment client. All state/actions live in
 * `useDriverStore`; each screen self-fetches its data via `trpc.driver.*` and
 * dispatches store actions, so touch and voice share one action layer.
 */
export default function PassthApp() {
  const scale = useFitScale();
  const screen = useDriverStore((s) => s.screen);
  const voiceOpen = useDriverStore((s) => s.voiceOpen);
  const goto = useDriverStore((s) => s.goto);
  const back = useDriverStore((s) => s.back);
  const toggleVoice = useDriverStore((s) => s.toggleVoice);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "radial-gradient(120% 120% at 50% 0%,#EEF1F5 0%,#DFE4EA 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "'Pretendard', -apple-system, sans-serif",
        position: "relative",
      }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
        <div
          style={{
            width: 1280,
            height: 720,
            background: "#F2F4F6",
            border: "1px solid #D7DCE1",
            borderRadius: 30,
            boxShadow: "0 50px 130px rgba(20,40,80,.28)",
            overflow: "hidden",
            display: "flex",
            position: "relative",
          }}
        >
          <NavRail screen={screen} onNavigate={goto} onToggleVoice={toggleVoice} />

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <TopBar title={SCREEN_TITLES[screen]} showBack={screen !== 1} onBack={back} />

            <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
              <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                {screen === 1 && <HomeScreen />}
                {screen === 2 && <StoresScreen />}
                {screen === 3 && <MenuScreen />}
                {screen === 4 && <ConfirmScreen />}
                {screen === 5 && <DoneScreen />}
                {screen === 6 && <PickupScreen />}
                {screen === 7 && <SettingsScreen />}
              </div>

              {voiceOpen && <VoicePanel onClose={() => toggleVoice(false)} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
