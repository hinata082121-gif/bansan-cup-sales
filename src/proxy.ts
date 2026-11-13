import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { ACCESS_COOKIE } from "@/lib/auth/access";

/** 未ログインでも開けるページ */
const PUBLIC_PATHS = ["/login", "/auth/callback", "/unauthorized"];
/** ログイン済みなら許可リストの照合前でも開けるページ（照合・初回登録・権限なしの案内） */
const AUTH_FLOW_PATHS = ["/auth/callback", "/auth/check", "/unauthorized", "/onboarding"];

const matches = (pathname: string, paths: string[]) =>
  paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * 認証の出し分け（Next.js 16 で middleware.ts から proxy.ts に改名された仕組み）。
 *   1. Supabase のセッション Cookie を更新する
 *   2. 未ログインならログイン画面へ
 *   3. 許可リスト未照合なら /auth/check へ（照合して、権限なし・初回登録・元のページに振り分ける）
 * DB には問い合わせない（JWT の検証と Cookie の確認だけ）。
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  // getClaims() は JWT を検証する（getSession() と違い Cookie の中身をそのまま信用しない）
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const { pathname, search } = request.nextUrl;

  /** セッション更新で付いた Cookie を引き継いでリダイレクトする */
  const redirectTo = (target: string, next?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.search = next ? `?next=${encodeURIComponent(next)}` : "";
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    for (const key of ["cache-control", "expires", "pragma"]) {
      const value = response.headers.get(key);
      if (value) redirect.headers.set(key, value);
    }
    return redirect;
  };

  if (!userId) {
    if (matches(pathname, PUBLIC_PATHS)) return response;
    return redirectTo("/login", pathname === "/" ? undefined : pathname + search);
  }

  if (matches(pathname, AUTH_FLOW_PATHS)) return response;

  const verified = request.cookies.get(ACCESS_COOKIE)?.value === userId;
  if (!verified) {
    const next = pathname === "/login" ? undefined : pathname + search;
    return redirectTo("/auth/check", next);
  }

  if (pathname === "/login") return redirectTo("/");
  return response;
}

export const config = {
  matcher: [
    // 静的ファイル・画像・PWA 関連・robots.txt には適用しない
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
