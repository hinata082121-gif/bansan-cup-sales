import type { Enums } from "@/lib/supabase/database.types";

/** 選択肢の表示ラベル（DB には英字の値で保存している） */
export const FLYER_STATUS_LABELS: Record<Enums<"flyer_status">, string> = {
  distributed: "配布",
  not_distributed: "未配布",
  previously_distributed: "前回以前配布済",
};

export const GENDER_LABELS: Record<Enums<"gender">, string> = {
  male: "男",
  female: "女",
  other: "その他",
};

export const EMPLOYMENT_TYPE_LABELS: Record<Enums<"employment_type">, string> = {
  manager: "店長",
  employee: "社員",
  part_time: "アルバイト",
  unknown: "不明",
};

export const SOCCER_INTEREST_LABELS: Record<Enums<"soccer_interest">, string> = {
  yes: "有",
  no: "無",
  unknown: "不明",
};

export const TIME_SLOT_LABELS: Record<Enums<"time_slot">, string> = {
  noon: "昼",
  evening: "夕方",
  night: "夜",
  undecided: "未定",
};

export function options<T extends string>(labels: Record<T, string>): { value: T; label: string }[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}
