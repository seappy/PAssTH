// Fallback for stores with no Kakao match: use a nearby real cafe's photo.
//   For each store still missing imageUrl → Kakao "카페" search near its coords
//   → first result with a real og:image → download → Supabase → Store.imageUrl.
// Run: node scripts/store-photos-fallback.mjs   (from PAssTH/)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
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
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function nearbyCafes(lng, lat) {
  const u = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  u.searchParams.set("query", "카페");
  u.searchParams.set("x", String(lng));
  u.searchParams.set("y", String(lat));
  u.searchParams.set("radius", "3000");
  u.searchParams.set("sort", "distance");
  u.searchParams.set("size", "15");
  const r = await fetch(u, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } });
  if (!r.ok) return [];
  return (await r.json()).documents ?? [];
}

async function ogImage(placeUrl) {
  const r = await fetch(placeUrl, { headers: { "User-Agent": UA } });
  if (!r.ok) return null;
  const html = await r.text();
  const m = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (!m) return null;
  let url = m[1];
  if (url.startsWith("//")) url = "https:" + url;
  if (/staticmap\.kakao\.com/i.test(url)) return null;
  if (!/kakaomapPhoto|cthumb/i.test(url)) return null;
  return url;
}

async function run() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  const { rows } = await client.query(
    'SELECT id, name, lat, lng FROM "Store" WHERE "imageUrl" IS NULL ORDER BY "createdAt" ASC',
  );
  console.log(`사진 없는 매장: ${rows.length}\n`);

  for (const s of rows) {
    const tag = `• ${s.name}`;
    if (s.lat == null || s.lng == null) { console.log(`${tag} — 좌표 없음, 건너뜀`); continue; }
    try {
      const cafes = await nearbyCafes(s.lng, s.lat);
      let done = false;
      for (const doc of cafes) {
        const img = await ogImage(doc.place_url);
        if (!img) continue;
        const res = await fetch(img, { headers: { "User-Agent": UA } });
        if (!res.ok) continue;
        const ct = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
        const ext = EXT[ct] ?? "jpg";
        const buf = Buffer.from(await res.arrayBuffer());
        const path = `store/${s.id}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from(BUCKET).upload(path, buf, { contentType: ct, upsert: true });
        if (up.error) continue;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        await client.query('UPDATE "Store" SET "imageUrl"=$1, "updatedAt"=now() WHERE id=$2', [data.publicUrl, s.id]);
        console.log(`${tag} ✓ (유사: ${doc.place_name}) ${data.publicUrl}`);
        done = true;
        break;
      }
      if (!done) console.log(`${tag} — 근처 카페 실사진 없음`);
    } catch (e) {
      console.log(`${tag} — 오류: ${e?.message ?? e}`);
    }
  }
  await client.end();
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
