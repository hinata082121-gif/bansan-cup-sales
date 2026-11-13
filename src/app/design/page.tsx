import type { Metadata } from "next";
import { DesignShowcase } from "./showcase";

export const metadata: Metadata = { title: "デザイン見本" };

/**
 * デザインの見本ページ（色・文字・部品の一覧）。新しい画面を作るときの参照用に残している。
 * ほかのページと同じくログインが必要。
 */
export default function DesignPage() {
  return <DesignShowcase />;
}
