import { cn } from "@/lib/utils";

/**
 * 『晩餐杯 店舗営業』のワードマーク（オリジナル）。
 * 「晩餐杯」は横断幕のような極太ゴシック、「店舗営業」は大会運営の札のような小さな黒地の札。
 * 黄色の面に乗せる前提で、文字はチャコール、札は黒地に黄。
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[0.35em] leading-none", className)}>
      <span className="font-heading tracking-tight">晩餐杯</span>
      <span className="rounded-sm bg-brand-foreground px-[0.4em] py-[0.3em] text-[0.48em] font-black tracking-wider text-brand">
        店舗営業
      </span>
    </span>
  );
}
