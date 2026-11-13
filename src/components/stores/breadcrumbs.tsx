"use client";

import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; onSelect?: () => void };

/** 都道府県 → 市区町村 → 店舗名 のパンくず。最後以外はタップで戻れる */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="パンくずリスト" className="px-4 pb-1">
      <ol className="flex flex-wrap items-center gap-x-0.5 gap-y-1 text-sm">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${i}-${crumb.label}`} className="flex items-center gap-0.5">
              {i > 0 && <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />}
              {last || !crumb.onSelect ? (
                <span aria-current={last ? "page" : undefined} className="px-1 py-2.5 font-black">
                  {crumb.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={crumb.onSelect}
                  className="min-h-11 rounded-sm px-1 font-bold text-muted-foreground underline decoration-brand decoration-2 underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring active:text-foreground"
                >
                  {crumb.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
