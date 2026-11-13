"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarPlus, CalendarX2, ChevronDown } from "lucide-react";
import type { Schedule } from "@/lib/data/schedules";
import type { Store } from "@/lib/data/stores";
import { groupByDate, relativeDayLabel, splitUpcoming } from "@/lib/schedules/calendar";
import { formatMd, formatWeekday } from "@/lib/format";
import { itemVariants, listVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ScheduleCard } from "./schedule-card";

function DateGroups({
  schedules,
  today,
  storeMap,
  onOpen,
  newestFirst = false,
}: {
  schedules: Schedule[];
  today: string;
  storeMap: ReadonlyMap<string, Store>;
  onOpen: (id: string) => void;
  /** 過去の予定は新しい日付から並べる */
  newestFirst?: boolean;
}) {
  const ordered = useMemo(() => {
    const groups = [...groupByDate(schedules).entries()];
    return newestFirst ? groups.reverse() : groups;
  }, [schedules, newestFirst]);
  return (
    <motion.ul variants={listVariants} initial="hidden" animate="show" className="flex flex-col gap-4">
      {ordered.map(([date, list]) => {
        const rel = relativeDayLabel(date, today);
        return (
          <motion.li key={date} variants={itemVariants} className="flex flex-col gap-2">
            <h3 className="flex items-baseline gap-2">
              <span className="num text-2xl leading-none font-bold">{formatMd(date)}</span>
              <span className="text-sm font-bold text-muted-foreground">（{formatWeekday(date)}）</span>
              {rel && <Badge variant={rel === "今日" ? "primary" : "brand"}>{rel}</Badge>}
            </h3>
            {list.map((s) => (
              <ScheduleCard key={s.id} schedule={s} storeMap={storeMap} onClick={() => onOpen(s.id)} />
            ))}
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

/** リスト表示: 今日以降の予定を日付順。過去の予定は「過去の予定を表示」で展開する */
export function ScheduleList({
  schedules,
  today,
  storeMap,
  onOpen,
  onAdd,
}: {
  schedules: Schedule[];
  today: string;
  storeMap: ReadonlyMap<string, Store>;
  onOpen: (id: string) => void;
  onAdd: () => void;
}) {
  const [showPast, setShowPast] = useState(false);
  const { upcoming, past } = useMemo(() => splitUpcoming(schedules, today), [schedules, today]);

  return (
    <div className="flex flex-col gap-5 px-4">
      {upcoming.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            icon={CalendarX2}
            title="今日以降の予定はありません"
            description="店舗を回る日を決めたら、予定を登録してみんなに共有しましょう。"
            action={
              <Button onClick={onAdd}>
                <CalendarPlus />
                予定を追加する
              </Button>
            }
          />
        </div>
      ) : (
        <DateGroups schedules={upcoming} today={today} storeMap={storeMap} onOpen={onOpen} />
      )}

      {past.length > 0 && (
        <div className="flex flex-col gap-3">
          <Button variant="ghost" block onClick={() => setShowPast((v) => !v)} aria-expanded={showPast} className="text-muted-foreground">
            {showPast ? "過去の予定を隠す" : "過去の予定を表示"}
            <span className="num text-base">（{past.length}）</span>
            <ChevronDown aria-hidden className={cn("transition-transform duration-200", showPast && "rotate-180")} />
          </Button>
          <AnimatePresence initial={false}>
            {showPast && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 40 }}
                className="overflow-hidden"
              >
                <div className="opacity-80">
                  <DateGroups schedules={past} today={today} storeMap={storeMap} onOpen={onOpen} newestFirst />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
