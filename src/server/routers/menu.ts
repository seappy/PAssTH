import { z } from "zod";
import { router, storeProcedure } from "@/server/trpc";
import * as menus from "@/server/services/menu.service";

const optionInput = z.object({
  name: z.string().min(1),
  extraPrice: z.number().int().default(0),
});

export const menuRouter = router({
  list: storeProcedure
    .input(z.object({ categoryId: z.string().optional() }).optional())
    .query(({ ctx, input }) => menus.listMenus(ctx.store.id, input?.categoryId)),

  byId: storeProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => menus.getMenu(ctx.store.id, input.id)),

  create: storeProcedure
    .input(
      z.object({
        name: z.string().min(1, "메뉴명을 입력하세요"),
        price: z.number().int().min(0),
        categoryId: z.string(),
        imageUrl: z.string().url().nullish(),
        soldOut: z.boolean().optional(),
        options: z.array(optionInput).optional(),
      }),
    )
    .mutation(({ ctx, input }) => menus.createMenu(ctx.store.id, input)),

  update: storeProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        price: z.number().int().min(0).optional(),
        categoryId: z.string().optional(),
        imageUrl: z.string().url().nullish(),
        soldOut: z.boolean().optional(),
        options: z.array(optionInput).optional(),
      }),
    )
    .mutation(({ ctx, input }) => menus.updateMenu(ctx.store.id, input)),

  remove: storeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => menus.removeMenu(ctx.store.id, input.id)),

  toggleSoldOut: storeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => menus.toggleSoldOut(ctx.store.id, input.id)),
});
