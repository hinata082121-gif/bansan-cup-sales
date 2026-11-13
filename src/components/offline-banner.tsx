"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { WifiOff } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/**
 * 電波が切れたときに画面上部に出す案内。表示中のデータは端末に残っている前回のもの。
 * 保存の操作は電波が戻ると自動で送られる（TanStack Query が再開する）。
 */
export function OfflineBanner() {
  const offline = useSyncExternalStore(
    subscribe,
    () => !navigator.onLine,
    () => false,
  );
  return (
    <AnimatePresence initial={false}>
      {offline && (
        <motion.div
          role="status"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 40 }}
          className="overflow-hidden bg-foreground text-background"
        >
          <p className="flex items-center gap-2 px-4 py-2 text-sm font-bold">
            <WifiOff aria-hidden className="size-4 shrink-0" />
            オフラインです。表示は前回のデータで、保存は電波が戻ると送られます。
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
