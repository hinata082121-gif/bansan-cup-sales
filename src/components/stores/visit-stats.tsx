import { motion } from "motion/react";
import { formatMd, formatWeekday } from "@/lib/format";
import { daysAgoLabel, type VisitStats } from "@/lib/visits/history";
import { itemVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

function Stat({
  label,
  sub,
  highlight = false,
  children,
}: {
  label: string;
  sub?: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2 px-3 py-3", highlight && "bg-brand-soft")}>
      <dt className={cn("text-xs font-bold", highlight ? "text-brand-soft-foreground" : "text-muted-foreground")}>{label}</dt>
      <dd className="flex flex-col gap-1">
        <span className="flex items-baseline gap-0.5 whitespace-nowrap">{children}</span>
        {sub && <span className="text-xs font-bold text-muted-foreground">{sub}</span>}
      </dd>
    </div>
  );
}

function DateValue({ ymd }: { ymd: string }) {
  return (
    <>
      <span className="num text-[28px] leading-none font-bold">{formatMd(ymd)}</span>
      <span className="ml-0.5 text-xs font-bold text-muted-foreground">{formatWeekday(ymd)}</span>
    </>
  );
}

/**
 * 店舗詳細の営業記録の集計（得点板のように数字を並べる）。
 * 2 回以上行っている店舗は「営業回数・最終訪問・初回訪問」、1 回だけなら「営業回数・訪問日」。
 */
export function VisitStatsStrip({ stats, today }: { stats: VisitStats; today: string }) {
  const repeat = stats.count >= 2;
  return (
    <motion.dl
      variants={itemVariants}
      initial="hidden"
      animate="show"
      className={cn(
        "mx-4 mb-3 grid divide-x divide-border overflow-hidden rounded-lg border border-border bg-card",
        repeat ? "grid-cols-3" : "grid-cols-2",
      )}
    >
      <Stat label="営業回数" highlight>
        <span className="num text-[28px] leading-none font-bold">{stats.count}</span>
        <span className="text-sm font-black">回</span>
      </Stat>
      <Stat label={repeat ? "最終訪問" : "訪問日"} sub={daysAgoLabel(stats.lastDate, today)}>
        <DateValue ymd={stats.lastDate} />
      </Stat>
      {repeat && (
        <Stat label="初回訪問" sub={daysAgoLabel(stats.firstDate, today)}>
          <DateValue ymd={stats.firstDate} />
        </Stat>
      )}
    </motion.dl>
  );
}
