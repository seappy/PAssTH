"use client";

import { useEffect, useRef, useState } from "react";
import { formatEta } from "@/lib/driver/format";
import { ArrowRightIcon } from "@/components/driver/Icons";

type LatLng = { lat: number; lng: number };
export type MapStore = {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  open: boolean;
  etaSeconds: number | null;
};

type KakaoNS = Record<string, any>;
declare global {
  interface Window {
    kakao: KakaoNS;
  }
}
const SCRIPT_ID = "kakao-map-sdk";

/**
 * Multi-store map for the search tab. Markers are plain pins only — the store
 * name + ETA are shown separately in a card when a pin is tapped (per design).
 * Falls back to a relative-position mock when the Kakao SDK is unavailable.
 */
export function StoresMap({
  stores,
  driver,
  onSelect,
}: {
  stores: MapStore[];
  driver: LatLng;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectRef = useRef<(id: string) => void>(() => {});
  selectRef.current = (id: string) => setSelectedId(id);

  const pinned = stores.filter((s) => s.lat != null && s.lng != null) as (MapStore & LatLng)[];
  const sig = pinned.map((s) => s.id).join("|");
  const selected = pinned.find((s) => s.id === selectedId) ?? null;

  // Default the info card to the nearest store so it isn't empty on open.
  useEffect(() => {
    if (!selectedId && pinned.length > 0) setSelectedId(pinned[0].id);
  }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!KEY || !ref.current) {
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
        const center = new kakao.maps.LatLng(driver.lat, driver.lng);
        const map = new kakao.maps.Map(ref.current, { center, level: 6 });
        const bounds = new kakao.maps.LatLngBounds();
        bounds.extend(center);

        new kakao.maps.CustomOverlay({ map, position: center, content: driverDot(), xAnchor: 0.5, yAnchor: 0.5, zIndex: 4 });

        pinned.forEach((s) => {
          const pos = new kakao.maps.LatLng(s.lat, s.lng);
          bounds.extend(pos);
          const el = pinEl(s.open);
          el.onclick = () => selectRef.current(s.id);
          new kakao.maps.CustomOverlay({ map, position: pos, content: el, xAnchor: 0.5, yAnchor: 1, zIndex: 5 });
        });

        if (pinned.length > 0) map.setBounds(bounds, 60, 60, 100, 60);
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
  }, [driver.lat, driver.lng, sig]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {failed ? (
        <MockStores stores={pinned} driver={driver} selectedId={selectedId} onPin={(id) => setSelectedId(id)} />
      ) : (
        // position+zIndex makes the map its own stacking context so Kakao's
        // internal high z-index layers stay below the info card (sibling).
        <div ref={ref} style={{ position: "relative", zIndex: 0, width: "100%", height: "100%", borderRadius: 20, overflow: "hidden", background: "#EEF1F4" }} />
      )}
      {selected && <StoreInfoCard store={selected} onOrder={() => onSelect(selected.id)} />}
    </div>
  );
}

/** Separate card showing the selected store's name + ETA (not on the marker). */
function StoreInfoCard({ store, onOrder }: { store: MapStore; onOrder: () => void }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 20, // above the Kakao map's internal tile/overlay layers
        background: "#fff",
        borderRadius: 18,
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: "0 12px 30px rgba(20,40,80,.18)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: "#191F28", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{store.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: store.open ? "#15C47E" : "#B0B8C1" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: store.open ? "#0FA968" : "#8B95A1" }}>{store.open ? "픽업 가능" : "준비 마감"}</span>
          </span>
          <span className="num" style={{ fontSize: 15, fontWeight: 800, color: "#3182F6" }}>픽업 {formatEta(store.etaSeconds)}</span>
        </div>
      </div>
      {store.open && (
        <div
          onClick={onOrder}
          style={{ height: 48, padding: "0 20px", borderRadius: 14, background: "#3182F6", color: "#fff", display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 20px rgba(49,130,246,.3)" }}
        >
          주문하기
          <ArrowRightIcon size={20} color="#fff" strokeWidth={2.4} />
        </div>
      )}
    </div>
  );
}

function driverDot() {
  const el = document.createElement("div");
  el.innerHTML = `<div style="width:22px;height:22px;border-radius:50%;background:#3182F6;border:3px solid #fff;box-shadow:0 4px 12px rgba(49,130,246,.5)"></div>`;
  return el;
}

/** Plain teardrop pin — no text. Open = brand blue, closed = gray. */
function pinEl(open: boolean) {
  const el = document.createElement("div");
  el.style.cursor = "pointer";
  const color = open ? "#3182F6" : "#B0B8C1";
  el.innerHTML = `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2.5px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.3)"></div>`;
  return el;
}

/** Relative-position fallback when the map SDK can't load. Pins only. */
function MockStores({
  stores,
  driver,
  selectedId,
  onPin,
}: {
  stores: (MapStore & LatLng)[];
  driver: LatLng;
  selectedId: string | null;
  onPin: (id: string) => void;
}) {
  const maxD = Math.max(0.002, ...stores.map((s) => Math.hypot(s.lat - driver.lat, s.lng - driver.lng)));
  return (
    <div style={{ width: "100%", height: "100%", borderRadius: 20, backgroundImage: "repeating-linear-gradient(135deg,#EAEEF2 0 14px,#E1E6EB 14px 28px)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 20, top: 18, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#AEB6BF", fontWeight: 600 }}>MAP · 주변 매장</div>
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 22, height: 22, borderRadius: "50%", background: "#3182F6", border: "3px solid #fff", boxShadow: "0 4px 12px rgba(49,130,246,.5)" }} />
      {stores.map((s) => {
        const left = 50 + ((s.lng - driver.lng) / maxD) * 32;
        const top = 50 - ((s.lat - driver.lat) / maxD) * 32;
        const sel = s.id === selectedId;
        const color = s.open ? "#3182F6" : "#B0B8C1";
        return (
          <div
            key={s.id}
            onClick={() => onPin(s.id)}
            title={s.name}
            style={{ position: "absolute", left: `${left}%`, top: `${top}%`, transform: `translate(-50%,-100%) scale(${sel ? 1.25 : 1})`, width: 22, height: 22, borderRadius: "50% 50% 50% 0", rotate: "-45deg", background: color, border: "2.5px solid #fff", boxShadow: "0 4px 10px rgba(0,0,0,.3)", cursor: "pointer" }}
          />
        );
      })}
    </div>
  );
}
