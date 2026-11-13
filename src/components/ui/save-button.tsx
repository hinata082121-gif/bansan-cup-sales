"use client";

import { AnimatePresence, motion } from "motion/react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

export type SaveState = "idle" | "saving" | "success";

/** Lucide の Check と同じ形のチェックマークを、線を引くように描く */
function AnimatedCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("size-6", className)}>
      <motion.path
        d="M20 6 9 17l-5-5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, ease: [0.65, 0, 0.35, 1], delay: 0.05 }}
      />
    </svg>
  );
}

const SWAP = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.16 },
};

/**
 * 保存ボタン。保存中はくるくる、成功すると緑に変わってチェックマークを描く。
 * state は呼び出し側で管理する（成功表示のあと閉じる・戻すなど）。
 */
export function SaveButton({
  state,
  children = "保存する",
  className,
  ...props
}: Omit<ButtonProps, "children"> & { state: SaveState; children?: React.ReactNode }) {
  return (
    <Button
      size="lg"
      block
      aria-live="polite"
      disabled={state !== "idle" || props.disabled}
      className={cn(
        "overflow-hidden disabled:opacity-100",
        state === "success" && "bg-[var(--success-strong)] text-white",
        state === "saving" && "opacity-80",
        className,
      )}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === "success" ? (
          <motion.span key="success" className="flex items-center gap-2" {...SWAP}>
            <AnimatedCheck />
            保存しました
          </motion.span>
        ) : state === "saving" ? (
          <motion.span key="saving" className="flex items-center gap-2" {...SWAP}>
            <LoaderCircle className="animate-spin" aria-hidden />
            保存しています…
          </motion.span>
        ) : (
          <motion.span key="idle" className="flex items-center gap-2" {...SWAP}>
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
