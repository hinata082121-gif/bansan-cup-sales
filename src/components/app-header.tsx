import { Wordmark } from "@/components/wordmark";

/** 画面上部の黄色い帯。左にワードマーク、右に利用者名などを置く */
export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 bg-brand text-brand-foreground pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center justify-between gap-2 pr-1 pl-4">
        <Wordmark className="text-[22px]" />
        <div className="flex items-center gap-0.5">{children}</div>
      </div>
    </header>
  );
}
