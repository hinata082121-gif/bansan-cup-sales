"use client";

import { motion } from "motion/react";
import type { AreaSummary, StoreFilter } from "@/lib/stores/hierarchy";
import { itemVariants, listVariants } from "@/lib/motion";
import { AreaProgressBar } from "./area-progress";

/** 第1階層: 都道府県のカード（2×2） */
export function PrefectureGrid({
  summaries,
  filter,
  onSelect,
}: {
  summaries: AreaSummary[];
  filter: StoreFilter;
  onSelect: (prefecture: string) => void;
}) {
  return (
    <motion.ul variants={listVariants} initial="hidden" animate="show" className="grid grid-cols-2 gap-2 px-4">
      {summaries.map((p) => (
        <motion.li key={p.name} variants={itemVariants}>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(p.name)}
            className="flex w-full flex-col gap-3 rounded-lg border border-border bg-card p-3.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <span className="text-lg leading-none font-black">{p.name}</span>
            <span className="flex items-baseline gap-1">
              <span className="num text-4xl leading-none font-bold">{p.matched}</span>
              <span className="text-xs font-bold text-muted-foreground">
                店舗{filter !== "all" && <span className="ml-0.5">／全<span className="num text-sm">{p.total}</span></span>}
              </span>
            </span>
            <AreaProgressBar total={p.total} visited={p.visited} scheduled={p.scheduled} />
            <span className="text-xs font-bold text-muted-foreground">
              営業済 <span className="num text-sm text-foreground">{p.visited}</span>
              <span className="mx-1.5">/</span>
              予定 <span className="num text-sm text-foreground">{p.scheduled}</span>
            </span>
          </motion.button>
        </motion.li>
      ))}
    </motion.ul>
  );
}
