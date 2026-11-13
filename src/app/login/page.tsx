import type { Metadata } from "next";
import { Suspense } from "react";
import { Wordmark } from "@/components/wordmark";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "ログイン" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col">
      <div className="bg-brand px-6 pt-[calc(env(safe-area-inset-top)+4.5rem)] pb-10 text-brand-foreground">
        <Wordmark className="text-[44px]" />
        <p className="jp-phrase mt-4 text-[15px] leading-relaxed font-bold">
          鳥貴族スタッフ限定フットサル大会
          <br />
          「晩餐杯」の店舗営業を、みんなで記録・共有する
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-6 py-8">
        <Suspense fallback={<Skeleton className="h-14 w-full" />}>
          <LoginForm />
        </Suspense>
        <p className="jp-phrase text-sm leading-relaxed text-muted-foreground">利用できるのは、登録済みの Google アカウントだけです。</p>
      </div>
    </main>
  );
}
