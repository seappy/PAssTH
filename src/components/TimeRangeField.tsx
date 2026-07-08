"use client";

export function TimeRangeField({
  label,
  open,
  close,
  onChange,
}: {
  label: string;
  open: string;
  close: string;
  onChange: (open: string, close: string) => void;
}) {
  const inputCls =
    "font-bold text-[15px] bg-canvas rounded-lg px-2 py-1 outline-none border border-transparent focus:border-accent";
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-ink-2 text-[15px]">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={open}
          onChange={(e) => onChange(e.target.value, close)}
          className={inputCls}
        />
        <span className="text-ink-3">–</span>
        <input
          type="time"
          value={close}
          onChange={(e) => onChange(open, e.target.value)}
          className={inputCls}
        />
      </div>
    </div>
  );
}
