"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Schedule } from "@/lib/data/schedules";
import { addMonths, buildMonthGrid } from "@/lib/schedules/calendar";
import { userColorVar } from "@/lib/user-color";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { Button } from "@/components/ui/button";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const MAX_DOTS = 3;
const SWIPE_OFFSET = 60;
const SWIPE_VELOCITY = 400;

const monthVariants = {
  enter: (d: number) => ({ x: d > 0 ? "60%" : "-60%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? "-60%" : "60%", opacity: 0 }),
};

/**
 * 月表示のカレンダー。予定がある日には、登録したユーザーの色のドットを付ける。
 * 日付をタップするとその日の予定を開く。左右にスワイプ（または矢印）で月を移動する。
 */
export function ScheduleCalendar({
  month,
  onMonthChange,
  byDate,
  today,
  onSelectDay,
}: {
  month: string;
  onMonthChange: (month: string) => void;
  byDate: ReadonlyMap<string, Schedule[]>;
  today: string;
  onSelectDay: (ymd: string) => void;
}) {
  const [direction, setDirection] = useState(1);
  const weeks = useMemo(() => buildMonthGrid(month), [month]);
  const [y, m] = month.split("-").map(Number);

  const go = (delta: number) => {
    haptic(6);
    setDirection(delta);
    onMonthChange(addMonths(month, delta));
  };

  // この月に予定がある人（色の凡例）
  const legend = useMemo(() => {
    const users = new Map<string, { name: string; color: string }>();
    for (const [ymd, list] of byDate) {
      if (!ymd.startsWith(month)) continue;
      for (const s of list) users.set(s.user_id, { name: s.author?.display_name ?? "不明", color: s.author?.color ?? "c1" });
    }
    return [...users.values()];
  }, [byDate, month]);

  return (
    <div className="px-4">
      <div className="mb-2 flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="前の月" onClick={() => go(-1)}>
          <ChevronLeft />
        </Button>
        <p aria-live="polite" className="flex items-baseline gap-0.5 font-black">
          <span className="num text-[26px] leading-none font-bold">{y}</span>年
          <span className="num ml-1 text-[26px] leading-none font-bold">{m}</span>月
        </p>
        <Button variant="ghost" size="icon" aria-label="次の月" onClick={() => go(1)}>
          <ChevronRight />
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-border">
        <div className="grid grid-cols-7 gap-px">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={cn(
                "bg-muted py-1.5 text-center text-xs font-black",
                i === 0 ? "text-primary-soft-foreground" : i === 6 ? "text-brand-soft-foreground" : "text-muted-foreground",
              )}
            >
              {w}
            </div>
          ))}
        </div>
        <div className="relative">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={month}
              custom={direction}
              variants={monthVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 420, damping: 40 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={(_, info) => {
                if (info.offset.x < -SWIPE_OFFSET || info.velocity.x < -SWIPE_VELOCITY) go(1);
                else if (info.offset.x > SWIPE_OFFSET || info.velocity.x > SWIPE_VELOCITY) go(-1);
              }}
              className="grid touch-pan-y grid-cols-7 gap-px pt-px"
            >
              {weeks.flat().map((day) => {
                const list = byDate.get(day.ymd) ?? [];
                const colors = [...new Map(list.map((s) => [s.user_id, s.author?.color ?? "c1"])).values()];
                const isToday = day.ymd === today;
                return (
                  <button
                    key={day.ymd}
                    type="button"
                    onClick={() => onSelectDay(day.ymd)}
                    aria-label={`${day.ymd.replace(/-/g, "/")}${list.length ? ` 予定${list.length}件` : ""}`}
                    className={cn(
                      "flex h-16 flex-col items-center gap-1 bg-card pt-1.5 outline-none focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-ring active:bg-muted",
                      !day.inMonth && "bg-background",
                    )}
                  >
                    <span
                      className={cn(
                        "num flex size-7 items-center justify-center rounded-full text-[17px] leading-none",
                        isToday ? "bg-brand font-bold text-brand-foreground" : list.length ? "font-bold" : "font-medium",
                        !day.inMonth && !isToday && "text-muted-foreground/60",
                        day.inMonth && !isToday && day.weekday === 0 && "text-primary-soft-foreground",
                      )}
                    >
                      {day.day}
                    </span>
                    {colors.length > 0 && (
                      <span className="flex items-center gap-0.5" aria-hidden>
                        {colors.slice(0, MAX_DOTS).map((c, i) => (
                          <span key={i} className="size-2 rounded-full" style={{ background: userColorVar(c) }} />
                        ))}
                        {colors.length > MAX_DOTS && (
                          <span className="num text-[11px] leading-none font-bold text-muted-foreground">+{colors.length - MAX_DOTS}</span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-3 flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1.5">
        {legend.length > 0 ? (
          legend.map((u) => (
            <span key={u.name + u.color} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: userColorVar(u.color) }} />
              {u.name}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">この月の予定はまだありません</span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">左右にスワイプで月を移動</span>
      </div>
    </div>
  );
}
