"use client";

import Link from "next/link";
import { IconCar, IconChevronRight } from "./icons";

export function LiveArrivalWidget({ nearestDist }: { nearestDist: string }) {
  return (
    <Link
      href="/map"
      className="flex items-center gap-3.5 rounded-[18px] px-[18px] py-4 mb-[26px]"
      style={{
        background: "linear-gradient(135deg, var(--color-accent), #1b64da)",
        boxShadow: "0 8px 20px -6px color-mix(in srgb, var(--color-accent) 55%, transparent)",
      }}
    >
      <div
        className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-none text-white"
        style={{ background: "rgba(255,255,255,.18)" }}
      >
        <IconCar size={24} />
      </div>
      <div className="flex-1 text-white">
        <div className="text-[12.5px] font-semibold opacity-85">실시간 도착 현황</div>
        <div className="font-bold text-base mt-px">
          가장 가까운 차량 <span className="font-extrabold">{nearestDist}</span>
        </div>
      </div>
      <span className="text-white">
        <IconChevronRight size={20} />
      </span>
    </Link>
  );
}
