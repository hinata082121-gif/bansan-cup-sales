import { test } from "node:test";
import assert from "node:assert/strict";
import { daysAgoLabel, daysBetween, summarizeVisits, visitOrdinals } from "./history";

const v = (id: string, visit_date: string, created_at = `${visit_date}T12:00:00Z`) => ({ id, visit_date, created_at });

test("visitOrdinals: 訪問日の古い順に 1 回目から振る（並び順に依存しない）", () => {
  const visits = [v("c", "2026-11-08"), v("a", "2026-10-02"), v("b", "2026-10-20")];
  assert.deepEqual(Object.fromEntries(visitOrdinals(visits)), { a: 1, b: 2, c: 3 });
});

test("visitOrdinals: 同じ訪問日は登録の早い順", () => {
  const visits = [v("late", "2026-11-08", "2026-11-08T20:00:00Z"), v("early", "2026-11-08", "2026-11-08T09:00:00Z")];
  assert.deepEqual(Object.fromEntries(visitOrdinals(visits)), { early: 1, late: 2 });
});

test("summarizeVisits: 回数・初回・最終", () => {
  assert.equal(summarizeVisits([]), null);
  assert.deepEqual(summarizeVisits([v("a", "2026-11-08")]), { count: 1, firstDate: "2026-11-08", lastDate: "2026-11-08" });
  assert.deepEqual(summarizeVisits([v("c", "2026-11-08"), v("a", "2026-10-02"), v("b", "2026-10-20")]), {
    count: 3,
    firstDate: "2026-10-02",
    lastDate: "2026-11-08",
  });
});

test("daysBetween: 月・年またぎ", () => {
  assert.equal(daysBetween("2026-11-08", "2026-11-13"), 5);
  assert.equal(daysBetween("2026-10-31", "2026-11-01"), 1);
  assert.equal(daysBetween("2026-12-31", "2027-01-01"), 1);
  assert.equal(daysBetween("2026-11-13", "2026-11-08"), -5);
});

test("daysAgoLabel", () => {
  assert.equal(daysAgoLabel("2026-11-13", "2026-11-13"), "今日");
  assert.equal(daysAgoLabel("2026-11-12", "2026-11-13"), "昨日");
  assert.equal(daysAgoLabel("2026-11-08", "2026-11-13"), "5日前");
  assert.equal(daysAgoLabel("2026-11-14", "2026-11-13"), "");
});
