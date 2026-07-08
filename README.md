# Pleos Pickup — 사장님(Merchant) 웹앱

픽업(차량) 주문 매장의 사장님이 실시간으로 주문을 받고 처리하는 풀스택 웹앱입니다.
Toss 스타일의 모바일 UI(프로토타입 `Pleos Pickup Merchant.dc.html`)를 프로덕션 수준으로
구현했습니다. **핵심은 실시간 주문 수신** — 별도의 고객/주문 앱이 넣은 주문이 사장님
화면에 리로드 없이 즉시 표시됩니다.

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

홈(통계·실시간 도착·신규/진행/최근 주문) · 주문 목록(상태 필터) · 주문 상세(큰 ETA·차량·
상품·상태 진행 CTA) · 메뉴 관리(분류 필터/추가·삭제, CRUD, 품절 토글, FAB) · 매장 관리
(영업·픽업·혼잡도·영업시간·정기휴무) · 실시간 도착 지도 · 차량 도착 알림 오버레이.

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

### 데모 로그인

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
  app/               (auth)/login · (owner)/{home,orders,menu,store,map} · api/*
  server/            db · auth · trpc · events · services/* · routers/*
  components/        PhoneFrame·BottomNav·Toggle·OrderCard·MenuCard·ArrivalAlert 등
  lib/               trpc client/provider · format · hooks · useLiveClock
  stores/            ui.store (Zustand)
```

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
