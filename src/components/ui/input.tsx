import * as React from "react";
import { cn } from "@/lib/utils";

/** 入力欄の共通スタイル。高さ 48px・文字 16px（iOS のズーム防止）。フォーカス時は黄色の太い輪郭 */
export const fieldControlClass = cn(
  "w-full min-w-0 rounded-md border border-input bg-card px-3 text-base text-foreground",
  "outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground",
  "focus-visible:border-foreground focus-visible:ring-[3px] focus-visible:ring-brand",
  "aria-invalid:border-destructive aria-invalid:focus-visible:ring-primary-soft",
  "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
);

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(fieldControlClass, "h-12", className)} {...props} />;
}

export { Input };
