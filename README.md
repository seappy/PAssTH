# Pleos Pickup — 하나의 서버, 두 개의 클라이언트

픽업(차량) 주문 플랫폼입니다. **하나의 백엔드(tRPC · Prisma · Auth.js · SSE)** 위에
두 개의 클라이언트가 올라갑니다.

| 클라이언트 | 경로 | 대상 | 설명 |
| --- | --- | --- | --- |
| **사장님(Merchant)** | `/home`·`/orders`·`/menu`·`/store`·`/map` | 매장 사장님(모바일) | 실시간 주문 수신·처리 |
| **운전자(Driver) 인포테인먼트** | `/drive` | 차량 인포테인먼트(1280×720) | 가는 길에 미리 주문 |

**핵심은 실시간 주문 수신** — 운전자(또는 별도 고객/주문 앱)가 넣은 주문이 사장님
화면에 리로드 없이 즉시 표시됩니다. 두 클라이언트는 동일한 tRPC/Prisma 타입과
SSE 실시간 파이프라인을 공유하므로, 운전자 앱이 지금의 목업 데이터를 실제 주문 API로
바꾸면 그대로 사장님 화면과 연결됩니다.

Toss 스타일 UI를 프로덕션 수준으로 구현했습니다(사장님 프로토타입
`Pleos Pickup Merchant.dc.html`, 운전자 인포테인먼트는 `passth-web` 프로토타입에서 포팅).

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프론트 | Next.js 14 (App Router), TypeScript, Tailwind CSS v4 |
| 상태 | TanStack Query(서버 상태, 낙관적 업데이트) + Zustand(UI 상태) |
| API | tRPC (타입 안전) · Next Route Handlers |
| DB | PostgreSQL + Prisma ORM |
| 인증 | Auth.js(NextAuth v5) Credentials(이메일+비밀번호, JWT 세션) |
| 실시간 | **SSE + Postgres `LISTEN/NOTIFY`** — 프로세스/앱 경계를 넘는 이벤트 |

## 화면

### 사장님(Merchant) — `src/app/(owner)`
홈(통계·실시간 도착·신규/진행/최근 주문) · 주문 목록(상태 필터) · 주문 상세(큰 ETA·차량·
상품·상태 진행 CTA) · 메뉴 관리(분류 필터/추가·삭제, CRUD, 품절 토글, FAB) · 매장 관리
(영업·픽업·혼잡도·영업시간·정기휴무) · 실시간 도착 지도 · 차량 도착 알림 오버레이.

### 운전자(Driver) 인포테인먼트 — `src/app/(driver)/drive`
차량 디스플레이용 1280×720 캔버스(뷰포트에 맞춰 자동 스케일). 홈(경로 주변 추천·최근 주문)
· 가는 길에 주문(경로순 매장) · 메뉴/옵션 · 주문 확인/결제(Pleos Pay) · 주문 완료(ETA 전달)
· 픽업 진행(지도·남은 시간·상태 진행) · 설정(차량 정보·즐겨찾기) · GLEO 음성 주문 패널.
현재는 목업 데이터 기반 프로토타입이며, 사장님 앱과 같은 tRPC API에 연결할 준비가 돼 있습니다.

## 로컬 실행

### 사전 준비
- Node 18+ / Docker

### 순서

```bash
# 1) 의존성
npm install

# 2) 로컬 Postgres (docker-compose, 호스트 포트 5544)
npm run db:up

# 3) 환경변수
cp .env.example .env      # 값은 그대로 로컬용으로 동작합니다

# 4) 스키마 마이그레이션 + 시드(프로토타입 목업 데이터)
npm run db:migrate        # prisma migrate dev
npm run db:seed           # 사장님/매장/분류3/메뉴6/주문5 시딩

# 5) 개발 서버
npm run dev               # http://localhost:3000
```

### 접속

- **사장님(Merchant)**: http://localhost:3000 → 로그인 후 `/home`
- **운전자(Driver) 인포테인먼트**: http://localhost:3000/drive (로그인 불필요)

### 데모 로그인 (사장님)

```
이메일   owner@pleos.dev
비밀번호 pleos1234
```

## 실시간 주문 데모

두 가지 방법으로 신규 주문을 밀어넣어, 사장님 화면에 **리로드 없이** 즉시 뜨는 것을
확인할 수 있습니다.

### ① 앱 내 버튼
`매장` 탭 → **데모 도구 → 가짜 주문 생성**. 랜덤 주문이 생성되고 홈/주문 목록에 즉시 반영,
도착 알림 오버레이가 뜹니다.

### ② 외부 주문 앱 (인제스트 API)
별도의 로컬 고객/주문 앱이 이 엔드포인트로 주문을 전송하면 됩니다. 공유 Postgres를
경유한 `NOTIFY`가 SSE로 사장님 화면에 전달됩니다.

