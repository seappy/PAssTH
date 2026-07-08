"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistance } from "@/lib/driver/format";

type LatLng = { lat: number; lng: number };

type KakaoNS = Record<string, any>;
declare global {
  interface Window {
    kakao: KakaoNS;
  }
}

const SCRIPT_ID = "kakao-map-sdk";

/**
 * Driver pickup map — store marker + the car's position + a route line between
 * them. Uses the Kakao Maps SDK; if the key is missing or the SDK can't load,
 * it falls back to a striped mock so the panel is never blank. Fills its parent
 * (the driver UI uses inline styles, not Tailwind).
 */
export function DriverMap({
  store,
  driver,
  distanceM,
}: {
  store: LatLng | null;
  driver: LatLng;
  distanceM: number | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  const sLat = store?.lat ?? null;
  const sLng = store?.lng ?? null;

  useEffect(() => {
    const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!KEY || !ref.current || sLat == null || sLng == null) {
      if (!KEY) setFailed(true);
      return;
    }
    let cancelled = false;
    const fail = () => !cancelled && setFailed(true);
    const timeout = setTimeout(fail, 4000);

    const render = () => {
      if (cancelled || !ref.current) return;
      try {
        const kakao = window.kakao;
        const storePos = new kakao.maps.LatLng(sLat, sLng);
        const carPos = new kakao.maps.LatLng(driver.lat, driver.lng);
        const map = new kakao.maps.Map(ref.current, { center: storePos, level: 6 });

        // route line
        new kakao.maps.Polyline({
          map,
          path: [carPos, storePos],
          strokeWeight: 5,
          strokeColor: "#3182F6",
          strokeOpacity: 0.85,
          strokeStyle: "solid",
        });

        new kakao.maps.CustomOverlay({ map, position: storePos, content: storeBadge(), xAnchor: 0.5, yAnchor: 0.5, zIndex: 5 });
        new kakao.maps.CustomOverlay({ map, position: carPos, content: carBadge(distanceM), xAnchor: 0.5, yAnchor: 0.5, zIndex: 6 });

        const bounds = new kakao.maps.LatLngBounds();
        bounds.extend(storePos);
        bounds.extend(carPos);
        map.setBounds(bounds, 60, 60, 60, 60);
        clearTimeout(timeout);
      } catch {
        fail();
      }
    };

    if (window.kakao?.maps) {
      window.kakao.maps.load(render);
      return () => {
        cancelled = true;
        clearTimeout(timeout);
      };
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const onLoad = () => window.kakao.maps.load(render);
    const onError = () => fail();
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false`;
      script.addEventListener("error", onError);
      document.head.appendChild(script);
    } else {
      script.addEventListener("error", onError);
    }
    script.addEventListener("load", onLoad);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      script?.removeEventListener("load", onLoad);
      script?.removeEventListener("error", onError);
    };
  }, [sLat, sLng, driver.lat, driver.lng, distanceM]);

  if (failed) return <MockRoute distanceM={distanceM} />;

  return <div ref={ref} style={{ width: "100%", height: "100%", borderRadius: 20, overflow: "hidden", background: "#EEF1F4" }} />;
}

function storeBadge() {
  const el = document.createElement("div");
  el.innerHTML = `<div style="width:44px;height:44px;border-radius:14px;background:#191F28;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.35)">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5 5 5h14l1 4.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0z"/><path d="M5 11v9h14v-9"/></svg>
  </div>`;
  return el;
}

function carBadge(distanceM: number | null) {
  const el = document.createElement("div");
  el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
    <div style="background:#3182F6;color:#fff;border-radius:999px;padding:6px 12px;font-size:13px;font-weight:800;white-space:nowrap;box-shadow:0 4px 12px rgba(49,130,246,.5)">🚗 ${distanceM != null ? formatDistance(distanceM) : "내 위치"}</div>
  </div>`;
  return el;
}

/** Striped fallback showing the car→store relationship without a real map. */
function MockRoute({ distanceM }: { distanceM: number | null }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 20,
        backgroundImage: "repeating-linear-gradient(135deg,#EAEEF2 0 14px,#E1E6EB 14px 28px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: 20, top: 18, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#AEB6BF", fontWeight: 600 }}>MAP · 경로</div>
      {/* route line */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} preserveAspectRatio="none">
        <line x1="22%" y1="72%" x2="66%" y2="40%" stroke="#3182F6" strokeWidth="4" strokeOpacity="0.8" strokeDasharray="2 10" strokeLinecap="round" />
      </svg>
      {/* car */}
      <div style={{ position: "absolute", left: "22%", top: "72%", transform: "translate(-50%,-50%)", background: "#3182F6", color: "#fff", borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 800, whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(49,130,246,.5)" }}>
        🚗 {distanceM != null ? formatDistance(distanceM) : "내 위치"}
      </div>
      {/* store */}
      <div style={{ position: "absolute", left: "66%", top: "40%", transform: "translate(-50%,-50%)", width: 44, height: 44, borderRadius: 14, background: "#191F28", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,.35)" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9.5 5 5h14l1 4.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0z" /><path d="M5 11v9h14v-9" /></svg>
      </div>
      <div style={{ position: "absolute", left: 14, bottom: 12, display: "flex", alignItems: "center", gap: 6, background: "#fff", borderRadius: 999, padding: "5px 11px", fontSize: 11, color: "#8B95A1", fontWeight: 600 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#15C47E" }} /> 시뮬레이션 지도
      </div>
    </div>
  );
}
