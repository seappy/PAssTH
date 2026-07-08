"use client";

import { useFitScale } from "@/lib/driver/useFitScale";
import { SCREEN_TITLES } from "@/lib/driver/mockData";
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
 * Shell for the driver infotainment client. All state and actions live in
 * `useDriverStore` so touch and voice share one action layer — this component
 * just subscribes and maps store actions onto the (unchanged) screen props.
 */
export default function PassthApp() {
  const scale = useFitScale();

  const screen = useDriverStore((s) => s.screen);
  const voiceOpen = useDriverStore((s) => s.voiceOpen);
  const selMenu = useDriverStore((s) => s.selMenu);
  const qty = useDriverStore((s) => s.qty);
  const carColor = useDriverStore((s) => s.carColor);
  const prefs = useDriverStore((s) => s.prefs);

  const {
    goto,
    back,
    toggleVoice,
    selectStore,
    selectMenu,
    incQty,
    decQty,
    reviewOrder,
    placeOrder,
    goToPickup,
    pickColor,
    togglePref,
  } = useDriverStore.getState();

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
                {screen === 1 && (
                  <HomeScreen onToStores={() => goto(2)} onToggleVoice={toggleVoice} onToMenu={() => goto(3)} />
                )}
                {screen === 2 && <StoresScreen onSelectStore={selectStore} />}
                {screen === 3 && (
                  <MenuScreen
                    selMenu={selMenu}
                    onSelectMenu={selectMenu}
                    qty={qty}
                    onIncQty={incQty}
                    onDecQty={decQty}
                    onToConfirm={reviewOrder}
                  />
                )}
                {screen === 4 && <ConfirmScreen onToDone={placeOrder} />}
                {screen === 5 && <DoneScreen onToPickup={goToPickup} />}
                {screen === 6 && <PickupScreen />}
                {screen === 7 && (
                  <SettingsScreen carColor={carColor} onPickColor={pickColor} prefs={prefs} onTogglePref={togglePref} />
                )}
              </div>

              {voiceOpen && <VoicePanel onClose={() => toggleVoice(false)} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
