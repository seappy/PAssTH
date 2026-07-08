import { menuItems, routeStores, SCREEN_TITLES } from "@/lib/driver/mockData";
import { useDriverStore } from "@/stores/driver.store";

/**
 * A snapshot of everything the intent parser needs to turn free-form speech
 * into concrete `DriverCommand`s — e.g. resolve "스타벅스" to a store index, or
 * "아메리카노" to a menu index. Feed this to the LLM prompt as grounding context.
 *
 * NOTE: stores/menu are currently mock data (`src/lib/driver/mockData.ts`).
 * When the driver flow is wired to the real tRPC API, source these lists from
 * the live query instead — the shape stays the same.
 */
export interface VoiceContext {
  screen: number;
  screenTitle: string;
  selectedStore: number | null;
  qty: number;
  stores: { index: number; name: string; category: string; eta: string; open: boolean }[];
  menu: { index: number; name: string; description: string; price: string }[];
}

export function getVoiceContext(): VoiceContext {
  const s = useDriverStore.getState();
  return {
    screen: s.screen,
    screenTitle: SCREEN_TITLES[s.screen] ?? "",
    selectedStore: s.selectedStore,
    qty: s.qty,
    stores: routeStores.map((st, index) => ({
      index,
      name: st.name,
      category: st.cat,
      eta: st.eta,
      open: st.open,
    })),
    menu: menuItems.map((m, index) => ({
      index,
      name: m.name,
      description: m.desc,
      price: m.price,
    })),
  };
}
