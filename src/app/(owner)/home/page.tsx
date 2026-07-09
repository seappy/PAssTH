"use client";

import { trpc } from "@/lib/trpc/client";
import { StoreSwitcher } from "@/components/store/StoreSwitcher";
import { LiveArrivalWidget } from "@/components/LiveArrivalWidget";
import { NewOrderCard } from "@/components/orders/NewOrderCard";
import { OrderCard, RecentRow } from "@/components/orders/OrderCard";
import { fmtDist } from "@/lib/format";
import type { OrderDTO } from "@/lib/trpc/types";

function isToday(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function HomePage() {
  const ordersQ = trpc.order.list.useQuery();
  const storeQ = trpc.store.get.useQuery();

  const orders: OrderDTO[] = ordersQ.data ?? [];
  const fetchedAt = ordersQ.dataUpdatedAt || Date.now();

  const active = orders.filter((o) => o.status !== "done" && o.status !== "rejected");
  const news = active.filter((o) => o.status === "new");
  const progressing = active.filter((o) => o.status !== "new");
  const recent = orders
    .filter((o) => o.status === "done" || o.status === "rejected")
    .slice(0, 6);
  const nearest = [...active].sort((a, b) => a.distanceM - b.distanceM)[0];
  const todayCount = orders.filter((o) => isToday(o.createdAt)).length;
  const isOpen = storeQ.data?.isOpen ?? true;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pl-scroll bg-canvas">
      <div className="px-5 pt-2 pb-7" style={{ animation: "plFade .25s ease" }}>
        {/* header */}
        <div className="flex items-center justify-between gap-3 min-w-0 my-2 mb-[22px]">
          <div className="min-w-0 flex-1">
            <StoreSwitcher currentId={storeQ.data?.id} currentName={storeQ.data?.name ?? "매장"} />
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold text-[13px] flex-none"
            style={
              isOpen
                ? { background: "#e3f7ef", color: "#0ca678" }
                : { background: "#f2f4f6", color: "#8b95a1" }
            }
          >
            <span
              className="w-[7px] h-[7px] rounded-full"
              style={{ background: isOpen ? "#12b886" : "#adb5bd" }}
            />
            {isOpen ? "영업중" : "영업종료"}
          </div>
        </div>

        {/* stats */}
        <div className="flex gap-3 mb-3.5">
          <div className="flex-1 bg-white rounded-[18px] px-4 py-[18px] shadow-sm">
            <div className="text-[13px] text-ink-3 font-semibold mb-2">오늘 주문</div>
            <div className="flex items-baseline gap-[3px]">
              <span className="font-extrabold text-[34px] tracking-tight">{todayCount}</span>
              <span className="text-[15px] text-ink-3 font-semibold">건</span>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-[18px] px-4 py-[18px] shadow-sm">
            <div className="text-[13px] text-ink-3 font-semibold mb-2">진행 중</div>
            <div className="flex items-baseline gap-[3px]">
              <span className="font-extrabold text-[34px] tracking-tight text-accent">
                {active.length}
              </span>
              <span className="text-[15px] text-ink-3 font-semibold">건</span>
            </div>
          </div>
        </div>

        <LiveArrivalWidget nearestDist={nearest ? fmtDist(nearest.distanceM) : "-"} />

        {/* new orders */}
        {news.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-[17px]">신규 주문</span>
              <span
                className="text-white font-bold text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center"
                style={{ background: "var(--color-accent)" }}
              >
                {news.length}
              </span>
            </div>
            <div className="flex flex-col gap-3 mb-[26px]">
              {news.map((o) => (
                <NewOrderCard key={o.id} order={o} fetchedAt={fetchedAt} />
              ))}
            </div>
          </>
        )}

        {/* progressing */}
        {progressing.length > 0 && (
          <>
            <div className="font-bold text-[17px] mb-3">진행 중 주문</div>
            <div className="flex flex-col gap-2.5 mb-[26px]">
              {progressing.map((o) => (
                <OrderCard key={o.id} order={o} fetchedAt={fetchedAt} />
              ))}
            </div>
          </>
        )}

        {/* recent */}
        {recent.length > 0 && (
          <>
            <div className="font-bold text-[17px] mb-3">최근 주문</div>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {recent.map((o) => (
                <RecentRow key={o.id} order={o} />
              ))}
            </div>
          </>
        )}

        {ordersQ.isLoading && (
          <div className="text-center text-ink-4 text-sm py-10">불러오는 중…</div>
        )}
        {!ordersQ.isLoading && orders.length === 0 && (
          <div className="text-center text-ink-4 text-sm py-10">아직 주문이 없어요</div>
        )}
      </div>
    </div>
  );
}
