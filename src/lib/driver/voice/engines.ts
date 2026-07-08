import type { DriverCommand } from "./commands";
import type { VoiceContext } from "./context";

/**
 * Swappable engine interfaces for the voice pipeline.
 *
 * The AI/STT developer implements these three. Nothing in the UI depends on a
 * specific vendor — swap Web Speech API for Naver Clova / a head-unit SDK / an
 * LLM endpoint by providing a different implementation (same pattern as the
 * pub/sub seam in `src/server/events.ts`).
 */

/** Speech-to-text. Emits partial + final transcripts. */
export interface SttEngine {
  /** Begin capturing (e.g. on steering-wheel push-to-talk or wake word). */
  start(): void;
  /** Stop capturing. */
  stop(): void;
  /** Register a listener for transcription results. Returns an unsubscribe fn. */
  onResult(cb: (result: SttResult) => void): () => void;
}

export interface SttResult {
  transcript: string;
  /** false = interim hypothesis, true = the user finished speaking. */
  isFinal: boolean;
}

/** Text-to-speech for eyes-free confirmations. */
export interface TtsEngine {
  speak(text: string): Promise<void> | void;
  cancel(): void;
}

/**
 * Natural-language understanding: transcript + app context → commands.
 * Recommended implementation is an LLM with tool-calling, where each tool
 * mirrors a `DriverCommand` variant. Runs server-side (protect the API key) —
 * e.g. behind `POST /api/voice/intent`.
 */
export interface IntentParser {
  parse(input: { transcript: string; context: VoiceContext }): Promise<DriverCommand[]>;
}

export interface VoiceEngines {
  stt?: SttEngine;
  tts?: TtsEngine;
  parser?: IntentParser;
}
