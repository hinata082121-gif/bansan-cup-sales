import type { Metadata } from "next";
import { Suspense } from "react";
import { Wordmark } from "@/components/wordmark";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "表示名の登録" };

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col">
      <div className="bg-brand px-6 pb-8 pt-12 text-brand-foreground">
        <Wordmark className="text-2xl" />
        <h1 className="mt-6 text-2xl font-black">はじめに表示名を登録</h1>
        <p className="mt-2 text-sm font-medium">営業記録や予定の登録者として、みんなに表示されます。</p>
      </div>
      <div className="px-6 py-8">
        <Suspense fallback={<div className="h-40 rounded-md bg-muted" />}>
          <OnboardingForm />
        </Suspense>
      </div>
    </main>
  );
}
