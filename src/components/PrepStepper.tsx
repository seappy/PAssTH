"use client";

type Props = {
  minutes: number;
  onDown: () => void;
  onUp: () => void;
  size?: "sm" | "lg";
  disabled?: boolean;
};

/** Estimated cook-time +/- stepper (5–60 min), used on order cards & detail. */
export function PrepStepper({ minutes, onDown, onUp, size = "sm", disabled }: Props) {
  const dim = size === "lg" ? 34 : 30;
  const btn =
    "flex items-center justify-center rounded-[9px] font-extrabold select-none disabled:opacity-40";
  const fontBtn = size === "lg" ? "text-xl" : "text-lg";
  const fontVal = size === "lg" ? "text-[19px] min-w-[46px]" : "text-base min-w-[40px]";
  return (
    <div className={`flex items-center ${size === "lg" ? "gap-4" : "gap-3.5"}`}>
      <button
        type="button"
        onClick={onDown}
        disabled={disabled || minutes <= 5}
        style={{ width: dim, height: dim, background: "#f2f4f6", color: "#4e5968" }}
        className={`${btn} ${fontBtn}`}
        aria-label="조리시간 줄이기"
      >
        −
      </button>
      <span className={`font-extrabold text-center ${fontVal}`}>{minutes}분</span>
      <button
        type="button"
        onClick={onUp}
        disabled={disabled || minutes >= 60}
        style={{
          width: dim,
          height: dim,
          background: "color-mix(in srgb, var(--color-accent) 12%, #fff)",
          color: "var(--color-accent)",
        }}
        className={`${btn} ${fontBtn}`}
        aria-label="조리시간 늘리기"
      >
        ＋
      </button>
    </div>
  );
}
