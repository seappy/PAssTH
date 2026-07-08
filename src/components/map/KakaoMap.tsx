"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export type MapOrder = {
  id: string;
  orderNo: string;
  distanceM: number;
  custLat: number | null;
  custLng: number | null;
};

type Props = {
  store: { lat: number | null; lng: number | null } | null;
  orders: MapOrder[];
};

// Kakao Maps SDK is loaded at runtime; it has no bundled types.
type KakaoNS = Record<string, any>;
declare global {
  interface Window {
    kakao: KakaoNS;
  }
}

const SCRIPT_ID = "kakao-map-sdk";
const DEFAULT = { lat: 37.4979, lng: 127.0276 }; // Gangnam fallback

const storeBadge = () => {
  const el = document.createElement("div");
  el.innerHTML = `<div style="width:40px;height:40px;border-radius:13px;background:#191f28;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.3)">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5 5 5h14l1 4.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0z"/><path d="M5 11v9h14v-9"/></svg>
  </div>`;
  return el;
};

const carBadge = (o: MapOrder, nearest: boolean, onClick: () => void) => {
  const el = document.createElement("div");
  el.style.cursor = "pointer";
  el.innerHTML = `<div style="transform:translateY(-6px);${
    nearest
      ? "background:#3182f6;color:#fff;box-shadow:0 4px 10px rgba(0,0,0,.25);"
      : "background:#fff;color:#191f28;border:1.5px solid #191f28;"
  }border-radius:999px;padding:5px 10px;font-size:12px;font-weight:700;white-space:nowrap">🚗 ${o.distanceM}m</div>`;
  el.onclick = onClick;
  return el;
};

export function KakaoMap({ store, orders }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  const center = {
    lat: store?.lat ?? DEFAULT.lat,
    lng: store?.lng ?? DEFAULT.lng,
  };
  // Rebuild only when marker data actually changes.
  const sig = orders.map((o) => `${o.id}:${o.distanceM}`).join("|");

  useEffect(() => {
    const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!KEY || !ref.current) return;
    let cancelled = false;

    const render = () => {
      if (cancelled || !ref.current) return;
      const kakao = window.kakao;
      const c = new kakao.maps.LatLng(center.lat, center.lng);
      const map = new kakao.maps.Map(ref.current, { center: c, level: 5 });
      const bounds = new kakao.maps.LatLngBounds();
      bounds.extend(c);

      new kakao.maps.CustomOverlay({
        map,
        position: c,
        content: storeBadge(),
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 5,
      });

      const list = ordersRef.current;
      let hasMarkers = false;
      list.forEach((o, i) => {
        if (o.custLat == null || o.custLng == null) return;
        hasMarkers = true;
        const pos = new kakao.maps.LatLng(o.custLat, o.custLng);
        bounds.extend(pos);
        new kakao.maps.CustomOverlay({
          map,
          position: pos,
          content: carBadge(o, i === 0, () => router.push(`/orders/${o.id}`)),
          yAnchor: 1,
          zIndex: i === 0 ? 4 : 3,
        });
      });

      if (hasMarkers) map.setBounds(bounds, 40, 40, 40, 40);
    };

    if (window.kakao?.maps) {
      window.kakao.maps.load(render);
      return () => {
        cancelled = true;
      };
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const onLoad = () => window.kakao.maps.load(render);
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false`;
      document.head.appendChild(script);
    }
    script.addEventListener("load", onLoad);
    return () => {
      cancelled = true;
      script?.removeEventListener("load", onLoad);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, sig, router]);

  return (
    <div
      ref={ref}
      className="rounded-[20px] h-[230px] overflow-hidden shadow-sm mb-4 bg-[#eef1f4]"
    />
  );
}
