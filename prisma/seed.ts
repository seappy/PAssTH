import { PrismaClient, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Demo owner credentials (documented in README).
const OWNER_EMAIL = "owner@pleos.dev";
const OWNER_PASSWORD = "pleos1234";

// 카페몬지 판교점 — 판교역로146번길 20, 9층 (현대백화점판교점 건물).
const PRIMARY_LAT = 37.3927985;
const PRIMARY_LNG = 127.1120536;

const CATEGORY_SPECS = [
  { name: "커피", sortOrder: 0 },
  { name: "티", sortOrder: 1 },
  { name: "디저트", sortOrder: 2 },
] as const;

// Shared demo menu photos (uploaded via 잇츠커피; public Supabase URLs reused across stores).
const MENU_IMAGE_BASE =
  "https://kxhjkdingkqdjcnrqqsq.supabase.co/storage/v1/object/public/menu-images/cmrcye63q0002cnrdyum1nqp6";

const MENU_SPECS = [
  {
    name: "아메리카노", price: 4500, cat: "커피", soldOut: false,
    imageUrl: `${MENU_IMAGE_BASE}/58e51a62-c223-4102-9729-585678d24062.webp`,
    options: [
      { name: "ICE / HOT", extraPrice: 0 },
      { name: "샷 추가", extraPrice: 500 },
      { name: "사이즈업", extraPrice: 500 },
    ],
  },
  {
    name: "카페라떼", price: 5000, cat: "커피", soldOut: false,
    imageUrl: `${MENU_IMAGE_BASE}/1b37873e-d5c7-4cf6-a790-4d780f0203d8.webp`,
    options: [
      { name: "ICE / HOT", extraPrice: 0 },
      { name: "샷 추가", extraPrice: 500 },
      { name: "오트밀크", extraPrice: 600 },
      { name: "사이즈업", extraPrice: 500 },
    ],
  },
  {
    name: "콜드브루", price: 5000, cat: "커피", soldOut: true,
    imageUrl: `${MENU_IMAGE_BASE}/4534273f-8569-4225-ae50-bae26c2a587e.jpg`,
    options: [
      { name: "톨", extraPrice: 0 },
      { name: "그란데", extraPrice: 500 },
    ],
  },
  {
    name: "바닐라라떼", price: 5500, cat: "커피", soldOut: false,
    imageUrl: `${MENU_IMAGE_BASE}/1060bbfd-27e5-4897-8499-2ea75c34b7aa.webp`,
    options: [
      { name: "ICE / HOT", extraPrice: 0 },
      { name: "샷 추가", extraPrice: 500 },
      { name: "연하게", extraPrice: 0 },
    ],
  },
  {
    name: "녹차라떼", price: 5500, cat: "티", soldOut: false,
    imageUrl: `${MENU_IMAGE_BASE}/9efb09e6-211b-423e-8883-a85599bc827f.webp`,
    options: [
      { name: "ICE / HOT", extraPrice: 0 },
      { name: "샷 추가", extraPrice: 500 },
    ],
  },
  {
    name: "치즈케이크", price: 6500, cat: "디저트", soldOut: false,
    imageUrl: `${MENU_IMAGE_BASE}/f44b9efe-7abf-4351-bca2-73fe487a47bd.jpg`,
    options: [{ name: "데우기", extraPrice: 0 }],
  },
] as const;

type StoreSpec = {
  name: string;
  lat: number;
  lng: number;
  seedOrders?: boolean;
};

/**
 * 판교역 인근 실제 카페 11곳 (운전자 매장 그리드·거리/ETA 데모용).
 * 시드는 목록에 없는 사장님 매장은 삭제하고, 각 매장 메뉴를 카페몬지 기준으로 맞춥니다.
 */
const STORE_SPECS: StoreSpec[] = [
  { name: "카페몬지 판교점", lat: PRIMARY_LAT, lng: PRIMARY_LNG, seedOrders: true },
  { name: "아메리칸트레일러 판교카카오아지트점", lat: 37.3993, lng: 127.1097 },
  { name: "까누누레 현대백화점판교점", lat: 37.3928, lng: 127.1121 },
  { name: "잇츠커피", lat: 37.3985, lng: 127.1090 },
  { name: "오크베리 판교역점", lat: 37.3943, lng: 127.1123 },
  { name: "메이크어케이크 아브뉴프랑판교점", lat: 37.3973, lng: 127.1138 },
  { name: "카페스트레가", lat: 37.3966, lng: 127.1107 },
  { name: "루트비커피 판교알파리움점", lat: 37.3972, lng: 127.1117 },
  { name: "업비트커피(Upbeat Coffee)", lat: 37.4006, lng: 127.1069 },
  { name: "폭스트롯(fxtrt)", lat: 37.3954, lng: 127.1097 },
  { name: "휘앙", lat: 37.4021, lng: 127.1060 },
];

/** 기존 메뉴를 지우고 카페몬지와 동일한 카테고리·메뉴·옵션으로 다시 채웁니다. */
async function replaceMenus(storeId: string) {
  await prisma.menu.deleteMany({ where: { storeId } });
  await prisma.category.deleteMany({ where: { storeId } });

  const cats = await Promise.all(
    CATEGORY_SPECS.map((c) =>
      prisma.category.create({ data: { ...c, storeId } }),
    ),
  );
  const catByName = Object.fromEntries(cats.map((c) => [c.name, c]));

  const menuByName: Record<string, { id: string }> = {};
  for (let i = 0; i < MENU_SPECS.length; i++) {
    const m = MENU_SPECS[i];
    const created = await prisma.menu.create({
      data: {
        storeId,
        categoryId: catByName[m.cat].id,
        name: m.name,
        price: m.price,
        soldOut: m.soldOut,
        imageUrl: m.imageUrl,
        sortOrder: i,
        options: {
          create: m.options.map((o, oi) => ({ ...o, sortOrder: oi })),
        },
      },
    });
    menuByName[m.name] = created;
  }

  return { cats, menuByName };
}

async function ensureStore(ownerId: string, spec: StoreSpec) {
  const existing = await prisma.store.findFirst({
    where: { ownerId, name: spec.name },
  });
  if (existing) {
    return prisma.store.update({
      where: { id: existing.id },
      data: {
        lat: spec.lat,
        lng: spec.lng,
        isOpen: true,
        pickupOn: true,
      },
    });
  }
  return prisma.store.create({
    data: {
      ownerId,
      name: spec.name,
      isOpen: true,
      pickupOn: true,
      congestion: "mid",
      weekdayOpen: "08:00",
      weekdayClose: "22:00",
      weekendOpen: "09:00",
      weekendClose: "21:00",
      closedDays: [1],
      lat: spec.lat,
      lng: spec.lng,
    },
  });
}

async function main() {
  console.log("🌱 Seeding Pleos Pickup Merchant…");

  // Upsert the owner so its id stays stable across reseeds — this keeps any
  // existing login session valid.
  const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 10);
  const owner = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: { passwordHash, name: "김사장" },
    create: { email: OWNER_EMAIL, name: "김사장", passwordHash },
  });

  let primaryStoreId: string | null = null;
  let menuCount = 0;
  let categoryCount = 0;

  for (const spec of STORE_SPECS) {
    const store = await ensureStore(owner.id, spec);
    if (!primaryStoreId) primaryStoreId = store.id;

    const { cats, menuByName } = await replaceMenus(store.id);
    categoryCount += cats.length;
    menuCount += MENU_SPECS.length;

    if (spec.seedOrders) {
      const orderCount = await prisma.order.count({ where: { storeId: store.id } });
      if (orderCount === 0) {
        await seedOrders(store.id, spec.lat, spec.lng, menuByName);
      }
    }
  }

  const specNames = STORE_SPECS.map((s) => s.name);
  const removed = await prisma.store.deleteMany({
    where: { ownerId: owner.id, name: { notIn: specNames } },
  });
  if (removed.count > 0) {
    console.log(`🧹 Removed ${removed.count} store(s) not in STORE_SPECS.`);
  }

  if (primaryStoreId) {
    const current = await prisma.user.findUnique({
      where: { id: owner.id },
      select: { activeStoreId: true },
    });
    if (!current?.activeStoreId) {
      await prisma.user.update({
        where: { id: owner.id },
        data: { activeStoreId: primaryStoreId },
      });
    }
  }

  const totalStores = await prisma.store.count({ where: { ownerId: owner.id } });
  console.log(
    `✅ Seeded: owner=${OWNER_EMAIL} / ${OWNER_PASSWORD}, ` +
      `${STORE_SPECS.length} stores synced (${totalStores} total for owner), ` +
      `${categoryCount} categories, ${menuCount} menus.`,
  );
}

