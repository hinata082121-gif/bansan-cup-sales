"use client";

import { motion } from "motion/react";
import { CalendarClock, ChevronRight, CircleCheck } from "lucide-react";
import type { AreaSummary } from "@/lib/stores/hierarchy";
import { itemVariants, listVariants } from "@/lib/motion";

/** 第2階層: 市区町村の一覧（店舗数・営業済/予定ありの件数） */
export function CityList({ cities, onSelect }: { cities: AreaSummary[]; onSelect: (city: string) => void }) {
  return (
    <motion.ul
      variants={listVariants}
      initial="hidden"
      animate="show"
      className="mx-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card"
    >
      {cities.map((c) => (
        <motion.li key={c.name} variants={itemVariants}>
          <button
            type="button"
            onClick={() => onSelect(c.name)}
            className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left outline-none focus-visible:bg-muted active:bg-muted"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-bold">{c.name}</span>
              {(c.visited > 0 || c.scheduled > 0) && (
                <span className="flex gap-3 text-xs font-bold text-muted-foreground">
                  {c.visited > 0 && (
                    <span className="flex items-center gap-1 text-success-soft-foreground">
                      <CircleCheck aria-hidden className="size-3.5" />
                      営業済 <span className="num text-[13px]">{c.visited}</span>
                    </span>
                  )}
                  {c.scheduled > 0 && (
                    <span className="flex items-center gap-1 text-brand-soft-foreground">
                      <CalendarClock aria-hidden className="size-3.5" />
                      予定 <span className="num text-[13px]">{c.scheduled}</span>
                    </span>
                  )}
                </span>
              )}
            </span>
            <span className="num text-xl font-semibold text-muted-foreground">
              {c.matched}
              <span className="sr-only">店舗</span>
            </span>
            <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
          </button>
        </motion.li>
      ))}
    </motion.ul>
  );
}
