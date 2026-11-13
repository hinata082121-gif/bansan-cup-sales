"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

/** オン/オフの切り替え（つまみがスプリングで動く）。ラベルごとタップできる */
export function Switch({
  checked,
  onCheckedChange,
  label,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        haptic(6);
        onCheckedChange(!checked);
      }}
      className={cn(
        "flex min-h-11 items-center gap-2.5 rounded-md px-1 text-sm font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-7 w-12 items-center rounded-full border-2 p-0.5 transition-colors",
          checked ? "justify-end border-foreground bg-foreground" : "justify-start border-input bg-card",
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 700, damping: 35 }}
          className={cn("size-5 rounded-full", checked ? "bg-brand" : "bg-input")}
        />
      </span>
      {label}
    </button>
  );
}
