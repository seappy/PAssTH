import type { CartLine, Prefs, ScreenId } from "@/lib/driver/types";
import { useDriverStore, type AssistantMessage } from "@/stores/driver.store";

/**
 * DriverCommand — the contract between the voice pipeline and the app.
 *
 * The AI/STT layer (built separately) turns a spoken sentence into one or more
 * of these structured commands, then calls `executeDriverCommand` for each. It
 * never touches React or the store directly — this union is the only surface it
 * needs, and each variant maps 1:1 to a store action (a natural fit for LLM
 * tool/function-calling).
 *
 * Names/prices for `addItem` must be resolved from `getVoiceContext()` (the live
 * store menu) by the parser — e.g. "아메리카노 두 잔" →
 *   [ { type: "addItem", line: { menuId, name:"아메리카노", unitPrice:4500, qty:2 } },
 *     { type: "reviewOrder" } ]
 */
export type DriverCommand =
  | { type: "navigate"; target: ScreenId | "home" | "back" }
  | { type: "openVoice" }
  | { type: "closeVoice" }
  | { type: "selectStore"; storeId: string }
  | { type: "addItem"; line: CartLine }
  | { type: "setLineQty"; index: number; qty: number }
  | { type: "removeLine"; index: number }
  | { type: "clearCart" }
  | { type: "reviewOrder" }
  | { type: "placeOrder" }
  | { type: "goToPickup" }
  | { type: "setCarColor"; index: number }
  | { type: "togglePref"; key: keyof Prefs }
  /** Append an assistant utterance to the dialog log (pair with TTS). */
  | { type: "say"; text: string };

/**
 * Execute a single command against the driver store. Safe to call from outside
 * React (uses `getState()`), e.g. from a voice orchestrator. `placeOrder` runs
 * asynchronously (creates a real order); await it via the store if you need the
 * result before speaking a confirmation.
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
      s.selectStore(cmd.storeId);
      return;
    case "addItem":
      s.addToCart(cmd.line);
      return;
    case "setLineQty":
      s.setLineQty(cmd.index, cmd.qty);
      return;
    case "removeLine":
      s.removeLine(cmd.index);
      return;
    case "clearCart":
      s.clearCart();
      return;
    case "reviewOrder":
      s.reviewOrder();
      return;
    case "placeOrder":
      void s.placeOrder();
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
      // Exhaustiveness guard: a new command variant without a handler is a
      // compile error.
      const _never: never = cmd;
      return _never;
    }
  }
}

/** Convenience for running a batch of commands in order. */
export function executeDriverCommands(cmds: DriverCommand[]): void {
  for (const cmd of cmds) executeDriverCommand(cmd);
}
