/**
 * マイグレーションと RLS の検証。
 * PGlite（WASM 版 PostgreSQL）上に Supabase の auth スキーマとロールを最小限再現し、
 * supabase/migrations/*.sql を流してから、ユーザーを切り替えて権限を確認する。
 *
 *   npm run test:db
 */
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import type { PGlite } from "@electric-sql/pglite";
import { createTestDb } from "./setup";

const USERS = {
  alice: "00000000-0000-0000-0000-00000000000a", // 許可済み
  bob: "00000000-0000-0000-0000-00000000000b", // 許可済み
  carol: "00000000-0000-0000-0000-00000000000c", // 未許可
  dave: "00000000-0000-0000-0000-00000000000d", // 許可リストにあるがメール未確認
} as const;
type UserKey = keyof typeof USERS;

let db: PGlite;

/** 指定したユーザー（または anon）として SQL を実行する */
async function as<T = Record<string, unknown>>(
  who: UserKey | "anon",
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  return db.transaction(async (tx) => {
    if (who === "anon") {
      await tx.exec(`set local role anon; select set_config('request.jwt.claim.sub', '', true);`);
    } else {
      await tx.exec(
        `set local role authenticated; select set_config('request.jwt.claim.sub', '${USERS[who]}', true);`,
      );
    }
    const res = await tx.query<T>(sql, params);
    return res.rows;
  });
}

async function rejects(p: Promise<unknown>, pattern: RegExp) {
  await assert.rejects(p, (e: Error) => {
    assert.match(e.message, pattern);
    return true;
  });
}

const todayJst = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

before(async () => {
  db = await createTestDb();

  await db.exec(`
    insert into auth.users (id, email, email_confirmed_at) values
      ('${USERS.alice}', 'Alice@Example.com', now()),
      ('${USERS.bob}', 'bob@example.com', now()),
      ('${USERS.carol}', 'carol@example.com', now()),
      ('${USERS.dave}', 'dave@example.com', null);
    insert into public.allowed_emails (email) values (' ALICE@example.com '), ('bob@example.com'), ('dave@example.com');
    insert into public.stores (id, name, name_kana, prefecture, city, address, official_url) values
      ('226', '池袋東口店', 'いけぶくろひがしぐちてん', '東京都', '豊島区', '東京都豊島区…', 'https://example.com/226'),
      ('652', '熊谷駅前店', 'くまがやえきまえてん', '埼玉県', '熊谷市', '埼玉県熊谷市…', 'https://example.com/652');
  `);
});

after(async () => {
  await db.close();
});

describe("アクセス制限", () => {
  test("allowed_emails は小文字・空白除去で保存される", async () => {
    const rows = await db.query<{ email: string }>(`select email from public.allowed_emails order by email`);
    assert.deepEqual(rows.rows.map((r) => r.email), ["alice@example.com", "bob@example.com", "dave@example.com"]);
  });

  test("get_my_access: 許可・未許可・メール未確認を判定する", async () => {
    const [a] = await as<{ access: { allowed: boolean } }>("alice", `select public.get_my_access() as access`);
    const [c] = await as<{ access: { allowed: boolean } }>("carol", `select public.get_my_access() as access`);
    const [d] = await as<{ access: { allowed: boolean } }>("dave", `select public.get_my_access() as access`);
    assert.deepEqual(a.access, { allowed: true, has_profile: false });
    assert.equal(c.access.allowed, false);
    assert.equal(d.access.allowed, false);
  });

  test("anon はどのテーブルも読めない", async () => {
    await rejects(as("anon", `select * from public.stores`), /permission denied/);
    await rejects(as("anon", `select * from public.visits`), /permission denied/);
    await rejects(as("anon", `select public.get_my_access()`), /permission denied/);
  });

  test("未許可ユーザーは店舗も記録も見えず、書き込めない", async () => {
    assert.equal((await as("carol", `select * from public.stores`)).length, 0);
    await rejects(
      as("carol", `insert into public.profiles (id, display_name) values ($1, 'キャロル')`, [USERS.carol]),
      /row-level security/,
    );
  });

  test("allowed_emails はアプリから読めない", async () => {
    await rejects(as("alice", `select * from public.allowed_emails`), /permission denied/);
  });
});

