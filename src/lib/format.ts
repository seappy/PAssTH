import type { OrderStatus } from "@/types/domain";

/** 12,000원 */
export const won = (n: number) => n.toLocaleString("ko-KR") + "원";

/** Seconds → "N분" / "도착" (ceil-to-minute, matches prototype). */
export const fmtEta = (sec: number) => (sec <= 0 ? "도착" : Math.ceil(sec / 60) + "분");

/** Metres → "150m" / "도착". */
export const fmtDist = (m: number) => (m > 0 ? `${m}m` : "도착");

/**
 * Live-decrement a snapshot ETA by the time elapsed since it was fetched, so
 * countdowns tick smoothly between server refetches (cosmetic).
 */
export function liveEta(baseSeconds: number, fetchedAt: number, now: number): number {
  const elapsed = Math.floor((now - fetchedAt) / 1000);
  return Math.max(0, baseSeconds - elapsed);
}

/** Urgent when arriving within 5 minutes (and still en route). */
export function isUrgent(status: string, etaSeconds: number): boolean {
  return status !== "done" && status !== "rejected" && etaSeconds > 0 && etaSeconds <= 300;
}

/** Date → "오전 9:12". */
export function fmtTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
}

export type StatusMeta = { label: string; color: string; bg: string };

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  new: { label: "신규 주문", color: "#3182f6", bg: "#eaf2ff" },
  accepted: { label: "수락됨", color: "#7048e8", bg: "#f0ebff" },
  preparing: { label: "준비 중", color: "#e8890c", bg: "#fff3e0" },
  ready: { label: "준비 완료", color: "#0ca678", bg: "#e3f7ef" },
  done: { label: "픽업 완료", color: "#8b95a1", bg: "#f2f4f6" },
  rejected: { label: "거절됨", color: "#f04452", bg: "#ffecec" },
};

/** advance() transitions: accepted → preparing → ready → done. */
export const ADVANCE_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  accepted: "preparing",
  preparing: "ready",
  ready: "done",
};

/** CTA label for the advance action, by current status. */
export const ADVANCE_LABEL: Partial<Record<OrderStatus, string>> = {
  accepted: "조리 시작",
  preparing: "준비 완료",
  ready: "픽업 완료 처리",
};

export const CONGESTION_META = {
  low: { label: "여유", dot: "#12b886" },
  mid: { label: "보통", dot: "#f59f00" },
  high: { label: "혼잡", dot: "#f04452" },
} as const;

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/** "아메리카노 외 1개" / "콜드브루 1개" — order line summary from items. */
export function menuSummary(
  items: { nameSnap: string; quantity: number }[],
): string {
  if (items.length === 0) return "";
  const first = items[0];
  if (items.length === 1) return `${first.nameSnap} ${first.quantity}개`;
  return `${first.nameSnap} 외 ${items.length - 1}개`;
}

/** "흰색 쏘렌토" — colour + model. */
export function carLine(o: {
  carColor?: string | null;
  carModel?: string | null;
}): string {
  return [o.carColor, o.carModel].filter(Boolean).join(" ");
}
