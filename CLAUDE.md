# CLAUDE.md — 에이전트/작업자용 안내

이 저장소는 **하나의 백엔드 위에 두 개의 프론트 클라이언트**가 올라가는 픽업(차량) 주문
플랫폼입니다. 작업 전에 아래 구조와 규칙을 먼저 이해하세요.

## 한눈에 보기: 하나의 서버, 두 클라이언트

| 클라이언트 | 라우트 그룹 | 경로 | 대상 | 인증 |
| --- | --- | --- | --- | --- |
| **사장님(Merchant)** | `src/app/(owner)` | `/home` `/orders` `/menu` `/store` `/map` | 매장 사장님(모바일 390×844) | 필요 (Auth.js) |
| **운전자(Driver) 인포테인먼트** | `src/app/(driver)` | `/drive` | 차량 디스플레이(1280×720) | 불필요 |

두 클라이언트는 **동일한 백엔드를 공유**합니다: `src/server/*`(tRPC·Prisma·Auth·SSE)와
`src/app/api/*`(trpc · events(SSE) · ingest · auth). 루트 `src/app/layout.tsx` →
`providers.tsx`가 SessionProvider + tRPC Provider를 두 클라이언트 모두에 주입합니다.

## 기술 스택 (중요: 버전 가정 주의)

- **Next.js 14 (App Router) · React 18 · TypeScript**
  - ⚠️ 운전자 UI는 원래 Next 16/React 19 프로토타입(`~/passth-web`)에서 포팅됐지만,
    이 저장소는 **Next 14 / React 18** 입니다. React 19/Next 16 전용 API를 쓰지 마세요.
- 상태: TanStack Query(서버 상태·낙관적 업데이트) + Zustand(UI 상태)
- DB: PostgreSQL + Prisma / 인증: Auth.js(NextAuth v5) Credentials + JWT
- 실시간: SSE + Postgres `LISTEN/NOTIFY` (`src/server/events.ts`)

## 코드 배치 규칙 (반드시 지킬 것)

두 클라이언트의 코드가 섞이지 않도록 **운전자 코드는 `driver/` 네임스페이스로 격리**돼 있습니다.

```
src/
  app/
    (auth)/login
    (owner)/…                     ← 사장님 화면
    (driver)/drive                ← 운전자 화면 (PhoneFrame 없이 전체화면 캔버스)
    api/*                         ← 공용 서버 (두 클라이언트가 함께 사용)
  server/*                        ← 공용 백엔드 (tRPC·Prisma·Auth·SSE). 클라이언트 구분 없음
  components/
    *.tsx                         ← 사장님 전용 (PhoneFrame·BottomNav·OrderCard 등)
    driver/*                      ← 운전자 전용 (PassthApp·NavRail·TopBar·VoicePanel·screens/*)
  lib/
    *.ts / trpc/*                 ← 사장님/공용 (trpc client, format, hooks)
    driver/*                      ← 운전자 전용 (types · mockData · useFitScale)
  stores/ui.store.ts              ← 사장님 UI 상태(Zustand)
public/assets/gleo-icon.png       ← 운전자 GLEO 음성비서 아이콘
```

- **운전자 작업**: `src/components/driver/`, `src/lib/driver/`, `src/app/(driver)/` 안에서만.
- **사장님 작업**: 위 `driver/` 폴더 밖의 기존 파일.
- **백엔드/API 작업**: `src/server/*`, `src/app/api/*` — 양쪽 클라이언트에 영향 주므로 신중히.
- 전역 스타일 `src/app/globals.css`는 **공용**입니다. 운전자용 항목은 파일 하단
  "Driver … client" 주석 블록(`.num`, `pxpulse/pxblink/pxring/pxpop` 키프레임)에 모아뒀습니다.

## 운전자 상태·행동 계층 (음성/터치 공용)

운전자 앱의 모든 상태와 동작은 **`src/stores/driver.store.ts`(Zustand)** 한 곳에 있습니다.
컴포넌트는 이 스토어를 구독하고 행동 메서드를 호출할 뿐, 자체 `useState`를 두지 않습니다.
→ **터치와 음성이 같은 행동 함수를 공유**합니다. UI 동작을 추가할 땐 여기 메서드부터 추가.

**음성 제어 연결 지점: `src/lib/driver/voice/`** (상세: 같은 폴더의 `README.md`)
- AI/STT 담당자는 `engines.ts`의 3개 인터페이스(`SttEngine`/`TtsEngine`/`IntentParser`)만
  구현하고, 최종 문장을 `runVoiceTurn()`에 넘기면 됩니다. **UI/스토어는 건드리지 않습니다.**
- 음성 명령은 `DriverCommand`(`commands.ts`) 구조로 표현되고 `executeDriverCommand`가
  스토어 행동으로 실행합니다. `getVoiceContext()`가 NLU에 현재 화면·매장·메뉴를 제공합니다.
- 새 음성 동작 추가 순서: store에 행동 메서드 → `DriverCommand` 변형 → `executeDriverCommand`
  스위치에 연결(누락 시 컴파일 에러).

## 현재 상태 & 다음 작업

- 운전자 인포테인먼트(`/drive`)는 **목업 데이터 기반 프로토타입**입니다
  (`src/lib/driver/mockData.ts`). 실제 서버 연동은 아직 안 돼 있습니다.
- 다음 단계 ①(음성): `src/lib/driver/voice/`의 엔진 3종 구현 + `POST /api/voice/intent`
  (LLM tool-use) 추가. 스토어/커맨드 계층은 이미 준비됨.
- 다음 단계 ②(실서버): 운전자 주문 흐름(메뉴→확인→결제→완료)을 **사장님과 동일한
  tRPC/ingest API**에 연결 → 운전자가 넣은 주문이 SSE로 사장님 화면에 실시간 반영.
  참고 진입점: `src/app/api/ingest/orders/route.ts`, `src/server/routers/order.ts`,
  `src/server/events.ts`, 사장님 쪽 실시간 수신 `src/components/RealtimeBridge.tsx`.
  (연동 시 `getVoiceContext()` 내부의 목업을 라이브 쿼리로 교체.)

## 로컬 실행

```bash
npm install
npm run db:up        # Docker Postgres (host 5544)
cp .env.example .env
npm run db:migrate && npm run db:seed
npm run dev          # http://localhost:3000  (사장님) / http://localhost:3000/drive (운전자)
```

데모 로그인(사장님): `owner@pleos.dev` / `pleos1234`

작업 후 `npx tsc --noEmit`로 타입체크, 그리고 두 클라이언트(`/home`·`/drive`)가 모두
정상 렌더되는지 확인하세요.
