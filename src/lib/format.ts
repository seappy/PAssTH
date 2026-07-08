import type { OrderStatus } from "@/types/domain";

/** 12,000원 */
export const won = (n: number) => n.toLocaleString("ko-KR") + "원";

/** Seconds → "N분" / "도착" (ceil-to-minute, matches prototype). */
export const fmtEta = (sec: number) => (sec <= 0 ? "도착" : Math.ceil(sec / 60) + "분");

/** Metres → "150m" / "도착". */
export const fmtDist = (m: number) => (m > 0 ? `${m}m` : "도착");

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
