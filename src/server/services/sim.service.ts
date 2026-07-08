import { prisma } from "@/server/db";
import { createOrder } from "./order.service";

const CARS = [
  { number: "34가 5678", color: "흰색", model: "쏘렌토", type: "SUV" },
  { number: "12나 3456", color: "검정", model: "아반떼", type: "승용" },
  { number: "78다 9012", color: "회색", model: "K5", type: "승용" },
  { number: "55라 1234", color: "흰색", model: "모닝", type: "경차" },
  { number: "21마 8765", color: "파랑", model: "투싼", type: "SUV" },
  { number: "90바 2468", color: "빨강", model: "셀토스", type: "SUV" },
  { number: "07사 1357", color: "은색", model: "그랜저", type: "승용" },
];
const OPTS = ["ICE", "HOT", "ICE · 샷 추가", "HOT · 연하게", "ICE · 톨", "HOT · 오트밀크"];
const MEMOS = [
  "",
  "",
  "조수석 창문으로 전달 부탁드려요",
  "매장 앞 도착하면 전화주세요",
  "빨대 2개 주세요",
];

const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/** Create a plausible random incoming order for the store (realtime demo). */
export async function createFakeOrder(storeId: string) {
  // Prefer real, in-stock menus so totals/snapshots look realistic.
  const menus = await prisma.menu.findMany({
    where: { storeId, soldOut: false },
  });
  const store = await prisma.store.findUniqueOrThrow({ where: { id: storeId } });

  const count = randInt(1, 2);
  const items = Array.from({ length: count }).map(() => {
    const m = menus.length ? rand(menus) : null;
    return {
      menuId: m?.id ?? null,
      name: m?.name ?? "아메리카노",
      price: m?.price ?? 4500,
      quantity: randInt(1, 2),
      optionsText: rand(OPTS),
    };
  });

  const distanceM = randInt(80, 900);
  const etaSeconds = Math.round((distanceM / 500) * 60) + randInt(30, 120); // ~2s/m-ish
  const lat = store.lat ?? 37.3947;
  const lng = store.lng ?? 127.1112;

  return createOrder(storeId, {
    items,
    customerMemo: rand(MEMOS) || null,
    etaSeconds,
    distanceM,
    car: rand(CARS),
    custLat: lat + distanceM / 111000,
    custLng: lng + distanceM / 111000,
  });
}
