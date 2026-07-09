/** Display helpers for the driver client. */

/**
 * Demo driver position (~3km NE of the Pangyo store) used when no live GPS is
 * available. In a real car this comes from the head unit's location.
 */
export const DRIVER_ORIGIN = { lat: 37.4147, lng: 127.1312 };
const AVG_SPEED_MPS = 8.3; // ~30 km/h city driving

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(s))));
}

export function drivingEtaSeconds(distanceM: number): number {
  return Math.round(distanceM / AVG_SPEED_MPS);
}

/** Long store names — use on flex children with minWidth: 0. */
export const ellipsis = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

/** 판교역 anchor — used to simulate "the driver's current position" for demo orders. */
export const PANGYO_STATION = { lat: 37.3947, lng: 127.1112 };

/**
 * Random point 400–2200m from an origin (default: 판교역).
 * Distance/ETA to each store are computed separately via Kakao route API.
 */
export function randomNearbyPoint(origin: { lat: number; lng: number } = PANGYO_STATION): {
  lat: number;
  lng: number;
} {
  const distanceM = Math.floor(Math.random() * (2200 - 400 + 1)) + 400;
  const bearing = Math.random() * Math.PI * 2;
  const latRad = (origin.lat * Math.PI) / 180;
  const dLat = (distanceM * Math.cos(bearing)) / 111_000;
  const dLng = (distanceM * Math.sin(bearing)) / (111_000 * Math.cos(latRad));
  return { lat: origin.lat + dLat, lng: origin.lng + dLng };
}

/** @deprecated Use randomNearbyPoint — distance/ETA come from route API now. */
export function randomNearbyFix(origin: { lat: number; lng: number } = PANGYO_STATION) {
  const point = randomNearbyPoint(origin);
  const distanceM = haversineMeters(origin, point);
  return { ...point, distanceM, etaSeconds: drivingEtaSeconds(distanceM) };
}

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

/** Wall-clock "HH:MM" for a timestamp (ms). */
export function formatClock(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Remaining time "M:SS" (clamped at 0:00). */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
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
