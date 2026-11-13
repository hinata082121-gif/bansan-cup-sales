import type { Enums } from "@/lib/supabase/database.types";

export type ScheduleFormValues = {
  date: string;
  time_slot: Enums<"time_slot"> | "";
  /** 回る順番に並んだ店舗 ID */
  store_ids: string[];
  memo: string;
};

export type ScheduleFormErrors = Partial<Record<"date", string>>;

/**
 * 予定日は今日以降。ただし過去の予定を編集するときは、日付を変えなければ保存できる（メモの修正など）。
 */
export function validateSchedule(values: ScheduleFormValues, today: string, originalDate: string | null): ScheduleFormErrors {
  if (!values.date) return { date: "予定日を選んでください" };
  if (values.date < today && values.date !== originalDate) return { date: "予定日に過去の日付は選べません" };
  return {};
}

export function toSaveScheduleArgs(values: ScheduleFormValues, scheduleId: string | null) {
  return {
    p_schedule_id: scheduleId,
    p_date: values.date,
    p_time_slot: values.time_slot || null,
    p_memo: values.memo.trim() || null,
    p_store_ids: values.store_ids,
  };
}

/** 回る店舗を追加する（同じ店舗は 2 回入れない） */
export function addStore(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids : [...ids, id];
}

export function snapshotSchedule(values: ScheduleFormValues): string {
  return JSON.stringify(values);
}
