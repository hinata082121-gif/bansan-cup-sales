"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { CalendarDays, NotebookPen, Store, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

export const NAV_TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/stores", label: "店舗一覧", icon: Store },
  { href: "/visits", label: "記録入力", icon: NotebookPen },
  { href: "/schedules", label: "営業予定", icon: CalendarDays },
];

const INDICATOR_SPRING = { type: "spring", stiffness: 480, damping: 36 } as const;

/**
 * 画面下部の固定タブ。選択中の黄色い札がタブ間を滑って移動する。
 * demo を渡すと、ページ遷移せずにその場で切り替わる（見本ページ用）。
 */
export function BottomNav({ demo }: { demo?: { active: string; onSelect: (href: string) => void } }) {
  const pathname = usePathname();
  const activeHref = demo?.active ?? NAV_TABS.find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))?.href;

  return (
    <nav
      aria-label="メイン"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid h-16 grid-cols-3">
        {NAV_TABS.map(({ href, label, icon: Icon }) => {
          const active = href === activeHref;
          const content = (
            <>
              <span className="relative flex h-8 w-16 items-center justify-center">
                {active && (
                  <motion.span
                    layoutId={demo ? "bottom-nav-indicator-demo" : "bottom-nav-indicator"}
                    transition={INDICATOR_SPRING}
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-brand"
                  />
                )}
                <Icon aria-hidden className={cn("relative size-[22px]", active && "text-brand-foreground")} strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className={cn("text-[11px] leading-none", active ? "font-black text-foreground" : "font-bold text-muted-foreground")}>
                {label}
              </span>
            </>
          );
          const itemClass =
            "flex h-full w-full flex-col items-center justify-center gap-1 outline-none transition-transform active:scale-95 focus-visible:bg-muted";
          return (
            <li key={href}>
              {demo ? (
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    haptic(6);
                    demo.onSelect(href);
                  }}
                  className={itemClass}
                >
                  {content}
                </button>
              ) : (
                <Link href={href} aria-current={active ? "page" : undefined} onClick={() => haptic(6)} className={itemClass}>
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
