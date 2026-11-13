"use client";

import { motion } from "motion/react";

/**
 * タブを切り替えて画面が開いたときの、ふわっと現れる動き。
 * 中に右下の浮きボタン（position: fixed）があるので、位置がずれないよう transform は使わず透明度だけ動かす。
 */
export function ScreenFade({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}
