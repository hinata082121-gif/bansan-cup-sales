# 晩餐杯 店舗営業

鳥貴族スタッフ限定フットサル大会「晩餐杯」の勧誘のために、鳥貴族の店舗を訪問して声をかける営業活動を記録・共有する Web アプリです。

- 本番: <https://bansan-cup-sales.vercel.app>
- 利用できるのは `allowed_emails` テーブルに登録した Google アカウントだけ。検索エンジンには載せない（`noindex` / `robots.txt`）
- Next.js 16（App Router）+ TypeScript / Tailwind CSS + shadcn/ui / Motion / Supabase（PostgreSQL + Auth）/ Vercel

## 目次

- [できること](#できること)
- [スマホのホーム画面に追加する](#スマホのホーム画面に追加する)
- [運用](#運用)（利用者の追加・店舗データの更新・表示名の変更）
- [セットアップ（最初の 1 回）](#セットアップ最初の-1-回)
- [開発](#開発)
- [店舗データの取得と更新](#店舗データの取得と更新)
- [うまくいかないとき](#うまくいかないとき)

---

## できること

画面下のタブで 3 つの画面を切り替えます。

### 店舗一覧
- 「都道府県 → 市区町村 → 店舗」をパンくずでたどる（URL は `/stores/東京都/豊島区/226`。戻る操作・リンク共有に対応）
- 店舗ごとの進捗バッジ: **営業済**（最終訪問日）/ **予定あり**（直近の予定日）/ **未訪問**
- 絞り込み（すべて / 未訪問 / 予定あり / 営業済）と店舗名検索（ひらがな・カタカナ・漢字・「鳥貴族」の有無を問わない）
- 店舗詳細: 住所・電話・公式ページ・Google マップ、この店舗を回る予定、営業記録の履歴、「この店舗の記録をつける」

### 記録入力
- 全員の営業記録を訪問日の新しい順に表示。右下の「記録する」で登録モーダルを開く
- 訪問日 → 店舗（都道府県 → 店舗名のオートコンプリート）→ チラシ配布状況 → 会話スタッフ（何人でも追加）→ 備考
- 店舗は店舗マスタから選んだものだけ保存できる。自分の記録だけ編集・削除できる

### 営業予定
- カレンダー（予定のある日にユーザーごとの色のドット）とリスト（今日以降、過去は展開）を切り替え
- 予定日・時間帯・回る店舗（複数・ドラッグで順番を並べ替え）・メモを登録。自分の予定だけ編集・削除できる
- 予定の詳細から「この店舗の記録を入力」で、訪問日と店舗が入った記録入力を開ける

電波が切れると画面上部に案内が出ます。店舗一覧などは端末に残っている前回のデータで表示し、保存の操作は電波が戻ると送られます。

## スマホのホーム画面に追加する

アプリのように全画面で開けるようになります。

- **iPhone（Safari）**: 本番の URL を開く → 下の共有ボタン → **ホーム画面に追加**
- **Android（Chrome）**: 本番の URL を開く → 右上の「︙」→ **ホーム画面に追加**（または **アプリをインストール**）

## 運用

### 利用者（許可メールアドレス）の追加・削除

Supabase のダッシュボードの **Table Editor → `allowed_emails`** で **Insert row** し、`email` に Google アカウントのメールアドレスを入れて保存します（`note` には誰のアドレスかのメモを書けます）。SQL Editor からでも追加できます:

```sql
insert into public.allowed_emails (email, note) values ('example@gmail.com', '山田さん');
```

- 大文字・前後の空白は自動で正規化されます
- 登録された人は、初回ログイン時に表示名を登録してから使い始めます
- 行を削除すると、その人はデータを読み書きできなくなります（すぐに反映）。画面上の「権限なし」への切り替えは最大 12 時間後です
- 登録していないアカウントでログインすると「利用権限がありません」画面が出て、自動でサインアウトされます

### 表示名の変更

アプリに変更画面はありません。**Table Editor → `profiles`** の `display_name` を書き換えてください（20 文字以内）。ユーザーの色は `color`（`c1`〜`c10`）です。

### 店舗データの更新（新店・閉店の反映）

[店舗データの取得と更新](#店舗データの取得と更新) を参照してください。ターミナルを使わない場合は、更新済みの `supabase/seed.sql` を SQL Editor に貼り付けて実行するだけです。

---

## セットアップ（最初の 1 回）

> ダッシュボードのメニュー名は変わることがあります。見当たらない場合は近い名前の項目を探してください。

### 1. Supabase プロジェクトの作成とマイグレーション

1. <https://supabase.com/dashboard> で **New project** を作成する（Region は **Northeast Asia (Tokyo)** を推奨。Vercel の関数も東京 `hnd1` で動かす設定にしてある）
2. マイグレーション（テーブル・RLS・関数）を適用する。どちらかの方法で:
   - **SQL Editor**（ターミナル不要）: `supabase/migrations/` の SQL ファイルを古い順に開き、全文をコピーして SQL Editor に貼り付け、**Run** する
   - **CLI**
     ```bash
     npx supabase login
     ```
     ```bash
     npx supabase link --project-ref <プロジェクトの Reference ID>
     ```
     ```bash
     npx supabase db push
     ```
3. 接続情報を控える
   - **Project URL**: Project Settings → Data API（`https://<Reference ID>.supabase.co`）
   - **Publishable key**（`sb_publishable_...`）と **Secret key**（`sb_secret_...`）: Project Settings → API Keys（旧形式の `anon` / `service_role` でも動きます）

### 2. Google ログインの設定

**Google Cloud Console**

1. **Google Auth Platform** を開く
   - **ブランディング**: アプリ名「晩餐杯 店舗営業」、サポートメール
   - **対象**: ユーザーの種類は「外部」。公開ステータスが「テスト」だとテストユーザーしかログインできないので、**本番環境に push** しておく（アプリ側の許可リストで利用者を絞っているので、公開しても登録者以外は使えません）
2. **クライアント** → **クライアントを作成** → 種類は「ウェブ アプリケーション」
   - **承認済みのリダイレクト URI**: `https://<Reference ID>.supabase.co/auth/v1/callback`（Supabase の Google プロバイダ設定画面に出る Callback URL と同じ）
   - **承認済みの JavaScript 生成元**（任意）: `https://bansan-cup-sales.vercel.app`、`http://localhost:3000`
3. **クライアント ID** と **クライアント シークレット** を控える（シークレットは作成時にしか表示されません）

**Supabase**

1. **Authentication → Sign In / Providers**
   - **Google** を有効にし、Client IDs（クライアント ID **だけ**。前後の空白や重複に注意）と Client Secret を入れて保存
   - **Email** は無効にする（Google ログインのみにするため）
2. **Authentication → URL Configuration**
   - **Site URL**: `https://bansan-cup-sales.vercel.app`
   - **Redirect URLs**: `https://bansan-cup-sales.vercel.app/auth/callback`、`http://localhost:3000/auth/callback`、
     プレビューデプロイでも試すなら `https://bansan-cup-sales-*-hinata082121-gifs-projects.vercel.app/**`

### 3. 店舗データの投入

`supabase/seed.sql` の全文を SQL Editor に貼り付けて **Run** する（何度実行しても問題ありません）。コマンドで行う場合は `.env.local` を用意して `npm run stores:upsert`。

### 4. 利用者の追加

[利用者（許可メールアドレス）の追加・削除](#利用者許可メールアドレスの追加削除) を参照。

### 5. Vercel へのデプロイ

1. <https://vercel.com/new> でこの GitHub リポジトリを **Import**（このリポジトリは作成済みのプロジェクト `bansan-cup-sales` に接続済み）
2. **Settings → Environment Variables** に以下を設定（Production / Preview / Development。種類は **Config**: ブラウザに配られる前提の値なので Secret にする必要はない）

   | 名前 | 値 |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase の Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key（または anon key） |

   `SUPABASE_SECRET_KEY` は Vercel には設定しないでください（RLS を無視して書き込める強い権限のキーです）
3. `main` へのプッシュで本番、プルリクエストでプレビューが自動デプロイされます。環境変数を変えたら **Deployments → 最新の「︙」→ Redeploy** で反映

---

## 開発

```bash
npm install
```

```bash
npm run dev
```

<http://localhost:3000> を開く（`.env.example` をコピーした `.env.local` が必要。Node.js 22）。

| コマンド | 内容 |
|---|---|
| `npm run dev` / `npm run build` | 開発サーバー / 本番ビルド |
| `npm run lint` / `npm run typecheck` | ESLint / 型チェック |
| `npm test` | 単体テスト（店舗名検索の表記ゆれ、階層・絞り込み、入力チェック、カレンダー計算） |
| `npm run test:db` | マイグレーションと RLS のテスト（PGlite 上で実行。Supabase は不要） |

### 構成

| 場所 | 内容 |
|---|---|
| `src/app/(app)/` | ログイン後の 3 画面（`stores/[[...path]]`・`visits`・`schedules`）とヘッダー・タブ |
| `src/app/login`・`onboarding`・`unauthorized`・`auth/*` | ログイン・初回の表示名登録・権限なし・認証のコールバック |
| `src/components/ui/` | 基本部品（ボタン・バッジ・ボトムシート・切り替え・保存ボタンなど） |
| `src/components/{stores,visits,schedules}/` | 各画面の部品 |
| `src/lib/data/` | Supabase からの取得・保存（TanStack Query。店舗マスタと進捗は端末にも保存） |
| `src/lib/search/` | 店舗名検索（店舗一覧・記録入力・営業予定で共通） |
| `src/proxy.ts` | 未ログイン時のリダイレクト（Next.js 16 で `middleware.ts` から改名された仕組み） |
| `supabase/migrations/` | テーブル・RLS・ビュー・RPC |

### 仕組みのメモ

- **認証**: proxy は Cookie だけを見て（DB には問い合わせない）未ログインならログイン画面へ。許可リストの照合はログイン直後に `/auth/check` で行い、結果をユーザー ID 付きの Cookie（12 時間）で覚える。データの保護は Supabase の RLS が担う（営業記録・予定は許可ユーザー全員が閲覧、編集・削除は本人のみ。店舗マスタは閲覧のみ）
- **画面の描画**: ログイン中のユーザーのデータで描く画面は、事前描画ではスケルトンだけを出し、ブラウザで描画する（`ClientOnly`）。Cache Components 有効時に事前描画で現在時刻や Cookie を読まないため
- **店舗一覧の階層移動**: `history.pushState` で URL だけを書き換え、サーバーに問い合わせずに切り替える（Next.js 16 の `usePathname` が追従する）
- **保存**: 記録とスタッフ、予定と回る店舗は、それぞれ 1 トランザクションの RPC（`save_visit` / `save_schedule`）で保存する

### デザインのルール

- 色・角丸・書体のトークンは `src/app/globals.css`。見本ページ `/design`（ログインが必要）で一覧できる
- 黄は「面」（ヘッダー・選択中・ハイライト）、赤は「点」（保存・記録するなどの主要ボタン）。文字は WCAG AA を満たす
- 絵文字は使わず、アイコンは Lucide。左ボーダーのアクセントカード・グラデーション・すりガラス・発光は使わない。角丸は 4〜8px、影は付けず罫線と背景色の差で区切る
- タップ領域は 44px 以上、入力欄は 16px 以上（iOS のズーム防止）。`prefers-reduced-motion` では動きを控えめにする

---

## 店舗データの取得と更新

1都3県（埼玉県・東京都・神奈川県・千葉県）の鳥貴族店舗を公式店舗マップから取得し、
`data/stores.json` に書き出します。アプリは公式サイトにアクセスせず、このファイルを投入した DB を使います。

| コマンド | 内容 |
|---|---|
| `npm run stores:sync` | 取得 → `data/stores.json` 書き出し → Supabase へ投入（新店・閉店の反映はこれ 1 つ） |
| `npm run stores:upsert` | 取得せず、コミット済みの `data/stores.json` を Supabase へ投入 |
| `npm run fetch-stores` | 取得して `data/stores.json` と `supabase/seed.sql` を書き出すだけ（`-- --dry` で差分表示のみ） |

- 取得元: <https://map.torikizoku.co.jp/map/> が内部で呼んでいる店舗検索 API
  （`https://api.site.can-ly.com/v2/directories/74/shops/search`）。日本全体を覆う範囲を指定して
  **1 回のリクエスト**で全店舗を取得し、1都3県・「鳥貴族」ブランド・閉店以外に絞り込みます
- 実行すると前回の `data/stores.json` との差分（新店・閉店）を表示します
- 一覧から消えた店舗は DB から削除せず `is_active = false` にします（過去の営業記録を残すため）
- 店舗 ID には公式の店舗コード（公式ページ URL `https://map.torikizoku.co.jp/detail/{店舗コード}/` の番号）を使います
- 市区町村は公式マップのエリア区分と同じく、政令指定都市（さいたま市・千葉市・横浜市・川崎市・相模原市）は区に分けず市でまとめます
- 開店前の店舗は `opening_note`（例: `2026年12月16日オープン予定`）付きで含めます
- `data/stores.json` を書き出すと、SQL Editor 用の `supabase/seed.sql` も作り直します
- 更新したら `data/stores.json` と `supabase/seed.sql` をコミットしてください

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
- 編集したら `npm run stores:sync` を再実行して反映します（API を呼ばずに試すなら、
  保存した API レスポンスを `npm run fetch-stores -- --input <file>` で渡せます）

---

## うまくいかないとき

| 症状 | 原因と対処 |
|---|---|
| Google の画面で `redirect_uri_mismatch` | Google のクライアントの「承認済みのリダイレクト URI」に Supabase の Callback URL が入っていない |
| Google の画面で `invalid_client`（OAuth client was not found） | Supabase の Client IDs が間違っている（数字の重複・空白・古い ID が先頭に残っているなど）。クライアント ID だけを入れ直す |
| Google で「アクセスをブロック」「テスト中」 | Google Auth Platform の公開ステータスが「テスト」のまま。**本番環境に push** するか、テストユーザーに追加する |
| Google から戻ると「ログインに失敗しました」 | Supabase の Redirect URLs に `…/auth/callback` が無い。Vercel のログに `Unable to exchange external code` と出ている場合はクライアント シークレットの誤り（新しく発行して入れ直す） |
| 自分なのに「利用権限がありません」 | `allowed_emails` のメールアドレスの打ち間違い |
| 「利用権限を確認できませんでした」 | マイグレーションが適用されていない |
| 店舗一覧が空 | `supabase/seed.sql` を実行していない |
