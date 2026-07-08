import { create } from "zustand";

export type ArrivalInfo = { orderId: string; orderNo: string };

type UIState = {
  arrival: ArrivalInfo | null;
  showArrival: (a: ArrivalInfo) => void;
  hideArrival: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  arrival: null,
  showArrival: (arrival) => set({ arrival }),
  hideArrival: () => set({ arrival: null }),
}));
