import type { Metadata } from "next";
import { DesignShowcase } from "./showcase";

export const metadata: Metadata = { title: "デザイン見本" };

/**
 * デザインの見本ページ（フェーズ3の確認用）。データは扱わないので、ログインなしで開ける。
 * 仕上げのフェーズで削除するか、ログイン必須に戻す。
 */
export default function DesignPage() {
  return <DesignShowcase />;
}
