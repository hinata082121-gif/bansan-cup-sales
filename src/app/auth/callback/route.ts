import type { NextRequest } from "next/server";
import { redirect, unstable_rethrow } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveSignedInDestination, signOutQuietly } from "@/lib/auth/server";

/**
 * Google ログイン後に Supabase から戻ってくる先。認可コードをセッションに交換して振り分ける。
 * リダイレクトは redirect() で相対パスにする（request.nextUrl.origin はサーバーの設定ホスト名に
 * なることがあり、Cookie を付けたホストと食い違うため）。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (!code) {
    console.error("OAuth callback without code:", searchParams.get("error_description") ?? searchParams.get("error"));
    redirect("/login?error=auth");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("exchangeCodeForSession failed:", error.message);
    redirect("/login?error=auth");
  }

  let destination: string;
  try {
    destination = await resolveSignedInDestination(searchParams.get("next"));
  } catch (e) {
    unstable_rethrow(e); // Next.js 内部の制御用エラー（事前描画の中断など）は握りつぶさない
    console.error(e);
    await signOutQuietly();
    destination = "/login?error=check";
  }
  redirect(destination);
}
