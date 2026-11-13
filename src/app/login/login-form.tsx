"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoaderCircle, LogIn, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const ERROR_MESSAGES: Record<string, string> = {
  auth: "ログインに失敗しました。もう一度お試しください。",
  check: "利用権限を確認できませんでした。時間をおいてもう一度お試しください。",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(ERROR_MESSAGES[searchParams.get("error") ?? ""] ?? null);

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
        <p role="alert" className="flex items-start gap-2 rounded-md bg-primary-soft px-3 py-2.5 text-sm font-bold text-primary-soft-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
      <Button size="lg" block onClick={signIn} disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <LogIn aria-hidden />}
        {pending ? "Google に移動しています…" : "Google でログイン"}
      </Button>
    </>
  );
}
