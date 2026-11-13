"use client";

import * as React from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
  /** 件数（絞り込みタブなど） */
  count?: number;
};

const INDICATOR_SPRING = { type: "spring", stiffness: 520, damping: 38 } as const;

/**
 * 選択肢の切り替え。選択中の印がスプリングで滑って移動する。
 *   segment : 灰色の溝の中で白い札が動く（カレンダー/リストの切り替えなど）
 *   chips   : 横並びの札。選択中はチャコールで塗る（すべて/未訪問/予定あり/営業済 の絞り込みなど）
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  variant = "segment",
  ariaLabel,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: "segment" | "chips";
  ariaLabel: string;
  className?: string;
}) {
  const id = React.useId();
  const isChips = variant === "chips";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        isChips
          ? "-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]"
          : "grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted p-1",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const Icon = option.icon;
        return (
          <motion.button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (!selected) {
                haptic(6);
                onChange(option.value);
              }
            }}
            className={cn(
              "relative flex shrink-0 items-center justify-center gap-1.5 text-sm font-bold whitespace-nowrap outline-none",
              "focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-1",
              isChips
                ? cn(
                    "h-11 rounded-full border px-4 transition-colors",
                    selected ? "border-foreground text-background" : "border-border bg-card text-foreground",
                  )
                : cn("h-11 rounded-md transition-colors", selected ? "text-foreground" : "text-muted-foreground"),
            )}
          >
            {selected && (
              <motion.span
                layoutId={`${id}-indicator`}
                transition={INDICATOR_SPRING}
                aria-hidden
                className={cn(
                  "absolute inset-0",
                  isChips ? "-m-px rounded-full bg-foreground" : "rounded-md border border-border bg-card",
                )}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {Icon && <Icon aria-hidden className="size-4" />}
              {option.label}
              {option.count !== undefined && (
                <span className={cn("num text-[15px] font-semibold", selected ? "opacity-90" : "text-muted-foreground")}>
                  {option.count}
                </span>
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
