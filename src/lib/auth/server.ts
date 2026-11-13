import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ACCESS_COOKIE, ACCESS_COOKIE_OPTIONS, checkAccess, safeNextPath } from "./access";

/**
 * ログイン中のユーザーを許可リストと照合し、次に開くべきパスを返す。
 *   - 許可されていない → サインアウトして /unauthorized
 *   - 表示名が未登録   → /onboarding
 *   - それ以外         → 照合済み Cookie を付けて next へ
 */
export async function resolveSignedInDestination(next: string | null): Promise<string> {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return "/login";

  const status = await checkAccess(supabase);
  if (status === "forbidden") {
    await supabase.auth.signOut();
    cookieStore.delete(ACCESS_COOKIE);
    return "/unauthorized";
  }

  const safeNext = safeNextPath(next);
  if (status === "needs_profile") {
    return safeNext === "/" ? "/onboarding" : `/onboarding?next=${encodeURIComponent(safeNext)}`;
  }

  cookieStore.set(ACCESS_COOKIE, userId, ACCESS_COOKIE_OPTIONS);
  return safeNext;
}

/** 表示名の登録後など、照合済みであることが分かっているときに Cookie を付ける */
export async function markAccessVerified(userId: string) {
  (await cookies()).set(ACCESS_COOKIE, userId, ACCESS_COOKIE_OPTIONS);
}

export async function clearAccessCookie() {
  (await cookies()).delete(ACCESS_COOKIE);
}

/** 照合に失敗したときなど、ログイン画面に戻す前にセッションを消す（リダイレクトの往復を防ぐ） */
export async function signOutQuietly() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // セッションが既に無い場合など
  }
  await clearAccessCookie();
}
