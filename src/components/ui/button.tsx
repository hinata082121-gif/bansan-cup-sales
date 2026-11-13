"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "motion/react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

/**
 * ボタン。タップ領域は最低 44px。
 *   primary : 赤。保存・記録するなど画面で一番大事な操作（1 画面に 1 つが目安）
 *   brand   : 黄。primary の次に目立たせたい操作
 *   outline : チャコールの太枠。キャンセルなどの補助操作
 *   ghost   : 背景なし。ヘッダーのアイコンなど
 *   danger  : 削除など取り消せない操作
 * 面のボタンは下辺に 3px の濃い帯を入れ、押すと帯が細くなる（物理ボタンのような手触り）。
 */
const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-bold",
    "outline-none transition-[background-color,color,box-shadow,opacity,filter] duration-150",
    "focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[inset_0_-3px_0_rgb(0_0_0/0.22)] hover:brightness-105 active:shadow-[inset_0_-1px_0_rgb(0_0_0/0.22)]",
        brand:
          "bg-brand text-brand-foreground shadow-[inset_0_-3px_0_rgb(0_0_0/0.14)] hover:brightness-105 active:shadow-[inset_0_-1px_0_rgb(0_0_0/0.14)]",
        outline: "border-2 border-foreground bg-card text-foreground hover:bg-muted",
        ghost: "text-current hover:bg-foreground/5 active:bg-foreground/10",
        danger: "border-2 border-destructive bg-card text-destructive hover:bg-primary-soft",
      },
      size: {
        lg: "h-14 px-6 text-lg",
        default: "h-12 px-5 text-base",
        sm: "h-11 px-3.5 text-sm [&_svg:not([class*='size-'])]:size-4",
        icon: "size-11",
        "icon-lg": "size-14 [&_svg:not([class*='size-'])]:size-6",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "default", block: false },
  },
);

type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> &
  VariantProps<typeof buttonVariants> & {
    children?: React.ReactNode;
    /** 子要素（Link など）にボタンの見た目を渡す。この場合タップの縮みは CSS で行う */
    asChild?: boolean;
    /** タップ時に振動させるか（対応端末のみ） */
    haptics?: boolean;
  };

const TAP = { scale: 0.96 };
const TAP_TRANSITION = { type: "spring", stiffness: 700, damping: 30 } as const;

function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  haptics = true,
  onPointerDown,
  disabled,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, block }), className);

  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        className={cn(classes, "transition-transform active:scale-[0.97]")}
        onPointerDown={(e: React.PointerEvent<HTMLElement>) => {
          if (haptics) haptic();
          (onPointerDown as React.PointerEventHandler<HTMLElement> | undefined)?.(e as never);
        }}
        {...(props as React.ComponentProps<typeof Slot.Root>)}
      />
    );
  }

  return (
    <motion.button
      data-slot="button"
      type="button"
      disabled={disabled}
      whileTap={disabled ? undefined : TAP}
      transition={TAP_TRANSITION}
      onPointerDown={(e) => {
        if (haptics && !disabled) haptic();
        onPointerDown?.(e);
      }}
      className={classes}
      {...props}
    />
  );
}

export { Button, buttonVariants, type ButtonProps };
