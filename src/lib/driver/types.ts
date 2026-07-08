export type ScreenId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface CarColor {
  name: string;
  swatch: string;
}

export interface Prefs {
  autoEta: boolean;
  pleosPay: boolean;
  voiceGuide: boolean;
}

/** The driver's own vehicle info, shown to the store at pickup. */
export interface CarInfo {
  number: string;
  color: string;
  model: string;
  type: string;
}

/** One line in the driver's cart (built from real menu items). */
export interface CartLine {
  menuId: string;
  name: string;
  unitPrice: number;
  qty: number;
  optionsText?: string;
}

export interface PlacedOrder {
  id: string;
  orderNo: string;
}
