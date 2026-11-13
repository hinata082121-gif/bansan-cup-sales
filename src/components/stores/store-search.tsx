"use client";

import { motion } from "motion/react";
import { ChevronRight, Search, SearchX, X } from "lucide-react";
import type { Store } from "@/lib/data/stores";
import type { StoreProgress } from "@/lib/stores/hierarchy";
import type { StoreSearchHit } from "@/lib/search/store-search";
import { itemVariants, listVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { fieldControlClass } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { Highlight } from "@/components/highlight";
import { StoreBadges } from "./store-badges";

/** 店舗名の検索ボックス（ひらがな・漢字のどちらでも途中まで入れれば絞り込む） */
export function StoreSearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        aria-label="店舗名で検索"
        placeholder="店舗名で検索（ひらがなでもOK）"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(fieldControlClass, "h-12 pr-11 pl-10 [&::-webkit-search-cancel-button]:hidden")}
      />
      {value && (
        <button
          type="button"
          aria-label="検索をクリア"
          onClick={() => onChange("")}
          className="absolute top-1/2 right-0.5 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground active:scale-90"
        >
          <X className="size-5" />
        </button>
      )}
    </div>
  );
}

/** 検索結果（都道府県をまたいで表示） */
export function StoreSearchResults({
  query,
  hits,
  progress,
  onSelect,
}: {
  query: string;
  hits: StoreSearchHit<Store>[];
  progress: ReadonlyMap<string, StoreProgress>;
  onSelect: (store: Store) => void;
}) {
  if (hits.length === 0) {
    return <EmptyState icon={SearchX} title="見つかりませんでした" description={`「${query}」に一致する店舗はありません。`} />;
  }
  return (
    <div>
      <p className="px-4 pb-2 text-sm font-bold text-muted-foreground">
        検索結果 <span className="num text-base text-foreground">{hits.length}</span> 件
      </p>
      <motion.ul
        key={query}
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="mx-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card"
      >
        {hits.map(({ store, nameMatch, kanaMatch }) => (
          <motion.li key={store.id} variants={itemVariants}>
            <button
              type="button"
              onClick={() => onSelect(store)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left outline-none focus-visible:bg-muted active:bg-muted"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] leading-snug font-bold">
                  <Highlight text={store.name} range={nameMatch} />
                </span>
                {!nameMatch && kanaMatch && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    <Highlight text={store.name_kana} range={kanaMatch} />
                  </span>
                )}
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {store.prefecture} {store.city}
                </span>
                <span className="mt-2 block">
                  <StoreBadges progress={progress.get(store.id)} openingNote={store.opening_note} />
                </span>
              </span>
              <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
            </button>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
