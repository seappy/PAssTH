"use client";

import { trpc } from "@/lib/trpc/client";
import { ADVANCE_NEXT } from "@/lib/format";
import type { OrderDTO, MenuDTO } from "@/lib/trpc/types";
import type { OrderStatus } from "@/types/domain";

/**
 * Order mutations with optimistic UI. The whole app reads a single unfiltered
 * `order.list` query (filtering/derivation happens client-side), so optimistic
 * patches only need to touch that cache plus `order.byId`.
 */
export function useOrderActions() {
  const utils = trpc.useUtils();

  const patch = (id: string, fn: (o: OrderDTO) => OrderDTO) => {
    utils.order.list.setData(undefined, (old) =>
      old?.map((o) => (o.id === id ? fn(o) : o)),
    );
    utils.order.byId.setData({ id }, (old) => (old ? fn(old) : old));
  };

  const snapshot = (id: string) => ({
    id,
    prevList: utils.order.list.getData(),
    prevById: utils.order.byId.getData({ id }),
  });
  type Ctx = ReturnType<typeof snapshot>;

  const rollback = (ctx: Ctx | undefined) => {
    if (!ctx) return;
    utils.order.list.setData(undefined, ctx.prevList);
    utils.order.byId.setData({ id: ctx.id }, ctx.prevById);
  };
  const settle = () => utils.order.invalidate();

  const advance = trpc.order.advance.useMutation({
    onMutate: async ({ id }) => {
      await utils.order.list.cancel();
      const ctx = snapshot(id);
      patch(id, (o) => ({
        ...o,
        status: (ADVANCE_NEXT[o.status as OrderStatus] ?? o.status) as OrderStatus,
      }));
      return ctx;
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: settle,
  });

  const accept = trpc.order.accept.useMutation({
    onMutate: async ({ id }) => {
      await utils.order.list.cancel();
      const ctx = snapshot(id);
      patch(id, (o) => ({ ...o, status: "accepted" as OrderStatus }));
      return ctx;
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: settle,
  });

  const reject = trpc.order.reject.useMutation({
    onMutate: async ({ id }) => {
      await utils.order.list.cancel();
      const ctx = snapshot(id);
      patch(id, (o) => ({ ...o, status: "rejected" as OrderStatus }));
      return ctx;
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: settle,
  });

  const setPrep = trpc.order.setPrep.useMutation({
    onMutate: async ({ id, delta }) => {
      await utils.order.list.cancel();
      const ctx = snapshot(id);
      patch(id, (o) => ({
        ...o,
        prepMinutes: Math.min(60, Math.max(5, o.prepMinutes + delta)),
      }));
      return ctx;
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: settle,
  });

  return { advance, accept, reject, setPrep };
}

/** Menu sold-out toggle with optimistic UI across menu.list caches. */
export function useToggleSoldOut() {
  const utils = trpc.useUtils();

  return trpc.menu.toggleSoldOut.useMutation({
    onMutate: async ({ id }) => {
      await utils.menu.list.cancel();
      // Patch every cached menu.list variant (filtered by category or not).
      const flip = (old: MenuDTO[] | undefined) =>
        old?.map((m) => (m.id === id ? { ...m, soldOut: !m.soldOut } : m));
      utils.menu.list.setData(undefined, flip);
      utils.menu.list.setData({}, flip);
      return {};
    },
    onSettled: () => utils.menu.invalidate(),
  });
}
