"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, NotebookPen, Store, type LucideIcon } from "lucide-react";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/stores", label: "店舗一覧", icon: Store },
  { href: "/visits", label: "記録入力", icon: NotebookPen },
  { href: "/schedules", label: "営業予定", icon: CalendarDays },
];

/** 画面下部の固定タブ（選択中インジケーターのアニメーションはフェーズ3で入れる） */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="メイン"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-border bg-background pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid h-16 grid-cols-3">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-xs font-bold ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <span className={`rounded-full px-4 py-1 ${active ? "bg-brand text-brand-foreground" : ""}`}>
                  <Icon className="size-5" aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
