import { NextResponse } from "next/server";
import { getDrivingRoute } from "@/server/services/kakao-route";

/** GET /api/kakao/directions?originLat=&originLng=&destLat=&destLng= */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const originLat = Number(u.searchParams.get("originLat"));
  const originLng = Number(u.searchParams.get("originLng"));
  const destLat = Number(u.searchParams.get("destLat"));
  const destLng = Number(u.searchParams.get("destLng"));

  if (![originLat, originLng, destLat, destLng].every(Number.isFinite)) {
    return NextResponse.json({ error: "originLat, originLng, destLat, destLng required" }, { status: 400 });
  }

  const route = await getDrivingRoute(
    { lat: originLat, lng: originLng },
    { lat: destLat, lng: destLng },
  );
  return NextResponse.json(route);
}
