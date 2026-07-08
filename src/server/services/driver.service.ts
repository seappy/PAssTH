import { prisma } from "@/server/db";
import { createOrder, type CreateOrderInput } from "./order.service";

/**
 * Driver (in-car) read/write logic. Unlike the merchant services these are
 * store-agnostic and unauthenticated — the driver client browses public store
 * info, then places an order that lands as a normal `new` order on the merchant
 * side (via the shared createOrder → NOTIFY path).
 */

// Demo driver origin (near Pangyo) used when the client sends no GPS location.
// Distance/ETA below are DERIVED from this + each store's coordinates, not
// hardcoded per store.
const DEFAULT_ORIGIN = { lat: 37.4009, lng: 127.1089 };
const AVG_SPEED_MPS = 8.3; // ~30 km/h city driving, for ETA estimation

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(s))));
}

type StoreRow = Awaited<ReturnType<typeof prisma.store.findMany>>[number];

function hoursText(store: StoreRow): string {
  const day = new Date().getDay(); // 0=Sun … 6=Sat
  if (store.closedDays.includes(day)) return "정기휴무";
  const weekend = day === 0 || day === 6;
  const close = weekend ? store.weekendClose : store.weekdayClose;
  if (!store.isOpen || !store.pickupOn) return "영업 준비중";
  return `영업중 · ~${close}`;
}

/** Whether the store can currently take pickup orders. */
function isOrderable(store: StoreRow): boolean {
  const day = new Date().getDay();
  return store.isOpen && store.pickupOn && !store.closedDays.includes(day);
}

function toStoreSummary(store: StoreRow, origin: { lat: number; lng: number }) {
  const hasCoords = store.lat != null && store.lng != null;
  const distanceM = hasCoords
    ? haversineMeters(origin, { lat: store.lat as number, lng: store.lng as number })
    : null;
  const etaSeconds = distanceM != null ? Math.round(distanceM / AVG_SPEED_MPS) : null;
  return {
    id: store.id,
    name: store.name,
    congestion: store.congestion,
    open: isOrderable(store),
    hoursText: hoursText(store),
    distanceM,
    etaSeconds,
  };
}

export type DriverStoreSummary = ReturnType<typeof toStoreSummary>;

/** Open-first, then nearest-first list of stores for the driver browse screens. */
export async function listStoresForDriver(origin?: { lat: number; lng: number }) {
  const o = origin ?? DEFAULT_ORIGIN;
  const stores = await prisma.store.findMany({ orderBy: { createdAt: "asc" } });
  return stores
    .map((s) => toStoreSummary(s, o))
    .sort((a, b) => {
      if (a.open !== b.open) return a.open ? -1 : 1;
      return (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity);
    });
}

/** One store's full menu (categories → menus → options) for the order screen. */
export async function getStoreMenu(storeId: string, origin?: { lat: number; lng: number }) {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) return null;
  const categories = await prisma.category.findMany({
    where: { storeId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      menus: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: { options: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  return {
    store: toStoreSummary(store, origin ?? DEFAULT_ORIGIN),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      menus: c.menus.map((m) => ({
        id: m.id,
        name: m.name,
        price: m.price,
        soldOut: m.soldOut,
        options: m.options.map((o) => ({ id: o.id, name: o.name, extraPrice: o.extraPrice })),
      })),
    })),
  };
}

/** Create an order from the driver client. Reuses the shared create+NOTIFY path. */
export async function placeDriverOrder(storeId: string, input: CreateOrderInput) {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) return null;
  const order = await createOrder(storeId, input);
  return { id: order.id, orderNo: order.orderNo, storeId };
}

/** Public order lookup for the pickup-tracking screen (by order id). */
export async function getDriverOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!order) return null;
  return {
    id: order.id,
    orderNo: order.orderNo,
    status: order.status,
    prepMinutes: order.prepMinutes,
    etaSeconds: order.etaSeconds,
    totalPrice: order.totalPrice,
    car: {
      number: order.carNumber,
      color: order.carColor,
      model: order.carModel,
      type: order.carType,
    },
    items: order.items.map((it) => ({
      name: it.nameSnap,
      price: it.priceSnap,
      quantity: it.quantity,
      optionsText: it.optionsText,
    })),
  };
}
