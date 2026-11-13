import { PREFECTURES } from "@/lib/prefectures";
import { findMatch, normalizeQuery, normalizeWithMap, type MatchRange } from "./normalize";

export type SearchableStore = { id: string; name: string; name_kana: string; prefecture: string };

export type StoreSearchHit<T extends SearchableStore> = {
  store: T;
  /** 店舗名（漢字表記）の一致範囲。読みだけで一致した場合は null */
  nameMatch: MatchRange | null;
  /** 読み（ひらがな）の一致範囲 */
  kanaMatch: MatchRange | null;
};

/**
 * 店舗名を検索する。ひらがな・カタカナ・漢字のどれで途中まで入力しても一致する。
 * 並び順: 先頭一致 → 部分一致、同じなら都道府県の表示順 → 読み順。
 */
export function searchStores<T extends SearchableStore>(stores: T[], query: string, limit = 50): StoreSearchHit<T>[] {
  const q = normalizeQuery(query);
  if (!q) return [];
  const hits: (StoreSearchHit<T> & { rank: number })[] = [];
  for (const store of stores) {
    const name = normalizeWithMap(store.name).normalized;
    const kana = normalizeWithMap(store.name_kana).normalized;
    const nameIdx = name.indexOf(q);
    const kanaIdx = kana.indexOf(q);
    if (nameIdx < 0 && kanaIdx < 0) continue;
    const prefix = nameIdx === 0 || kanaIdx === 0;
    hits.push({
      store,
      nameMatch: nameIdx >= 0 ? findMatch(store.name, q) : null,
      kanaMatch: kanaIdx >= 0 ? findMatch(store.name_kana, q) : null,
      rank: prefix ? 0 : 1,
    });
  }
  const collator = new Intl.Collator("ja");
  hits.sort(
    (a, b) =>
      a.rank - b.rank ||
      PREFECTURES.indexOf(a.store.prefecture as never) - PREFECTURES.indexOf(b.store.prefecture as never) ||
      collator.compare(a.store.name_kana, b.store.name_kana),
  );
  return hits.slice(0, limit).map(({ store, nameMatch, kanaMatch }) => ({ store, nameMatch, kanaMatch }));
}
