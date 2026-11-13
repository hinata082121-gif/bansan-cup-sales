"use client";

import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { MapPinOff, SearchX, TriangleAlert } from "lucide-react";
import { useStoreProgress, useStores, type Store } from "@/lib/data/stores";
import { isPrefecture } from "@/lib/prefectures";
import { searchStores } from "@/lib/search/store-search";
import {
  LOCATION_DEPTH,
  STORE_FILTERS,
  countByFilter,
  isStoreFilter,
  parseStoresPath,
  storesInCity,
  storesPath,
  summarizeCities,
  summarizePrefectures,
  type StoreFilter,
  type StoreProgress,
  type StoresLocation,
} from "@/lib/stores/hierarchy";
import { SLIDE_TRANSITION, slideVariants } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";
import { CityList } from "./city-list";
import { PrefectureGrid } from "./prefecture-grid";
import { ListSkeleton, PrefectureGridSkeleton } from "./skeletons";
import { StoreDetail } from "./store-detail";
import { StoreList } from "./store-list";
import { StoreSearchBox, StoreSearchResults } from "./store-search";

const EMPTY_PROGRESS: ReadonlyMap<string, StoreProgress> = new Map();

/** 階層ごとのスクロール位置（戻ったときに元の位置へ） */
const scrollPositions = new Map<string, number>();

/**
 * 店舗一覧（/stores/都道府県/市区町村/店舗ID）。
 * 階層の移動は history.pushState で URL だけを書き換え、サーバーに問い合わせずに即座に切り替える
 * （Next.js の usePathname が追従する）。ブラウザの戻る・リンク共有にも対応する。
 * 進むときは右から、戻るときは左から画面ごとスライドする。
 */
