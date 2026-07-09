// One-off: populate each store's photo from Kakao.
//   Kakao Local keyword search (official, REST key) → place page → og:image
//   (real review photo) → download → Supabase Storage → Store.imageUrl.
// Run: node scripts/store-photos.mjs   (from PAssTH/)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

// --- load .env (tolerant of `KEY = "value"` spacing used in this repo) ---
function loadEnv() {
  const txt = readFileSync(new URL("../.env", import.meta.url), "utf8");
  const env = {};
  for (const line of txt.split("\n")) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const i = s.indexOf("=");
    if (i < 0) continue;
    const key = s.slice(0, i).trim();
    let val = s.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnv();
const KAKAO_KEY = env.KAKAO_REST_API_KEY;
const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const DB_URL = env.DIRECT_URL || env.DATABASE_URL;
const BUCKET = "menu-images";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

if (!KAKAO_KEY || !SUPABASE_URL || !SERVICE_KEY || !DB_URL) {
  console.error("missing env (KAKAO_REST_API_KEY / SUPABASE_* / DIRECT_URL)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

/** Kakao keyword search → best place doc (id + place_url). */
async function kakaoSearch(name, lng, lat) {
  const tryQuery = async (q) => {
    const u = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
    u.searchParams.set("query", q);
    if (lng != null && lat != null) {
      u.searchParams.set("x", String(lng));
      u.searchParams.set("y", String(lat));
      u.searchParams.set("radius", "20000");
      u.searchParams.set("sort", "distance");
    }
    const r = await fetch(u, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } });
    if (!r.ok) return [];
    const d = await r.json();
    return d.documents ?? [];
  };
  let docs = await tryQuery(name);
  if (docs.length === 0) docs = await tryQuery(name.replace(/\(.*?\)/g, "").trim());
  return docs[0] ?? null;
}

/** Public place page → og:image (only when it's a real photo, not a static map). */
async function ogImage(placeUrl) {
  const r = await fetch(placeUrl, { headers: { "User-Agent": UA } });
  if (!r.ok) return null;
  const html = await r.text();
  const m = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (!m) return null;
  let url = m[1];
  if (url.startsWith("//")) url = "https:" + url;
  // Reject the static-map fallback (store has no review photo).
  if (/staticmap\.kakao\.com/i.test(url)) return null;
  if (!/kakaomapPhoto|cthumb/i.test(url)) return null;
  return url;
}

async function run() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  const { rows } = await client.query(
    'SELECT id, name, lat, lng, "imageUrl" FROM "Store" ORDER BY "createdAt" ASC',
  );
  console.log(`stores: ${rows.length}\n`);

  let ok = 0, skip = 0, fail = 0;
  for (const s of rows) {
    const tag = `• ${s.name}`;
    try {
      const doc = await kakaoSearch(s.name, s.lng, s.lat);
      if (!doc) { console.log(`${tag} — 검색 결과 없음`); fail++; continue; }
      const img = await ogImage(doc.place_url);
      if (!img) { console.log(`${tag} — 사진 없음(정적지도만) place=${doc.id}`); skip++; continue; }

      const res = await fetch(img, { headers: { "User-Agent": UA } });
      if (!res.ok) { console.log(`${tag} — 다운로드 실패 ${res.status}`); fail++; continue; }
      const ct = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
      const ext = EXT[ct] ?? "jpg";
      const buf = Buffer.from(await res.arrayBuffer());
      const path = `store/${s.id}/${crypto.randomUUID()}.${ext}`;

      const up = await supabase.storage.from(BUCKET).upload(path, buf, { contentType: ct, upsert: true });
      if (up.error) { console.log(`${tag} — 업로드 실패: ${up.error.message}`); fail++; continue; }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      await client.query('UPDATE "Store" SET "imageUrl"=$1, "updatedAt"=now() WHERE id=$2', [data.publicUrl, s.id]);
      console.log(`${tag} ✓ ${data.publicUrl}`);
      ok++;
    } catch (e) {
      console.log(`${tag} — 오류: ${e?.message ?? e}`);
      fail++;
    }
  }
  await client.end();
  console.log(`\n완료: 성공 ${ok} · 사진없음 ${skip} · 실패 ${fail}`);
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
