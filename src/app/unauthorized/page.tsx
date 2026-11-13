import type { Metadata } from "next";
import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutOnMount } from "./sign-out-on-mount";

export const metadata: Metadata = { title: "利用権限がありません" };

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
      <SignOutOnMount />
      <div className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
        <ShieldX className="size-8" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="font-heading text-[26px] leading-tight">利用権限がありません</h1>
        <p className="jp-phrase leading-relaxed text-muted-foreground">
          このGoogleアカウントは利用者として登録されていません。登録済みのアカウントでログインし直すか、管理者に登録を依頼してください。
        </p>
      </div>
      <Button asChild variant="outline" size="lg" block>
        <Link href="/login">別のアカウントでログインする</Link>
      </Button>
    </main>
  );
}
