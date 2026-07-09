"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Chips, type Chip } from "@/components/Chips";
import { NewOrderCard } from "@/components/orders/NewOrderCard";
import { OrderCard } from "@/components/orders/OrderCard";
import type { OrderDTO } from "@/lib/trpc/types";
import type { OrderStatus } from "@/types/domain";

type FilterKey = "all" | "new" | "preparing" | "done";

const MATCH: Record<FilterKey, (s: OrderStatus) => boolean> = {
  all: () => true,
  new: (s) => s === "new",
  preparing: (s) => s === "accepted" || s === "preparing" || s === "ready",
  done: (s) => s === "done" || s === "rejected",
};

export default function OrdersPage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const ordersQ = trpc.order.list.useQuery();
  const orders: OrderDTO[] = ordersQ.data ?? [];
  const fetchedAt = ordersQ.dataUpdatedAt || Date.now();

  const count = (k: FilterKey) =>
    orders.filter((o) => MATCH[k](o.status as OrderStatus)).length;

  const chips: Chip[] = [
    { key: "all", label: "전체" },
    { key: "new", label: "신규", count: count("new") },
    { key: "preparing", label: "준비중", count: count("preparing") },
    { key: "done", label: "완료", count: count("done") },
  ];

  const filtered = orders.filter((o) => MATCH[filter](o.status as OrderStatus));

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pl-scroll bg-canvas">
      <div className="px-5 pt-2 pb-7" style={{ animation: "plFade .25s ease" }}>
        <div className="font-bold text-2xl my-2 mb-[18px]">주문 관리</div>

        <div className="mb-5">
          <Chips chips={chips} value={filter} onChange={(k) => setFilter(k as FilterKey)} />
        </div>

        <div className="flex flex-col gap-3">
          {filtered.map((o) =>
            o.status === "new" ? (
              <NewOrderCard key={o.id} order={o} fetchedAt={fetchedAt} />
            ) : (
              <OrderCard key={o.id} order={o} fetchedAt={fetchedAt} showAdvance />
            ),
          )}
          {!ordersQ.isLoading && filtered.length === 0 && (
            <div className="text-center text-ink-4 text-sm py-10">해당 주문이 없어요</div>
          )}
          {ordersQ.isLoading && (
            <div className="text-center text-ink-4 text-sm py-10">불러오는 중…</div>
          )}
        </div>
      </div>
    </div>
  );
}
