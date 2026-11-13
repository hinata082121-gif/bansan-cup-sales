/** profiles.color（c1〜c10）を CSS 変数に変換する。値が不正なら c1 */
const KEYS = new Set(["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10"]);

export function userColorVar(color: string | null | undefined): string {
  return `var(--user-${color && KEYS.has(color) ? color : "c1"})`;
}
