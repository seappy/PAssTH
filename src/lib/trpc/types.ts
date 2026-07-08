import type { inferRouterOutputs, inferRouterInputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;

export type OrderDTO = RouterOutputs["order"]["list"][number];
export type MenuDTO = RouterOutputs["menu"]["list"][number];
export type CategoryDTO = RouterOutputs["category"]["list"][number];
export type StoreDTO = RouterOutputs["store"]["get"];
