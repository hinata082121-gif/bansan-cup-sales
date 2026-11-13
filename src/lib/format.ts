import { format } from "date-fns";
import { ja } from "date-fns/locale";

/** "YYYY-MM-DD" を端末のタイムゾーンの 0 時として Date にする */
export function parseYmd(ymd: string): Date {
  return new Date(`${ymd}T00:00:00`);
}

/** 11/8 */
export function formatMd(ymd: string): string {
  return format(parseYmd(ymd), "M/d");
}

/** 金 */
export function formatWeekday(ymd: string): string {
  return format(parseYmd(ymd), "E", { locale: ja });
}

/** 2026年11月8日（日） */
export function formatLongDate(ymd: string): string {
  return format(parseYmd(ymd), "yyyy年M月d日（E）", { locale: ja });
}
