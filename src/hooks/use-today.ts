"use client";

import { useSyncExternalStore } from "react";

/** 日本時間の今日（YYYY-MM-DD） */
export function todayJst(now = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(now);
}

const subscribe = () => () => {};

/**
 * 日本時間の今日を返す。事前描画（サーバー）では現在時刻を読めないので null を返し、
 * ブラウザで描画し直したときに日付が入る。初期値に使う入力欄は key に渡して作り直すとよい。
 */
export function useTodayJst(): string | null {
  return useSyncExternalStore(subscribe, todayJst, () => null);
}
