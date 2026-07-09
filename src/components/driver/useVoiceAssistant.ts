"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDriverStore } from "@/stores/driver.store";
import { WebSpeechStt, WebSpeechTts } from "@/lib/driver/voice/webspeech";
import { postVoiceTurn, type MenuOption, type OrderSummary, type QuickAction } from "@/lib/driver/voice/turn";

/**
 * Conversational voice loop. STT/TTS live in the browser (Web Speech); the
 * dialogue "brain" is the AI team's FastAPI, reached via `/api/voice/turn`.
 *
 * Flow: mic/text → utterance → postVoiceTurn(session, utterance) → speak
 * speech_text + surface quick_actions / order_summary. (Bridging the finished
 * order into Supabase happens later, once the catalog is aligned.)
 */
export function useVoiceAssistant() {
  const pushMessage = useDriverStore((s) => s.pushMessage);
  const setListening = useDriverStore((s) => s.setListening);
  const listening = useDriverStore((s) => s.listening);
  const trackPlacedOrder = useDriverStore((s) => s.trackPlacedOrder);
  const toggleVoice = useDriverStore((s) => s.toggleVoice);
  const car = useDriverStore((s) => s.car);
  const carRef = useRef(car);
  carRef.current = car;

  const sttRef = useRef<WebSpeechStt | null>(null);
  const ttsRef = useRef<WebSpeechTts | null>(null);
  const sessionRef = useRef<string>("");
  const [sttSupported, setSttSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [menuOptions, setMenuOptions] = useState<MenuOption[]>([]);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);

  useEffect(() => {
    ttsRef.current = new WebSpeechTts();
    sessionRef.current = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    if (WebSpeechStt.isSupported()) {
      sttRef.current = new WebSpeechStt();
      setSttSupported(true);
    }
    return () => {
      sttRef.current?.stop();
      ttsRef.current?.cancel();
      setListening(false);
    };
  }, [setListening]);

  const send = useCallback(
    async (utterance: string) => {
      const text = utterance.trim();
      if (!text || busy) return;
      pushMessage({ role: "user", text });
      setBusy(true);
      try {
        const resp = await postVoiceTurn(sessionRef.current, text, carRef.current);
        if (resp.speech_text) {
          pushMessage({ role: "assistant", text: resp.speech_text });
          ttsRef.current?.speak(resp.speech_text);
        }
        setQuickActions(resp.quick_actions ?? []);
        setMenuOptions(resp.menu_options ?? []);
        setOrderSummary(resp.order_summary ?? null);

        // Order done + mirrored into the merchant DB → drive the SAME 완료/픽업
        // progress screens as a touch order (seed placedOrder, close the panel).
        const os = resp.order_summary;
        if (os?.bridged && os.merchant_order_id && os.merchant_order_no) {
          trackPlacedOrder({ id: os.merchant_order_id, orderNo: os.merchant_order_no });
          toggleVoice(false);
        }
      } catch {
        pushMessage({ role: "assistant", text: "음성 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요." });
      } finally {
        setBusy(false);
      }
    },
    [busy, pushMessage, trackPlacedOrder, toggleVoice],
  );

  const startListening = useCallback(() => {
    const stt = sttRef.current;
    if (!stt) return;
    ttsRef.current?.cancel();
    setListening(true);
    const unsub = stt.onResult((r) => {
      if (!r.isFinal) return;
      unsub();
      setListening(false);
      stt.stop();
      if (r.transcript.trim()) void send(r.transcript);
    });
    stt.start();
  }, [send, setListening]);

  const stopListening = useCallback(() => {
    sttRef.current?.stop();
    setListening(false);
  }, [setListening]);

  return {
    sttSupported,
    listening,
    busy,
    quickActions,
    menuOptions,
    orderSummary,
    startListening,
    stopListening,
    sendText: send,
    tapQuickAction: (value: string) => void send(value),
  };
}
