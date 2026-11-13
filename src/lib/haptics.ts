/**
 * 対応端末（主に Android）で軽く振動させる。iOS Safari は Vibration API 非対応なので何もしない。
 * 動きを減らす設定の端末でも振動はしない。
 */
export function haptic(pattern: number | number[] = 8) {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  if (!("vibrate" in navigator)) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // 一部ブラウザはユーザー操作外の呼び出しで例外を出す
  }
}
