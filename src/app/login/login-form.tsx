"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { LogIn, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ERROR_MESSAGES: Record<string, string> = {
  auth: "ログインに失敗しました。もう一度お試しください。",
  check: "利用権限を確認できませんでした。時間をおいてもう一度お試しください。",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(
    ERROR_MESSAGES[searchParams.get("error") ?? ""] ?? null,
  );

  async function signIn() {
    setPending(true);
    setError(null);
    const next = searchParams.get("next");
    const callback = new URL("/auth/callback", window.location.origin);
    if (next) callback.searchParams.set("next", next);

    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback.toString(),
        // 別のアカウントでも入り直せるように、毎回アカウントを選ばせる
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setError(ERROR_MESSAGES.auth);
      setPending(false);
    }
  }

  return (
    <>
      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-md bg-primary/10 px-3 py-2.5 text-sm text-primary">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={signIn}
        disabled={pending}
        className="flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-base font-bold text-primary-foreground transition active:scale-[0.97] disabled:opacity-60"
      >
        <LogIn className="size-5" aria-hidden />
        {pending ? "Google に移動しています…" : "Google でログイン"}
      </button>
    </>
  );
}
