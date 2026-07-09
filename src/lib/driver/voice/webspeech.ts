import type { SttEngine, SttResult, TtsEngine } from "./engines";

/**
 * Browser Web Speech implementations of the voice engines. STT/TTS live on the
 * front-end (the car browser); the Python AI only owns the NLU brain behind
 * `IntentParser`. Swap these for a cloud/head-unit SDK later without touching
 * the rest of the pipeline.
 */

type SpeechRecognitionCtor = new () => any;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export class WebSpeechStt implements SttEngine {
  private rec: any = null;
  private cbs = new Set<(r: SttResult) => void>();
  private finalDelivered = false;
  private latest = "";

  static isSupported(): boolean {
    return getRecognitionCtor() !== null;
  }

  onResult(cb: (r: SttResult) => void): () => void {
    this.cbs.add(cb);
    return () => this.cbs.delete(cb);
  }

  private emit(r: SttResult) {
    this.cbs.forEach((cb) => cb(r));
  }

  start(): void {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "ko-KR";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    this.finalDelivered = false;
    this.latest = "";

    rec.onresult = (e: any) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      this.latest = (final || interim).trim();
      if (final) {
        this.finalDelivered = true;
        this.emit({ transcript: final.trim(), isFinal: true });
      } else {
        this.emit({ transcript: this.latest, isFinal: false });
      }
    };

    // Always deliver exactly one final (from a final result OR from end) so the
    // caller never gets stuck in a listening state.
    rec.onend = () => {
      if (!this.finalDelivered) {
        this.finalDelivered = true;
        this.emit({ transcript: this.latest, isFinal: true });
      }
      this.rec = null;
    };
    rec.onerror = () => {
      /* handled by onend */
    };

    this.rec = rec;
    try {
      rec.start();
    } catch {
      /* start() throws if already started — ignore */
    }
  }

  stop(): void {
    try {
      this.rec?.stop();
    } catch {
      /* ignore */
    }
  }
}

export class WebSpeechTts implements TtsEngine {
  static isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!WebSpeechTts.isSupported() || !text.trim()) return resolve();
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "ko-KR";
        u.rate = 1.02;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      } catch {
        resolve();
      }
    });
  }

  cancel(): void {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
  }
}
