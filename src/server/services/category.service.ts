import { TRPCError } from "@trpc/server";
import { prisma } from "@/server/db";

export function listCategories(storeId: string) {
  return prisma.category.findMany({
    where: { storeId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { menus: true } } },
  });
}

export async function createCategory(storeId: string, name: string) {
  const exists = await prisma.category.findFirst({ where: { storeId, name } });
  if (exists) {
    throw new TRPCError({ code: "CONFLICT", message: "이미 있는 분류예요." });
  }
  const max = await prisma.category.aggregate({
    where: { storeId },
    _max: { sortOrder: true },
  });
  return prisma.category.create({
    data: { storeId, name, sortOrder: (max._max.sortOrder ?? 0) + 1 },
  });
}

/**
 * Delete a category. Its menus are reassigned to the first remaining category.
 * The last category cannot be deleted (menus need a home).
 */
export async function removeCategory(storeId: string, id: string) {
  const target = await prisma.category.findFirst({ where: { id, storeId } });
  if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "분류를 찾을 수 없습니다." });

  const others = await prisma.category.findMany({
    where: { storeId, id: { not: id } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  if (others.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "마지막 분류는 삭제할 수 없어요.",
    });
  }
  const fallback = others[0];

  return prisma.$transaction(async (tx) => {
    await tx.menu.updateMany({
      where: { storeId, categoryId: id },
      data: { categoryId: fallback.id },
    });
    await tx.category.delete({ where: { id } });
    return { id, movedTo: fallback.id };
  });
}
