import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const MENU_BUCKET = "menu-images";

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
