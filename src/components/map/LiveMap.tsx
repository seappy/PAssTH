"use client";

import { IconStore } from "@/components/icons";

type MapOrder = { id: string; distanceM: number };

// Deterministic bearing per order so markers stay put across re-renders.
function bearing(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ((h % 360) * Math.PI) / 180;
}

/**
 * Mock live map. Positions car markers around the store by distance + a stable
 * per-order bearing. Swap the positioning math for a real map (Mapbox) later —
 * the marker data (distance, id) is already the right shape.
 */
export function LiveMap({ orders }: { orders: MapOrder[] }) {
  const maxD = Math.max(400, ...orders.map((o) => o.distanceM));

  return (
    <div className="pl-stripe relative rounded-[20px] h-[230px] bg-[#eef1f4] overflow-hidden shadow-sm mb-4">
      {/* store (center) */}
      <div
        className="absolute w-[42px] h-[42px] rounded-[14px] bg-ink flex items-center justify-center text-white"
        style={{ left: "50%", top: "54%", transform: "translate(-50%,-50%)", boxShadow: "0 4px 12px rgba(0,0,0,.3)" }}
      >
        <IconStore size={22} />
      </div>

      {orders.map((o, i) => {
        const ang = bearing(o.id);
        const r = 15 + (o.distanceM / maxD) * 33; // % radius from centre
        const left = 50 + Math.cos(ang) * r;
        const top = 54 + Math.sin(ang) * r * 0.72;
        const nearest = i === 0;
        return (
          <div
            key={o.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-[5px] text-xs font-bold whitespace-nowrap"
            style={
              nearest
                ? {
                    left: `${left}%`,
                    top: `${top}%`,
                    background: "var(--color-accent)",
                    color: "#fff",
                    boxShadow: "0 4px 10px rgba(0,0,0,.2)",
                    animation: "plPulse 1.6s ease infinite",
                  }
                : {
                    left: `${left}%`,
                    top: `${top}%`,
                    background: "#fff",
                    color: "#191f28",
                    border: "1.5px solid #191f28",
                  }
            }
          >
            🚗 {o.distanceM}m
          </div>
        );
      })}

      {/* GPS badge */}
      <div className="absolute left-3.5 bottom-3 flex items-center gap-1.5 text-[11px] text-ink-2 font-semibold bg-white rounded-full px-2.5 py-1 shadow-sm">
        <span
          className="w-[7px] h-[7px] rounded-full"
          style={{ background: "#12b886", animation: "plPulse 1.4s ease infinite" }}
        />
        실시간 GPS
      </div>
    </div>
  );
}
