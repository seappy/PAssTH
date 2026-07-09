"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Chips, type Chip } from "@/components/Chips";
import { NewOrderCard } from "@/components/orders/NewOrderCard";
import { OrderCard, RecentRow } from "@/components/orders/OrderCard";
import type { OrderDTO } from "@/lib/trpc/types";

type TabKey = "active" | "history";

export default function OrdersPage() {
  const [tab, setTab] = useState<TabKey>("active");
  const ordersQ = trpc.order.list.useQuery();
  const orders: OrderDTO[] = ordersQ.data ?? [];
  const fetchedAt = ordersQ.dataUpdatedAt || Date.now();

  const active = orders.filter((o) => o.status !== "done" && o.status !== "rejected");
  const history = orders.filter((o) => o.status === "done" || o.status === "rejected");

  // 진행 중 주문이 없으면 탭 없이 기록 목록을 바로 보여줍니다.
  const showTabs = active.length > 0;
  const viewingActive = showTabs && tab === "active";
  const viewingHistory = !showTabs || tab === "history";

  const tabs: Chip[] = [
    { key: "active", label: "진행중", count: active.length },
    { key: "history", label: "주문 기록", count: history.length },
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pl-scroll bg-canvas">
      <div className="px-5 pt-2 pb-7" style={{ animation: "plFade .25s ease" }}>
        <div className="font-bold text-2xl my-2 mb-[18px]">주문 관리</div>

        {showTabs ? (
          <div className="mb-5">
            <Chips chips={tabs} value={tab} onChange={(k) => setTab(k as TabKey)} />
          </div>
        ) : null}

        {ordersQ.isLoading && (
          <div className="text-center text-ink-4 text-sm py-10">불러오는 중…</div>
        )}

        {!ordersQ.isLoading && viewingActive && (
          <div className="flex flex-col gap-3">
            {active.map((o) =>
              o.status === "new" ? (
                <NewOrderCard key={o.id} order={o} fetchedAt={fetchedAt} />
              ) : (
                <OrderCard key={o.id} order={o} fetchedAt={fetchedAt} showAdvance />
              ),
            )}
          </div>
        )}

        {!ordersQ.isLoading && viewingHistory && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {history.map((o) => (
              <RecentRow key={o.id} order={o} />
            ))}
            {history.length === 0 && (
              <div className="text-center text-ink-4 text-sm py-10">아직 주문이 없어요</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
