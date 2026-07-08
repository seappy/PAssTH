# 배포 가이드 (Supabase DB + 컨테이너 호스팅)

이 앱은 실시간(SSE)이 Postgres `LISTEN/NOTIFY` + 상주 커넥션에 의존하므로 **서버리스
(Vercel)로는 실시간이 안 됩니다.** DB는 **Supabase**, 앱은 **상주 Node 런타임을 주는
컨테이너 호스트**(Railway / Fly.io / Render)에 올립니다.

연결은 항상 두 갈래입니다:
- `DATABASE_URL` — 앱 런타임용(Supabase **풀링**, 6543)
- `DIRECT_URL` — 마이그레이션 + 실시간 LISTEN/NOTIFY용(Supabase **직접**, 5432)

---

## 1. Supabase 프로젝트 만들기 (직접)

1. https://supabase.com → New project. Region은 서비스 지역(예: Northeast Asia/Seoul)으로.
2. Database Password를 정하고 안전하게 보관.
3. 상단 **Connect** (또는 Settings → Database → Connection string)에서 두 문자열 복사:
   - **Transaction pooler** (port 6543) → `DATABASE_URL`.
     끝에 `?pgbouncer=true&connection_limit=1` 를 붙입니다.
   - **Session pooler** (port 5432) → `DIRECT_URL`.
     ⚠️ "Direct connection"(`db.<ref>.supabase.co:5432`)은 무료 플랜에서 IPv6 전용이라
     대부분의 환경/호스트에서 안 닿습니다. IPv4인 **Session pooler**를 쓰세요
     (LISTEN/NOTIFY도 세션 모드에서 정상 동작).
   - 둘 다 `[YOUR-PASSWORD]` 자리를 실제 비밀번호로 치환. 비번에 특수문자가 있으면
     URL 인코딩하세요 (`!`→`%21`, `*`→`%2A`, `+`→`%2B`).

## 2. 스키마 반영 + 시드 (로컬에서 1회)

로컬 저장소의 `.env`에 위 두 값을 넣고(로컬 Docker 값 대신), 한 번만:

```bash
npx prisma migrate deploy   # 기존 마이그레이션을 Supabase에 적용
npm run db:seed             # 데모 데이터(사장님/매장/메뉴/주문) 시드 — 선택
```

> 팁: 개인 로컬 개발은 계속 Docker로, 공유/배포만 Supabase로 둘 수도 있습니다.
> 팀이 하나의 Supabase를 개발 DB로 공유하면, A가 넣은 주문이 B의 사장님 화면에
> 실시간으로 뜨는 것까지 함께 확인됩니다(같은 DB의 NOTIFY 공유).

## 3. 앱 배포 (Railway 예시)

이 저장소에 `Dockerfile`이 있어 Railway/Fly/Render가 그대로 빌드합니다.

1. Railway → New Project → Deploy from GitHub repo (`seappy/PAssTH`).
2. **Variables**에 환경변수 등록:
   ```
   DATABASE_URL   = (Supabase 풀링, 6543, ?pgbouncer=true&connection_limit=1)
   DIRECT_URL     = (Supabase 직접, 5432)
   AUTH_SECRET    = openssl rand -base64 32 로 생성한 값
   NEXTAUTH_URL   = https://<배포도메인>
   NEXT_PUBLIC_APP_URL = https://<배포도메인>
   INGEST_API_KEY = 임의의 강한 키
   NEXT_PUBLIC_KAKAO_MAP_KEY = (선택) Kakao JS 키
   ```
3. 마이그레이션은 릴리스 단계에서: Railway **Deploy → Custom Start/Release Command**에
   `npx prisma migrate deploy` 를 넣거나, 2번처럼 로컬에서 미리 적용해 둡니다.
4. 배포 후 도메인이 생기면 `NEXTAUTH_URL`/`NEXT_PUBLIC_APP_URL`을 그 도메인으로 맞추고
   Kakao 콘솔의 Web 플랫폼에도 그 도메인을 등록.

## 4. 로컬 도커 이미지 테스트(선택)

```bash
docker build -t pleos .
docker run --rm -p 3000:3000 --env-file .env pleos
```

---

## 실시간 관련 주의

- `src/server/events.ts`의 LISTEN 커넥션은 **`DIRECT_URL`** 을 씁니다. 풀링(pgBouncer)
  으로는 `LISTEN/NOTIFY`가 안 되기 때문입니다. `DIRECT_URL`을 빼먹으면 실시간이 조용히
  멈춥니다(주문은 저장되지만 화면 자동 갱신이 안 됨).
- 여러 인스턴스로 스케일해도 각 인스턴스가 같은 Postgres 채널을 LISTEN 하므로 이벤트는
  모든 인스턴스에 전달됩니다. 다만 인스턴스마다 direct 커넥션을 1개씩 잡으니 커넥션 수를
  감안하세요.
- 더 큰 규모로 가면 README의 제안대로 **Supabase Realtime 채널**로 교체하는 것도 방법
  입니다(`notify`/`subscribe` 인터페이스만 바꾸면 됨).
