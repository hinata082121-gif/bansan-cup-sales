"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

/** 0 件のときの表示。アイコンと短い一文で状態を伝え、次の操作へ誘導する */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center px-6 py-10 text-center"
    >
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand-soft-foreground">
        <Icon aria-hidden className="size-8" strokeWidth={1.75} />
      </div>
      <p className="jp-phrase text-lg font-black">{title}</p>
      {description && <p className="jp-phrase mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
