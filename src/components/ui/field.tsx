import * as React from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/** ラベル・入力欄・補足・エラーをまとめる枠 */
function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const hintId = htmlFor ? `${htmlFor}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-bold">
        {label}
        {required && (
          <span className="rounded-sm bg-primary-soft px-1.5 py-0.5 text-[11px] leading-none text-primary-soft-foreground">
            必須
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={hintId} role="alert" className="flex items-start gap-1.5 text-sm font-medium text-destructive">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export { Field };
