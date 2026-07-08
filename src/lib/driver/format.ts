/** Display helpers for the driver client. */

export function formatWon(n: number): string {
  return n.toLocaleString("ko-KR");
}

export function formatDistance(m: number | null): string {
  if (m == null) return "-";
  if (m < 1000) return `${m}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

export function formatEta(seconds: number | null): string {
  if (seconds == null) return "-";
  const min = Math.max(1, Math.round(seconds / 60));
  return `${min}분`;
}

export function congestionLabel(level: "low" | "mid" | "high"): { text: string; color: string } {
  switch (level) {
    case "low":
      return { text: "여유", color: "#15C47E" };
    case "high":
      return { text: "혼잡", color: "#FF8A00" };
    default:
      return { text: "보통", color: "#3182F6" };
  }
}

export const ORDER_STEPS = [
  { key: "accepted", label: "접수" },
  { key: "preparing", label: "준비중" },
  { key: "ready", label: "준비완료" },
] as const;

/** 0-based index of how far an order has progressed through ORDER_STEPS. */
export function stepIndex(status: string): number {
  switch (status) {
    case "new":
      return -1;
    case "accepted":
      return 0;
    case "preparing":
      return 1;
    case "ready":
    case "done":
      return 2;
    default:
      return -1;
  }
}
