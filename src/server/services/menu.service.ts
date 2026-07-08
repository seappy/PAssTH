import { TRPCError } from "@trpc/server";
import { prisma } from "@/server/db";

const menuInclude = {
  options: { orderBy: { sortOrder: "asc" } },
} as const;

export function listMenus(storeId: string, categoryId?: string) {
  return prisma.menu.findMany({
    where: { storeId, ...(categoryId ? { categoryId } : {}) },
    include: menuInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getMenu(storeId: string, id: string) {
  const menu = await prisma.menu.findFirst({
    where: { id, storeId },
    include: menuInclude,
  });
  if (!menu) throw new TRPCError({ code: "NOT_FOUND", message: "메뉴를 찾을 수 없습니다." });
  return menu;
}

async function assertCategory(storeId: string, categoryId: string) {
  const cat = await prisma.category.findFirst({ where: { id: categoryId, storeId } });
  if (!cat) throw new TRPCError({ code: "BAD_REQUEST", message: "분류를 찾을 수 없습니다." });
  return cat;
}

export type MenuOptionInput = { name: string; extraPrice: number };

export async function createMenu(
  storeId: string,
  input: {
    name: string;
    price: number;
    categoryId: string;
    imageUrl?: string | null;
    soldOut?: boolean;
    options?: MenuOptionInput[];
  },
) {
  await assertCategory(storeId, input.categoryId);
  const max = await prisma.menu.aggregate({
    where: { storeId },
    _max: { sortOrder: true },
  });
  return prisma.menu.create({
    data: {
      storeId,
      categoryId: input.categoryId,
      name: input.name,
      price: input.price,
      imageUrl: input.imageUrl ?? null,
      soldOut: input.soldOut ?? false,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
      options: {
        create: (input.options ?? []).map((o, i) => ({
          name: o.name,
          extraPrice: o.extraPrice,
          sortOrder: i,
        })),
      },
    },
    include: menuInclude,
  });
}

export async function updateMenu(
  storeId: string,
  input: {
    id: string;
    name?: string;
    price?: number;
    categoryId?: string;
    imageUrl?: string | null;
    soldOut?: boolean;
    options?: MenuOptionInput[];
  },
) {
  await getMenu(storeId, input.id); // ownership check
  if (input.categoryId) await assertCategory(storeId, input.categoryId);

  return prisma.$transaction(async (tx) => {
    if (input.options) {
      // Replace the option set wholesale.
      await tx.menuOption.deleteMany({ where: { menuId: input.id } });
    }
    return tx.menu.update({
      where: { id: input.id },
      data: {
        ...(input.name != null ? { name: input.name } : {}),
        ...(input.price != null ? { price: input.price } : {}),
        ...(input.categoryId != null ? { categoryId: input.categoryId } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.soldOut != null ? { soldOut: input.soldOut } : {}),
        ...(input.options
          ? {
              options: {
                create: input.options.map((o, i) => ({
                  name: o.name,
                  extraPrice: o.extraPrice,
                  sortOrder: i,
                })),
              },
            }
          : {}),
      },
      include: menuInclude,
    });
  });
}

export async function removeMenu(storeId: string, id: string) {
  await getMenu(storeId, id);
  await prisma.menu.delete({ where: { id } });
  return { id };
}

export async function toggleSoldOut(storeId: string, id: string) {
  const menu = await getMenu(storeId, id);
  return prisma.menu.update({
    where: { id },
    data: { soldOut: !menu.soldOut },
    include: menuInclude,
  });
}
