import { z } from "zod";
import { router, storeProcedure } from "@/server/trpc";
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
});
