import { prisma } from "@/server/db";
import type { Congestion } from "@/types/domain";

export function getStore(storeId: string) {
  return prisma.store.findUniqueOrThrow({ where: { id: storeId } });
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
