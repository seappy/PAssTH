# PAssTH — 가는 길에, 미리 주문하세요

**PAssTH(패스스루)** 는 운전자가 **차량 인포테인먼트에서 음성·터치로** 경로 주변 매장을
찾아 픽업 주문을 하고, 매장 사장님이 그 주문을 **실시간으로** 받아 처리하는 픽업 주문
플랫폼입니다. "가는 길에 미리 주문 → 도착 시간에 딱 맞춰 픽업"이 핵심 가치입니다.

> **하나의 백엔드(Next.js · tRPC · Prisma · Supabase · SSE) 위에 두 개의 클라이언트**
> — 운전자용 인포테인먼트와 사장님용 관리 앱 — 이 올라가고, 브라우저 음성인식 +
> 별도 배포된 **AI 대화 서버**가 결합해 실제 주문까지 완성됩니다.

| 클라이언트 | 경로 | 대상 | 한 줄 설명 |
| --- | --- | --- | --- |
| 🚗 **운전자 인포테인먼트** | `/drive` | 차량 디스플레이(1280×720) | 음성/터치로 가는 길에 주문 |
| 🏪 **사장님 관리 앱** | `/home` 외 | 매장 사장님(모바일) | 실시간 주문 수신·조리·픽업 관리 |

---

## ✨ 핵심 기능

