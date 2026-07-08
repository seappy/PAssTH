import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc";
import {
  getDriverOrder,
  getStoreMenu,
  listStoresForDriver,
  placeDriverOrder,
} from "@/server/services/driver.service";

// Driver (in-car) client API. PUBLIC — the car display has no merchant session.
// createOrder is first-party (no ingest key needed); harden with car/user
// identity + rate limiting before real production use.
const originInput = z.object({ lat: z.number(), lng: z.number() }).optional();

export const driverRouter = router({
  stores: publicProcedure.input(originInput).query(({ input }) => {
    return listStoresForDriver(input);
  }),

  storeMenu: publicProcedure
    .input(z.object({ storeId: z.string(), origin: originInput }))
    .query(async ({ input }) => {
      const menu = await getStoreMenu(input.storeId, input.origin);
      if (!menu) throw new TRPCError({ code: "NOT_FOUND", message: "매장을 찾을 수 없습니다." });
      return menu;
    }),

  createOrder: publicProcedure
    .input(
      z.object({
        storeId: z.string(),
        items: z
          .array(
            z.object({
              menuId: z.string().optional(),
              name: z.string().min(1),
              price: z.number().int().min(0),
              quantity: z.number().int().min(1).default(1),
              optionsText: z.string().optional(),
            }),
          )
          .min(1, "장바구니가 비어 있어요."),
        car: z
          .object({
            number: z.string().optional(),
            color: z.string().optional(),
            model: z.string().optional(),
            type: z.string().optional(),
          })
          .optional(),
        customerMemo: z.string().optional(),
        etaSeconds: z.number().int().min(0).optional(),
        distanceM: z.number().int().min(0).optional(),
        custLat: z.number().optional(),
        custLng: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await placeDriverOrder(input.storeId, {
        items: input.items,
        car: input.car,
        customerMemo: input.customerMemo ?? null,
        etaSeconds: input.etaSeconds,
        distanceM: input.distanceM,
        custLat: input.custLat ?? null,
        custLng: input.custLng ?? null,
      });
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "매장을 찾을 수 없습니다." });
      return result;
    }),

  order: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const order = await getDriverOrder(input.id);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "주문을 찾을 수 없습니다." });
    return order;
  }),
});
