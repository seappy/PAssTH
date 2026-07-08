"use client";

import { useState } from "react";
import { useFitScale } from "@/lib/driver/useFitScale";
import type { Prefs, ScreenId } from "@/lib/driver/types";
import { SCREEN_TITLES } from "@/lib/driver/mockData";
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

export default function PassthApp() {
  const scale = useFitScale();
  const [screen, setScreen] = useState<ScreenId>(1);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [qty, setQty] = useState(2);
  const [selMenu, setSelMenu] = useState(0);
  const [carColor, setCarColor] = useState(4);
  const [prefs, setPrefs] = useState<Prefs>({ autoEta: true, pleosPay: true, voiceGuide: false });

  const toggleVoice = () => setVoiceOpen((v) => !v);
  const togglePref = (key: keyof Prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));
  const back = () => setScreen(screen === 7 ? 1 : (Math.max(1, screen - 1) as ScreenId));

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
          <NavRail screen={screen} onNavigate={setScreen} onToggleVoice={toggleVoice} />

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <TopBar title={SCREEN_TITLES[screen]} showBack={screen !== 1} onBack={back} />

            <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
              <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                {screen === 1 && (
                  <HomeScreen onToStores={() => setScreen(2)} onToggleVoice={toggleVoice} onToMenu={() => setScreen(3)} />
                )}
                {screen === 2 && <StoresScreen onSelectStore={() => setScreen(3)} />}
                {screen === 3 && (
                  <MenuScreen
                    selMenu={selMenu}
                    onSelectMenu={setSelMenu}
                    qty={qty}
                    onIncQty={() => setQty((q) => q + 1)}
                    onDecQty={() => setQty((q) => Math.max(1, q - 1))}
                    onToConfirm={() => setScreen(4)}
                  />
                )}
                {screen === 4 && <ConfirmScreen onToDone={() => setScreen(5)} />}
                {screen === 5 && <DoneScreen onToPickup={() => setScreen(6)} />}
                {screen === 6 && <PickupScreen />}
                {screen === 7 && (
                  <SettingsScreen carColor={carColor} onPickColor={setCarColor} prefs={prefs} onTogglePref={togglePref} />
                )}
              </div>

              {voiceOpen && <VoicePanel onClose={toggleVoice} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
