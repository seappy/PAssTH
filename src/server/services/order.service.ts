import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/server/db";
import { notify } from "@/server/events";
import { ADVANCE_NEXT } from "@/lib/format";
import type { OrderStatus } from "@/types/domain";

const orderInclude = {
  items: { orderBy: { id: "asc" } },
} satisfies Prisma.OrderInclude;

export type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export function listOrders(storeId: string, status?: OrderStatus) {
  return prisma.order.findMany({
    where: { storeId, ...(status ? { status } : {}) },
    include: orderInclude,
    orderBy: [{ createdAt: "desc" }],
  });
}

/** Active = anything not terminal (done/rejected), sorted nearest-first. */
export async function nearbyOrders(storeId: string) {
  const orders = await prisma.order.findMany({
    where: { storeId, status: { notIn: ["done", "rejected"] } },
    include: orderInclude,
  });
  return orders.sort((a, b) => a.distanceM - b.distanceM);
}

export async function getOrder(storeId: string, id: string) {
  const order = await prisma.order.findFirst({
    where: { id, storeId },
    include: orderInclude,
  });
  if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "주문을 찾을 수 없습니다." });
  return order;
}

async function requireOrder(storeId: string, id: string) {
  const order = await prisma.order.findFirst({ where: { id, storeId } });
  if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "주문을 찾을 수 없습니다." });
  return order;
}

export async function acceptOrder(storeId: string, id: string, prepMinutes?: number) {
  const order = await requireOrder(storeId, id);
  if (order.status !== "new") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "신규 주문만 수락할 수 있어요." });
  }
  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: "accepted",
      ...(prepMinutes != null ? { prepMinutes: clampPrep(prepMinutes) } : {}),
    },
    include: orderInclude,
  });
  await notify({ type: "order.updated", storeId, orderId: id, status: "accepted" });
  return updated;
}

export async function rejectOrder(storeId: string, id: string) {
  const order = await requireOrder(storeId, id);
  if (order.status !== "new") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "신규 주문만 거절할 수 있어요." });
  }
  const updated = await prisma.order.update({
    where: { id },
    data: { status: "rejected" },
    include: orderInclude,
  });
  await notify({ type: "order.updated", storeId, orderId: id, status: "rejected" });
  return updated;
}

export async function advanceOrder(storeId: string, id: string) {
  const order = await requireOrder(storeId, id);
  const next = ADVANCE_NEXT[order.status as OrderStatus];
  if (!next) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "더 이상 진행할 수 없는 상태예요.",
    });
  }
  const updated = await prisma.order.update({
    where: { id },
    data: { status: next },
    include: orderInclude,
  });
  await notify({ type: "order.updated", storeId, orderId: id, status: next });
  return updated;
}

function clampPrep(n: number) {
  return Math.min(60, Math.max(5, n));
}

export async function setPrep(storeId: string, id: string, delta: number) {
  const order = await requireOrder(storeId, id);
  const updated = await prisma.order.update({
    where: { id },
    data: { prepMinutes: clampPrep(order.prepMinutes + delta) },
    include: orderInclude,
  });
  await notify({ type: "order.updated", storeId, orderId: id, status: updated.status as OrderStatus });
  return updated;
}

export type CreateOrderInput = {
  items: {
    menuId?: string | null;
    name: string;
    price: number;
    quantity?: number;
    optionsText?: string | null;
  }[];
  customerMemo?: string | null;
  prepMinutes?: number;
  etaSeconds?: number;
  distanceM?: number;
  car?: { number?: string; color?: string; model?: string; type?: string };
  custLat?: number | null;
  custLng?: number | null;
};

/** Shared order-creation path used by both the ingest API and the simulator. */
export async function createOrder(storeId: string, input: CreateOrderInput) {
  const existing = await prisma.order.findMany({
    where: { storeId },
    select: { orderNo: true },
  });
  const maxNo = existing.reduce(
    (m, o) => Math.max(m, parseInt(o.orderNo.replace(/\D/g, ""), 10) || 0),
    100,
  );
  const orderNo = `#A-${maxNo + 1}`;
  const total = input.items.reduce((s, it) => s + it.price * (it.quantity ?? 1), 0);

  const order = await prisma.order.create({
    data: {
      storeId,
      orderNo,
      status: "new",
      customerMemo: input.customerMemo ?? null,
      prepMinutes: input.prepMinutes ?? 10,
      etaSeconds: input.etaSeconds ?? 0,
      distanceM: input.distanceM ?? 0,
      carNumber: input.car?.number ?? null,
      carColor: input.car?.color ?? null,
      carModel: input.car?.model ?? null,
      carType: input.car?.type ?? null,
      custLat: input.custLat ?? null,
      custLng: input.custLng ?? null,
      totalPrice: total,
      items: {
        create: input.items.map((it) => ({
          menuId: it.menuId ?? null,
          nameSnap: it.name,
          priceSnap: it.price,
          quantity: it.quantity ?? 1,
          optionsText: it.optionsText ?? null,
        })),
      },
    },
    include: orderInclude,
  });

  await notify({ type: "order.created", storeId, orderId: order.id, orderNo });
  return order;
}
