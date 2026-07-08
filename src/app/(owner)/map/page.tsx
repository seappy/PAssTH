"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { BackHeader } from "@/components/BackHeader";
import { LiveMap } from "@/components/map/LiveMap";
import { IconChevronRight } from "@/components/icons";
import { carLine, fmtDist, menuSummary } from "@/lib/format";
import type { OrderDTO } from "@/lib/trpc/types";

export default function MapPage() {
  const router = useRouter();
  const ordersQ = trpc.order.list.useQuery();
  const storeQ = trpc.store.get.useQuery();
  const orders: OrderDTO[] = ordersQ.data ?? [];

  const active = orders
    .filter((o) => o.status !== "done" && o.status !== "rejected")
    .sort((a, b) => a.distanceM - b.distanceM);

  return (
    <>
      <BackHeader title="실시간 도착 현황" fallbackHref="/home" />

      <div className="flex-1 min-h-0 overflow-y-auto pl-scroll px-5 pt-4 pb-6 bg-canvas">
        <LiveMap
          store={storeQ.data ? { lat: storeQ.data.lat, lng: storeQ.data.lng } : null}
          orders={active.map((o) => ({
            id: o.id,
            orderNo: o.orderNo,
            distanceM: o.distanceM,
            custLat: o.custLat,
            custLng: o.custLng,
          }))}
        />

        <div className="font-bold text-base mx-0.5 mb-2.5">거리순 주문</div>
        <div className="flex flex-col gap-2.5">
          {active.map((o) => {
            const near = o.distanceM <= 200;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => router.push(`/orders/${o.id}`)}
                className="bg-white rounded-2xl p-3.5 flex items-center gap-3 shadow-sm text-left"
                style={near ? { border: "1.5px solid var(--color-accent)" } : undefined}
              >
                <div className="min-w-[52px] text-center">
                  <div
                    className="font-extrabold text-base"
                    style={{
                      color: near ? "var(--color-accent)" : "#4e5968",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {fmtDist(o.distanceM)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[15px]">
                    {o.orderNo} · {menuSummary(o.items)}
                  </div>
                  <div className="text-[12.5px] text-ink-3 mt-0.5">
                    {o.carNumber} · {carLine(o)}
                  </div>
                </div>
                <span className="text-[#c4cad1]">
                  <IconChevronRight size={18} />
                </span>
              </button>
            );
          })}
          {active.length === 0 && (
            <div className="text-center text-ink-4 text-sm py-10">도착 예정 차량이 없어요</div>
          )}
        </div>
      </div>
    </>
  );
}
