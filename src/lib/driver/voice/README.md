# 음성 제어 연결 지점 (Voice control seam)

이 폴더는 **음성으로 운전자 앱 전체를 제어**하기 위한 계약(contract)입니다.
AI/STT 담당자는 **UI나 스토어를 직접 건드릴 필요 없이** 여기에 정의된 인터페이스만
구현하면 됩니다. 터치 버튼과 음성이 **똑같은 행동 함수**(`src/stores/driver.store.ts`)를
호출하도록 이미 배선돼 있습니다.

## 그림

```
[마이크/PTT] → SttEngine → (최종 문장) → runVoiceTurn()
                                            │
                        getVoiceContext() ──┤  현재 화면·매장·메뉴 목록
                                            ▼
                                       IntentParser.parse()   ← 여기에 LLM(tool-use)
                                            │  DriverCommand[]
                                            ▼
                                    executeDriverCommands()   → driver.store 행동 실행
                                            │
                                       TtsEngine.speak()      ← "say" 명령 읽어주기
```

## 담당자가 구현할 것 — 딱 3개 (`engines.ts`)

1. **`SttEngine`** — 음성 → 텍스트 (Web Speech API / Naver Clova / 헤드유닛 SDK 등).
2. **`IntentParser`** — 텍스트 + 컨텍스트 → `DriverCommand[]`.
   - 권장: LLM 함수호출(tool-use). **command 변형 1개 = tool 1개**로 매핑됩니다.
   - API 키 보호를 위해 서버 라우트에서 호출하세요 (예: `POST /api/voice/intent`).
3. **`TtsEngine`** — 텍스트 → 음성 (결제 확인 등 eyes-free 안내).

세 개 모두 **교체 가능**하도록 인터페이스 뒤에 있습니다. 프로토타입은 Web Speech,
실차는 클라우드/네이티브로 스왑하세요.

## 연결 방법

```ts
import { runVoiceTurn } from "@/lib/driver/voice";

// STT가 최종 문장을 뱉을 때:
stt.onResult(async ({ transcript, isFinal }) => {
  if (!isFinal) return;
  await runVoiceTurn(transcript, { parser: myLlmParser, tts: myTts });
});
```

`runVoiceTurn`이 컨텍스트 수집 → 파싱 → 실행 → TTS까지 다 해줍니다. 배선을 직접
제어하고 싶으면 `getVoiceContext()` + `executeDriverCommand()`를 개별로 써도 됩니다.

## 명령 목록 (`commands.ts`의 `DriverCommand`)

`navigate` · `openVoice` / `closeVoice` · `selectStore(storeId)` ·
`addItem(line)` · `setLineQty(index,qty)` / `removeLine(index)` / `clearCart` ·
`reviewOrder` · `placeOrder` · `goToPickup` · `setCarColor(index)` ·
`togglePref(key)` · `say(text)`

- `addItem`의 `line`은 **`getVoiceContext()`의 라이브 메뉴에서 이름→menuId/가격을 해석**해
  채웁니다: `{ menuId, name, unitPrice, qty, optionsText? }`.
- `selectStore`/`placeOrder`도 실데이터 기반 — 스토어 선택은 storeId, 결제는 실제 주문 생성.

예) "샷 추가한 아메리카노 두 잔 담아줘" (아메리카노 menuId=`m1`, 4500 + 샷 500) →
```
[ { type:"addItem", line:{ menuId:"m1", name:"아메리카노", unitPrice:5000, qty:2, optionsText:"샷 추가" } },
  { type:"reviewOrder" },
  { type:"say", text:"샷 추가 아메리카노 2잔, 10,000원. 결제할까요?" } ]
```

## 규칙

- **UI/스토어를 직접 수정하지 말 것.** 새 동작이 필요하면 먼저 store에 행동 메서드를
  추가하고 → `DriverCommand`에 변형을 추가하고 → `executeDriverCommand`에서 연결하세요.
  (스위치문에 exhaustiveness 가드가 있어 빠뜨리면 컴파일 에러가 납니다.)
- 결제(`placeOrder`)는 **반드시 TTS 확인 후** 실행하세요 (운전 중 안전).
- 매장/메뉴 목록은 지금 목업(`mockData.ts`)입니다. 실제 tRPC API 연동 시
  `getVoiceContext()` 내부만 라이브 쿼리로 바꾸면 됩니다 (shape 동일).
