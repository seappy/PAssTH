/**
 * Driving distance / ETA via Kakao Mobility Directions API, with a road-factor
 * haversine fallback when the API key is missing or the call fails.
 */

export type DrivingRoute = {
  distanceM: number;
  etaSeconds: number;
  /** kakao = Mobility API, estimate = straight-line × road factor */
  source: "kakao" | "estimate";
};

const ROAD_FACTOR = 1.38;
const URBAN_SPEED_MPS = 6.5; // ~23 km/h effective in 판교 street network
const CACHE_TTL_MS = 10 * 60 * 1000;

const cache = new Map<string, { at: number; route: DrivingRoute }>();

function cacheKey(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  return `${a.lat.toFixed(4)},${a.lng.toFixed(4)}->${b.lat.toFixed(4)},${b.lng.toFixed(4)}`;
}

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(s))));
}

function estimateDrivingRoute(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
): DrivingRoute {
  const straight = haversineMeters(origin, dest);
  const distanceM = Math.max(80, Math.round(straight * ROAD_FACTOR));
  const etaSeconds = Math.max(60, Math.round(distanceM / URBAN_SPEED_MPS));
  return { distanceM, etaSeconds, source: "estimate" };
}

async function fetchKakaoDirections(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
): Promise<DrivingRoute | null> {
  const apiKey = process.env.KAKAO_REST_API_KEY ?? process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  if (!apiKey) return null;

  const appOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = new URL("https://apis-navi.kakaomobility.com/v1/directions");
  url.searchParams.set("origin", `${origin.lng},${origin.lat}`);
  url.searchParams.set("destination", `${dest.lng},${dest.lat}`);
  url.searchParams.set("priority", "RECOMMEND");
  url.searchParams.set("summary", "true");

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
        "Content-Type": "application/json",
        // Mobility API requires KA metadata — see Kakao Mobility 길찾기 docs.
        KA: `os javascript origin ${appOrigin}`,
      },
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      routes?: { summary?: { distance?: number; duration?: number } }[];
    };
    const summary = data.routes?.[0]?.summary;
    if (!summary?.distance || !summary?.duration) return null;

    return {
      distanceM: summary.distance,
      etaSeconds: summary.duration,
      source: "kakao",
    };
  } catch {
    return null;
  }
}

/** Origin → destination driving distance & ETA (cached). */
export async function getDrivingRoute(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
): Promise<DrivingRoute> {
  const key = cacheKey(origin, dest);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.route;

  const kakao = await fetchKakaoDirections(origin, dest);
  const route = kakao ?? estimateDrivingRoute(origin, dest);
  cache.set(key, { at: Date.now(), route });
  return route;
}
