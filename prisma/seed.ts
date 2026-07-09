import { PrismaClient, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Demo owner credentials (documented in README).
const OWNER_EMAIL = "owner@pleos.dev";
const OWNER_PASSWORD = "pleos1234";

// 카페몬지 판교점 — 판교역로146번길 20, 9층 (현대백화점판교점 건물).
const STORE_LAT = 37.3927985;
const STORE_LNG = 127.1120536;

async function main() {
  console.log("🌱 Seeding Pleos Pickup Merchant…");

  // Upsert the owner so its id stays stable across reseeds — this keeps any
  // existing login session valid. Store/menus/orders are recreated fresh.
  const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 10);
  const owner = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: { passwordHash, name: "김사장" },
    create: { email: OWNER_EMAIL, name: "김사장", passwordHash },
  });

  // Wipe this owner's stores (cascades categories/menus/orders/items).
  await prisma.store.deleteMany({ where: { ownerId: owner.id } });

  const store = await prisma.store.create({
    data: {
      ownerId: owner.id,
      name: "카페몬지 판교점",
      isOpen: true,
      pickupOn: true,
      congestion: "mid",
      weekdayOpen: "08:00",
      weekdayClose: "22:00",
      weekendOpen: "09:00",
      weekendClose: "21:00",
      closedDays: [1], // 매주 월요일 정기휴무
      lat: STORE_LAT,
      lng: STORE_LNG,
    },
  });

  // ---- Categories ----
  const cats = await Promise.all(
    [
      { name: "커피", sortOrder: 0 },
      { name: "티", sortOrder: 1 },
      { name: "디저트", sortOrder: 2 },
    ].map((c) =>
      prisma.category.create({ data: { ...c, storeId: store.id } }),
    ),
  );
  const catByName = Object.fromEntries(cats.map((c) => [c.name, c]));

  // ---- Menus (+ options) ----
  const menuSpecs = [
    {
      name: "아메리카노", price: 4500, cat: "커피", soldOut: false,
      options: [
        { name: "ICE / HOT", extraPrice: 0 },
        { name: "샷 추가", extraPrice: 500 },
        { name: "사이즈업", extraPrice: 500 },
      ],
    },
    {
      name: "카페라떼", price: 5000, cat: "커피", soldOut: false,
      options: [
        { name: "ICE / HOT", extraPrice: 0 },
        { name: "샷 추가", extraPrice: 500 },
        { name: "오트밀크", extraPrice: 600 },
        { name: "사이즈업", extraPrice: 500 },
      ],
    },
    {
      name: "콜드브루", price: 5000, cat: "커피", soldOut: true,
      options: [
        { name: "톨", extraPrice: 0 },
        { name: "그란데", extraPrice: 500 },
      ],
    },
    {
      name: "바닐라라떼", price: 5500, cat: "커피", soldOut: false,
      options: [
        { name: "ICE / HOT", extraPrice: 0 },
        { name: "샷 추가", extraPrice: 500 },
        { name: "연하게", extraPrice: 0 },
      ],
    },
    {
      name: "녹차라떼", price: 5500, cat: "티", soldOut: false,
      options: [
        { name: "ICE / HOT", extraPrice: 0 },
        { name: "샷 추가", extraPrice: 500 },
      ],
    },
    {
      name: "치즈케이크", price: 6500, cat: "디저트", soldOut: false,
      options: [{ name: "데우기", extraPrice: 0 }],
    },
  ];

  const menuByName: Record<string, { id: string }> = {};
  for (let i = 0; i < menuSpecs.length; i++) {
    const m = menuSpecs[i];
    const created = await prisma.menu.create({
      data: {
        storeId: store.id,
        categoryId: catByName[m.cat].id,
        name: m.name,
        price: m.price,
        soldOut: m.soldOut,
        sortOrder: i,
        options: {
          create: m.options.map((o, oi) => ({ ...o, sortOrder: oi })),
        },
      },
    });
    menuByName[m.name] = created;
  }

  // ---- Orders (from prototype mock) ----
  type ItemSpec = { name: string; opt: string; qty: number; price: number };
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
        storeId: store.id,
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
        custLat: o.distanceM > 0 ? STORE_LAT + o.distanceM / 111000 : null,
        custLng: o.distanceM > 0 ? STORE_LNG + o.distanceM / 111000 : null,
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

  console.log(
    `✅ Seeded: owner=${OWNER_EMAIL} / ${OWNER_PASSWORD}, store="${store.name}", ` +
      `${cats.length} categories, ${menuSpecs.length} menus, ${orderSpecs.length} orders.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
