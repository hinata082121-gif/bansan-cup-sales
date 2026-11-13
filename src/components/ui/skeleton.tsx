import { cn } from "@/lib/utils";

/** 読み込み中の形だけを先に見せる（スピナーだけにしない） */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden className={cn("animate-pulse rounded-md bg-foreground/[0.08]", className)} {...props} />;
}

export { Skeleton };
