"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconList, IconGrid, IconStore } from "./icons";

const TABS = [
  { href: "/home", label: "홈", Icon: IconHome },
  { href: "/orders", label: "주문", Icon: IconList },
  { href: "/menu", label: "메뉴", Icon: IconGrid },
  { href: "/store", label: "매장", Icon: IconStore },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const isTab = TABS.some((t) => t.href === pathname);
  // Hidden on sub-views (order detail, menu edit, map) — they use a back header.
  if (!isTab) return null;

  return (
    <nav className="flex-none flex px-2 pt-2 pb-[26px] border-t border-line bg-white">
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1"
            style={{ color: active ? "var(--color-accent)" : "#adb5bd" }}
          >
            <Icon size={25} />
            <span className="text-[11px] font-bold">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