describe("プロフィール", () => {
  test("自分のプロフィールを作成でき、色が自動で割り当てられる", async () => {
    const [a] = await as<{ color: string; display_name: string }>(
      "alice",
      `insert into public.profiles (id, display_name) values ($1, '  ありす ') returning color, display_name`,
      [USERS.alice],
    );
    const [b] = await as<{ color: string }>(
      "bob",
      `insert into public.profiles (id, display_name) values ($1, 'ぼぶ') returning color`,
      [USERS.bob],
    );
    assert.equal(a.display_name, "ありす");
    assert.equal(a.color, "c1");
    assert.equal(b.color, "c2");
  });

  test("他人の ID でプロフィールを作れない", async () => {
    await rejects(
      as("bob", `insert into public.profiles (id, display_name) values ($1, 'なりすまし')`, [USERS.dave]),
      /row-level security|foreign key/,
    );
  });

  test("空の表示名は保存できない", async () => {
    await rejects(
      as("alice", `update public.profiles set display_name = '   ' where id = $1`, [USERS.alice]),
      /profiles_display_name_length/,
    );
  });

  test("他人のプロフィールは更新できない", async () => {
    const rows = await as("bob", `update public.profiles set display_name = 'x' where id = $1 returning id`, [
      USERS.alice,
    ]);
    assert.equal(rows.length, 0);
  });
});

describe("店舗マスタ", () => {
  test("許可ユーザーは閲覧できるが、書き込めない", async () => {
    assert.equal((await as("alice", `select * from public.stores`)).length, 2);
    await rejects(as("alice", `update public.stores set name = 'x'`), /permission denied/);
    await rejects(
      as("alice", `insert into public.stores (id, name, name_kana, prefecture, city, address, official_url)
                   values ('1', 'x', 'x', '東京都', 'x', 'x', 'x')`),
      /permission denied/,
    );
  });

  test("1都3県以外は登録できない", async () => {
    await rejects(
      db.query(`insert into public.stores (id, name, name_kana, prefecture, city, address, official_url)
                values ('9', 'x', 'x', '大阪府', 'x', 'x', 'x')`),
      /stores_prefecture_valid/,
    );
  });
});

describe("営業記録", () => {
  let aliceVisitId: string;

  test("save_visit で記録とスタッフを保存できる（空のスタッフは保存しない）", async () => {
    const [{ id }] = await as<{ id: string }>(
      "alice",
      `select public.save_visit(null, '226', $1, 'distributed', ' 店長不在 ', $2::jsonb) as id`,
      [
        todayJst(),
        JSON.stringify([
          { staff_name: "", gender: "male", employment_type: "part_time", conversation: "", soccer_interest: "yes" },
          { staff_name: "", gender: "", employment_type: "", conversation: " ", soccer_interest: "" },
          { staff_name: "佐藤", gender: "female", employment_type: "manager", conversation: "興味あり", soccer_interest: "unknown" },
        ]),
      ],
    );
    aliceVisitId = id;
    const staff = await as<{ sort_order: number; staff_name: string | null }>(
      "bob",
      `select sort_order, staff_name from public.visit_staff where visit_id = $1 order by sort_order`,
      [id],
    );
    assert.deepEqual(staff, [
      { sort_order: 0, staff_name: null },
      { sort_order: 1, staff_name: "佐藤" },
    ]);
    const [visit] = await as<{ note: string; created_by: string }>(
      "bob",
      `select note, created_by from public.visits where id = $1`,
      [id],
    );
    assert.equal(visit.note, "店長不在");
    assert.equal(visit.created_by, USERS.alice);
  });

  test("未来の訪問日は保存できない", async () => {
    await rejects(
      as("alice", `select public.save_visit(null, '226', $1, null, null, '[]')`, [addDays(todayJst(), 1)]),
      /未来の日付/,
    );
  });

  test("存在しない店舗は保存できない", async () => {
    await rejects(
      as("alice", `select public.save_visit(null, 'xxx', $1, null, null, '[]')`, [todayJst()]),
      /foreign key/,
    );
  });

  test("本人は save_visit で更新でき、スタッフが置き換わる", async () => {
    await as("alice", `select public.save_visit($1, '652', $2, 'not_distributed', null, $3::jsonb)`, [
      aliceVisitId,
      todayJst(),
      JSON.stringify([{ staff_name: "鈴木" }]),
    ]);
    const staff = await as<{ staff_name: string }>(
      "alice",
      `select staff_name from public.visit_staff where visit_id = $1`,
      [aliceVisitId],
    );
    assert.deepEqual(staff.map((s) => s.staff_name), ["鈴木"]);
  });

  test("他人の記録は更新・削除できない", async () => {
    await rejects(
      as("bob", `select public.save_visit($1, '226', $2, null, null, '[]')`, [aliceVisitId, todayJst()]),
      /編集する権限がありません/,
    );
    assert.equal((await as("bob", `delete from public.visits where id = $1 returning id`, [aliceVisitId])).length, 0);
    assert.equal(
      (await as("bob", `update public.visits set note = 'x' where id = $1 returning id`, [aliceVisitId])).length,
      0,
    );
    await rejects(
      as("bob", `insert into public.visit_staff (visit_id, sort_order, staff_name) values ($1, 9, 'x')`, [
        aliceVisitId,
      ]),
      /row-level security/,
    );
    assert.equal((await as("bob", `delete from public.visit_staff where visit_id = $1 returning id`, [aliceVisitId])).length, 0);
  });

  test("他人になりすまして記録を作れない", async () => {
    await rejects(
      as("bob", `insert into public.visits (store_id, visit_date, created_by) values ('226', $1, $2)`, [
        todayJst(),
        USERS.alice,
      ]),
      /row-level security/,
    );
  });

  test("本人は削除でき、スタッフも一緒に消える", async () => {
    const [{ id }] = await as<{ id: string }>(
      "bob",
      `select public.save_visit(null, '226', $1, null, null, $2::jsonb) as id`,
      [todayJst(), JSON.stringify([{ staff_name: "田中" }])],
    );
    assert.equal((await as("bob", `delete from public.visits where id = $1 returning id`, [id])).length, 1);
    assert.equal((await db.query(`select * from public.visit_staff where visit_id = $1`, [id])).rows.length, 0);
  });
});

