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

## 운전자 데이터·상태·행동 계층 (음성/터치 공용)

운전자 앱은 이제 **실데이터 연동**입니다 (목업 없음).

- **읽기**: `trpc.driver.*` (공개 라우터 `src/server/routers/driver.ts` → `driver.service.ts`).
  화면 컴포넌트가 `trpc.driver.stores` / `trpc.driver.storeMenu` / `trpc.driver.order`를
  직접 쿼리합니다. 매장 거리·ETA는 좌표로 계산, 영업시간은 매장 필드에서 도출.
- **쓰기(주문)**: `src/stores/driver.store.ts`의 `placeOrder()`가 바닐라 tRPC 클라이언트
  (`src/lib/driver/api.ts`)로 `driver.createOrder`를 호출 → 사장님과 동일한 `createOrder`
  서비스 → `notify()`로 **사장님 화면에 실시간 표시**. (검증: 운전자 결제 → `#A-###` 생성 →
  `/orders`에 신규 주문으로 노출.)
- **상태/행동**: 모든 상태·동작은 `driver.store.ts` 한 곳. 컴포넌트는 구독+행동 호출만.
  → **터치와 음성이 같은 행동 함수를 공유** (`selectStore`·`addToCart`·`reviewOrder`·
  `placeOrder` 등). UI 동작 추가 시 여기 메서드부터.
- 운전자 API는 **공개(publicProcedure)** — 차량엔 사장님 세션이 없음. 프로덕션 전
  차량/사용자 신원 + rate limit로 하드닝 필요(`driver.ts` 주석 참고).

**음성 제어 연결 지점: `src/lib/driver/voice/`** (상세: 같은 폴더의 `README.md`)
- AI/STT 담당자는 `engines.ts`의 3개 인터페이스(`SttEngine`/`TtsEngine`/`IntentParser`)만
  구현하고, 최종 문장을 `runVoiceTurn()`에 넘기면 됩니다. **UI/스토어는 건드리지 않습니다.**
- 음성 명령은 `DriverCommand`(`commands.ts`) 구조 → `executeDriverCommand`가 스토어 행동으로
  실행. `getVoiceContext()`는 **라이브 매장/메뉴**를 async로 제공(이름→ID/가격 해석용).
- 새 음성 동작 추가 순서: store에 행동 메서드 → `DriverCommand` 변형 → `executeDriverCommand`
  스위치에 연결(누락 시 컴파일 에러).

## 다음 작업

- **음성 구현**: `src/lib/driver/voice/`의 엔진 3종 구현 + `POST /api/voice/intent`
  (LLM tool-use, command 변형당 tool 1개). 스토어/커맨드/컨텍스트 계층은 이미 준비됨.
- **매장 다양화**: 시드 `STORE_SPECS`에 판교 인근 실제 카페 11곳(카페몬지 판교점 포함).
  시드 실행 시 목록에 맞춰 매장·메뉴(카페몬지 기준) 동기화. 사장님은 홈 매장 전환(`User.activeStoreId`).
- **운전자 실시간 상태**: 픽업 화면은 현재 4초 폴링(`trpc.driver.order` refetchInterval).
  원하면 SSE(주문별)로 승격 가능.

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
