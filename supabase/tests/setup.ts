/**
 * テスト用の DB。PGlite（WASM 版 PostgreSQL）上に Supabase の auth スキーマとロールを
 * 最小限再現し、supabase/migrations/*.sql を流した状態を返す。
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

const MIGRATIONS_DIR = path.resolve(import.meta.dirname, "../migrations");

/** Supabase 環境の最小限の再現 */
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;

  create schema auth;
  create table auth.users (
    id uuid primary key,
    email text,
    email_confirmed_at timestamptz
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;

  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  -- Supabase の既定: public に作られたテーブルは各ロールに全権限が付く
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
`;

export async function createTestDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) await db.exec(await readFile(path.join(MIGRATIONS_DIR, f), "utf8"));
  return db;
}
