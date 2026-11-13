"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/** 予期しないエラーが起きたときの画面（再読み込みで直ることが多い） */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
        <TriangleAlert className="size-8" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="font-heading text-[26px] leading-tight">うまく表示できませんでした</h1>
        <p className="jp-phrase leading-relaxed text-muted-foreground">
          通信状況を確認して、もう一度お試しください。何度も起きる場合は管理者に知らせてください。
        </p>
        {error.digest && <p className="num text-sm text-muted-foreground">エラー番号 {error.digest}</p>}
      </div>
      <Button size="lg" block onClick={reset}>
        <RotateCcw />
        もう一度読み込む
      </Button>
    </main>
  );
}
