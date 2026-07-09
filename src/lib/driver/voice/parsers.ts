import type { DriverCommand } from "./commands";
import type { VoiceContext } from "./context";
import type { IntentParser } from "./engines";

/**
 * HttpIntentParser — production path. Forwards {transcript, context} to the
 * server proxy (`/api/voice/intent`), which calls the Python AI service. Returns
 * the resolved DriverCommand[].
 */
export class HttpIntentParser implements IntentParser {
  constructor(private url = "/api/voice/intent") {}

  async parse(input: { transcript: string; context: VoiceContext }): Promise<DriverCommand[]> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`voice intent failed: ${res.status}`);
    const data = (await res.json()) as { commands?: DriverCommand[] };
    return data.commands ?? [];
  }
}

/**
 * MockIntentParser — DEV ONLY, temporary. A tiny ko-KR rule parser so the full
 * voice loop (STT → parse → execute → TTS) works before the Python AI is ready.
 * Replace with HttpIntentParser once the service lands. Not meant to be robust.
 */
const QTY_WORDS: Record<string, number> = {
  한: 1, 하나: 1, 두: 2, 둘: 2, 세: 3, 셋: 3, 네: 4, 넷: 4, 다섯: 5,
};

function parseQty(text: string): number {
  const digit = text.match(/(\d+)\s*(잔|개|것)?/);
  if (digit) return Math.min(20, Math.max(1, parseInt(digit[1], 10)));
  for (const [w, n] of Object.entries(QTY_WORDS)) {
    if (text.includes(`${w} `) || text.includes(`${w}잔`) || text.includes(`${w}개`)) return n;
  }
  return 1;
}

export class MockIntentParser implements IntentParser {
  async parse({ transcript, context }: { transcript: string; context: VoiceContext }): Promise<DriverCommand[]> {
    const t = transcript.replace(/\s+/g, " ").trim();
    const norm = t.replace(/\s+/g, "");

    // 결제 / 주문 확정
    if (/(결제|주문\s*확정|주문할|주문해|보내줘|확정)/.test(t)) {
      if (context.cart.length === 0) return [{ type: "say", text: "장바구니가 비어 있어요. 먼저 메뉴를 담아주세요." }];
      return [
        { type: "reviewOrder" },
        { type: "placeOrder" },
        { type: "say", text: "주문을 매장에 전달했어요. 도착 시간에 맞춰 준비할게요." },
      ];
    }

    // 장바구니 / 주문 확인
    if (/(장바구니|주문\s*확인|확인해)/.test(t)) {
      return [{ type: "reviewOrder" }, { type: "say", text: "주문 내역을 보여드릴게요." }];
    }

    // 홈으로
    if (/(홈|처음|메인)/.test(t)) {
      return [{ type: "navigate", target: "home" }, { type: "say", text: "홈으로 이동할게요." }];
    }

    // 매장 선택 (이름 매칭)
    const store = context.stores.find((s) => norm.includes(s.name.replace(/\s+/g, "")));
    if (store && /(매장|픽업|가게|점|주문)/.test(t) && !context.menu.some((m) => norm.includes(m.name.replace(/\s+/g, "")))) {
      return [{ type: "selectStore", storeId: store.id }, { type: "say", text: `${store.name}을(를) 선택했어요. 메뉴를 말씀해 주세요.` }];
    }

    // 메뉴 담기 (이름 매칭 → 수량)
    const menu = context.menu.find((m) => !m.soldOut && norm.includes(m.name.replace(/\s+/g, "")));
    if (menu) {
      const qty = parseQty(t);
      return [
        { type: "addItem", line: { menuId: menu.id, name: menu.name, unitPrice: menu.price, qty } },
        { type: "say", text: `${menu.name} ${qty}잔 담았어요. 더 필요하신가요, 아니면 결제할까요?` },
      ];
    }

    // 매장 미선택 상태에서 메뉴를 말한 경우
    if (!context.selectedStoreId && context.stores.length > 0) {
      return [{ type: "say", text: "먼저 매장을 선택해 주세요. 예를 들어 ‘판교 1호점 주문’처럼요." }];
    }

    return [{ type: "say", text: "잘 못 알아들었어요. ‘아메리카노 두 잔’이나 ‘결제해줘’처럼 말씀해 주세요." }];
  }
}
