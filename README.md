# 晩餐杯 店舗営業

鳥貴族スタッフ限定フットサル大会「晩餐杯」の店舗営業を記録・共有する Web アプリ。

- Next.js 16（App Router）+ TypeScript / Tailwind CSS / Supabase（PostgreSQL + Auth）/ Vercel
- 利用できるのは `allowed_emails` テーブルに登録した Google アカウントだけ
- 検索エンジンには載せない（`noindex` / `robots.txt` で全拒否）

## 目次

1. [Supabase プロジェクトの作成とマイグレーション](#1-supabase-プロジェクトの作成とマイグレーション)
2. [Google ログインの設定](#2-google-ログインの設定)
3. [店舗データの投入](#3-店舗データの投入)
4. [利用者（許可メールアドレス）の追加](#4-利用者許可メールアドレスの追加)
5. [Vercel へのデプロイ](#5-vercel-へのデプロイ)
6. [ローカルでの開発](#6-ローカルでの開発)
7. [店舗データの取得と更新](#店舗データの取得と更新)

> ダッシュボードのメニュー名は変わることがあります。見当たらない場合は近い名前の項目を探してください。

---

## 1. Supabase プロジェクトの作成とマイグレーション

1. <https://supabase.com/dashboard> で **New project** を作成する
   - Region は **Northeast Asia (Tokyo)** を推奨（Vercel の関数も東京 `hnd1` で動かす設定にしてある）
2. マイグレーション（テーブル・RLS・関数）を適用する。どちらかの方法で:
   - **SQL Editor**（ターミナル不要）: `supabase/migrations/` の SQL ファイルを古い順に開き、
     全文をコピーして SQL Editor に貼り付け、**Run** する
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
   - **Project URL**: Project Settings → Data API（または画面上部の **Connect**）
   - **Publishable key**（`sb_publishable_...`）と **Secret key**（`sb_secret_...`）: Project Settings → API Keys
     - 旧形式の `anon` / `service_role` キーしか無い場合はそれでも動きます

## 2. Google ログインの設定

### Google Cloud Console

1. <https://console.cloud.google.com/> でプロジェクトを作成（既存でも可）
2. **Google Auth Platform**（旧「OAuth 同意画面」）を開き、設定する
   - **ブランディング**: アプリ名「晩餐杯 店舗営業」、サポートメール
   - **対象**: ユーザーの種類は「外部」
     - 公開ステータスが「テスト」のままだと、テストユーザーに追加した人しかログインできません。
       メール・プロフィールだけを使うアプリなので、**「本番環境に push」して公開**しておくのが楽です
       （アプリ側の許可リストで利用者を絞っているので、公開しても登録者以外は使えません）
3. **クライアント** → **クライアントを作成** → 種類は「ウェブ アプリケーション」
   - **承認済みの JavaScript 生成元**: `http://localhost:3000`、`https://<Vercel の本番ドメイン>`
   - **承認済みのリダイレクト URI**: `https://<プロジェクトの Reference ID>.supabase.co/auth/v1/callback`
     （Supabase の Google プロバイダ設定画面に表示される Callback URL と同じもの）
4. 作成された **クライアント ID** と **クライアント シークレット** を控える

### Supabase

1. **Authentication → Sign In / Providers**
   - **Google** を有効にし、クライアント ID とシークレットを貼り付けて保存
   - **Email** は無効にする（Google ログインのみにするため）
2. **Authentication → URL Configuration**
   - **Site URL**: `https://<Vercel の本番ドメイン>`
   - **Redirect URLs** に以下を追加
     - `http://localhost:3000/auth/callback`
     - `https://<Vercel の本番ドメイン>/auth/callback`
     - プレビューデプロイでも試すなら `https://*-<Vercel のチーム/ユーザー名>.vercel.app/**`

## 3. 店舗データの投入

`data/stores.json`（コミット済み）を Supabase の `stores` テーブルに投入します。どちらかの方法で:

- **SQL Editor**（ターミナル不要）: `supabase/seed.sql` の全文をコピーして SQL Editor に貼り付け、**Run** する。
  何度実行しても問題ありません（店舗データを更新したときも同じ手順）
- **コマンド**: `.env.local` に `NEXT_PUBLIC_SUPABASE_URL`・`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`・`SUPABASE_SECRET_KEY` を書いてから
  ```bash
  npm run stores:upsert
  ```
  公式サイトから取り直して投入まで一度に行う場合は `npm run stores:sync`（[店舗データの取得と更新](#店舗データの取得と更新)を参照）

> `SUPABASE_SECRET_KEY` は RLS を無視して書き込める強い権限のキーです。`.env.local` 以外には書かず、Vercel にも設定しないでください。

## 4. 利用者（許可メールアドレス）の追加

ダッシュボードの **Table Editor → `allowed_emails`** で **Insert row** し、`email` に Google アカウントのメールアドレスを入れて保存します（`note` には誰のアドレスかのメモを書けます）。

SQL Editor からでも追加できます:

```sql
insert into public.allowed_emails (email, note) values ('example@gmail.com', '山田さん');
```

- 大文字・前後の空白は自動で正規化されます
- 登録された人は、初回ログイン時に表示名を登録してから使い始めます
- 行を削除すると、その人はデータを読み書きできなくなります（すぐに反映）。画面上の「権限なし」への切り替えは最大 12 時間後です
- 登録していないアカウントでログインすると「利用権限がありません」画面が出て、自動でサインアウトされます

## 5. Vercel へのデプロイ

1. <https://vercel.com/new> でこの GitHub リポジトリを **Import**
2. **Environment Variables** に以下を設定（Production と Preview の両方）
   | 名前 | 値 |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase の Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key（または anon key） |
3. **Deploy**。以降は `main` へのプッシュで本番、プルリクエストでプレビューが自動デプロイされます
4. 本番ドメインが決まったら、[2. Google ログインの設定](#2-google-ログインの設定)の Google Cloud（JavaScript 生成元）と Supabase（Site URL / Redirect URLs）に登録する

関数のリージョンは `vercel.json` で東京（`hnd1`）にしています。

## 6. ローカルでの開発

```bash
npm install
```

```bash
npm run dev
```

<http://localhost:3000> を開く（`.env.local` が必要）。

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド |
| `npm run lint` / `npm run typecheck` | ESLint / 型チェック |
| `npm run test:db` | マイグレーションと RLS のテスト（PGlite 上で実行。Supabase は不要） |

`/design` は色・文字・部品をまとめたデザインの見本ページです（データを扱わないのでログイン不要）。
部品は `src/components/ui/`、色・角丸・書体のトークンは `src/app/globals.css` にあります。

### 認証の仕組み（メモ）

- `src/proxy.ts`（Next.js 16 で `middleware.ts` から改名された仕組み）が全ページの前で動き、未ログインならログイン画面へ回す
- 許可リストの照合はログイン直後に `/auth/check` で行い、結果をユーザー ID 付きの Cookie（12 時間）で覚える。proxy は DB に問い合わせない
- データの保護は Supabase の RLS が担う。営業記録・予定は許可ユーザー全員が閲覧でき、編集・削除は登録した本人のみ。店舗マスタは閲覧のみ

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
