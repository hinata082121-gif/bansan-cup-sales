# 晩餐杯 店舗営業

鳥貴族スタッフ限定フットサル大会「晩餐杯」の店舗営業を記録・共有する Web アプリ。

> セットアップ手順（Supabase / Google OAuth / Vercel）は後続フェーズで追記します。

## 店舗データの取得と更新

1都3県（埼玉県・東京都・神奈川県・千葉県）の鳥貴族店舗を公式店舗マップから取得し、
`data/stores.json` に書き出します。アプリは公式サイトにアクセスせず、このファイル（を投入した DB）を使います。

```bash
npm run fetch-stores
```

- 取得元: <https://map.torikizoku.co.jp/map/> が内部で呼んでいる店舗検索 API
  （`https://api.site.can-ly.com/v2/directories/74/shops/search`）。日本全体を覆う範囲を指定して
  **1 回のリクエスト**で全店舗を取得し、1都3県・「鳥貴族」ブランド・閉店以外に絞り込みます
- 実行すると前回の `data/stores.json` との差分（新店・閉店）を表示します。`--dry` を付けるとファイルを書き換えません
- 店舗 ID には公式の店舗コード（公式ページ URL `https://map.torikizoku.co.jp/detail/{店舗コード}/` の番号）を使います
- 市区町村は公式マップのエリア区分と同じく、政令指定都市（さいたま市・千葉市・横浜市・川崎市・相模原市）は区に分けず市でまとめます
- 開店前の店舗は `opening_note`（例: `2026年12月16日オープン予定`）付きで含めます

### ふりがな（`name_kana`）

店舗名の読みは形態素解析（kuromoji）で自動生成します。地名は誤読しやすいため、
誤りは `data/store-kana-overrides.json` で上書きします。

```json
{
  "652": { "name": "熊谷駅前店", "kana": "くまがやえきまえてん" }
}
```

- キーは店舗コード（`data/stores.json` の `id`）。`name` は見やすさのためのメモで、処理には使いません
- `kana` はひらがなで、末尾の「てん」まで含めて書きます
- 編集したら `npm run fetch-stores` を再実行して反映します（API を呼ばずに試すなら、
  保存した API レスポンスを `npm run fetch-stores -- --input <file>` で渡せます）
