"use client";

import { useState } from "react";
import { useDriverStore } from "@/stores/driver.store";
import { useVoiceAssistant } from "./useVoiceAssistant";
import { formatWon } from "@/lib/driver/format";
import { CloseIcon, MicIcon } from "./Icons";

export default function VoicePanel({ onClose }: { onClose: () => void }) {
  const messages = useDriverStore((s) => s.messages);
  const {
    sttSupported,
    listening,
    busy,
    quickActions,
    menuOptions,
    orderSummary,
    startListening,
    stopListening,
    sendText,
    tapQuickAction,
  } = useVoiceAssistant();
  const [text, setText] = useState("");

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    sendText(t);
  };

  return (
    <div
      style={{
        width: 400,
        flex: "0 0 400px",
        background: "#fff",
        borderLeft: "1px solid #EDF0F3",
        display: "flex",
        flexDirection: "column",
        padding: "20px 22px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: "#EAF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MicIcon size={17} color="#3182F6" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#191F28" }}>GLEO AI</div>
            <div style={{ fontSize: 11, color: "#8B95A1", fontWeight: 500 }}>음성 주문</div>
          </div>
        </div>
        <div
          onClick={onClose}
          style={{ width: 34, height: 34, borderRadius: 11, background: "#F2F4F6", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B95A1", cursor: "pointer" }}
        >
          <CloseIcon />
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }} className="pl-scroll">
        {messages.map((msg, i) =>
          msg.role === "assistant" ? (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", maxWidth: "92%" }}>
              <div
                style={{ width: 28, height: 28, flex: "0 0 28px", borderRadius: 9, background: "#EAF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#3182F6", fontWeight: 700 }}
              >
                AI
              </div>
              <div style={{ background: "#F2F4F6", borderRadius: "4px 14px 14px 14px", padding: "11px 14px", fontSize: 15, lineHeight: 1.5, color: "#191F28" }}>
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ background: "#3182F6", color: "#fff", borderRadius: "14px 4px 14px 14px", padding: "11px 14px", fontSize: 15, lineHeight: 1.5, maxWidth: "88%", fontWeight: 500 }}>
                {msg.text}
              </div>
            </div>
          ),
        )}

        {/* order summary card (from the AI turn) */}
        {orderSummary && (orderSummary.items?.length || orderSummary.store_name || orderSummary.order_id) && (
          <div style={{ alignSelf: "stretch", background: orderSummary.order_id ? "#EAF9F0" : "#fff", border: `1px solid ${orderSummary.order_id ? "#CDEBD9" : "#EDF0F3"}`, borderRadius: 14, padding: "13px 15px", boxShadow: "0 2px 8px rgba(20,40,80,.04)" }}>
            {orderSummary.order_id && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "#0FA968", marginBottom: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#15C47E" }} /> 주문 완료 · <span className="num">{orderSummary.order_id}</span>
              </div>
            )}
            {orderSummary.bridged && (
              <div style={{ fontSize: 12, fontWeight: 700, color: "#3182F6", marginBottom: 6 }}>
                사장님에게 접수됨{orderSummary.merchant_order_no ? <> · <span className="num">{orderSummary.merchant_order_no}</span></> : null}
              </div>
            )}
            {orderSummary.store_name && <div style={{ fontSize: 14, fontWeight: 800, color: "#191F28", marginBottom: 8 }}>{orderSummary.store_name}</div>}
            {orderSummary.items?.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#4E5968", marginBottom: 4 }}>
                <span>{it.name}{it.quantity ? ` ×${it.quantity}` : ""}</span>
                {it.price != null && <span className="num">{formatWon(it.price)}원</span>}
              </div>
            ))}
            {orderSummary.total_price != null && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: "#191F28", borderTop: "1px solid rgba(20,40,80,.06)", marginTop: 8, paddingTop: 8 }}>
                <span>{orderSummary.order_id ? "결제금액" : "합계"}</span>
                <span className="num">{formatWon(orderSummary.total_price)}원</span>
              </div>
            )}
            {orderSummary.eta_minutes != null && (
              <div style={{ fontSize: 13, color: "#0FA968", fontWeight: 700, marginTop: 4 }}>약 <span className="num">{orderSummary.eta_minutes}</span>분 뒤 픽업</div>
            )}
          </div>
        )}
      </div>

      {/* menu options (tappable menu list from the AI turn) */}
      {!listening && menuOptions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {menuOptions.map((m, i) => (
            <div
              key={i}
              onClick={() => tapQuickAction(m.name)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 15px", borderRadius: 14, background: "#fff", border: "1px solid #EDF0F3", cursor: "pointer", boxShadow: "0 2px 8px rgba(20,40,80,.03)" }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: "#191F28" }}>{m.name}</span>
              {m.price != null && <span className="num" style={{ fontSize: 14, fontWeight: 700, color: "#4E5968" }}>{formatWon(m.price)}원</span>}
            </div>
          ))}
        </div>
      )}

      {/* quick actions */}
      {!listening && quickActions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {quickActions.map((qa, i) => (
            <div
              key={i}
              onClick={() => tapQuickAction(qa.value)}
              style={{ padding: "9px 15px", borderRadius: 999, background: "#EAF2FF", border: "1.5px solid #D3E3FF", color: "#3182F6", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              {qa.label}
            </div>
          ))}
        </div>
      )}

      {/* composer */}
      <div style={{ marginTop: 14 }}>
        {listening ? (
          <div
            onClick={stopListening}
            style={{ background: "#EAF2FF", border: "1.5px solid #3182F6", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4, height: 26 }}>
              {[0, 0.15, 0.3, 0.45, 0.6].map((d) => (
                <div key={d} style={{ width: 4, height: "100%", background: "#3182F6", borderRadius: 2, animation: `pxpulse 1s ease-in-out ${d}s infinite` }} />
              ))}
            </div>
            <div style={{ flex: 1, color: "#3182F6", fontSize: 15, fontWeight: 700 }}>듣고 있어요… <span style={{ color: "#8B95A1", fontWeight: 500 }}>(탭하여 중지)</span></div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={busy ? "처리 중…" : "주문을 말하거나 입력하세요"}
              disabled={busy}
              style={{ flex: 1, height: 48, background: "#F2F4F6", border: "1px solid #EDF0F3", borderRadius: 14, padding: "0 16px", fontSize: 15, color: "#191F28", outline: "none", fontFamily: "inherit" }}
            />
            {text.trim() ? (
              <div
                onClick={send}
                style={{ width: 48, height: 48, flex: "0 0 48px", borderRadius: 14, background: "#3182F6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
              >
                전송
              </div>
            ) : (
              <div
                onClick={sttSupported ? startListening : undefined}
                title={sttSupported ? "탭해서 말하기" : "이 브라우저는 음성 인식을 지원하지 않아요"}
                style={{ width: 48, height: 48, flex: "0 0 48px", borderRadius: 14, background: sttSupported ? "#3182F6" : "#C4CBD3", display: "flex", alignItems: "center", justifyContent: "center", cursor: sttSupported ? "pointer" : "default", boxShadow: sttSupported ? "0 6px 16px rgba(49,130,246,.35)" : "none" }}
              >
                <MicIcon size={22} color="#fff" />
              </div>
            )}
          </div>
        )}
        {!sttSupported && !listening && (
          <div style={{ fontSize: 12, color: "#B0B8C1", marginTop: 8, textAlign: "center" }}>음성 인식 미지원 브라우저 — 텍스트로 입력해 주세요</div>
        )}
      </div>
    </div>
  );
}
