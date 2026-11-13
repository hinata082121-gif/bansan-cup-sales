import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * 許可リストの照合結果を覚えておく Cookie。値はユーザー ID。
 *
 * proxy は全リクエスト（先読みを含む）で動くため DB には問い合わせず、この Cookie の有無と
 * ログイン中のユーザー ID が一致するかだけを見る。照合はログイン直後と、Cookie の期限切れ時に
 * /auth/check で行う。データそのものは RLS で守られているので、この Cookie は画面の出し分け用。
 */
export const ACCESS_COOKIE = "bansan_access";

export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 12, // 12 時間ごとに許可リストを照合し直す
} as const;

export type AccessStatus = "ok" | "needs_profile" | "forbidden";

/** ログイン中のユーザーが許可リストに載っているか、表示名を登録済みかを DB に問い合わせる */
export async function checkAccess(supabase: SupabaseClient<Database>): Promise<AccessStatus> {
  const { data, error } = await supabase.rpc("get_my_access");
  if (error) throw new Error(`利用権限の確認に失敗しました: ${error.message}`);
  const access = data as { allowed?: boolean; has_profile?: boolean } | null;
  if (!access?.allowed) return "forbidden";
  return access.has_profile ? "ok" : "needs_profile";
}

/** ログイン後の戻り先として安全なパスだけを通す（外部サイトへのリダイレクトを防ぐ） */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