### 🚗 운전자 (in-car)
- **음성 주문** — "스타벅스 가고 싶어" → "아메리카노 한 잔" → "결제" 한 번의 대화로 주문 완료
  (브라우저 음성인식/합성 + AI 대화 서버, 아래 [AI 음성 주문](#-ai-음성-주문-구조) 참조)
- **경로 주변 매장 탐색** — Kakao 길찾기 기반 실제 **도착 ETA·거리** 로 정렬, 스폰서(광고) 추천
- **리스트 / 지도 보기 전환** — Kakao 지도에 매장 핀, 탭하면 매장 정보 카드
- **"가는 길에" 픽업 타임라인** — *내 도착 예정 시각* vs *조리 완료 예정 시각* 을 나란히 보여주고
  "도착에 딱 맞춰 준비돼요 / N분 대기" 를 판정 (픽업의 핵심 UX)
- 메뉴·옵션 선택 → 결제(Pleos Pay) → **실시간 픽업 진행**(수락→준비중→완료) → 별점·후기

### 🏪 사장님 (merchant)
- **실시간 주문 수신** — 운전자/음성/외부 주문이 리로드 없이 즉시 화면에 뜸(도착 알림 오버레이)
- 주문 상태 진행(수락·조리시간 조절·완료), 메뉴 관리(사진 업로드 · 품절 토글 · CRUD),
  매장 관리(영업·픽업·혼잡도·영업시간), **Kakao 실시간 도착 지도**

### 🔗 둘을 잇는 것
운전자가 (음성이든 터치든) 넣은 주문은 **같은 Supabase DB**에 저장되고, Postgres
`LISTEN/NOTIFY` → SSE 로 **사장님 화면에 실시간 반영**됩니다.

---

## 🎬 데모 시나리오 (음성 주문 → 사장님 접수)

```
운전자: (마이크) "스타벅스 가고 싶어"
 GLEO : "스타벅스 판교점이 3분으로 가장 빨라요. 이 매장으로 주문할까요?"   [응 / 다른 매장]
운전자: "응"
 GLEO : "어떤 메뉴로 드릴까요?"                                          [아이스 아메리카노 / …]
운전자: "아이스 아메리카노"
 GLEO : "담았어요. 결제할까요?"                                          [결제 / 메뉴 더]
운전자: "결제"
 GLEO : "주문이 매장에 전달됐어요. 도착 시간에 맞춰 준비할게요."
   ↓  (같은 순간)
사장님 /orders 화면 : 🔔 신규 주문 #A-###  아이스 아메리카노 · 12가 3456  — 리로드 없이 등장
```

---

## 🧠 시스템 구성

```
┌───────────────────────── 브라우저 (차량 / 사장님) ─────────────────────────┐
│  운전자 /drive          사장님 /home·/orders·/menu·/store·/map            │
│  · Web Speech STT/TTS   · 실시간 주문 리스트 (SSE 구독)                    │
└───────────────┬───────────────────────────────┬──────────────────────────┘
                │ tRPC / fetch                   │ SSE (/api/events)
┌───────────────▼───────────────────────────────▼──────────────────────────┐
│                      Next.js 14 (App Router) — 단일 서버                    │
│  tRPC 라우터(driver·order·menu·store·category·sim)                         │
│  Route Handlers: /api/voice/turn · /api/ingest/orders · /api/kakao/*       │
│  events.ts (Postgres LISTEN/NOTIFY ↔ in-process EventEmitter ↔ SSE)        │
└───────┬───────────────────────┬───────────────────────┬───────────────────┘
        │ Prisma                │ HTTP                   │ HTTP
┌───────▼────────┐   ┌──────────▼───────────┐   ┌────────▼─────────┐
│ Supabase       │   │ AI 음성 서버 (별도)   │   │ Kakao Local /    │
│ PostgreSQL     │   │ FastAPI · GPT · 대화  │   │ Mobility (길찾기)│
│ + Storage(사진)│   │ (Railway 배포)        │   │ ETA·거리         │
└────────────────┘   └──────────────────────┘   └──────────────────┘
```

핵심 설계 원칙: **터치와 음성이 같은 "행동 계층"을 공유**합니다. 운전자 앱의 모든 동작은
`src/stores/driver.store.ts`(Zustand)의 액션으로 존재하고, 터치 UI도 음성 파이프라인도
동일한 액션을 호출합니다.

---

## 🎙 AI 음성 주문 구조

음성 파이프라인은 **역할이 명확히 분리**돼 있어, 각 부분을 독립적으로 교체할 수 있습니다.

| 단계 | 위치 | 구현 |
| --- | --- | --- |
| STT (음성→텍스트) | 브라우저 | Web Speech API (`WebSpeechStt`) |
| **대화·의도 이해** | AI 서버(Python) | FastAPI `POST /order/turn` — 매장 검색·메뉴·주문을 관장 |
| 프록시 | Next 서버 | `/api/voice/turn` — 서버 간 중계 + **완료 주문을 Supabase로 브리지** |
| 실행/렌더 | 브라우저 | 응답(`speech_text`·`quick_actions`·`order_summary`)을 대화 UI로 |
| TTS (텍스트→음성) | 브라우저 | Web Speech API (`WebSpeechTts`) |

- AI 서버는 별도 저장소/배포(팀 협업). 앱은 `VOICE_SERVICE_URL` 로만 연결합니다.
- 대화가 `completed` 되면 `/api/voice/turn`이 주문을 **매장 DB에 미러링**해 사장님 화면에
  실시간으로 뜨게 합니다(`bridgeOrder`).
- 관련 코드: `src/lib/driver/voice/*`, `src/components/driver/useVoiceAssistant.ts`,
  `src/app/api/voice/turn/route.ts`. (계약 문서: `src/lib/driver/voice/README.md`)

---

## 🛠 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프론트 | **Next.js 14** (App Router) · TypeScript · Tailwind CSS v4 |
| 상태 | TanStack Query(서버 상태) + **Zustand**(운전자 행동/UI 상태) |
| API | **tRPC**(타입 안전) · Next Route Handlers |
| DB | **Supabase PostgreSQL** + Prisma ORM · **Supabase Storage**(메뉴/매장 사진) |
| 인증 | Auth.js(NextAuth v5) Credentials + JWT 세션 |
| 실시간 | **SSE + Postgres `LISTEN/NOTIFY`** (프로세스/앱 경계를 넘는 이벤트) |
| 지도/길찾기 | **Kakao Maps** + Kakao Mobility(도착 ETA·거리) |
| 음성 | 브라우저 **Web Speech API**(STT/TTS) + 외부 AI FastAPI(대화) |

---

## 🚀 로컬 실행

### 사전 준비
- Node 18+
- **Supabase 프로젝트**(권장) 또는 로컬 Docker Postgres

### 순서

```bash
npm install
cp .env.example .env          # 아래 환경변수 채우기

# DB — 택1
#  (a) Supabase: .env에 DATABASE_URL/DIRECT_URL 넣고
npx prisma migrate deploy && npm run db:seed
#  (b) 로컬 Docker:
npm run db:up && npm run db:migrate && npm run db:seed

npm run dev                   # http://localhost:3000
```

접속:
- 🚗 **운전자**: http://localhost:3000/drive  (로그인 불필요)
- 🏪 **사장님**: http://localhost:3000  → 로그인 후 `/home`

데모 로그인(사장님): `owner@pleos.dev` / `pleos1234`

> 음성 주문은 `VOICE_SERVICE_URL`(AI FastAPI)이 설정돼 있어야 완전 동작합니다. 없어도
> 터치 주문·실시간 수신은 그대로 동작합니다. (Web Speech STT는 Chrome + 마이크 권한 필요,
> 마이크가 없으면 패널의 텍스트 입력으로 테스트 가능)

---

## 🔑 환경변수 (`.env.example` 참고)

| 변수 | 설명 |
| --- | --- |
| `DATABASE_URL` / `DIRECT_URL` | Supabase 풀링(6543) / 세션(5432) 연결. 세션 연결은 마이그레이션 + `LISTEN/NOTIFY`용 |
| `AUTH_SECRET` | Auth.js 세션 시크릿 (`openssl rand -base64 32`) |
| `VOICE_SERVICE_URL` | AI 음성 FastAPI 주소 (예: Railway 배포 URL) |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | Kakao Maps JS 키(지도). 없으면 목업 지도로 폴백 |
| `KAKAO_REST_API_KEY` | Kakao 길찾기(ETA) REST 키 |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Storage 사진 업로드용(서버 전용) |
| `INGEST_API_KEY` | 외부 주문 인제스트 API 키 |

---

## ⚡ 실시간 파이프라인

```
주문 생성(터치 · 음성 브리지 · 인제스트)
  → createOrder() → pg_notify('pleos_events', …)          [공유 Supabase]
  → 전용 LISTEN 커넥션(src/server/events.ts) 수신
  → in-process EventEmitter
  → /api/events (SSE, 매장별 필터)
  → 클라이언트 RealtimeBridge → 쿼리 무효화 + 도착 알림
```

NOTIFY가 공유 DB를 경유하므로 **다른 프로세스/앱(음성 브리지·외부 주문)이 넣은 주문도**
사장님 화면이 즉시 수신합니다.

### 주문 상태 흐름
```
new ─accept→ accepted ─advance→ preparing ─advance→ ready ─advance→ done
  └─reject→ rejected
```

### 외부 주문 인제스트(참고)
```bash
curl -X POST http://localhost:3000/api/ingest/orders \
  -H "content-type: application/json" -H "x-store-key: $INGEST_API_KEY" \
  -d '{"items":[{"name":"딸기라떼","price":6000,"quantity":1}],
       "car":{"number":"11가 2222","color":"파랑"}}'
```

---

## 📁 폴더 구조

```
prisma/                     schema.prisma · seed.ts · migrations/
src/
  app/
    (auth)/login                          사장님 로그인
    (owner)/{home,orders,menu,store,map}  ← 사장님 클라이언트
    (driver)/drive                        ← 운전자 인포테인먼트
    api/
      trpc · events(SSE) · ingest · auth  두 클라이언트 공용
      voice/turn                          AI 음성 프록시 + 주문 브리지
      kakao/directions                    Kakao 길찾기 ETA
      menu/upload · store/upload          Supabase Storage 사진 업로드
  server/
    events.ts                             LISTEN/NOTIFY ↔ SSE
    routers/{driver,order,menu,store,category,sim}
    services/{driver,order,menu,store,category,kakao-route,sim}
  components/
    (사장님)  PhoneFrame·BottomNav·OrderCard·MenuCard·map/KakaoMap 등
    driver/   PassthApp·NavRail·TopBar·VoicePanel·DriverMap·StoresMap·screens/*
  lib/driver/ api · config · format · types · useFitScale · voice/*
  stores/     ui.store · driver.store (운전자 행동 계층)
public/assets/ logo.png · name.png · gleo-icon.png
```

운전자 코드는 `src/components/driver/` · `src/lib/driver/` 로 네임스페이스를 분리해
사장님 코드와 섞이지 않습니다.

---

## ☁️ 배포

- **DB**: Supabase(PostgreSQL). LISTEN/NOTIFY는 **세션 풀러(5432)** 로 연결해야 동작.
- **앱**: SSE 상주 연결 때문에 서버리스(Vercel)보다 **상주 Node 런타임(Railway/Fly/Render)**
  권장. 저장소에 `Dockerfile` + 상세 가이드 `DEPLOY.md` 포함.
- **AI 음성 서버**: 별도 FastAPI(Railway) — 앱은 `VOICE_SERVICE_URL` 로 연결.

## 📜 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` / `build` / `start` | 개발 / 프로덕션 빌드 / 실행 |
| `npm run db:migrate` / `db:seed` / `db:reset` | Prisma 마이그레이션 / 시드 / 리셋 |
| `npm run db:up` / `db:down` / `db:studio` | 로컬 Postgres 기동·종료 / Prisma Studio |

---

<p align="center"><b>PAssTH</b> · 가는 길에, 미리 주문하세요 🚗</p>