describe("営業予定", () => {
  let bobScheduleId: string;

  test("save_schedule で回る店舗を順番付きで保存できる（重複は除く）", async () => {
    const [{ id }] = await as<{ id: string }>(
      "bob",
      `select public.save_schedule(null, $1, 'evening', 'メモ', array['652', '226', '652']) as id`,
      [addDays(todayJst(), 3)],
    );
    bobScheduleId = id;
    const stores = await as<{ store_id: string }>(
      "alice",
      `select store_id from public.schedule_stores where schedule_id = $1 order by sort_order`,
      [id],
    );
    assert.deepEqual(stores.map((s) => s.store_id), ["652", "226"]);
  });

  test("過去の日付では作成できない", async () => {
    await rejects(
      as("bob", `select public.save_schedule(null, $1, null, null, '{}')`, [addDays(todayJst(), -1)]),
      /過去の日付/,
    );
  });

  test("他人の予定は更新・削除できない", async () => {
    await rejects(
      as("alice", `select public.save_schedule($1, $2, null, null, '{}')`, [bobScheduleId, todayJst()]),
      /編集する権限がありません/,
    );
    assert.equal(
      (await as("alice", `delete from public.schedules where id = $1 returning id`, [bobScheduleId])).length,
      0,
    );
    await rejects(
      as("alice", `insert into public.schedule_stores (schedule_id, store_id) values ($1, '226')`, [bobScheduleId]),
      /row-level security|duplicate key/,
    );
  });
});

describe("store_progress", () => {
  test("最終訪問日・訪問回数・直近の予定日を店舗ごとに返す", async () => {
    const rows = await as<{
      store_id: string;
      last_visit_date: string | null;
      visit_count: number;
      next_schedule_date: string | null;
    }>("alice", `select store_id, last_visit_date::text, visit_count, next_schedule_date::text
                 from public.store_progress order by store_id`);
    assert.deepEqual(rows, [
      { store_id: "226", last_visit_date: null, visit_count: 0, next_schedule_date: addDays(todayJst(), 3) },
      { store_id: "652", last_visit_date: todayJst(), visit_count: 1, next_schedule_date: addDays(todayJst(), 3) },
    ]);
  });

  test("未許可ユーザーには何も返さない", async () => {
    assert.equal((await as("carol", `select * from public.store_progress`)).length, 0);
  });
});
