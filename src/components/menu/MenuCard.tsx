"use client";

import { useRouter } from "next/navigation";
import { Toggle } from "@/components/Toggle";
import { useToggleSoldOut } from "@/lib/hooks";
import { won } from "@/lib/format";
import type { MenuDTO } from "@/lib/trpc/types";

export function MenuCard({ menu }: { menu: MenuDTO }) {
  const router = useRouter();
  const toggle = useToggleSoldOut();

  return (
    <div
      className="bg-white rounded-[18px] p-3.5 flex items-center gap-3.5 shadow-sm"
      style={{ opacity: menu.soldOut ? 0.55 : 1, animation: "plUp .25s ease" }}
    >
      <button
        type="button"
        onClick={() => router.push(`/menu/${menu.id}/edit`)}
        className="flex-1 min-w-0 flex items-center gap-3.5 text-left"
      >
        <div className="pl-stripe w-14 h-14 rounded-[14px] flex-none flex items-center justify-center text-[10px] text-ink-4 font-semibold bg-[#f2f4f6]">
          사진
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="font-bold text-base truncate"
            style={
              menu.soldOut
                ? { textDecoration: "line-through", color: "#8b95a1" }
                : undefined
            }
          >
            {menu.name}
          </div>
          <div className="text-sm text-ink-2 font-semibold mt-0.5">
            {menu.soldOut ? "품절" : won(menu.price)}
            <span className="text-ink-4 font-medium"> · 옵션 {menu.options.length}개</span>
          </div>
        </div>
      </button>
      <Toggle
        on={!menu.soldOut}
        onChange={() => toggle.mutate({ id: menu.id })}
      />
    </div>
  );
}
