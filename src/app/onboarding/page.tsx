import type { Metadata } from "next";
import { Suspense } from "react";
import { Wordmark } from "@/components/wordmark";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "表示名の登録" };

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col">
      <div className="bg-brand px-6 pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-8 text-brand-foreground">
        <Wordmark className="text-[26px]" />
        <h1 className="mt-7 font-heading text-[26px] leading-tight">はじめに表示名を登録</h1>
        <p className="jp-phrase mt-2 text-sm leading-relaxed font-bold">営業記録や予定の登録者として、みんなに表示されます。</p>
      </div>
      <div className="px-6 py-8">
        <Suspense fallback={<Skeleton className="h-44 w-full" />}>
          <OnboardingForm />
        </Suspense>
      </div>
    </main>
  );
}
