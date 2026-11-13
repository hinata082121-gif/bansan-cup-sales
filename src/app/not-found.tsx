import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/** 404（存在しない URL） */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
      <div className="flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand-soft-foreground">
        <MapPinOff className="size-8" aria-hidden />
      </div>
      <div className="space-y-2">
        <p className="num text-4xl font-bold text-muted-foreground">404</p>
        <h1 className="font-heading text-[26px] leading-tight">ページが見つかりません</h1>
        <p className="jp-phrase leading-relaxed text-muted-foreground">URL が間違っているか、ページが移動した可能性があります。</p>
      </div>
      <Button asChild size="lg" block>
        <Link href="/stores">店舗一覧へ</Link>
      </Button>
    </main>
  );
}
