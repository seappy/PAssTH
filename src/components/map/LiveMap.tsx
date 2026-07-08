"use client";

import { KakaoMap, type MapOrder } from "./KakaoMap";
import { MockMap } from "./MockMap";

/**
 * Live map wrapper. Renders a real Kakao map when NEXT_PUBLIC_KAKAO_MAP_KEY is
 * set, otherwise falls back to the mock map so the app works without a key.
 */
export function LiveMap({
  store,
  orders,
}: {
  store: { lat: number | null; lng: number | null } | null;
  orders: MapOrder[];
}) {
  const hasKey = !!process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  if (hasKey) return <KakaoMap store={store} orders={orders} />;
  return <MockMap orders={orders.map((o) => ({ id: o.id, distanceM: o.distanceM }))} />;
}
