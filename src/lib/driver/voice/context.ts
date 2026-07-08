import { driverApi } from "@/lib/driver/api";
import { useDriverStore } from "@/stores/driver.store";

/**
 * A live snapshot the intent parser needs to turn speech into concrete
 * `DriverCommand`s — resolve "스타벅스" to a storeId, or "아메리카노" to a menu
 * item (id + price). Fetches real data from the driver API, grounded on the
 * current screen/cart. Async because the catalog is server-backed now.
 */
export interface VoiceContext {
  screen: number;
  selectedStoreId: string | null;
  cart: { name: string; qty: number; optionsText?: string }[];
  stores: { id: string; name: string; open: boolean; etaSeconds: number | null }[];
  menu: {
    category: string;
    id: string;
    name: string;
    price: number;
    soldOut: boolean;
    options: { name: string; extraPrice: number }[];
  }[];
}

export async function getVoiceContext(): Promise<VoiceContext> {
  const s = useDriverStore.getState();

  const stores = await driverApi.driver.stores.query(s.driverLoc ?? undefined);

  let menu: VoiceContext["menu"] = [];
  if (s.selectedStoreId) {
    const data = await driverApi.driver.storeMenu.query({
      storeId: s.selectedStoreId,
      origin: s.driverLoc ?? undefined,
    });
    menu = data.categories.flatMap((c) =>
      c.menus.map((m) => ({
        category: c.name,
        id: m.id,
        name: m.name,
        price: m.price,
        soldOut: m.soldOut,
        options: m.options.map((o) => ({ name: o.name, extraPrice: o.extraPrice })),
      })),
    );
  }

  return {
    screen: s.screen,
    selectedStoreId: s.selectedStoreId,
    cart: s.cart.map((l) => ({ name: l.name, qty: l.qty, optionsText: l.optionsText })),
    stores: stores.map((st) => ({ id: st.id, name: st.name, open: st.open, etaSeconds: st.etaSeconds })),
    menu,
  };
}
