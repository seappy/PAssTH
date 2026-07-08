import type { CarColor, Prefs } from "./types";

/** Static UI config for the driver client (NOT data — no hardcoded stores/menus). */

export const SCREEN_TITLES: Record<number, string> = {
  1: "PAssTH",
  2: "가는 길에 주문",
  3: "메뉴",
  4: "주문 확인",
  5: "주문 완료",
  6: "픽업 진행",
  7: "설정",
};

export const carColorDefs: CarColor[] = [
  { name: "화이트", swatch: "#F1F3F5" },
  { name: "실버", swatch: "#C4CBD3" },
  { name: "그레이", swatch: "#8B95A1" },
  { name: "다크", swatch: "#4E5968" },
  { name: "블랙", swatch: "#252A31" },
  { name: "기타", swatch: "repeating-linear-gradient(135deg,#EEF1F4 0 6px,#E1E6EB 6px 12px)" },
];

export const prefLabels: { key: keyof Prefs; label: string }[] = [
  { key: "autoEta", label: "ETA 자동 안내" },
  { key: "pleosPay", label: "Pleos Pay 자동 결제" },
  { key: "voiceGuide", label: "음성 주문 확인 안내" },
];
