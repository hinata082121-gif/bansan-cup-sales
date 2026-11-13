/** カレンダー表示の計算（日付はすべて "YYYY-MM-DD" の文字列で扱う） */

export type CalendarDay = { ymd: string; day: number; inMonth: boolean; weekday: number };

const pad = (n: number) => String(n).padStart(2, "0");
export const toYmd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/** 月（"YYYY-MM"）を前後に動かす */
export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
}

/**
 * 月表示のマス（日曜始まり・6 週ぶんに満たなければ 5 週や 4 週）。前後の月の日も含める。
 * Date はタイムゾーンの影響を受けないよう UTC で計算する。
 */
export function buildMonthGrid(month: string): CalendarDay[][] {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const start = new Date(first);
  start.setUTCDate(1 - first.getUTCDay());
  const weeks: CalendarDay[][] = [];
  const cursor = new Date(start);
  const lastNeeded = new Date(Date.UTC(y, m - 1, daysInMonth));
  while (cursor <= lastNeeded || cursor.getUTCDay() !== 0) {
    if (cursor.getUTCDay() === 0) weeks.push([]);
    weeks[weeks.length - 1].push({
      ymd: toYmd(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, cursor.getUTCDate()),
      day: cursor.getUTCDate(),
      inMonth: cursor.getUTCMonth() === m - 1,
      weekday: cursor.getUTCDay(),
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return weeks;
}

const SLOT_ORDER: Record<string, number> = { noon: 0, evening: 1, night: 2, undecided: 3 };

type Datable = { date: string; time_slot: string | null; created_at: string };

/** 同じ日の中は 昼 → 夕方 → 夜 → 未定 → 時間帯なし、同じなら登録順 */
export function compareSchedules(a: Datable, b: Datable): number {
  return (
    a.date.localeCompare(b.date) ||
    (SLOT_ORDER[a.time_slot ?? ""] ?? 4) - (SLOT_ORDER[b.time_slot ?? ""] ?? 4) ||
    a.created_at.localeCompare(b.created_at)
  );
}

/** 日付ごとにまとめる */
export function groupByDate<T extends Datable>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of [...items].sort(compareSchedules)) {
    const list = map.get(item.date) ?? [];
    list.push(item);
    map.set(item.date, list);
  }
  return map;
}

/** 今日以降（日付の早い順）と過去（新しい順）に分ける */
export function splitUpcoming<T extends Datable>(items: T[], today: string): { upcoming: T[]; past: T[] } {
  const sorted = [...items].sort(compareSchedules);
  return {
    upcoming: sorted.filter((s) => s.date >= today),
    past: sorted.filter((s) => s.date < today).reverse(),
  };
}

/** 今日・明日などの呼び方 */
export function relativeDayLabel(ymd: string, today: string): string | null {
  if (ymd === today) return "今日";
  const t = new Date(`${today}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + 1);
  if (ymd === t.toISOString().slice(0, 10)) return "明日";
  return null;
}
