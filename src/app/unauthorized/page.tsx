import type { Metadata } from "next";
import Link from "next/link";
import { ShieldX } from "lucide-react";
import { SignOutOnMount } from "./sign-out-on-mount";

export const metadata: Metadata = { title: "利用権限がありません" };

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
      <SignOutOnMount />
      <ShieldX className="size-12 text-primary" aria-hidden />
      <div className="space-y-2">
        <h1 className="text-2xl font-black">利用権限がありません</h1>
        <p className="text-muted-foreground">
          このGoogleアカウントは利用者として登録されていません。登録済みのアカウントでログインし直すか、管理者に登録を依頼してください。
        </p>
      </div>
      <Link
        href="/login"
        className="flex h-12 items-center justify-center rounded-md border border-border bg-background px-4 font-bold transition active:scale-[0.97]"
      >
        別のアカウントでログインする
      </Link>
    </main>
  );
}
