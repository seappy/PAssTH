"use client";

type Props = {
  on: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

/** iOS-style switch matching the prototype's toggle. */
export function Toggle({ on, onChange, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="relative w-[52px] h-[31px] rounded-full flex-none transition-colors disabled:opacity-60"
      style={{ background: on ? "var(--color-accent)" : "#dfe3e8" }}
    >
      <span
        className="absolute top-[3px] w-[25px] h-[25px] rounded-full bg-white transition-all"
        style={{ left: on ? 24 : 3, boxShadow: "0 2px 4px rgba(0,0,0,.2)" }}
      />
    </button>
  );
}
