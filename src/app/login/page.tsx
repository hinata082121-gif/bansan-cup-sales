import type { Metadata } from "next";
import { Suspense } from "react";
import { Wordmark } from "@/components/wordmark";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "ログイン" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col">
      <div className="bg-brand px-6 pb-10 pt-16 text-brand-foreground">
        <Wordmark className="text-4xl" />
        <p className="mt-3 text-sm font-medium">鳥貴族スタッフ限定フットサル大会の店舗営業記録</p>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-6 py-8">
        <Suspense fallback={<div className="h-12 rounded-md bg-muted" />}>
          <LoginForm />
        </Suspense>
        <p className="text-sm text-muted-foreground">
          利用できるのは、登録済みの Google アカウントだけです。
        </p>
      </div>
    </main>
  );
}
