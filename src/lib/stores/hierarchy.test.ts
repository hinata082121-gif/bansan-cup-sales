import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countByFilter,
  parseStoresPath,
  storesInCity,
  storesPath,
  summarizeCities,
  summarizePrefectures,
  type StoreProgress,
} from "./hierarchy";

const S = (id: string, prefecture: string, city: string, name_kana: string) => ({ id, prefecture, city, name_kana });
const STORES = [
  S("1", "東京都", "豊島区", "いけぶくろひがしぐちてん"),
  S("2", "東京都", "豊島区", "いけぶくろきたぐちてん"),
  S("3", "東京都", "新宿区", "しんじゅくてん"),
  S("4", "埼玉県", "さいたま市", "うらわてん"),
];
const P = (last: string | null, next: string | null): StoreProgress => ({ lastVisitDate: last, visitCount: last ? 1 : 0, nextScheduleDate: next });
const PROGRESS = new Map([
  ["1", P("2026-11-08", "2026-11-27")], // 営業済 + 予定あり
  ["3", P(null, "2026-11-20")], // 予定あり
]);

test("絞り込みごとの件数（営業済と予定ありは重なる）", () => {
  assert.deepEqual(countByFilter(["1", "2", "3", "4"], PROGRESS), { all: 4, unvisited: 2, scheduled: 2, visited: 1 });
});

test("都道府県・市区町村の集計", () => {
  const prefs = summarizePrefectures(STORES, "unvisited", PROGRESS);
  assert.deepEqual(prefs.map((p) => [p.name, p.total, p.matched]), [
    ["埼玉県", 1, 1],
    ["東京都", 3, 1],
    ["神奈川県", 0, 0],
    ["千葉県", 0, 0],
  ]);
  const cities = summarizeCities(STORES, "東京都", "all", PROGRESS);
  assert.deepEqual(cities.map((c) => [c.name, c.total, c.visited, c.scheduled]), [
    ["豊島区", 2, 1, 1],
    ["新宿区", 1, 0, 1],
  ]);
});

test("市区町村内の店舗は読み順、絞り込みに合うものだけ", () => {
  assert.deepEqual(storesInCity(STORES, "東京都", "豊島区", "all", PROGRESS).map((s) => s.id), ["2", "1"]);
  assert.deepEqual(storesInCity(STORES, "東京都", "豊島区", "unvisited", PROGRESS).map((s) => s.id), ["2"]);
});

test("URL と階層の相互変換", () => {
  assert.deepEqual(parseStoresPath("/stores"), { level: "root" });
  assert.deepEqual(parseStoresPath("/stores/"), { level: "root" });
  const path = storesPath("東京都", "豊島区", "226");
  assert.equal(path, "/stores/%E6%9D%B1%E4%BA%AC%E9%83%BD/%E8%B1%8A%E5%B3%B6%E5%8C%BA/226");
  assert.deepEqual(parseStoresPath(path), { level: "store", prefecture: "東京都", city: "豊島区", storeId: "226" });
  assert.deepEqual(parseStoresPath("/stores/東京都/豊島区"), { level: "city", prefecture: "東京都", city: "豊島区" });
});
