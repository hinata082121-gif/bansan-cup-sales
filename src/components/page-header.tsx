import { cn } from "@/lib/utils";

/** 画面の見出し。看板のような極太の書体で、件数などの補足は数字書体で添える */
export function PageHeader({
  title,
  meta,
  action,
  className,
}: {
  title: string;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-3 px-4 pt-5 pb-3", className)}>
      <div className="min-w-0">
        <h1 className="font-heading text-[26px] leading-tight tracking-tight">{title}</h1>
        {meta && <div className="jp-phrase mt-1 text-sm font-medium text-muted-foreground">{meta}</div>}
      </div>
      {action}
    </div>
  );
}
