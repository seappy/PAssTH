import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartLine, CarInfo, PlacedOrder, Prefs, ScreenId } from "@/lib/driver/types";
import { carColorDefs } from "@/lib/driver/config";
import { driverApi } from "@/lib/driver/api";

/**
 * Driver (in-car) store — single source of truth for the `/drive` client and
 * the shared action layer for touch AND voice (see CLAUDE.md). State is backed
 * by real data now: `selectedStoreId` + a real `cart`, and `placeOrder` creates
 * an actual order via the driver tRPC API (→ merchant sees it live). No
 * hardcoded stores/menus live here — those come from `trpc.driver.*` queries.
 */

export interface AssistantMessage {
  role: "user" | "assistant";
  text: string;
}

const GREETING: AssistantMessage = {
  role: "assistant",
  text: "무엇을 도와드릴까요? “가는 길에 아메리카노 주문해줘”처럼 말해보세요.",
};

const DEFAULT_CAR: CarInfo = { number: "12가 3456", color: "블랙", model: "아이오닉 6", type: "승용" };

export interface DriverState {
  // ---- state ----
  screen: ScreenId;
  voiceOpen: boolean;
  listening: boolean;
  messages: AssistantMessage[];
  /** Optional GPS; null → server uses a demo origin for distance/ETA. */
  driverLoc: { lat: number; lng: number } | null;
  selectedStoreId: string | null;
  cart: CartLine[];
  car: CarInfo;
  carColor: number; // index into carColorDefs (settings swatch)
  prefs: Prefs;
  memo: string;
  placing: boolean;
  orderError: string | null;
  placedOrder: PlacedOrder | null;

  // ---- navigation ----
  goto: (screen: ScreenId) => void;
  back: () => void;
  goHome: () => void;

  // ---- voice panel ----
  toggleVoice: (open?: boolean) => void;
  setListening: (listening: boolean) => void;
  pushMessage: (msg: AssistantMessage) => void;
  clearMessages: () => void;

  // ---- location ----
  setDriverLoc: (loc: { lat: number; lng: number } | null) => void;

  // ---- ordering flow (the "remote control buttons") ----
  selectStore: (storeId: string) => void;
  addToCart: (line: CartLine) => void;
  setLineQty: (index: number, qty: number) => void;
  removeLine: (index: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  reviewOrder: () => void; // 메뉴 → 주문 확인
  placeOrder: () => Promise<PlacedOrder | null>; // 주문 확인 → 결제/생성 → 완료
  goToPickup: () => void; // 완료 → 픽업 진행

  // ---- settings ----
  pickColor: (index: number) => void;
  setCar: (patch: Partial<CarInfo>) => void;
  togglePref: (key: keyof Prefs) => void;

  // ---- lifecycle ----
  resetOrder: () => void;
}

export const useDriverStore = create<DriverState>()(
  persist(
    (set, get) => ({
      // ---- initial state ----
      screen: 1,
      voiceOpen: false,
      listening: false,
      messages: [GREETING],
      driverLoc: null,
      selectedStoreId: null,
      cart: [],
      car: DEFAULT_CAR,
      carColor: 4,
      prefs: { autoEta: true, pleosPay: true, voiceGuide: false },
      memo: "",
      placing: false,
      orderError: null,
      placedOrder: null,

      // ---- navigation ----
      goto: (screen) => set({ screen }),
      back: () =>
        set((s) => ({ screen: s.screen === 7 ? 1 : (Math.max(1, s.screen - 1) as ScreenId) })),
      goHome: () => set({ screen: 1 }),

      // ---- voice panel ----
      toggleVoice: (open) => set((s) => ({ voiceOpen: open ?? !s.voiceOpen })),
      setListening: (listening) => set({ listening }),
      pushMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      clearMessages: () => set({ messages: [GREETING] }),

      // ---- location ----
      setDriverLoc: (driverLoc) => set({ driverLoc }),

      // ---- ordering flow ----
      selectStore: (storeId) =>
        set((s) => ({
          selectedStoreId: storeId,
          // switching stores empties the cart (menu differs per store)
          cart: s.selectedStoreId === storeId ? s.cart : [],
          screen: 3,
        })),

      addToCart: (line) =>
        set((s) => {
          const i = s.cart.findIndex(
            (l) => l.menuId === line.menuId && (l.optionsText ?? "") === (line.optionsText ?? ""),
          );
          if (i >= 0) {
            const cart = s.cart.slice();
            cart[i] = { ...cart[i], qty: cart[i].qty + line.qty };
            return { cart };
          }
          return { cart: [...s.cart, line] };
        }),

      setLineQty: (index, qty) =>
        set((s) => {
          const cart = s.cart.slice();
          if (!cart[index]) return {};
          if (qty <= 0) {
            cart.splice(index, 1);
          } else {
            cart[index] = { ...cart[index], qty };
          }
          return { cart };
        }),

      removeLine: (index) => set((s) => ({ cart: s.cart.filter((_, i) => i !== index) })),
      clearCart: () => set({ cart: [] }),
      cartTotal: () => get().cart.reduce((sum, l) => sum + l.unitPrice * l.qty, 0),

      reviewOrder: () => {
        if (get().cart.length === 0) return;
        set({ screen: 4 });
      },

      placeOrder: async () => {
        const s = get();
        if (s.placing) return null;
        const storeId = s.selectedStoreId;
        if (!storeId || s.cart.length === 0) {
          set({ orderError: "장바구니가 비어 있어요." });
          return null;
        }
        set({ placing: true, orderError: null });
        try {
          const result = await driverApi.driver.createOrder.mutate({
            storeId,
            items: s.cart.map((l) => ({
              menuId: l.menuId,
              name: l.name,
              price: l.unitPrice,
              quantity: l.qty,
              optionsText: l.optionsText,
            })),
            car: s.car,
            customerMemo: s.memo || undefined,
            distanceM: undefined,
            custLat: s.driverLoc?.lat,
            custLng: s.driverLoc?.lng,
          });
          set({ placing: false, placedOrder: result, screen: 5 });
          return result;
        } catch (err) {
          set({
            placing: false,
            orderError: err instanceof Error ? err.message : "주문 전송에 실패했어요.",
          });
          return null;
        }
      },

      goToPickup: () => set({ screen: 6 }),

      // ---- settings ----
      pickColor: (index) =>
        set({ carColor: index, car: { ...get().car, color: carColorDefs[index]?.name ?? get().car.color } }),
      setCar: (patch) => set((s) => ({ car: { ...s.car, ...patch } })),
      togglePref: (key) => set((s) => ({ prefs: { ...s.prefs, [key]: !s.prefs[key] } })),

      // ---- lifecycle ----
      resetOrder: () =>
        set({ screen: 1, selectedStoreId: null, cart: [], memo: "", placedOrder: null, orderError: null }),
    }),
    {
      name: "pleos-driver",
      storage: createJSONStorage(() => localStorage),
      // Persist durable vehicle/settings only — not transient nav/cart/order.
      partialize: (s) => ({ car: s.car, carColor: s.carColor, prefs: s.prefs }),
    }
  )
);
