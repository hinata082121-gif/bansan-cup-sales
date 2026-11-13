import { test } from "node:test";
import assert from "node:assert/strict";
import { findMatch, normalizeQuery } from "./normalize";
import { searchStores } from "./store-search";

const STORES = [
  { id: "226", name: "池袋東口店", name_kana: "いけぶくろひがしぐちてん", prefecture: "東京都" },
  { id: "286", name: "池袋北口店", name_kana: "いけぶくろきたぐちてん", prefecture: "東京都" },
  { id: "589", name: "南池袋公園前店", name_kana: "みなみいけぶくろこうえんまえてん", prefecture: "東京都" },
  { id: "407", name: "幡ヶ谷店", name_kana: "はたがやてん", prefecture: "東京都" },
  { id: "295", name: "三軒茶屋店", name_kana: "さんげんじゃやてん", prefecture: "東京都" },
  { id: "521", name: "京急川崎２号店", name_kana: "けいきゅうかわさきにごうてん", prefecture: "神奈川県" },
  { id: "433", name: "渋谷マークシティ前店", name_kana: "しぶやまーくしてぃまえてん", prefecture: "東京都" },
  { id: "652", name: "熊谷駅前店", name_kana: "くまがやえきまえてん", prefecture: "埼玉県" },
];
const ids = (q: string) => searchStores(STORES, q).map((h) => h.store.id);

test("ひらがなでも漢字でも途中まで入れれば候補に出る", () => {
  assert.deepEqual(ids("いけぶ"), ["286", "226", "589"]);
  assert.deepEqual(ids("池袋"), ["286", "226", "589"]);
});

test("先頭一致が部分一致より先に並ぶ", () => {
  assert.equal(ids("いけぶくろ").at(-1), "589");
});

test("カタカナ・半角カタカナ・全角英数字の表記ゆれを吸収する", () => {
  assert.deepEqual(ids("イケブ"), ["286", "226", "589"]);
  assert.deepEqual(ids("ｲｹﾌﾞ"), ["286", "226", "589"]);
  assert.deepEqual(ids("川崎2"), ["521"]);
  assert.deepEqual(ids("マーク"), ["433"]);
  assert.deepEqual(ids("ﾏｰｸ"), ["433"]);
});

test("「鳥貴族」の有無や空白は無視する", () => {
  assert.deepEqual(ids("鳥貴族 池袋東口"), ["226"]);
  assert.deepEqual(ids("とりきぞく いけぶくろひがし"), ["226"]);
  assert.deepEqual(ids("  "), []);
});

test("地名の「ヶ」や「ぢ/じ」のゆれを吸収する", () => {
  assert.deepEqual(ids("幡ヶ谷"), ["407"]);
  assert.deepEqual(ids("はたがや"), ["407"]);
  assert.deepEqual(ids("さんげんぢゃや"), ["295"]);
  assert.deepEqual(ids("さんげんじゃや"), ["295"]);
});

test("一致した部分を元の表記の位置で返す", () => {
  const [hit] = searchStores(STORES, "ひがしぐち");
  assert.equal(hit.store.id, "226");
  assert.equal(hit.nameMatch, null);
  assert.deepEqual(hit.kanaMatch, { start: 5, end: 10 });
  assert.deepEqual(findMatch("池袋東口店", normalizeQuery("東口")), { start: 2, end: 4 });
  assert.deepEqual(findMatch("京急川崎２号店", normalizeQuery("2号")), { start: 4, end: 6 });
  assert.deepEqual(findMatch("幡ヶ谷店", normalizeQuery("ヶ谷")), { start: 1, end: 3 });
});
