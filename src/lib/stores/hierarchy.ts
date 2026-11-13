import { PREFECTURES, type Prefecture } from "@/lib/prefectures";

export type StoreProgress = {
  lastVisitDate: string | null;
  visitCount: number;
  nextScheduleDate: string | null;
};

export type StoreFilter = "all" | "unvisited" | "scheduled" | "visited";

export const STORE_FILTERS: { value: StoreFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "unvisited", label: "未訪問" },
  { value: "scheduled", label: "予定あり" },
  { value: "visited", label: "営業済" },
];

export function isStoreFilter(value: string | null): value is StoreFilter {
  return value === "all" || value === "unvisited" || value === "scheduled" || value === "visited";
}

type ProgressMap = ReadonlyMap<string, StoreProgress>;

export function isVisited(id: string, progress: ProgressMap) {
  return Boolean(progress.get(id)?.lastVisitDate);
}
export function isScheduled(id: string, progress: ProgressMap) {
  return Boolean(progress.get(id)?.nextScheduleDate);
}

/** 絞り込み条件に合うか（「営業済」と「予定あり」は重なることがある） */
export function matchesFilter(id: string, filter: StoreFilter, progress: ProgressMap): boolean {
  switch (filter) {
    case "all":
      return true;
    case "visited":
      return isVisited(id, progress);
    case "scheduled":
      return isScheduled(id, progress);
    case "unvisited":
      return !isVisited(id, progress) && !isScheduled(id, progress);
  }
}

export function countByFilter(ids: string[], progress: ProgressMap): Record<StoreFilter, number> {
  const counts: Record<StoreFilter, number> = { all: ids.length, unvisited: 0, scheduled: 0, visited: 0 };
  for (const id of ids) {
    if (isVisited(id, progress)) counts.visited++;
    if (isScheduled(id, progress)) counts.scheduled++;
    if (!isVisited(id, progress) && !isScheduled(id, progress)) counts.unvisited++;
  }
  return counts;
}

type HierarchyStore = { id: string; prefecture: string; city: string; name_kana: string };

export type AreaSummary = {
  name: string;
  total: number;
  /** 絞り込み条件に合う店舗数 */
  matched: number;
  visited: number;
  scheduled: number;
};

function summarize(name: string, ids: string[], filter: StoreFilter, progress: ProgressMap): AreaSummary {
  const counts = countByFilter(ids, progress);
  return { name, total: ids.length, matched: counts[filter], visited: counts.visited, scheduled: counts.scheduled };
}

/** 都道府県ごとの集計（表示順） */
export function summarizePrefectures(stores: HierarchyStore[], filter: StoreFilter, progress: ProgressMap): AreaSummary[] {
  return PREFECTURES.map((pref) =>
    summarize(
      pref,
      stores.filter((s) => s.prefecture === pref).map((s) => s.id),
      filter,
      progress,
    ),
  );
}

/** 都道府県内の市区町村ごとの集計。店舗の多い順（同数なら名前順） */
export function summarizeCities(
  stores: HierarchyStore[],
  prefecture: Prefecture,
  filter: StoreFilter,
  progress: ProgressMap,
): AreaSummary[] {
  const byCity = new Map<string, string[]>();
  for (const s of stores) {
    if (s.prefecture !== prefecture) continue;
    const list = byCity.get(s.city) ?? [];
    list.push(s.id);
    byCity.set(s.city, list);
  }
  const collator = new Intl.Collator("ja");
  return [...byCity.entries()]
    .map(([city, ids]) => summarize(city, ids, filter, progress))
    .sort((a, b) => b.total - a.total || collator.compare(a.name, b.name));
}

/** 市区町村内の店舗（読み順）。絞り込み条件に合うものだけ */
export function storesInCity<T extends HierarchyStore>(
  stores: T[],
  prefecture: string,
  city: string,
  filter: StoreFilter,
  progress: ProgressMap,
): T[] {
  const collator = new Intl.Collator("ja");
  return stores
    .filter((s) => s.prefecture === prefecture && s.city === city && matchesFilter(s.id, filter, progress))
    .sort((a, b) => collator.compare(a.name_kana, b.name_kana));
}

// -----------------------------------------------------------------------------
// URL（/stores/都道府県/市区町村/店舗ID）
// -----------------------------------------------------------------------------

export type StoresLocation =
  | { level: "root" }
  | { level: "prefecture"; prefecture: string }
  | { level: "city"; prefecture: string; city: string }
  | { level: "store"; prefecture: string; city: string; storeId: string };

export function parseStoresPath(pathname: string): StoresLocation {
  const segments = pathname
    .replace(/^\/stores\/?/, "")
    .split("/")
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });
  const [prefecture, city, storeId] = segments;
  if (storeId) return { level: "store", prefecture, city, storeId };
  if (city) return { level: "city", prefecture, city };
  if (prefecture) return { level: "prefecture", prefecture };
  return { level: "root" };
}

export function storesPath(...segments: string[]): string {
  return ["/stores", ...segments.map(encodeURIComponent)].join("/");
}

export const LOCATION_DEPTH: Record<StoresLocation["level"], number> = { root: 0, prefecture: 1, city: 2, store: 3 };