export function StoresExplorer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = useMemo(() => parseStoresPath(pathname), [pathname]);
  const filterParam = searchParams.get("filter");
  const filter: StoreFilter = isStoreFilter(filterParam) ? filterParam : "all";

  const storesQuery = useStores();
  const progressQuery = useStoreProgress();
  const progress = progressQuery.data ?? EMPTY_PROGRESS;

  // 遷移の向き（深くなれば +1、浅くなれば -1）。前回の値と比べて描画中に決める
  const depth = LOCATION_DEPTH[location.level];
  const [nav, setNav] = useState({ pathname, depth, direction: 1 });
  if (nav.pathname !== pathname) {
    setNav({ pathname, depth, direction: depth >= nav.depth ? 1 : -1 });
  }

  useLayoutEffect(() => {
    const saved = scrollPositions.get(window.location.pathname);
    window.scrollTo({ top: nav.direction < 0 && saved !== undefined ? saved : 0 });
  }, [nav]);

  const navigate = useCallback((path: string) => {
    scrollPositions.set(window.location.pathname, window.scrollY);
    window.history.pushState(null, "", path + window.location.search);
  }, []);

  const setFilter = useCallback((next: StoreFilter) => {
    const params = new URLSearchParams(window.location.search);
    if (next === "all") params.delete("filter");
    else params.set("filter", next);
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, []);

  return (
    <div className="relative overflow-x-clip">
      <AnimatePresence mode="popLayout" initial={false} custom={nav.direction}>
        <motion.div
          key={pathname}
          custom={nav.direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SLIDE_TRANSITION}
          className="min-h-[calc(100dvh-7.5rem)] bg-background"
        >
          <StoresScreen
            location={location}
            filter={filter}
            stores={storesQuery.data}
            storesError={storesQuery.isError}
            onRetry={() => storesQuery.refetch()}
            progress={progress}
            navigate={navigate}
            setFilter={setFilter}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** 1 階層ぶんの画面（スライドの単位） */
function StoresScreen({
  location,
  filter,
  stores,
  storesError,
  onRetry,
  progress,
  navigate,
  setFilter,
}: {
  location: StoresLocation;
  filter: StoreFilter;
  stores: Store[] | undefined;
  storesError: boolean;
  onRetry: () => void;
  progress: ReadonlyMap<string, StoreProgress>;
  navigate: (path: string) => void;
  setFilter: (filter: StoreFilter) => void;
}) {
  const [query, setQuery] = useState("");
  const isDetail = location.level === "store";

  const scopeIds = useMemo(() => {
    if (!stores) return [];
    return stores
      .filter((s) => {
        if (location.level === "prefecture") return s.prefecture === location.prefecture;
        if (location.level === "city") return s.prefecture === location.prefecture && s.city === location.city;
        return true;
      })
      .map((s) => s.id);
  }, [stores, location]);
  const counts = useMemo(() => countByFilter(scopeIds, progress), [scopeIds, progress]);
  const hits = useMemo(() => (stores && query ? searchStores(stores, query) : []), [stores, query]);

  const openStore = (store: Store) => navigate(storesPath(store.prefecture, store.city, store.id));
  const detailStore = isDetail && stores ? stores.find((s) => s.id === location.storeId) : undefined;

  const crumbs: Crumb[] = [];
  if (location.level !== "root") {
    crumbs.push({ label: "店舗一覧", onSelect: () => navigate("/stores") });
    crumbs.push({ label: location.prefecture, onSelect: () => navigate(storesPath(location.prefecture)) });
    if (location.level === "city" || location.level === "store") {
      crumbs.push({ label: location.city, onSelect: () => navigate(storesPath(location.prefecture, location.city)) });
    }
    if (location.level === "store") crumbs.push({ label: detailStore?.name ?? "店舗" });
  }

  return (
    <div className="pb-6">
      {!isDetail && (
        <>
          <PageHeader
            title="店舗一覧"
            meta={
              stores ? (
                <>
                  1都3県 <span className="num text-base text-foreground">{stores.length}</span> 店舗
                </>
              ) : undefined
            }
          />
          <div className="flex flex-col gap-3 px-4 pb-3">
            <StoreSearchBox value={query} onChange={setQuery} />
            {!query && (
              <Segmented
                variant="tiles"
                ariaLabel="絞り込み"
                value={filter}
                onChange={setFilter}
                options={STORE_FILTERS.map((f) => ({ ...f, count: stores ? counts[f.value] : undefined }))}
              />
            )}
          </div>
        </>
      )}

      {query && !isDetail ? (
        <StoreSearchResults query={query} hits={hits} progress={progress} onSelect={openStore} />
      ) : (
        <>
          {crumbs.length > 0 && (
            <div className={isDetail ? "pt-2" : ""}>
              <Breadcrumbs crumbs={crumbs} />
            </div>
          )}
          <LevelContent
            location={location}
            filter={filter}
            stores={stores}
            storesError={storesError}
            onRetry={onRetry}
            progress={progress}
            navigate={navigate}
            openStore={openStore}
            detailStore={detailStore}
            setFilter={setFilter}
          />
        </>
      )}
    </div>
  );
}

function LevelContent({
  location,
  filter,
  stores,
  storesError,
  onRetry,
  progress,
  navigate,
  openStore,
  detailStore,
  setFilter,
}: {
  location: StoresLocation;
  filter: StoreFilter;
  stores: Store[] | undefined;
  storesError: boolean;
  onRetry: () => void;
  progress: ReadonlyMap<string, StoreProgress>;
  navigate: (path: string) => void;
  openStore: (store: Store) => void;
  detailStore: Store | undefined;
  setFilter: (filter: StoreFilter) => void;
}) {
  if (!stores) {
    if (storesError) {
      return (
        <div className="mx-4 flex items-center gap-3 rounded-lg bg-primary-soft px-4 py-3 text-sm font-bold text-primary-soft-foreground">
          <TriangleAlert aria-hidden className="size-5 shrink-0" />
          <span className="flex-1">店舗を読み込めませんでした</span>
          <Button size="sm" variant="outline" onClick={onRetry}>
            再読み込み
          </Button>
        </div>
      );
    }
    return location.level === "root" ? <PrefectureGridSkeleton /> : <ListSkeleton />;
  }

  const notFound = (
    <EmptyState
      icon={MapPinOff}
      title="見つかりませんでした"
      description="閉店したか、URL が間違っている可能性があります。"
      action={
        <Button variant="outline" onClick={() => navigate("/stores")}>
          店舗一覧に戻る
        </Button>
      }
    />
  );
  const noMatch = (
    <EmptyState
      icon={SearchX}
      title="条件に合う店舗はありません"
      description="絞り込みを「すべて」にすると、ほかの店舗も表示します。"
      action={
        <Button variant="outline" onClick={() => setFilter("all")}>
          すべて表示する
        </Button>
      }
    />
  );

  switch (location.level) {
    case "root":
      return (
        <PrefectureGrid
          summaries={summarizePrefectures(stores, filter, progress)}
          filter={filter}
          onSelect={(prefecture) => navigate(storesPath(prefecture))}
        />
      );
    case "prefecture": {
      if (!isPrefecture(location.prefecture)) return notFound;
      const cities = summarizeCities(stores, location.prefecture, filter, progress).filter(
        (c) => filter === "all" || c.matched > 0,
      );
      if (cities.length === 0) return noMatch;
      return <CityList cities={cities} onSelect={(city) => navigate(storesPath(location.prefecture, city))} />;
    }
    case "city": {
      const inCity = stores.some((s) => s.prefecture === location.prefecture && s.city === location.city);
      if (!inCity) return notFound;
      const list = storesInCity(stores, location.prefecture, location.city, filter, progress);
      if (list.length === 0) return noMatch;
      return <StoreList stores={list} progress={progress} onSelect={openStore} />;
    }
    case "store":
      if (!detailStore) return notFound;
      return <StoreDetail store={detailStore} progress={progress.get(detailStore.id)} />;
  }
}
