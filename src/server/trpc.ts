import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "./auth";
import { prisma } from "./db";

/**
 * Context is built per request. `auth()` reads the session from cookies via
 * next/headers, so it works in the fetch route handler.
 */
export async function createContext() {
  const session = await auth();
  return { session, prisma };
}
export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zod:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

/** Requires an authenticated user. Attaches `userId`. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "로그인이 필요합니다." });
  }
  return next({ ctx: { ...ctx, userId: ctx.session.user.id } });
});

/**
 * Requires an authenticated owner AND resolves the store they're currently
 * managing. Prefers `User.activeStoreId` (set via the store switcher); falls
 * back to the first-created store if unset or if it no longer belongs to
 * this owner (e.g. after a switch to a store that was later deleted).
 */
export const storeProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.userId },
    include: { activeStore: true },
  });
  let store = user?.activeStore && user.activeStore.ownerId === ctx.userId ? user.activeStore : null;
  if (!store) {
    store = await ctx.prisma.store.findFirst({
      where: { ownerId: ctx.userId },
      orderBy: { createdAt: "asc" },
    });
  }
  if (!store) {
    throw new TRPCError({ code: "NOT_FOUND", message: "매장을 찾을 수 없습니다." });
  }
  return next({ ctx: { ...ctx, store } });
});
