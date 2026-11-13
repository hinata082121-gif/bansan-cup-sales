/**
 * 鳥貴族 公式店舗マップから 1都3県の店舗を取得し、data/stores.json を生成して
 * Supabase の stores テーブルへ投入する。
 *
 *   npm run stores:sync             # 取得 → data/stores.json 書き出し → Supabase へ upsert
 *   npm run stores:upsert           # 取得せず、コミット済みの data/stores.json を Supabase へ upsert
 *   npm run fetch-stores            # 取得して data/stores.json を書き出すだけ
 *   npm run fetch-stores -- --dry   # 取得と差分表示のみ（ファイルは書き換えない）
 *   npm run fetch-stores -- --input saved.json
 *                                   # API を呼ばず、保存済みの API レスポンスから生成する
 *
 * Supabase への投入には .env.local の NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SECRET_KEY を使う。
 *
 * Node 22 の fetch は HTTPS_PROXY を読まないので、プロキシ環境では
 * NODE_USE_ENV_PROXY=1 を付けて実行する。
 *
 * 取得元について
 *   https://map.torikizoku.co.jp/map/ は Next.js 製のページで、店舗一覧はブラウザから
 *   下記の検索 API を呼んで描画している（ページの Network タブで確認できる）。
 *     GET https://api.site.can-ly.com/v2/directories/74/shops/search
 *   地図の表示範囲（緯度経度の矩形）をパラメータに取るので、日本全体を覆う矩形を
 *   指定すると全店舗が 1 リクエストで返る。アクセスはこの 1 回だけ。
 */
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import kuromoji from "kuromoji";
import { createClient } from "@supabase/supabase-js";

const API_URL =
  "https://api.site.can-ly.com/v2/directories/74/shops/search" +
  "?location_filter=true&sort=off" +
  "&map_min_latitude=24&map_min_longitude=122" +
  "&map_max_latitude=46&map_max_longitude=146";

const OFFICIAL_URL = (storeCode: string) =>
  `https://map.torikizoku.co.jp/detail/${storeCode}/`;

/** 対象都道府県（アプリでの表示順） */
const PREFECTURES = ["埼玉県", "東京都", "神奈川県", "千葉県"] as const;
type Prefecture = (typeof PREFECTURES)[number];

const TARGET_BRAND = "鳥貴族";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_PATH = path.join(ROOT, "data/stores.json");
const OVERRIDES_PATH = path.join(ROOT, "data/store-kana-overrides.json");

// ---------------------------------------------------------------------------
// 型
// ---------------------------------------------------------------------------

/** API が返す店舗（使う項目のみ） */
type ApiShop = {
  id: number;
  storeCode: string;
  nameKanji: string;
  nameKana: string;
  latitude: string | null;
  longitude: string | null;
  openStatus: string; // "IS_ALREADY_OPEN" | "IS_CLOSED" | ...
  address: string;
  zipCode: string | null;
  tel: string | null;
  brand: { id: number; name: string } | null;
};

type Store = {
  /** 公式の店舗コード（公式ページ URL にも使われる。安定した ID として採用） */
  id: string;
  /** 「鳥貴族」を除いた店舗名（例: 池袋東口店） */
  name: string;
  /** name の読み（ひらがな） */
  name_kana: string;
  prefecture: Prefecture;
  /** 市区町村。政令指定都市は区まで分けず市でまとめる（公式マップと同じ粒度） */
  city: string;
  /** 都道府県を含む住所（公式の表記のまま） */
  address: string;
  zip_code: string | null;
  tel: string | null;
  lat: number | null;
  lng: number | null;
  official_url: string;
  /** 開店前の店舗の注記（例: 2026年12月16日オープン予定）。開店済みなら null */
  opening_note: string | null;
};

type StoresFile = {
  source: string;
  fetched_at: string;
  counts: Record<string, number>;
  stores: Store[];
};

