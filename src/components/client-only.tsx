"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * ブラウザでだけ中身を描画する。事前描画（サーバー）では fallback（スケルトンなど）を出す。
 * ログイン中のユーザーのデータ・現在時刻・端末のキャッシュに依存する画面に使う。
 */
export function ClientOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return isClient ? children : fallback;
}
