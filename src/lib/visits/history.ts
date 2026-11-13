/**
 * 店舗ごとの営業記録の集計（同じ店舗に何度も行く前提）。
 * 営業回数は記録の件数で数える（DB のビュー store_progress.visit_count と同じ定義）。
 */

type VisitLike = { id: string; visit_date: string; created_at: string };

/** 古い順（訪問日 → 登録日時）に並べる */
function byOldest(a: VisitLike, b: VisitLike): number {
  return a.visit_date.localeCompare(b.visit_date) || a.created_at.localeCompare(b.created_at);
}

/** 記録 ID → 何回目か（古い順に 1, 2, 3…） */
export function visitOrdinals(visits: readonly VisitLike[]): Map<string, number> {
  return new Map([...visits].sort(byOldest).map((v, i) => [v.id, i + 1]));
}

export type VisitStats = { count: number; firstDate: string; lastDate: string };

/** 営業回数・初回訪問日・最終訪問日（記録が無ければ null） */
export function summarizeVisits(visits: readonly VisitLike[]): VisitStats | null {
  if (visits.length === 0) return null;
  const sorted = [...visits].sort(byOldest);
  return { count: sorted.length, firstDate: sorted[0].visit_date, lastDate: sorted[sorted.length - 1].visit_date };
}

/** "YYYY-MM-DD" 同士の日数差（端末のタイムゾーンや夏時間の影響を受けないよう UTC で数える） */
export function daysBetween(fromYmd: string, toYmd: string): number {
  const utc = (ymd: string) => {
    const [y, m, d] = ymd.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(toYmd) - utc(fromYmd)) / 86_400_000);
}

/** 今日 / 昨日 / 5日前（未来の日付は空文字） */
export function daysAgoLabel(ymd: string, today: string): string {
  const days = daysBetween(ymd, today);
  if (days < 0) return "";
  if (days === 0) return "今日";
  if (days === 1) return "昨日";
  return `${days}日前`;
}
