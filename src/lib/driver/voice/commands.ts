import type { Prefs, ScreenId } from "@/lib/driver/types";
import { useDriverStore, type AssistantMessage } from "@/stores/driver.store";

/**
 * DriverCommand — the contract between the voice pipeline and the app.
 *
 * The AI/STT layer (built separately) turns a spoken sentence into one or more
 * of these structured commands, then calls `executeDriverCommand` for each.
 * It never touches React components or the store directly — this union is the
 * ONLY surface it needs. Each variant maps 1:1 to a store action, which makes it
 * a natural fit for LLM tool/function-calling (one tool per command variant).
 *
 * Example: "샷 추가한 아메리카노 두 잔 담아줘" →
 *   [ { type: "selectMenu", index: 0 },
 *     { type: "setQuantity", qty: 2 },
 *     { type: "reviewOrder" } ]
 */
export type DriverCommand =
  | { type: "navigate"; target: ScreenId | "home" | "back" }
  | { type: "openVoice" }
  | { type: "closeVoice" }
  | { type: "selectStore"; index: number }
  | { type: "selectMenu"; index: number }
  | { type: "setQuantity"; qty: number }
  | { type: "incQuantity" }
  | { type: "decQuantity" }
  | { type: "reviewOrder" }
  | { type: "placeOrder" }
  | { type: "goToPickup" }
  | { type: "setCarColor"; index: number }
  | { type: "togglePref"; key: keyof Prefs }
  /** Append an assistant utterance to the dialog log (pair with TTS). */
  | { type: "say"; text: string };

/**
 * Execute a single command against the driver store. Safe to call from outside
 * React (uses `getState()`), e.g. from a voice orchestrator.
 */
export function executeDriverCommand(cmd: DriverCommand): void {
  const s = useDriverStore.getState();
  switch (cmd.type) {
    case "navigate":
      if (cmd.target === "home") s.goHome();
      else if (cmd.target === "back") s.back();
      else s.goto(cmd.target);
      return;
    case "openVoice":
      s.toggleVoice(true);
      return;
    case "closeVoice":
      s.toggleVoice(false);
      return;
    case "selectStore":
      s.selectStore(cmd.index);
      return;
    case "selectMenu":
      s.selectMenu(cmd.index);
      return;
    case "setQuantity":
      s.setQty(cmd.qty);
      return;
    case "incQuantity":
      s.incQty();
      return;
    case "decQuantity":
      s.decQty();
      return;
    case "reviewOrder":
      s.reviewOrder();
      return;
    case "placeOrder":
      s.placeOrder();
      return;
    case "goToPickup":
      s.goToPickup();
      return;
    case "setCarColor":
      s.pickColor(cmd.index);
      return;
    case "togglePref":
      s.togglePref(cmd.key);
      return;
    case "say":
      s.pushMessage({ role: "assistant", text: cmd.text } satisfies AssistantMessage);
      return;
    default: {
      // Exhaustiveness guard: adding a command variant without handling it here
      // becomes a compile error.
      const _never: never = cmd;
      return _never;
    }
  }
}

/** Convenience for running a batch of commands in order. */
export function executeDriverCommands(cmds: DriverCommand[]): void {
  for (const cmd of cmds) executeDriverCommand(cmd);
}
