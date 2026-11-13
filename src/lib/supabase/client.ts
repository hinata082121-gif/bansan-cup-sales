import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

/** ブラウザ用の Supabase クライアント（RLS はログイン中のユーザーで効く） */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