type KanaOverrides = Record<string, { name?: string; kana: string }>;

// ---------------------------------------------------------------------------
// 取得
// ---------------------------------------------------------------------------

async function fetchShops(inputPath: string | null): Promise<ApiShop[]> {
  if (inputPath) {
    const json = JSON.parse(await readFile(inputPath, "utf8")) as { shops?: ApiShop[] };
    if (!Array.isArray(json.shops)) throw new Error(`${inputPath} に shops がありません`);
    return json.shops;
  }
  const res = await fetch(API_URL, {
    headers: { Accept: "application/json", "User-Agent": "bansan-cup-store-sync/1.0" },
  });
  if (!res.ok) {
    throw new Error(`店舗 API の取得に失敗しました: HTTP ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as { shops?: ApiShop[] };
  if (!Array.isArray(json.shops) || json.shops.length === 0) {
    throw new Error("店舗 API のレスポンスに shops がありません。API の仕様が変わった可能性があります。");
  }
  return json.shops;
}

// ---------------------------------------------------------------------------
// 整形
// ---------------------------------------------------------------------------

/** 全角英数・記号を半角に、全角スペースを半角に */
function toHalfWidth(s: string): string {
  return s
    .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/　/g, " ");
}

/** カタカナ → ひらがな（地名の「ヶ」は「が」と読む） */
function kataToHira(s: string): string {
  return s
    .replace(/[ヶヵ]/g, (c) => (c === "ヶ" ? "が" : "か"))
    .replace(/[ァ-ヴ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

/**
 * 公式の店舗名を分解する。
 *   "鳥貴族 北浦和店（2026年12月16日オープン予定！）"
 *     → { name: "北浦和店", openingNote: "2026年12月16日オープン予定" }
 */
function parseName(nameKanji: string): { name: string; openingNote: string | null } {
  let name = nameKanji.trim().replace(/^鳥貴族[\s　]*/, "");
  let openingNote: string | null = null;
  const m = name.match(/[（(]([^（）()]*オープン予定)[！!]?[）)]/);
  if (m) {
    openingNote = m[1];
    name = name.replace(m[0], "");
  }
  return { name: name.trim(), openingNote };
}

function parsePrefecture(address: string): Prefecture | null {
  return PREFECTURES.find((p) => address.startsWith(p)) ?? null;
}

/**
 * 都道府県を除いた住所から市区町村を取り出す。
 *   東京都豊島区…       → 豊島区
 *   神奈川県横浜市港北区… → 横浜市（政令市は市でまとめる）
 *   東京都西多摩郡瑞穂町… → 西多摩郡瑞穂町
 * 「市」「区」で終わる最短の 2 文字以上の接頭辞を取る（市川市・市原市・東村山市も正しく取れる）。
 */
function parseCity(address: string, prefecture: Prefecture): string | null {
  const rest = address.slice(prefecture.length).trim();
  const gun = rest.match(/^(.{1,5}?郡.{1,5}?[町村])/);
  if (gun) return gun[1];
  for (let i = 1; i < Math.min(rest.length, 8); i++) {
    if (rest[i] === "市" || rest[i] === "区") return rest.slice(0, i + 1);
  }
  const town = rest.match(/^(.{1,5}?[町村])/);
  return town ? town[1] : null;
}

function parseCoord(v: string | null): number | null {
  if (v == null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? Math.round(n * 1e7) / 1e7 : null;
}

// ---------------------------------------------------------------------------
// ふりがな
// ---------------------------------------------------------------------------

type Tokenizer = kuromoji.Tokenizer<kuromoji.IpadicFeatures>;

function buildTokenizer(): Promise<Tokenizer> {
  const require = createRequire(import.meta.url);
  const dicPath = path.join(path.dirname(require.resolve("kuromoji")), "..", "dict");
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath }).build((err, tokenizer) => (err ? reject(err) : resolve(tokenizer)));
  });
}

const KANJI_DIGITS = "〇一二三四五六七八九";

/**
 * 店舗名の読みを自動生成する。地名の読みは辞書だけでは誤りやすいので、
 * 店舗名に共通するパターンだけここで補正し、個別の誤りは上書きファイルで直す。
 *   - 括弧内の補足（例:「（東京都）」）は読まない
 *   - 数字は漢数字にしてから読ませる（3丁目 → さんちょうめ、2号店 → にごうてん）
 *   - 末尾の「店」は常に「てん」（辞書だと「みせ」になることがある）
 *   - 「〜通り」は連濁して「どおり」
 */
function generateKana(tokenizer: Tokenizer, name: string): string {
  const base = toHalfWidth(name)
    .replace(/[（(][^（）()]*[）)]/g, "")
    .replace(/[0-9]/g, (d) => KANJI_DIGITS[Number(d)])
    .trim();
  const tokens = tokenizer.tokenize(base);
  const reading = tokens
    .map((t, i) => {
      if (i === tokens.length - 1 && t.surface_form === "店") return "テン";
      return t.reading && t.reading !== "*" ? t.reading : t.surface_form;
    })
    .join("");
  return kataToHira(reading).replace(/\s+/g, "").toLowerCase().replace(/とおりてん$/, "どおりてん");
}

async function loadOverrides(): Promise<KanaOverrides> {
  try {
    return JSON.parse(await readFile(OVERRIDES_PATH, "utf8")) as KanaOverrides;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw e;
  }
}

// ---------------------------------------------------------------------------
// メイン
// ---------------------------------------------------------------------------

async function loadPrevious(): Promise<Store[]> {
  try {
    return (JSON.parse(await readFile(OUT_PATH, "utf8")) as StoresFile).stores;
  } catch {
    return [];
  }
}

async function buildStores(
  inputPath: string | null,
): Promise<{ stores: Store[]; warnings: string[] }> {
  const [shops, tokenizer, overrides] = await Promise.all([
    fetchShops(inputPath),
    buildTokenizer(),
    loadOverrides(),
  ]);
  const warnings: string[] = [];
  const stores: Store[] = [];

  for (const s of shops) {
    const prefecture = parsePrefecture(s.address ?? "");
    if (!prefecture) continue;
    if (s.brand?.name !== TARGET_BRAND) continue;
    if (s.openStatus === "IS_CLOSED") continue;

    const { name, openingNote } = parseName(s.nameKanji);
    const city = parseCity(s.address, prefecture);
    if (!city) warnings.push(`市区町村を判定できません: ${s.nameKanji} / ${s.address}`);

    const override = overrides[s.storeCode];
    stores.push({
      id: s.storeCode,
      name,
      name_kana: override?.kana ?? generateKana(tokenizer, name),
      prefecture,
      city: city ?? "不明",
      address: s.address.trim(),
      zip_code: s.zipCode?.trim() || null,
      tel: s.tel?.trim() || null,
      lat: parseCoord(s.latitude),
      lng: parseCoord(s.longitude),
      official_url: OFFICIAL_URL(s.storeCode),
      opening_note: openingNote,
    });
  }

  for (const code of Object.keys(overrides)) {
    if (!stores.some((s) => s.id === code)) {
      warnings.push(`ふりがな上書きの店舗コード ${code}（${overrides[code].name ?? "?"}）は取得結果にありません`);
    }
  }

  const collator = new Intl.Collator("ja");
  stores.sort(
    (a, b) =>
      PREFECTURES.indexOf(a.prefecture) - PREFECTURES.indexOf(b.prefecture) ||
      collator.compare(a.city, b.city) ||
      collator.compare(a.name_kana, b.name_kana),
  );
  return { stores, warnings };
}

// ---------------------------------------------------------------------------
// Supabase への投入
// ---------------------------------------------------------------------------

/**
 * stores テーブルへ upsert する。今回の一覧に無い店舗（閉店など）は削除せず
 * is_active = false にする（過去の営業記録が参照しているため）。
 */
async function upsertStores(stores: Store[]) {
  try {
    process.loadEnvFile(path.join(ROOT, ".env.local"));
  } catch {
    // .env.local が無ければ環境変数をそのまま使う
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error(
      "Supabase に投入するには NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SECRET_KEY が必要です（.env.local に設定してください）",
    );
  }
  const supabase = createClient(url, secretKey, { auth: { persistSession: false } });
  const now = new Date().toISOString();

  const rows = stores.map((s) => ({ ...s, is_active: true, updated_at: now }));
  const { error } = await supabase.from("stores").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`stores への upsert に失敗しました: ${error.message}`);

  const { data: active, error: selectError } = await supabase
    .from("stores")
    .select("id, name")
    .eq("is_active", true);
  if (selectError) throw new Error(`stores の取得に失敗しました: ${selectError.message}`);

  const ids = new Set(stores.map((s) => s.id));
  const gone = (active ?? []).filter((s) => !ids.has(s.id));
  if (gone.length > 0) {
    const { error } = await supabase
      .from("stores")
      .update({ is_active: false, updated_at: now })
      .in(
        "id",
        gone.map((s) => s.id),
      );
    if (error) throw new Error(`閉店店舗の更新に失敗しました: ${error.message}`);
  }

  console.log(`\nSupabase の stores に ${rows.length} 件を upsert しました`);
  for (const s of gone) console.log(`  一覧から外れたため非表示にした店舗: ${s.name}（${s.id}）`);
}

// ---------------------------------------------------------------------------
// メイン
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const upsert = args.includes("--upsert");
  const noFetch = args.includes("--no-fetch");
  const inputIdx = args.indexOf("--input");
  const inputPath = inputIdx >= 0 ? path.resolve(args[inputIdx + 1] ?? "") : null;

  const previous = await loadPrevious();

  if (noFetch) {
    if (previous.length === 0) throw new Error("data/stores.json がありません。先に npm run fetch-stores を実行してください");
    console.log(`data/stores.json の ${previous.length} 件を使います（取得はしません）`);
    if (upsert) await upsertStores(previous);
    return;
  }

  const { stores, warnings } = await buildStores(inputPath);

  const counts = Object.fromEntries(
    PREFECTURES.map((p) => [p, stores.filter((s) => s.prefecture === p).length]),
  );
  const file: StoresFile = {
    source: "https://map.torikizoku.co.jp/map/",
    fetched_at: new Date().toISOString(),
    counts: { ...counts, 合計: stores.length },
    stores,
  };

  console.log("店舗数:");
  for (const [p, n] of Object.entries(file.counts)) console.log(`  ${p.padEnd(4, "　")} ${n}`);

  if (previous.length > 0) {
    const prevIds = new Set(previous.map((s) => s.id));
    const nextIds = new Set(stores.map((s) => s.id));
    const added = stores.filter((s) => !prevIds.has(s.id));
    const removed = previous.filter((s) => !nextIds.has(s.id));
    console.log(`\n前回との差分: 追加 ${added.length} / 削除 ${removed.length}`);
    for (const s of added) console.log(`  + ${s.prefecture} ${s.name}`);
    for (const s of removed) console.log(`  - ${s.prefecture} ${s.name}`);
  }

  if (warnings.length > 0) {
    console.warn("\n警告:");
    for (const w of warnings) console.warn(`  ${w}`);
  }

  if (dry) {
    console.log("\n--dry のためファイルの書き換えと投入はしていません");
    return;
  }
  await writeFile(OUT_PATH, JSON.stringify(file, null, 2) + "\n", "utf8");
  console.log(`\n${path.relative(ROOT, OUT_PATH)} を書き出しました`);

  if (upsert) await upsertStores(stores);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
