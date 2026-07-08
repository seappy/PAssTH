import { router } from "@/server/trpc";
import { orderRouter } from "./order";
import { menuRouter } from "./menu";
import { categoryRouter } from "./category";
import { storeRouter } from "./store";
import { simRouter } from "./sim";
import { driverRouter } from "./driver";

export const appRouter = router({
  order: orderRouter,
  menu: menuRouter,
  category: categoryRouter,
  store: storeRouter,
  sim: simRouter,
  driver: driverRouter,
});

export type AppRouter = typeof appRouter;
