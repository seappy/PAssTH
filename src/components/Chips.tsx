"use client";

export type Chip = { key: string; label: string; count?: number };

export function Chips({
  chips,
  value,
  onChange,
}: {
  chips: Chip[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pl-scroll">
      {chips.map((c) => {
        const active = c.key === value;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            className="flex items-center gap-1.5 flex-none rounded-full px-4 py-2.5 font-bold text-sm transition-colors"
            style={
              active
                ? { background: "#191f28", color: "#fff" }
                : { background: "#fff", color: "#4e5968", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }
            }
          >
            {c.label}
            {c.count != null && c.count > 0 ? (
              <span
                className="text-[11px] font-extrabold rounded-full px-1.5 py-px"
                style={
                  active
                    ? { background: "rgba(255,255,255,.25)", color: "#fff" }
                    : { background: "#f2f4f6", color: "#8b95a1" }
                }
              >
                {c.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
