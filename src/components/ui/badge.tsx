import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

/** 小さなピル型のタグ。状態は色だけでなく文字（とアイコン）でも伝える */
const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 text-xs leading-none font-bold [&>svg]:pointer-events-none [&>svg]:size-3.5 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "border-border bg-muted text-muted-foreground",
        brand: "border-brand-soft-foreground/25 bg-brand-soft text-brand-soft-foreground",
        success: "border-success/30 bg-success-soft text-success-soft-foreground",
        primary: "border-primary-soft-foreground/25 bg-primary-soft text-primary-soft-foreground",
        solid: "border-foreground bg-foreground text-background",
        outline: "border-dashed border-input bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
