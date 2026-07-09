import { z } from "zod";
import { router, protectedProcedure, storeProcedure } from "@/server/trpc";
import * as store from "@/server/services/store.service";
import { CONGESTION_LEVELS } from "@/types/domain";

const hhmm = z.string().regex(/^\d{2}:\d{2}$/, "HH:MM 형식이어야 해요");

export const storeRouter = router({
  get: storeProcedure.query(({ ctx }) => store.getStore(ctx.store.id)),

  setStatus: storeProcedure
    .input(z.object({ isOpen: z.boolean().optional(), pickupOn: z.boolean().optional() }))
    .mutation(({ ctx, input }) => store.setStatus(ctx.store.id, input)),

  setCongestion: storeProcedure
    .input(z.object({ level: z.enum(CONGESTION_LEVELS) }))
    .mutation(({ ctx, input }) => store.setCongestion(ctx.store.id, input.level)),

  updateHours: storeProcedure
    .input(
      z.object({
        weekdayOpen: hhmm,
        weekdayClose: hhmm,
        weekendOpen: hhmm,
        weekendClose: hhmm,
      }),
    )
    .mutation(({ ctx, input }) => store.updateHours(ctx.store.id, input)),

  setClosedDays: storeProcedure
    .input(z.object({ days: z.array(z.number().int().min(0).max(6)) }))
    .mutation(({ ctx, input }) => store.setClosedDays(ctx.store.id, input.days)),

  setImage: storeProcedure
    .input(z.object({ imageUrl: z.string().url().nullable() }))
    .mutation(({ ctx, input }) => store.setImage(ctx.store.id, input.imageUrl)),

  // Owner-level (not tied to a single resolved store) — powers the store switcher.
  myStores: protectedProcedure.query(({ ctx }) => store.listMyStores(ctx.userId)),

  switchTo: protectedProcedure
    .input(z.object({ storeId: z.string() }))
    .mutation(({ ctx, input }) => store.switchActiveStore(ctx.userId, input.storeId)),

  createStore: protectedProcedure
    .input(z.object({ name: z.string().min(1, "매장명을 입력하세요").max(40) }))
    .mutation(({ ctx, input }) => store.createStore(ctx.userId, input.name)),
});
