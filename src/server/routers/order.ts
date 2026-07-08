import { z } from "zod";
import { router, storeProcedure } from "@/server/trpc";
import * as orders from "@/server/services/order.service";
import { ORDER_STATUSES } from "@/types/domain";

export const orderRouter = router({
  list: storeProcedure
    .input(z.object({ status: z.enum(ORDER_STATUSES).optional() }).optional())
    .query(({ ctx, input }) => orders.listOrders(ctx.store.id, input?.status)),

  byId: storeProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => orders.getOrder(ctx.store.id, input.id)),

  nearby: storeProcedure.query(({ ctx }) => orders.nearbyOrders(ctx.store.id)),

  accept: storeProcedure
    .input(z.object({ id: z.string(), prepMinutes: z.number().int().min(5).max(60).optional() }))
    .mutation(({ ctx, input }) => orders.acceptOrder(ctx.store.id, input.id, input.prepMinutes)),

  reject: storeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => orders.rejectOrder(ctx.store.id, input.id)),

  advance: storeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => orders.advanceOrder(ctx.store.id, input.id)),

  setPrep: storeProcedure
    .input(z.object({ id: z.string(), delta: z.number().int() }))
    .mutation(({ ctx, input }) => orders.setPrep(ctx.store.id, input.id, input.delta)),
});
