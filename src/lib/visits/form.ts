import type { Enums, Json } from "@/lib/supabase/database.types";

/** 会話スタッフ 1 人ぶんの入力（項目 4〜8） */
export type StaffInput = {
  /** 追加・削除のアニメーション用のキー（保存はしない） */
  key: string;
  staff_name: string;
  gender: Enums<"gender"> | "";
  employment_type: Enums<"employment_type"> | "";
  conversation: string;
  soccer_interest: Enums<"soccer_interest"> | "";
};

export type VisitFormValues = {
  visit_date: string;
  prefecture: string;
  store_id: string | null;
  flyer_status: Enums<"flyer_status"> | "";
  staff: StaffInput[];
  note: string;
};

export type VisitFormErrors = Partial<Record<"visit_date" | "store_id", string>>;

let keySeq = 0;
export function newStaffKey(): string {
  keySeq += 1;
  return `staff-${Date.now().toString(36)}-${keySeq}`;
}

export function emptyStaff(): StaffInput {
  return { key: newStaffKey(), staff_name: "", gender: "", employment_type: "", conversation: "", soccer_interest: "" };
}

/** すべての項目が空のスタッフ（保存しない） */
export function isStaffEmpty(s: StaffInput): boolean {
  return !s.staff_name.trim() && !s.gender && !s.employment_type && !s.conversation.trim() && !s.soccer_interest;
}

export function validateVisit(values: VisitFormValues, today: string): VisitFormErrors {
  const errors: VisitFormErrors = {};
  if (!values.visit_date) errors.visit_date = "訪問日を選んでください";
  else if (values.visit_date > today) errors.visit_date = "未来の日付は選べません";
  if (!values.store_id) errors.store_id = "店舗を候補から選んでください";
  return errors;
}

/** save_visit RPC の引数に変換する（空のスタッフは送らない） */
export function toSaveVisitArgs(values: VisitFormValues, visitId: string | null) {
  const staff = values.staff
    .filter((s) => !isStaffEmpty(s))
    .map((s) => ({
      staff_name: s.staff_name.trim(),
      gender: s.gender,
      employment_type: s.employment_type,
      conversation: s.conversation.trim(),
      soccer_interest: s.soccer_interest,
    }));
  return {
    p_visit_id: visitId,
    p_store_id: values.store_id!,
    p_visit_date: values.visit_date,
    p_flyer_status: values.flyer_status || null,
    p_note: values.note.trim() || null,
    p_staff: staff as unknown as Json,
  };
}

/** 入力途中かどうかを判定するための比較用の文字列（アニメーション用のキーは除く） */
export function snapshot(values: VisitFormValues): string {
  return JSON.stringify({
    ...values,
    staff: values.staff.map((s) => [s.staff_name, s.gender, s.employment_type, s.conversation, s.soccer_interest]),
  });
}
