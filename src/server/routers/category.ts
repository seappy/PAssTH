import { z } from "zod";
import { router, storeProcedure } from "@/server/trpc";
import * as categories from "@/server/services/category.service";

export const categoryRouter = router({
  list: storeProcedure.query(({ ctx }) => categories.listCategories(ctx.store.id)),

  create: storeProcedure
    .input(z.object({ name: z.string().min(1, "분류명을 입력하세요").max(20) }))
    .mutation(({ ctx, input }) => categories.createCategory(ctx.store.id, input.name)),

  remove: storeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => categories.removeCategory(ctx.store.id, input.id)),
});
