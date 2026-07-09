"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useDriverStore } from "@/stores/driver.store";
import { formatWon, ellipsis } from "@/lib/driver/format";
import { ArrowRightIcon, MinusIcon, PlusIcon } from "@/components/driver/Icons";

export default function MenuScreen() {
  const storeId = useDriverStore((s) => s.selectedStoreId);
  const driverLoc = useDriverStore((s) => s.driverLoc);
  const addToCart = useDriverStore((s) => s.addToCart);
  const cart = useDriverStore((s) => s.cart);
  const reviewOrder = useDriverStore((s) => s.reviewOrder);

  const { data, isLoading } = trpc.driver.storeMenu.useQuery(
    { storeId: storeId as string, origin: driverLoc ?? undefined },
    { enabled: !!storeId },
  );

  const menus = useMemo(
    () => (data ? data.categories.flatMap((c) => c.menus.map((m) => ({ ...m, category: c.name }))) : []),
    [data],
  );

  const [selId, setSelId] = useState<string | null>(null);
  const [opts, setOpts] = useState<Record<string, boolean>>({});
  const [qty, setQty] = useState(1);

  const selected = menus.find((m) => m.id === selId) ?? menus[0] ?? null;
  const effectiveSel = selected;

  const chosenOptions = effectiveSel ? effectiveSel.options.filter((o) => opts[o.id]) : [];
  const unitPrice = effectiveSel
    ? effectiveSel.price + chosenOptions.reduce((s, o) => s + o.extraPrice, 0)
    : 0;
  const lineTotal = unitPrice * qty;
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const cartTotal = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);

  const pick = (id: string) => {
    setSelId(id);
    setOpts({});
    setQty(1);
  };

  const add = () => {
    if (!effectiveSel) return;
    const optionsText = chosenOptions.map((o) => o.name).join(" · ") || undefined;
    addToCart({ menuId: effectiveSel.id, name: effectiveSel.name, unitPrice, qty, optionsText });
    setOpts({});
    setQty(1);
  };

  if (isLoading) return <Center text="메뉴를 불러오는 중…" />;
  if (!storeId) return <Center text="먼저 매장을 선택해 주세요." />;
  if (menus.length === 0) return <Center text="등록된 메뉴가 없어요." />;

  return (
    <div style={{ height: "100%", display: "flex", gap: 20, padding: "22px 28px" }}>
      {/* menu list */}
      <div style={{ flex: 1.32, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ ...ellipsis, fontSize: 15, fontWeight: 700, color: "#8B95A1", marginBottom: 12 }} title={data?.store.name}>
          {data?.store.name}
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 10, overflow: "auto" }} className="pl-scroll">
          {menus.map((m) => {
            const sel = effectiveSel?.id === m.id;
            return (
              <div
                key={m.id}
                onClick={() => !m.soldOut && pick(m.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  background: "#fff",
                  border: `1px solid ${sel ? "#3182F6" : "#EDF0F3"}`,
                  borderRadius: 16,
                  padding: "14px 18px",
                  cursor: m.soldOut ? "default" : "pointer",
                  opacity: m.soldOut ? 0.5 : 1,
                  boxShadow: "0 2px 8px rgba(20,40,80,.03)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 19, fontWeight: 700, color: "#191F28" }}>{m.name}</div>
                  <div style={{ fontSize: 14, color: "#8B95A1" }}>{m.category}{m.soldOut ? " · 품절" : ""}</div>
                </div>
                <div className="num" style={{ fontSize: 19, fontWeight: 700, color: "#191F28" }}>{formatWon(m.price)}</div>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: sel ? "#3182F6" : "#EAF2FF", color: sel ? "#fff" : "#3182F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PlusIcon size={22} strokeWidth={2.4} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* option panel */}
      <div style={{ flex: 1, minWidth: 0, background: "#fff", border: "1px solid #EDF0F3", borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 4px 16px rgba(20,40,80,.05)" }}>
        {/* menu photo header */}
        <div
          className={effectiveSel?.imageUrl ? undefined : "pl-stripe"}
          style={{
            height: 104,
            flex: "0 0 104px",
            backgroundColor: "#EEF1F4",
            backgroundImage: effectiveSel?.imageUrl ? `url(${effectiveSel.imageUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "18px 24px 20px" }}>
        {/* scrollable: grows/shrinks with option count, never pushes the footer below off-screen */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }} className="pl-scroll">
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#B0B8C1", fontWeight: 600, letterSpacing: ".05em" }}>OPTIONS</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: "#191F28", margin: "6px 0 14px" }}>{effectiveSel?.name}</div>

          {effectiveSel && effectiveSel.options.length > 0 ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#8B95A1", marginBottom: 8 }}>추가 옵션</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {effectiveSel.options.map((o) => {
                  const on = !!opts[o.id];
                  return (
                    <div
                      key={o.id}
                      onClick={() => setOpts((p) => ({ ...p, [o.id]: !p[o.id] }))}
                      style={{
                        padding: "11px 18px",
                        borderRadius: 999,
                        cursor: "pointer",
                        background: on ? "#EAF2FF" : "#F7F8FA",
                        border: on ? "1.5px solid #3182F6" : "1.5px solid transparent",
                        color: on ? "#3182F6" : "#8B95A1",
                        fontSize: 15,
                        fontWeight: on ? 700 : 600,
                      }}
                    >
                      {o.name}{o.extraPrice ? ` +${formatWon(o.extraPrice)}` : ""}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 14, color: "#B0B8C1" }}>선택 가능한 옵션이 없어요.</div>
          )}
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: "#8B95A1", margin: "14px 0 8px" }}>수량</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div onClick={() => setQty((q) => Math.max(1, q - 1))} style={stepBtn("#F2F4F6", "#4E5968", 46)}>
            <MinusIcon />
          </div>
          <div className="num" style={{ fontSize: 26, fontWeight: 800, color: "#191F28", width: 44, textAlign: "center" }}>{qty}</div>
          <div onClick={() => setQty((q) => q + 1)} style={stepBtn("#EAF2FF", "#3182F6", 46)}>
            <PlusIcon />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 4px", borderTop: "1px solid #F2F4F6", marginTop: 12 }}>
          <span style={{ fontSize: 15, color: "#4E5968", fontWeight: 600 }}>담기 금액</span>
          <span className="num" style={{ fontSize: 22, fontWeight: 800, color: "#191F28" }}>{formatWon(lineTotal)}원</span>
        </div>
        <div onClick={add} style={{ height: 48, borderRadius: 14, background: "#EAF2FF", color: "#3182F6", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 16, fontWeight: 800, cursor: "pointer", marginBottom: 8 }}>
          <PlusIcon size={18} strokeWidth={2.4} /> 장바구니 담기
        </div>
        <div
          onClick={() => cartCount > 0 && reviewOrder()}
          style={{
            height: 52,
            borderRadius: 14,
            background: cartCount > 0 ? "#3182F6" : "#C4CBD3",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontSize: 19,
            fontWeight: 800,
            cursor: cartCount > 0 ? "pointer" : "default",
            boxShadow: cartCount > 0 ? "0 10px 24px rgba(49,130,246,.3)" : "none",
          }}
        >
          주문하기 {cartCount > 0 ? `· ${cartCount}개 ${formatWon(cartTotal)}원` : ""}
          <ArrowRightIcon size={22} color="#fff" strokeWidth={2.4} />
        </div>
        </div>
      </div>
    </div>
  );
}

function stepBtn(bg: string, color: string, size = 54): React.CSSProperties {
  return { width: size, height: size, borderRadius: 15, background: bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color };
}

function Center({ text }: { text: string }) {
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B95A1", fontSize: 16, fontWeight: 600 }}>
      {text}
    </div>
  );
}
