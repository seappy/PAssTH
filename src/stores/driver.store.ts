import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Prefs, ScreenId } from "@/lib/driver/types";
import { chatMessages } from "@/lib/driver/mockData";

/**
 * Driver (in-car infotainment) store — the single source of truth for the
 * `/drive` client, and the shared "action layer" that BOTH touch and voice go
 * through.
 *
 * Design goal (see CLAUDE.md): every user-facing action is a named method here.
 * The touch UI calls these methods; the voice pipeline (STT → intent parser,
 * built separately) calls the exact same methods via
 * `src/lib/driver/voice/commands.ts`. So "말로 하기" === "손으로 누르기".
 *
 * Do NOT put ASR/LLM/TTS logic in this file. This layer only knows *what* the
 * app can do, not *how* a request arrived.
 */

export interface AssistantMessage {
  role: "user" | "assistant";
  text: string;
}

const seedMessages: AssistantMessage[] = chatMessages.map((m) => ({
  role: m.ai ? "assistant" : "user",
  text: m.text,
}));

export interface DriverState {
  // ---- state ----
  screen: ScreenId;
  voiceOpen: boolean;
  /** true while the STT engine is capturing; the voice dev flips this. */
  listening: boolean;
  selectedStore: number | null;
  selMenu: number;
  qty: number;
  carColor: number;
  prefs: Prefs;
  /** GLEO conversation log rendered in the voice panel. */
  messages: AssistantMessage[];

  // ---- navigation ----
  goto: (screen: ScreenId) => void;
  back: () => void;
  goHome: () => void;

  // ---- voice panel ----
  toggleVoice: (open?: boolean) => void;
  setListening: (listening: boolean) => void;

  // ---- ordering flow (the "remote control buttons") ----
  selectStore: (index: number) => void;
  selectMenu: (index: number) => void;
  setQty: (qty: number) => void;
  incQty: () => void;
  decQty: () => void;
  reviewOrder: () => void; // 메뉴 → 주문 확인
  placeOrder: () => void; // 주문 확인 → 결제 완료
  goToPickup: () => void; // 완료 → 픽업 진행

  // ---- settings ----
  pickColor: (index: number) => void;
  togglePref: (key: keyof Prefs) => void;

  // ---- assistant conversation (dialog log + TTS target) ----
  pushMessage: (msg: AssistantMessage) => void;
  clearMessages: () => void;

  // ---- lifecycle ----
  resetOrder: () => void;
}

const clampScreen = (n: number): ScreenId => Math.min(7, Math.max(1, n)) as ScreenId;

export const useDriverStore = create<DriverState>()(
  persist(
    (set, get) => ({
      // ---- initial state ----
      screen: 1,
      voiceOpen: false,
      listening: false,
      selectedStore: null,
      selMenu: 0,
      qty: 2,
      carColor: 4,
      prefs: { autoEta: true, pleosPay: true, voiceGuide: false },
      messages: seedMessages,

      // ---- navigation ----
      goto: (screen) => set({ screen }),
      back: () => set({ screen: get().screen === 7 ? 1 : clampScreen(get().screen - 1) }),
      goHome: () => set({ screen: 1 }),

      // ---- voice panel ----
      toggleVoice: (open) => set((s) => ({ voiceOpen: open ?? !s.voiceOpen })),
      setListening: (listening) => set({ listening }),

      // ---- ordering flow ----
      selectStore: (index) => set({ selectedStore: index, screen: 3 }),
      selectMenu: (index) => set({ selMenu: index }),
      setQty: (qty) => set({ qty: Math.max(1, qty) }),
      incQty: () => set((s) => ({ qty: s.qty + 1 })),
      decQty: () => set((s) => ({ qty: Math.max(1, s.qty - 1) })),
      reviewOrder: () => set({ screen: 4 }),
      placeOrder: () => set({ screen: 5 }),
      goToPickup: () => set({ screen: 6 }),

      // ---- settings ----
      pickColor: (index) => set({ carColor: index }),
      togglePref: (key) => set((s) => ({ prefs: { ...s.prefs, [key]: !s.prefs[key] } })),

      // ---- assistant conversation ----
      pushMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      clearMessages: () => set({ messages: [] }),

      // ---- lifecycle ----
      resetOrder: () =>
        set({ screen: 1, selectedStore: null, selMenu: 0, qty: 2, voiceOpen: false }),
    }),
    {
      name: "pleos-driver",
      storage: createJSONStorage(() => localStorage),
      // Persist only durable user settings — not transient nav/voice/order state.
      // (Keeps the initial home render deterministic → no hydration mismatch.)
      partialize: (s) => ({ carColor: s.carColor, prefs: s.prefs }),
    }
  )
);
