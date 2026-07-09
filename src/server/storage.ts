import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Store + menu photos share one public bucket, namespaced by path prefix
// (store/<id>/... vs <storeId>/<uuid>.ext) to avoid requiring a second bucket.
export const MENU_BUCKET = "menu-images";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const g = globalThis as unknown as { __supabase?: SupabaseClient };

/**
 * Server-only Supabase client (service role — bypasses RLS) for Storage uploads.
 * Returns null when storage isn't configured so the app still boots/works
 * without menu photos.
 */
export function getStorage(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  if (!g.__supabase) {
    g.__supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }
  return g.__supabase;
}

export function isStorageConfigured(): boolean {
  return !!(url && serviceKey);
}

export type UploadImageResult =
  | { ok: true; url: string }
  | { ok: false; status: number; error: string };

/**
 * Validate + upload an image file to the shared bucket under `pathPrefix/`.
 * Shared by the menu and store photo upload routes.
 */
export async function uploadImage(
  file: File,
  pathPrefix: string,
): Promise<UploadImageResult> {
  const storage = getStorage();
  if (!storage) {
    return {
      ok: false,
      status: 503,
      error: "이미지 저장소가 설정되지 않았어요 (SUPABASE_URL/SERVICE_ROLE_KEY).",
    };
  }

  const ext = IMAGE_EXT[file.type];
  if (!ext) {
    return { ok: false, status: 400, error: "JPG/PNG/WebP/GIF만 올릴 수 있어요." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, status: 400, error: "최대 5MB까지 올릴 수 있어요." };
  }

  const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await storage.storage
    .from(MENU_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) {
    return { ok: false, status: 500, error: `업로드 실패: ${error.message}` };
  }

  const { data } = storage.storage.from(MENU_BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
