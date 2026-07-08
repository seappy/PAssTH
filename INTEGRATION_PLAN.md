# 통합 & 데모 계획 — 사장님(Merchant) ↔ 운전자(Driver)

> 목표: 운전자 인포테인먼트(`/drive`)에서 넣은 주문이 사장님 앱(`/home`)에
> **리로드 없이 실시간으로** 뜨는 걸 시연. 두 클라이언트가 한 백엔드/DB를 공유.

## 현재 상태 (2026-07-08)

한 레포 · 한 백엔드 위 두 클라이언트. 친구가 운전자 쪽 **연동과 배포 셋업까지 이미 구현**해서,
핵심 파이프라인은 사실상 완성 상태입니다.

- **사장님**: `src/app/(owner)/*` — 실시간 주문 수신·처리 (완성)
- **운전자**: `src/app/(driver)/drive` — 매장/메뉴 조회·주문·픽업추적 (친구가 백엔드 연결 완료)
- **연동 동작 원리**:
  `trpc.driver.createOrder` → `placeDriverOrder()`(`src/server/services/driver.service.ts`)
  → **공유 `createOrder()`**(`src/server/services/order.service.ts`) → `pg_notify`
  → 사장님 SSE(`/api/events`) → `RealtimeBridge` 실시간 반영 + 도착 알림.
- **운전자 상태 추적**: `PickupScreen`이 `trpc.driver.order`를 4초 폴링(`refetchInterval`)해서
  사장님이 바꾼 상태(수락→준비완료→픽업완료)를 따라 표시.
- **배포 준비**: `Dockerfile`, standalone 빌드, `DEPLOY.md`, Prisma `directUrl`,
  Supabase 풀링(`DATABASE_URL` pooler / `DIRECT_URL` session) 셋업 완료.

### 로컬 반영 완료
- `.env`에 `DIRECT_URL` 추가(로컬은 `DATABASE_URL`과 동일)
- `npx prisma generate` 완료 · 마이그레이션 불필요(모델 변경 없음)

---

## 남은 일

### 1) 로컬 E2E 검증 — **제일 먼저**
사장님·운전자 두 화면을 동시에 띄우고 실제 흐름 확인.

1. `npm run dev` (서버 **1개만**)
2. 브라우저 탭 A: `http://localhost:3000` → 로그인(`owner@pleos.dev`/`pleos1234`) → 홈
3. 브라우저 탭 B: `http://localhost:3000/drive`
4. 탭 B에서 주문: 매장(판교 1호점) → 메뉴 → 주문 확인 → 결제 → 완료
5. **확인 포인트**
   - [ ] 탭 A(사장님)에 새 주문이 리로드 없이 등장 + "신규 주문 도착" 알림
   - [ ] 사장님이 수락→조리시작→준비완료→픽업완료 진행 시, 탭 B(운전자) 픽업 화면 상태가 4초 내 따라 변함
   - [ ] 차량번호 · 메뉴 · ETA가 양쪽에 올바르게 표시
   - [ ] 사장님 `/map`에 운전자 주문 위치 마커 표시(카카오 키 등록돼 있으면 실제 지도)

> curl로 빠르게 연동만 확인하려면:
> `curl -s -X POST localhost:3000/api/trpc/driver.createOrder -H 'content-type: application/json' -d '{"json":{"storeId":"<STORE_ID>","items":[{"name":"아메리카노","price":4500,"quantity":1}],"car":{"number":"12가 3456"}}}'`
> → 사장님 화면에 실시간으로 뜨는지 본다. (`<STORE_ID>`는 `npm run db:studio` 또는 DB에서 확인)

### 2) 갭 / 폴리시 점검 (검증하면서 필요 시 수정)
- **차량번호 캡처**: 운전자 주문에 차량번호가 실제로 담기는지 확인
  (`src/components/driver/screens/ConfirmScreen.tsx` / 설정의 차량 정보). 데모 임팩트 큼.
- **거리/ETA 현실성**: 운전자 origin(판교 인근)과 매장 좌표 기반 haversine 계산값이 자연스러운지
  (`driver.service.ts`의 `DEFAULT_ORIGIN`, `AVG_SPEED_MPS`).
- **(선택) 운전자 상태 실시간화**: 지금은 4초 폴링. SSE 푸시로 바꾸면 더 매끄럽지만, 데모엔 폴링으로 충분.
- **세션/시드 주의**: `npm run db:seed`는 사장님 계정 upsert라 로그인 유지됨. `migrate reset`은 재로그인 필요.

### 3) 배포 (라이브 데모용, 선택)
`DEPLOY.md` 참고. 요약:
- Supabase 프로젝트 생성 → `DATABASE_URL`=Transaction pooler(6543, `?pgbouncer=true`),
  `DIRECT_URL`=Session pooler(5432)
- 컨테이너 호스트(Fly.io / Railway / Render)에 `Dockerfile`로 배포 — **Vercel은 SSE/LISTEN 제약이라 비권장**
- 배포 후: `prisma migrate deploy` + `prisma db seed`, 카카오 Web 플랫폼에 **배포 도메인 추가**,
  `AUTH_SECRET`·`INGEST_API_KEY` 실제 값으로 설정

### 4) 데모 시나리오 (리허설 스크립트)
- 화면 배치: 큰 디스플레이=운전자 인포테인먼트(`/drive`, 1280×720), 폰=사장님(`/home`)
- 흐름: 운전자 "가는 길에 주문" → 결제 → **사장님 화면 실시간 알림** → 수락→준비완료→픽업완료
  → 운전자 픽업 화면이 상태 따라 변화 → 도착
- (선택) GLEO 음성 주문("가는 길에 아메리카노 두 잔 주문해줘") 시연 — `src/lib/driver/voice/*`

---

## 실행 순서 한눈에
1. `git pull` — ✅ 완료(최신 `97d30c6`)
2. `.env`에 `DIRECT_URL` + `npx prisma generate` — ✅ 완료
3. `npm run dev` → **로컬 E2E 검증(1번)** ← 지금 여기
4. 갭 수정(2번)
5. (선택) 배포(3번) → 데모 리허설(4번)
