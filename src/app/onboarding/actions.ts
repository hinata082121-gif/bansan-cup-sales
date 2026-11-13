"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/access";
import { markAccessVerified } from "@/lib/auth/server";

export type OnboardingState = { error: string | null; displayName: string };

const MAX_LENGTH = 20;

/** 初回ログイン時の表示名登録 */
export async function createProfile(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!displayName) return { error: "表示名を入力してください", displayName };
  if ([...displayName].length > MAX_LENGTH) {
    return { error: `表示名は${MAX_LENGTH}文字以内で入力してください`, displayName };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const { error } = await supabase.from("profiles").insert({ id: userId, display_name: displayName });
  if (error) {
    // 23505: 既に登録済み（二重送信など）→ そのまま進める / 42501: RLS 違反 = 許可されていない
    if (error.code === "42501") redirect("/unauthorized");
    if (error.code !== "23505") {
      console.error("profiles insert failed:", error);
      return { error: "登録できませんでした。もう一度お試しください", displayName };
    }
  }

  await markAccessVerified(userId);
  redirect(next);
}
