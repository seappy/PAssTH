import type {
  CarColor,
  CartItem,
  ChatMessage,
  FavMenu,
  FavStore,
  MenuItem,
  Recommendation,
  RecentOrder,
  RouteStore,
} from "./types";

export const SCREEN_TITLES: Record<number, string> = {
  1: "PAssTH",
  2: "가는 길에 주문",
  3: "메뉴",
  4: "주문 확인",
  5: "주문 완료",
  6: "픽업 진행",
  7: "설정",
};

export const recentOrders: RecentOrder[] = [
  { store: "스타벅스 동탄점", item: "아이스 아메리카노 외 1", time: "어제" },
  { store: "써브웨이 반송점", item: "에그마요 15cm", time: "3일 전" },
];

export const recommendations: Recommendation[] = [
  { name: "블루보틀 동탄", cat: "카페 · 커피", eta: "6분" },
  { name: "노브랜드 버거", cat: "버거 · 패스트푸드", eta: "9분" },
];

export const routeStores: RouteStore[] = [
  { name: "스타벅스 동탄호수공원", logo: "STARBUCKS", cat: "카페", dist: "2.1km", eta: "5분", rating: "4.8", reviews: "1.2k", hours: "영업중 · ~22:00", open: true },
  { name: "맥도날드 동탄센트럴", logo: "MCDONALDS", cat: "버거", dist: "4.0km", eta: "9분", rating: "4.6", reviews: "980", hours: "영업중 · 24시간", open: true },
  { name: "폴바셋 반송", logo: "PAULBASSETT", cat: "카페", dist: "6.8km", eta: "14분", rating: "4.7", reviews: "640", hours: "영업중 · ~21:00", open: true },
  { name: "투썸플레이스 능동", logo: "TWOSOME", cat: "카페 · 디저트", dist: "9.2km", eta: "19분", rating: "4.5", reviews: "510", hours: "준비 마감", open: false },
];

export const menuItems: MenuItem[] = [
  { name: "아이스 카페 아메리카노", desc: "Tall · 355ml", price: "4,500" },
  { name: "카페 라떼", desc: "Tall · 355ml", price: "5,000" },
  { name: "바닐라 크림 콜드브루", desc: "Tall · 355ml", price: "5,900" },
  { name: "버터 크로플", desc: "플레인", price: "4,200" },
];

export const cart: CartItem[] = [
  { name: "아이스 아메리카노", opt: "Tall · 샷 추가", qty: 2, price: "10,000" },
  { name: "버터 크로플", opt: "플레인", qty: 1, price: "4,200" },
];

export const carColorDefs: CarColor[] = [
  { name: "화이트", swatch: "#F1F3F5" },
  { name: "실버", swatch: "#C4CBD3" },
  { name: "그레이", swatch: "#8B95A1" },
  { name: "다크", swatch: "#4E5968" },
  { name: "블랙", swatch: "#252A31" },
  { name: "기타", swatch: "repeating-linear-gradient(135deg,#EEF1F4 0 6px,#E1E6EB 6px 12px)" },
];

export const favStores: FavStore[] = [
  { name: "스타벅스 동탄호수공원", cat: "카페 · 자주 픽업" },
  { name: "맥도날드 동탄센트럴", cat: "버거 · 드라이브스루" },
];

export const favMenus: FavMenu[] = [
  { name: "아이스 아메리카노 Tall · 샷 추가", store: "스타벅스 동탄호수공원" },
  { name: "빅맥 세트", store: "맥도날드 동탄센트럴" },
];

export const chatMessages: ChatMessage[] = [
  { ai: false, text: "가는 길에 아메리카노 두 잔 주문해줘" },
  { ai: true, text: "경로에 있는 스타벅스 동탄호수공원점을 찾았어요. 아이스 아메리카노 Tall 2잔으로 주문할까요?" },
  { ai: false, text: "응, 샷 추가해서" },
  { ai: true, text: "샷 추가한 아이스 아메리카노 2잔, 총 12,000원이에요. Pleos Pay로 결제하고 ETA를 매장에 전달할게요." },
];

export const prefLabels: { key: "autoEta" | "pleosPay" | "voiceGuide"; label: string }[] = [
  { key: "autoEta", label: "ETA 자동 안내" },
  { key: "pleosPay", label: "Pleos Pay 자동 결제" },
  { key: "voiceGuide", label: "음성 주문 확인 안내" },
];
