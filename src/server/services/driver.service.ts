import { prisma } from "@/server/db";
import { createOrder, type CreateOrderInput } from "./order.service";
import { getDrivingRoute } from "./kakao-route";
import { PANGYO_STATION } from "@/lib/driver/format";

/**
 * Driver (in-car) read/write logic. Unlike the merchant services these are
 * store-agnostic and unauthenticated — the driver client browses public store
 * info, then places an order that lands as a normal `new` order on the merchant
 * side (via the shared createOrder → NOTIFY path).
 */

// Fallback when the client sends no GPS — matches the 판교역 demo anchor.
const DEFAULT_ORIGIN = PANGYO_STATION;

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

async function toStoreSummary(store: StoreRow, origin: { lat: number; lng: number }) {
  const hasCoords = store.lat != null && store.lng != null;
  let distanceM: number | null = null;
  let etaSeconds: number | null = null;
  let routeSource: "kakao" | "estimate" | null = null;

  if (hasCoords) {
    const route = await getDrivingRoute(origin, {
      lat: store.lat as number,
      lng: store.lng as number,
    });
    distanceM = route.distanceM;
    etaSeconds = route.etaSeconds;
    routeSource = route.source;
  }

  return {
    id: store.id,
    name: store.name,
    imageUrl: store.imageUrl,
    congestion: store.congestion,
    open: isOrderable(store),
    hoursText: hoursText(store),
    distanceM,
    etaSeconds,
    routeSource,
  };
}

export type DriverStoreSummary = Awaited<ReturnType<typeof toStoreSummary>>;

/** Open-first, then nearest-first list of stores for the driver browse screens. */
export async function listStoresForDriver(origin?: { lat: number; lng: number }) {
  const o = origin ?? DEFAULT_ORIGIN;
  const stores = await prisma.store.findMany({ orderBy: { createdAt: "asc" } });
  const summaries = await Promise.all(stores.map((s) => toStoreSummary(s, o)));
  return summaries.sort((a, b) => {
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
    store: await toStoreSummary(store, origin ?? DEFAULT_ORIGIN),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      menus: c.menus.map((m) => ({
        id: m.id,
        name: m.name,
        price: m.price,
        imageUrl: m.imageUrl,
        soldOut: m.soldOut,
        options: m.options.map((o) => ({ id: o.id, name: o.name, extraPrice: o.extraPrice })),
      })),
    })),
  };
}

/** Driving distance/ETA from a point to a store (pickup map, order tab). */
export async function getRouteToStore(
  origin: { lat: number; lng: number },
  storeId: string,
) {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store?.lat || !store?.lng) return null;
  return getDrivingRoute(origin, { lat: store.lat, lng: store.lng });
}

/** Create an order from the driver client. Reuses the shared create+NOTIFY path. */
export async function placeDriverOrder(storeId: string, input: CreateOrderInput) {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) return null;

  let payload = input;
  if (
    input.custLat != null &&
    input.custLng != null &&
    store.lat != null &&
    store.lng != null
  ) {
    const route = await getDrivingRoute(
      { lat: input.custLat, lng: input.custLng },
      { lat: store.lat, lng: store.lng },
    );
    payload = {
      ...input,
      distanceM: route.distanceM,
      etaSeconds: route.etaSeconds,
    };
  }

  const order = await createOrder(storeId, payload);
  return { id: order.id, orderNo: order.orderNo, storeId };
}

/** Save the driver's post-pickup rating (1~5) + optional one-line review. */
export async function submitFeedback(orderId: string, rating: number, reviewText?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  await prisma.order.update({
    where: { id: orderId },
    data: { rating, reviewText: reviewText?.trim() || null },
  });
  return { id: orderId, rating };
}

function summarizeItems(items: { nameSnap: string; quantity: number }[]): string {
  if (items.length === 0) return "";
  const first = items[0];
  if (items.length === 1) return `${first.nameSnap} ${first.quantity}개`;
  return `${first.nameSnap} 외 ${items.length - 1}개`;
}

/** Recent orders for this vehicle (driver "주문" tab history). */
export async function listOrdersByCar(carNumber: string) {
  const num = carNumber.trim();
  if (!num) return [];
  const orders = await prisma.order.findMany({
    where: { carNumber: num },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      items: { orderBy: { id: "asc" } },
      store: { select: { name: true } },
    },
  });
  return orders.map((o) => ({
    id: o.id,
    orderNo: o.orderNo,
    status: o.status,
    storeId: o.storeId,
    createdAt: o.createdAt,
    totalPrice: o.totalPrice,
    storeName: o.store.name,
    itemSummary: summarizeItems(o.items),
  }));
}

/** Public order lookup for the pickup-tracking screen (by order id). */
export async function getDriverOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { orderBy: { id: "asc" } }, store: { select: { name: true, lat: true, lng: true } } },
  });
  if (!order) return null;
  return {
    id: order.id,
    orderNo: order.orderNo,
    storeId: order.storeId,
    status: order.status,
    prepMinutes: order.prepMinutes,
    etaSeconds: order.etaSeconds,
    distanceM: order.distanceM,
    totalPrice: order.totalPrice,
    customerMemo: order.customerMemo,
    custLat: order.custLat,
    custLng: order.custLng,
    store: order.store,
    updatedAt: order.updatedAt,
    car: {
      number: order.carNumber,
      color: order.carColor,
      model: order.carModel,
      type: order.carType,
    },
    items: order.items.map((it) => ({
      menuId: it.menuId,
      name: it.nameSnap,
      price: it.priceSnap,
      quantity: it.quantity,
      optionsText: it.optionsText,
    })),
  };
}
