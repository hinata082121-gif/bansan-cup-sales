import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

/** Server Component / Server Action / Route Handler 用の Supabase クライアント */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Component からは Cookie を書けない。セッションの更新は proxy が行うので無視してよい
        }
      },
    },
  });
}
