import { test } from "node:test";
import assert from "node:assert/strict";
import { addMonths, buildMonthGrid, groupByDate, relativeDayLabel, splitUpcoming } from "./calendar";
import { addStore, toSaveScheduleArgs, validateSchedule } from "./form";

test("月表示のマスは日曜始まりで、前後の月の日を含む", () => {
  const weeks = buildMonthGrid("2026-11");
  // 2026/11/1 は日曜。30 日なので 5 週（最後の週は 12/1〜12/5 を含む）
  assert.equal(weeks.length, 5);
  assert.equal(weeks[0][0].ymd, "2026-11-01");
  assert.equal(weeks[4][6].ymd, "2026-12-05");
  assert.equal(weeks[4][6].inMonth, false);
  assert.ok(weeks.every((w) => w.length === 7));
  const feb = buildMonthGrid("2027-02");
  assert.equal(feb[0][0].ymd, "2027-01-31");
  assert.equal(feb[0][1].ymd, "2027-02-01");
});

test("月の移動は年をまたげる", () => {
  assert.equal(addMonths("2026-12", 1), "2027-01");
  assert.equal(addMonths("2026-01", -1), "2025-12");
  assert.equal(addMonths("2026-11", 0), "2026-11");
});

const S = (id: string, date: string, time_slot: string | null, created_at = "2026-11-01T00:00:00Z") => ({ id, date, time_slot, created_at });

test("日付ごとにまとめ、同じ日は時間帯順", () => {
  const map = groupByDate([S("a", "2026-11-20", "night"), S("b", "2026-11-20", "noon"), S("c", "2026-11-20", null), S("d", "2026-11-21", null)]);
  assert.deepEqual(map.get("2026-11-20")!.map((s) => s.id), ["b", "a", "c"]);
  assert.deepEqual([...map.keys()], ["2026-11-20", "2026-11-21"]);
});

test("今日以降は早い順、過去は新しい順", () => {
  const { upcoming, past } = splitUpcoming([S("a", "2026-11-10", null), S("b", "2026-11-13", null), S("c", "2026-11-30", null), S("d", "2026-11-01", null)], "2026-11-13");
  assert.deepEqual(upcoming.map((s) => s.id), ["b", "c"]);
  assert.deepEqual(past.map((s) => s.id), ["a", "d"]);
});

test("今日・明日の呼び方（月末をまたぐ）", () => {
  assert.equal(relativeDayLabel("2026-11-30", "2026-11-30"), "今日");
  assert.equal(relativeDayLabel("2026-12-01", "2026-11-30"), "明日");
  assert.equal(relativeDayLabel("2026-12-02", "2026-11-30"), null);
});

test("予定日は今日以降。過去の予定は日付を変えなければ編集できる", () => {
  const v = { date: "2026-11-10", time_slot: "" as const, store_ids: [], memo: "" };
  assert.equal(validateSchedule(v, "2026-11-13", null).date, "予定日に過去の日付は選べません");
  assert.deepEqual(validateSchedule(v, "2026-11-13", "2026-11-10"), {});
  assert.equal(validateSchedule({ ...v, date: "2026-11-09" }, "2026-11-13", "2026-11-10").date, "予定日に過去の日付は選べません");
  assert.deepEqual(validateSchedule({ ...v, date: "2026-11-13" }, "2026-11-13", null), {});
});

test("回る店舗は重複せず順番どおり送る", () => {
  assert.deepEqual(addStore(addStore(["226"], "652"), "226"), ["226", "652"]);
  const args = toSaveScheduleArgs({ date: "2026-11-20", time_slot: "", store_ids: ["652", "226"], memo: "  " }, null);
  assert.deepEqual(args, { p_schedule_id: null, p_date: "2026-11-20", p_time_slot: null, p_memo: null, p_store_ids: ["652", "226"] });
});
