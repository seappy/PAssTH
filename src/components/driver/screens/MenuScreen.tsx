"use client";

import Placeholder from "@/components/driver/Placeholder";
import { ArrowRightIcon, MinusIcon, PlusIcon, StarIcon } from "@/components/driver/Icons";
import { menuItems } from "@/lib/driver/mockData";

export default function MenuScreen({
  selMenu,
  onSelectMenu,
  qty,
  onIncQty,
  onDecQty,
  onToConfirm,
}: {
  selMenu: number;
  onSelectMenu: (i: number) => void;
  qty: number;
  onIncQty: () => void;
  onDecQty: () => void;
  onToConfirm: () => void;
}) {
  const selected = menuItems[selMenu];

  return (
    <div style={{ height: "100%", display: "flex", gap: 20, padding: "22px 28px" }}>
      <div style={{ flex: 1.32, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", border: "1px solid #EDF0F3", borderRadius: 18, padding: "16px 20px", marginBottom: 14, boxShadow: "0 2px 8px rgba(20,40,80,.03)" }}>
          <Placeholder size={56} borderRadius={14} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#191F28" }}>스타벅스 동탄호수공원</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
              <StarIcon size={15} />
              <span className="num" style={{ fontSize: 14, fontWeight: 700, color: "#191F28" }}>4.8</span>
              <span style={{ fontSize: 14, color: "#8B95A1" }}>· 픽업 ETA 5분 · 경로 2.1km</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#EAF9F0", borderRadius: 999, padding: "8px 14px" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#15C47E" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0FA968" }}>픽업 가능</span>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {menuItems.map((m, i) => {
            const sel = selMenu === i;
            return (
              <div
                key={m.name}
                onClick={() => onSelectMenu(i)}
                style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", border: `1px solid ${sel ? "#3182F6" : "#EDF0F3"}`, borderRadius: 16, padding: "14px 18px", cursor: "pointer", boxShadow: "0 2px 8px rgba(20,40,80,.03)" }}
              >
                <Placeholder size={56} borderRadius={12} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 19, fontWeight: 700, color: "#191F28" }}>{m.name}</div>
                  <div style={{ fontSize: 14, color: "#8B95A1" }}>{m.desc}</div>
                </div>
                <div className="num" style={{ fontSize: 19, fontWeight: 700, color: "#191F28" }}>{m.price}</div>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: sel ? "#3182F6" : "#EAF2FF", color: sel ? "#fff" : "#3182F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PlusIcon size={22} strokeWidth={2.4} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* option panel */}
      <div style={{ flex: 1, minWidth: 0, background: "#fff", border: "1px solid #EDF0F3", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", boxShadow: "0 4px 16px rgba(20,40,80,.05)" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#B0B8C1", fontWeight: 600, letterSpacing: ".05em" }}>OPTIONS</div>
        <div style={{ fontSize: 23, fontWeight: 800, color: "#191F28", margin: "8px 0 20px" }}>{selected.name}</div>

        <div style={{ fontSize: 14, fontWeight: 700, color: "#8B95A1", marginBottom: 10 }}>사이즈</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <div style={{ flex: 1, textAlign: "center", padding: "13px 0", borderRadius: 13, background: "#EAF2FF", border: "1.5px solid #3182F6", color: "#3182F6", fontSize: 16, fontWeight: 700 }}>Tall</div>
          <div style={{ flex: 1, textAlign: "center", padding: "13px 0", borderRadius: 13, background: "#F7F8FA", color: "#8B95A1", fontSize: 16, fontWeight: 600 }}>Grande</div>
          <div style={{ flex: 1, textAlign: "center", padding: "13px 0", borderRadius: 13, background: "#F7F8FA", color: "#8B95A1", fontSize: 16, fontWeight: 600 }}>Venti</div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: "#8B95A1", marginBottom: 10 }}>추가 옵션</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
          <div style={{ padding: "11px 18px", borderRadius: 999, background: "#EAF2FF", border: "1.5px solid #3182F6", color: "#3182F6", fontSize: 15, fontWeight: 700 }}>샷 추가 +500</div>
          <div style={{ padding: "11px 18px", borderRadius: 999, background: "#F7F8FA", color: "#8B95A1", fontSize: 15, fontWeight: 600 }}>바닐라 시럽</div>
          <div style={{ padding: "11px 18px", borderRadius: 999, background: "#F7F8FA", color: "#8B95A1", fontSize: 15, fontWeight: 600 }}>연하게</div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: "#8B95A1", marginBottom: 10 }}>수량</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div onClick={onDecQty} style={{ width: 54, height: 54, borderRadius: 15, background: "#F2F4F6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#4E5968" }}>
            <MinusIcon />
          </div>
          <div className="num" style={{ fontSize: 30, fontWeight: 800, color: "#191F28", width: 50, textAlign: "center" }}>{qty}</div>
          <div onClick={onIncQty} style={{ width: 54, height: 54, borderRadius: 15, background: "#EAF2FF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#3182F6" }}>
            <PlusIcon />
          </div>
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 4px 18px", borderTop: "1px solid #F2F4F6", marginTop: 16 }}>
          <span style={{ fontSize: 16, color: "#4E5968", fontWeight: 600 }}>합계</span>
          <span className="num" style={{ fontSize: 24, fontWeight: 800, color: "#191F28" }}>10,000원</span>
        </div>
        <div
          onClick={onToConfirm}
          style={{ height: 66, borderRadius: 16, background: "#3182F6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 20, fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 24px rgba(49,130,246,.3)" }}
        >
          장바구니 담고 주문
          <ArrowRightIcon size={22} color="#fff" strokeWidth={2.4} />
        </div>
      </div>
    </div>
  );
}
