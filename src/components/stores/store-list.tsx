"use client";

import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import type { Store } from "@/lib/data/stores";
import type { StoreProgress } from "@/lib/stores/hierarchy";
import { itemVariants, listVariants } from "@/lib/motion";
import { StoreBadges } from "./store-badges";

/** 住所から都道府県・市区町村を除いた部分（一覧では短く見せる） */
export function shortAddress(store: Pick<Store, "address" | "prefecture" | "city">): string {
  return store.address.replace(store.prefecture, "").replace(store.city, "").trim();
}

/** 第3階層: 市区町村内の店舗 */
export function StoreList({
  stores,
  progress,
  onSelect,
}: {
  stores: Store[];
  progress: ReadonlyMap<string, StoreProgress>;
  onSelect: (store: Store) => void;
}) {
  return (
    <motion.ul
      variants={listVariants}
      initial="hidden"
      animate="show"
      className="mx-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card"
    >
      {stores.map((store) => (
        <motion.li key={store.id} variants={itemVariants}>
          <button
            type="button"
            onClick={() => onSelect(store)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left outline-none focus-visible:bg-muted active:bg-muted"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] leading-snug font-bold">{store.name}</span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">{shortAddress(store)}</span>
              <span className="mt-2 block">
                <StoreBadges progress={progress.get(store.id)} openingNote={store.opening_note} />
              </span>
            </span>
            <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
          </button>
        </motion.li>
      ))}
    </motion.ul>
  );
}
