import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyStaff, isStaffEmpty, snapshot, toSaveVisitArgs, validateVisit, type VisitFormValues } from "./form";

const base = (): VisitFormValues => ({
  visit_date: "2026-11-13",
  prefecture: "東京都",
  store_id: "226",
  flyer_status: "",
  staff: [emptyStaff()],
  note: "",
});

test("訪問日は必須で、未来の日付は不可", () => {
  assert.deepEqual(validateVisit(base(), "2026-11-13"), {});
  assert.equal(validateVisit({ ...base(), visit_date: "2026-11-14" }, "2026-11-13").visit_date, "未来の日付は選べません");
  assert.equal(validateVisit({ ...base(), visit_date: "" }, "2026-11-13").visit_date, "訪問日を選んでください");
});

test("店舗は候補から選んだもの（store_id）が必須", () => {
  assert.equal(validateVisit({ ...base(), store_id: null }, "2026-11-13").store_id, "店舗を候補から選んでください");
});

test("名前が空でも性別などが入っていればスタッフとして送る。全部空のスタッフは送らない", () => {
  const v = base();
  v.staff = [
    { ...emptyStaff(), gender: "male", soccer_interest: "yes" },
    emptyStaff(),
    { ...emptyStaff(), staff_name: " 佐藤 ", conversation: " 興味あり " },
  ];
  assert.equal(isStaffEmpty(v.staff[1]), true);
  const args = toSaveVisitArgs(v, null);
  assert.deepEqual(args.p_staff, [
    { staff_name: "", gender: "male", employment_type: "", conversation: "", soccer_interest: "yes" },
    { staff_name: "佐藤", gender: "", employment_type: "", conversation: "興味あり", soccer_interest: "" },
  ]);
  assert.equal(args.p_flyer_status, null);
  assert.equal(args.p_note, null);
  assert.equal(args.p_visit_id, null);
});

test("入力途中の判定はスタッフのキーに左右されない", () => {
  const a = base();
  const b = { ...a, staff: [emptyStaff()] };
  assert.equal(snapshot(a), snapshot(b));
  assert.notEqual(snapshot(a), snapshot({ ...a, note: "x" }));
});
