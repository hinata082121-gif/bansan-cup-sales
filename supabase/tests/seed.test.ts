/**
 * supabase/seed.sql（SQL Editor に貼り付ける店舗投入用 SQL）の検証。
 *
 *   npm run test:db
 */
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import { createTestDb } from "./setup";

const ROOT = path.resolve(import.meta.dirname, "../..");
let db: PGlite;
let seed: string;
let expected: { id: string; name: string; name_kana: string; lat: number | null }[];

before(async () => {
  db = await createTestDb();
  seed = await readFile(path.join(ROOT, "supabase/seed.sql"), "utf8");
  expected = JSON.parse(await readFile(path.join(ROOT, "data/stores.json"), "utf8")).stores;
});

after(async () => {
  await db.close();
});

test("data/stores.json の全店舗が投入される", async () => {
  await db.exec(seed);
  const { rows } = await db.query<{ id: string; name: string; name_kana: string; lat: number | null; is_active: boolean }>(
    `select id, name, name_kana, lat, is_active from public.stores`,
  );
  assert.equal(rows.length, expected.length);
  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const s of expected) {
    const row = byId.get(s.id);
    assert.ok(row, `${s.name} が投入されていない`);
    assert.equal(row.name, s.name);
    assert.equal(row.name_kana, s.name_kana);
    assert.equal(row.lat, s.lat);
    assert.equal(row.is_active, true);
  }
});

test("何度実行してもよく、一覧に無い店舗は非表示になる", async () => {
  await db.exec(`insert into public.stores (id, name, name_kana, prefecture, city, address, official_url)
                 values ('closed-1', '閉店した店', 'へいてんしたみせ', '東京都', '新宿区', '東京都新宿区', 'https://example.com')`);
  await db.exec(seed);
  const { rows } = await db.query<{ active: number; inactive: number }>(
    `select count(*) filter (where is_active)::int as active, count(*) filter (where not is_active)::int as inactive
     from public.stores`,
  );
  assert.deepEqual(rows[0], { active: expected.length, inactive: 1 });
});
