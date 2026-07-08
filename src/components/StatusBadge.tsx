import { STATUS_META } from "@/lib/format";
import type { OrderStatus } from "@/types/domain";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className="font-bold text-xs rounded-full px-2.5 py-[3px] whitespace-nowrap"
      style={{ background: m.bg, color: m.color }}
    >
      {m.label}
    </span>
  );
}
