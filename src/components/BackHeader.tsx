"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { IconChevronLeft } from "./icons";
import { StatusBadge } from "./StatusBadge";
import type { OrderStatus } from "@/types/domain";

type Props = {
  title: string;
  status?: OrderStatus;
  right?: ReactNode;
  fallbackHref?: string;
};

export function BackHeader({ title, status, right, fallbackHref = "/home" }: Props) {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push(fallbackHref);
  };

  return (
    <div className="flex-none flex items-center gap-2.5 px-4 pt-1.5 pb-3 bg-white">
      <button
        type="button"
        onClick={goBack}
        aria-label="뒤로"
        className="w-9 h-9 flex items-center justify-center -ml-1.5 text-ink"
      >
        <IconChevronLeft size={26} />
      </button>
      <span className="font-bold text-[19px]">{title}</span>
      {status ? <StatusBadge status={status} /> : null}
      {right ? <div className="ml-auto">{right}</div> : null}
    </div>
  );
}
