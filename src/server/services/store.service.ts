import { TRPCError } from "@trpc/server";
import { prisma } from "@/server/db";
import type { Congestion } from "@/types/domain";

export function getStore(storeId: string) {
  return prisma.store.findUniqueOrThrow({ where: { id: storeId } });
}

/** All stores this owner manages (for the store switcher), oldest first. */
export function listMyStores(ownerId: string) {
  return prisma.store.findMany({
    where: { ownerId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, imageUrl: true, isOpen: true },
  });
}

/** Point the merchant UI at a different store the owner already manages. */
export async function switchActiveStore(ownerId: string, storeId: string) {
  const store = await prisma.store.findFirst({ where: { id: storeId, ownerId } });
  if (!store) {
    throw new TRPCError({ code: "NOT_FOUND", message: "매장을 찾을 수 없습니다." });
  }
  await prisma.user.update({ where: { id: ownerId }, data: { activeStoreId: storeId } });
  return store;
}

/** Create a new store for this owner (with one starter category) and switch to it. */
export async function createStore(ownerId: string, name: string) {
  const store = await prisma.store.create({
    data: {
      ownerId,
      name,
      categories: { create: [{ name: "메뉴", sortOrder: 0 }] },
    },
  });
  await prisma.user.update({ where: { id: ownerId }, data: { activeStoreId: store.id } });
  return store;
}

export function setStatus(
  storeId: string,
  patch: { isOpen?: boolean; pickupOn?: boolean },
) {
  return prisma.store.update({
    where: { id: storeId },
    data: {
      ...(patch.isOpen != null ? { isOpen: patch.isOpen } : {}),
      ...(patch.pickupOn != null ? { pickupOn: patch.pickupOn } : {}),
    },
  });
}

export function setCongestion(storeId: string, level: Congestion) {
  return prisma.store.update({
    where: { id: storeId },
    data: { congestion: level },
  });
}

export function updateHours(
  storeId: string,
  hours: {
    weekdayOpen: string;
    weekdayClose: string;
    weekendOpen: string;
    weekendClose: string;
  },
) {
  return prisma.store.update({ where: { id: storeId }, data: hours });
}

export function setClosedDays(storeId: string, days: number[]) {
  const clean = Array.from(new Set(days.filter((d) => d >= 0 && d <= 6))).sort();
  return prisma.store.update({
    where: { id: storeId },
    data: { closedDays: clean },
  });
}

export function setImage(storeId: string, imageUrl: string | null) {
  return prisma.store.update({ where: { id: storeId }, data: { imageUrl } });
}
