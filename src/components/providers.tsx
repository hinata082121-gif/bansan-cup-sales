"use client";

import { MotionConfig } from "motion/react";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/query-provider";

/** アプリ全体の client 側の設定。動きを減らす設定の端末では Motion の移動・拡大縮小アニメーションを止める */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <MotionConfig reducedMotion="user">
        {children}
        <Toaster />
      </MotionConfig>
    </QueryProvider>
  );
}
