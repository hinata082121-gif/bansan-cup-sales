"use client";

import { useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import type { Store } from "@/lib/data/stores";
import { searchStores } from "@/lib/search/store-search";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { fieldControlClass } from "@/components/ui/input";
import { Highlight } from "@/components/highlight";

const MAX_CANDIDATES = 8;

/**
 * 店舗名のオートコンプリート（記録入力・営業予定で共通）。
 * ひらがな・漢字のどちらで途中まで入力しても、渡された店舗（都道府県で絞ったもの）から候補を出す。
 * 候補はふわっと展開し、一致した部分をハイライトする。店舗マスタの候補から選ぶことしかできない。
 */
export function StoreAutocomplete({
  id,
  stores,
  onSelect,
  excludeIds,
  disabled,
  placeholder = "店舗名（ひらがなでもOK）",
  invalid,
  describedBy,
  onQueryChange,
  onBlurWithText,
}: {
  id?: string;
  stores: Store[];
  onSelect: (store: Store) => void;
  /** すでに選んだ店舗など、候補から外すもの */
  excludeIds?: ReadonlySet<string>;
  disabled?: boolean;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
  onQueryChange?: (query: string) => void;
  /** 文字を入れたまま（候補を選ばずに）入力欄を離れたとき */
  onBlurWithText?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();

  const hits = useMemo(() => {
    if (!query.trim()) return [];
    return searchStores(stores, query, MAX_CANDIDATES + (excludeIds?.size ?? 0))
      .filter((h) => !excludeIds?.has(h.store.id))
      .slice(0, MAX_CANDIDATES);
  }, [stores, query, excludeIds]);

  const open = query.trim().length > 0;
  const update = (value: string) => {
    setQuery(value);
    setActive(0);
    onQueryChange?.(value);
  };
  const choose = (store: Store) => {
    haptic(8);
    onSelect(store);
    update("");
  };

  return (
    <div>
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && hits[active] ? `${listId}-${hits[active].store.id}` : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          enterKeyHint="done"
          disabled={disabled}
          placeholder={placeholder}
          value={query}
          onChange={(e) => update(e.target.value)}
          onBlur={() => {
            if (query.trim()) onBlurWithText?.();
          }}
          onKeyDown={(e) => {
            if (!hits.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, hits.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(hits[active].store);
            }
          }}
          className={cn(fieldControlClass, "h-12 pr-11 pl-10")}
        />
        {query && (
          <button
            type="button"
            aria-label="入力を消す"
            onClick={() => update("")}
            className="absolute top-1/2 right-0.5 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground active:scale-90"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="candidates"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 42 }}
            className="overflow-hidden"
          >
            {hits.length > 0 ? (
              <ul id={listId} role="listbox" aria-label="店舗の候補" className="mt-2 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                {hits.map(({ store, nameMatch, kanaMatch }, i) => (
                  <li
                    key={store.id}
                    id={`${listId}-${store.id}`}
                    role="option"
                    aria-selected={i === active}
                    // タップしても入力欄のフォーカスを外さない（離れたときのエラー表示がちらつかないように）
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(store)}
                    className={cn(
                      "flex min-h-12 cursor-pointer flex-col justify-center px-3.5 py-2 active:bg-muted",
                      i === active && "bg-muted/60",
                    )}
                  >
                    <span className="font-bold">
                      <Highlight text={store.name} range={nameMatch} />
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {!nameMatch && kanaMatch ? (
                        <>
                          <Highlight text={store.name_kana} range={kanaMatch} />
                          <span className="mx-1">·</span>
                        </>
                      ) : null}
                      {store.city}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 rounded-lg border border-dashed border-input px-3.5 py-3 text-sm text-muted-foreground">
                一致する店舗がありません。都道府県があっているか確認してください。
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
