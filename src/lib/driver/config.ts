import type { CarColor, CarInfo, Prefs } from "./types";

/** Static UI config for the driver client (NOT data — no hardcoded stores/menus). */

export const SCREEN_TITLES: Record<number, string> = {
  1: "PAssTH",
  2: "가는 길에 주문",
  3: "메뉴",
  4: "주문 확인",
  5: "주문 완료",
  6: "주문",
  7: "설정",
  8: "이용 후기",
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

// Demo car pool — used to give each test device a distinct vehicle identity so
// concurrent testers show up as different cars on the merchant screen.
const CAR_MODELS: { model: string; type: string }[] = [
  { model: "아이오닉 6", type: "승용" },
  { model: "EV6", type: "SUV" },
  { model: "모델 3", type: "승용" },
  { model: "그랜저", type: "승용" },
  { model: "쏘렌토", type: "SUV" },
  { model: "G80", type: "승용" },
  { model: "셀토스", type: "SUV" },
  { model: "니로 EV", type: "SUV" },
];

const PLATE_SYLLABLES = "가나다라마거너더러머버서어저고노도로모보소오조구누두루무부수우주허하호".split("");

/** A random, plausible Korean vehicle identity + matching color swatch index. */
export function randomCarProfile(): { car: CarInfo; carColor: number } {
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const { model, type } = pick(CAR_MODELS);
  const carColor = Math.floor(Math.random() * 5); // 0..4 (skip "기타")
  const two = 10 + Math.floor(Math.random() * 90);
  const four = 1000 + Math.floor(Math.random() * 9000);
  const number = `${two}${pick(PLATE_SYLLABLES)} ${four}`;
  return { car: { number, color: carColorDefs[carColor].name, model, type }, carColor };
}