type ItemSpec = { name: string; opt: string; qty: number; price: number };

async function seedOrders(
  storeId: string,
  storeLat: number,
  storeLng: number,
  menuByName: Record<string, { id: string }>,
) {
  const orderSpecs: {
    orderNo: string;
    status: OrderStatus;
    memo?: string;
    prepMinutes?: number;
    etaSeconds: number;
    distanceM: number;
    car: { number: string; color: string; model: string; type: string };
    items: ItemSpec[];
    total: number;
    minutesAgo: number;
  }[] = [
    {
      orderNo: "#A-102", status: "new", memo: "조수석 창문으로 전달 부탁드려요",
      etaSeconds: 735, distanceM: 150,
      car: { number: "34가 5678", color: "흰색", model: "쏘렌토", type: "SUV" },
      items: [
        { name: "아메리카노", opt: "ICE · 샷 추가", qty: 1, price: 4500 },
        { name: "카페라떼", opt: "HOT · 오트밀크", qty: 1, price: 5000 },
      ],
      total: 9500, minutesAgo: 3,
    },
    {
      orderNo: "#A-101", status: "preparing",
      etaSeconds: 245, distanceM: 420,
      car: { number: "12나 3456", color: "검정", model: "아반떼", type: "승용" },
      items: [
        { name: "카페라떼", opt: "HOT", qty: 1, price: 5000 },
        { name: "바닐라라떼", opt: "ICE · 연하게", qty: 1, price: 5500 },
      ],
      total: 10500, minutesAgo: 7,
    },
    {
      orderNo: "#A-100", status: "ready", memo: "매장 앞 도착하면 전화주세요",
      etaSeconds: 75, distanceM: 80,
      car: { number: "78다 9012", color: "회색", model: "K5", type: "승용" },
      items: [{ name: "콜드브루", opt: "ICE · 톨", qty: 1, price: 5000 }],
      total: 5000, minutesAgo: 11,
    },
    {
      orderNo: "#A-098", status: "done",
      etaSeconds: 0, distanceM: 0,
      car: { number: "55라 1234", color: "흰색", model: "모닝", type: "경차" },
      items: [{ name: "아메리카노", opt: "ICE", qty: 2, price: 4500 }],
      total: 9000, minutesAgo: 29,
    },
    {
      orderNo: "#A-097", status: "done",
      etaSeconds: 0, distanceM: 0,
      car: { number: "21마 8765", color: "파랑", model: "투싼", type: "SUV" },
      items: [{ name: "녹차라떼", opt: "HOT", qty: 1, price: 5500 }],
      total: 5500, minutesAgo: 43,
    },
  ];

  for (const o of orderSpecs) {
    await prisma.order.create({
      data: {
        storeId,
        orderNo: o.orderNo,
        status: o.status,
        customerMemo: o.memo ?? null,
        prepMinutes: o.prepMinutes ?? 10,
        etaSeconds: o.etaSeconds,
        distanceM: o.distanceM,
        carNumber: o.car.number,
        carColor: o.car.color,
        carModel: o.car.model,
        carType: o.car.type,
        custLat: o.distanceM > 0 ? storeLat + o.distanceM / 111000 : null,
        custLng: o.distanceM > 0 ? storeLng + o.distanceM / 111000 : null,
        totalPrice: o.total,
        createdAt: new Date(Date.now() - o.minutesAgo * 60_000),
        items: {
          create: o.items.map((it) => ({
            menuId: menuByName[it.name]?.id ?? null,
            nameSnap: it.name,
            priceSnap: it.price,
            quantity: it.qty,
            optionsText: it.opt,
          })),
        },
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
