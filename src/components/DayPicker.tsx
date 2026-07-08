"use client";

import { WEEKDAY_LABELS } from "@/lib/format";

export function DayPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (days: number[]) => void;
}) {
  const toggle = (d: number) =>
    value.includes(d)
      ? onChange(value.filter((x) => x !== d))
      : onChange([...value, d].sort((a, b) => a - b));

  return (
    <div className="flex gap-1.5">
      {WEEKDAY_LABELS.map((lbl, i) => {
        const on = value.includes(i);
        return (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            className="flex-1 aspect-square rounded-xl font-bold text-sm transition-colors"
            style={
              on
                ? { background: "var(--color-accent)", color: "#fff" }
                : { background: "#fff", color: "#8b95a1", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }
            }
          >
            {lbl}
          </button>
        );
      })}
    </div>
  );
}