```bash
curl -X POST http://localhost:3000/api/ingest/orders \
  -H "content-type: application/json" \
  -H "x-store-key: pleos-dev-ingest-key" \
  -d '{
    "items": [
      { "name": "딸기라떼", "price": 6000, "quantity": 1, "optionsText": "ICE · 휘핑 추가" }
    ],
    "car": { "number": "11가 2222", "color": "파랑", "model": "아이오닉", "type": "승용" },
    "distanceM": 120,
    "etaSeconds": 95,
    "customerMemo": "조수석 창문으로 전달 부탁드려요"
  }'
```

- 인증: `x-store-key` 헤더 = `INGEST_API_KEY`(.env).
- `storeId` 생략 시 첫(단일) 매장으로 들어갑니다.
- 응답: `{ ok, id, orderNo, storeId }`.

## 주문 상태 흐름

```
new ──accept──▶ accepted ──advance──▶ preparing ──advance──▶ ready ──advance──▶ done
  └─reject──▶ rejected
```

수락(조리 대기)과 조리 시작을 명시적으로 분리했습니다. 상태 변경/조리시간 조절/품절
토글은 **낙관적 업데이트**로 즉시 반영 후 서버로 확정됩니다.

## 아키텍처 메모

- **타입 공유**: Prisma 모델 → tRPC 라우터 → 프론트가 하나의 타입 소스를 공유
  (`inferRouterOutputs`). 나중에 고객용 앱이 같은 API를 재사용할 수 있습니다.
- **실시간 파이프라인**: 뮤테이션/인제스트 → `pg_notify('pleos_events', …)` →
  전용 LISTEN 커넥션(`src/server/events.ts`)이 수신 → 프로세스 내 EventEmitter →
  `/api/events`(SSE, 매장별 필터) → 클라이언트 `RealtimeBridge`가 쿼리 무효화 +
  도착 알림. NOTIFY가 공유 DB를 경유하므로 **다른 프로세스(외부 주문 앱)의 주문도 수신**.
- **인증**: Credentials + JWT 세션(어댑터 테이블 불필요). 서버 프로시저는
  `protectedProcedure`/`storeProcedure`로 로그인·매장 소유를 보장.

## 폴더 구조

```
prisma/              schema.prisma · seed.ts
src/
  app/
    (auth)/login              사장님 로그인
    (owner)/{home,orders,menu,store,map}   ← 사장님 클라이언트
    (driver)/drive            ← 운전자 인포테인먼트 클라이언트
    api/*                     trpc · events(SSE) · ingest · auth  (두 클라이언트 공용 서버)
  server/            db · auth · trpc · events · services/* · routers/*   (공용 백엔드)
  components/
    (사장님)          PhoneFrame·BottomNav·Toggle·OrderCard·MenuCard·ArrivalAlert 등
    driver/           PassthApp·NavRail·TopBar·VoicePanel·Icons·Placeholder·screens/*
  lib/
    (사장님)          trpc client/provider · format · hooks · useLiveClock
    driver/           types · mockData · useFitScale
  stores/            ui.store (Zustand)
public/assets/       gleo-icon.png (운전자 GLEO 음성비서 아이콘)
```

두 클라이언트는 `src/server/*`(tRPC·Prisma·Auth·SSE)와 `src/app/api/*`를 공유합니다.
운전자 UI 코드는 `src/components/driver/`·`src/lib/driver/`로 네임스페이스를 분리해
사장님 코드와 섞이지 않습니다.

## 배포 참고 (Vercel + Supabase/Neon)

- Vercel serverless는 장수명 SSE 연결과 프로세스 상주 LISTEN에 제약이 있습니다.
  프로덕션에서는 (a) SSE/이벤트 처리를 Node 상주 런타임(예: Fly.io, Railway, 또는
  Vercel의 장수명 함수 대안)에 두거나, (b) **Supabase Realtime 채널**로 교체하는 것을
  권장합니다. `src/server/events.ts`의 pub/sub 인터페이스(`notify`/`subscribe`)만
  바꾸면 나머지 코드는 그대로 재사용됩니다.
- 지도는 목업 좌표 기반(`src/components/map/LiveMap.tsx`). Mapbox 등으로 교체 시
  마커 데이터(거리/좌표) 구조는 그대로 두고 위치 계산만 바꾸면 됩니다.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` / `start` | 프로덕션 빌드/실행 |
| `npm run lint` | ESLint |
| `npm run db:up` / `db:down` | 로컬 Postgres 기동/종료 |
| `npm run db:migrate` | Prisma 마이그레이션 |
| `npm run db:seed` | 시드 데이터 |
| `npm run db:reset` | DB 리셋 + 재마이그레이션 + 시드 |
| `npm run db:studio` | Prisma Studio |
