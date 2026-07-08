import { executeDriverCommands, type DriverCommand } from "./commands";
import { getVoiceContext } from "./context";
import type { IntentParser, TtsEngine } from "./engines";
import { useDriverStore } from "@/stores/driver.store";

/**
 * Reference "glue" that turns one finished utterance into app actions. The
 * AI/STT developer normally only has to implement the engines (STT/TTS/parser)
 * and feed final transcripts here — this wiring (context → parse → execute →
 * speak) is already done and goes through the same store actions as touch.
 *
 * Flow:
 *   transcript → log user message → parser.parse(transcript, context)
 *             → executeDriverCommands → speak any `say` commands via TTS
 */
export async function runVoiceTurn(
  transcript: string,
  deps: { parser: IntentParser; tts?: TtsEngine }
): Promise<DriverCommand[]> {
  const store = useDriverStore.getState();
  const clean = transcript.trim();
  if (!clean) return [];

  store.pushMessage({ role: "user", text: clean });

  const context = await getVoiceContext();
  const commands = await deps.parser.parse({ transcript: clean, context });

  // Execute first so the UI reflects the result, then read back any spoken
  // confirmations. `say` commands are also appended to the dialog log by
  // executeDriverCommand, so we only need to voice them here.
  executeDriverCommands(commands);

  if (deps.tts) {
    for (const cmd of commands) {
      if (cmd.type === "say") await deps.tts.speak(cmd.text);
    }
  }

  return commands;
}
