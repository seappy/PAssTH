export type ScreenId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface RecentOrder {
  store: string;
  item: string;
  time: string;
}

export interface Recommendation {
  name: string;
  cat: string;
  eta: string;
}

export interface RouteStore {
  name: string;
  logo: string;
  cat: string;
  dist: string;
  eta: string;
  rating: string;
  reviews: string;
  hours: string;
  open: boolean;
}

export interface MenuItem {
  name: string;
  desc: string;
  price: string;
}

export interface CartItem {
  name: string;
  opt: string;
  qty: number;
  price: string;
}

export interface CarColor {
  name: string;
  swatch: string;
}

export interface FavStore {
  name: string;
  cat: string;
}

export interface FavMenu {
  name: string;
  store: string;
}

export interface ChatMessage {
  ai: boolean;
  text: string;
}

export interface Prefs {
  autoEta: boolean;
  pleosPay: boolean;
  voiceGuide: boolean;
}
