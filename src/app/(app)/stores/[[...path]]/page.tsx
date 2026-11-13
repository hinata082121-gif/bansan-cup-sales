import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { StoresExplorer } from "@/components/stores/stores-explorer";
import { StoresPageSkeleton } from "@/components/stores/skeletons";

export const metadata: Metadata = { title: "店舗一覧" };

/**
 * 店舗一覧（/stores, /stores/東京都, /stores/東京都/豊島区, /stores/東京都/豊島区/226）。
 * 中身はログイン中のユーザーのデータと端末のキャッシュで描画するので、事前描画ではスケルトンだけを出す。
 */
export default function StoresPage() {
  return (
    <Suspense fallback={<StoresPageSkeleton />}>
      <ClientOnly fallback={<StoresPageSkeleton />}>
        <StoresExplorer />
      </ClientOnly>
    </Suspense>
  );
}
