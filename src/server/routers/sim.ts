import { router, storeProcedure } from "@/server/trpc";
import { createFakeOrder } from "@/server/services/sim.service";

export const simRouter = router({
  // Generate a random incoming order for the current store (realtime demo).
  createFakeOrder: storeProcedure.mutation(({ ctx }) => createFakeOrder(ctx.store.id)),
});
