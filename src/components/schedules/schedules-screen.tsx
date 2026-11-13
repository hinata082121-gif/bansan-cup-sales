"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, CalendarPlus, List, TriangleAlert } from "lucide-react";
import { useSchedules, type Schedule } from "@/lib/data/schedules";
import { useStoreProgress, useStores, type Store } from "@/lib/data/stores";
import { useMyUserId } from "@/lib/data/me";
import type { StoreProgress } from "@/lib/stores/hierarchy";
import { groupByDate } from "@/lib/schedules/calendar";
import type { ScheduleFormValues } from "@/lib/schedules/form";
import { formatLongDate } from "@/lib/format";
import { todayJst } from "@/hooks/use-today";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/page-header";
import { ScheduleCalendar } from "./schedule-calendar";
import { ScheduleCard } from "./schedule-card";
import { ScheduleDetailSheet } from "./schedule-detail-sheet";
import { ScheduleFormSheet, newScheduleValues } from "./schedule-form-sheet";
import { ScheduleList } from "./schedule-list";

type View = "calendar" | "list";
type FormState = { key: number; scheduleId: string | null; originalDate: string | null; initial: ScheduleFormValues };

const VIEW_KEY = "bansan-cup-sales:schedule-view";
const EMPTY_PROGRESS: ReadonlyMap<string, StoreProgress> = new Map();

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "calendar";
  } catch {
    return "calendar";
  }
}

/**
 * 営業予定の画面。カレンダー（月表示・ユーザー色のドット・日付タップで一覧）とリスト（今日以降・過去は展開）を
 * 切り替える。全員の予定が見え、編集・削除は本人のみ。/schedules?date=YYYY-MM-DD でその日を開ける。
 */
export function SchedulesScreen() {
  const searchParams = useSearchParams();
  const today = todayJst();
  const storesQuery = useStores();
  const storeMap = useMemo(() => new Map<string, Store>((storesQuery.data ?? []).map((s) => [s.id, s])), [storesQuery.data]);
  const progress = useStoreProgress().data ?? EMPTY_PROGRESS;
  const schedulesQuery = useSchedules();
  const me = useMyUserId();

  const [view, setView] = useState<View>(readView);
  const [mineOnly, setMineOnly] = useState(false);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [dayOpen, setDayOpen] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const schedules = useMemo(() => {
    const all = schedulesQuery.data ?? [];
    return mineOnly && me.data ? all.filter((s) => s.user_id === me.data) : all;
  }, [schedulesQuery.data, mineOnly, me.data]);
  const byDate = useMemo(() => groupByDate(schedules), [schedules]);
  const detail = useMemo(() => (schedulesQuery.data ?? []).find((s) => s.id === detailId) ?? null, [schedulesQuery.data, detailId]);

  const changeView = (next: View) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // 保存できなくても困らない
    }
  };
  const openNew = (date?: string | null) => {
    setDayOpen(null);
    setDetailId(null);
    setForm((prev) => ({ key: (prev?.key ?? 0) + 1, scheduleId: null, originalDate: null, initial: newScheduleValues(date) }));
    setFormOpen(true);
  };
  const openEdit = (s: Schedule) => {
    setDetailId(null);
    setForm((prev) => ({
      key: (prev?.key ?? 0) + 1,
      scheduleId: s.id,
      originalDate: s.date,
      initial: { date: s.date, time_slot: s.time_slot ?? "", store_ids: s.store_ids, memo: s.memo ?? "" },
    }));
    setFormOpen(true);
  };
  const openDetail = (id: string) => {
    setDayOpen(null);
    setDetailId(id);
  };

  // /schedules?date=… （店舗詳細の予定から）: その月のカレンダーとその日の予定を開く
  const entry = searchParams.get("date");
  const [handledEntry, setHandledEntry] = useState<string | null>(null);
  if (entry !== handledEntry) {
    setHandledEntry(entry);
    if (entry && /^\d{4}-\d{2}-\d{2}$/.test(entry)) {
      setMonth(entry.slice(0, 7));
      setView("calendar");
      setDayOpen(entry);
    }
  }
  useEffect(() => {
    if (entry) window.history.replaceState(null, "", "/schedules");
  }, [entry]);

  const daySchedules = dayOpen ? (byDate.get(dayOpen) ?? []) : [];

  return (
    <div className="pb-28">
      <PageHeader title="営業予定" meta="みんなの予定を共有。編集できるのは自分の予定だけです" />

      <div className="flex flex-col gap-1 px-4 pb-3">
        <Segmented
          ariaLabel="表示形式"
          value={view}
          onChange={changeView}
          options={[
            { value: "calendar", label: "カレンダー", icon: CalendarDays },
            { value: "list", label: "リスト", icon: List },
          ]}
        />
        <Switch checked={mineOnly} onCheckedChange={setMineOnly} label="自分の予定のみ表示" className="self-start" />
      </div>

      {schedulesQuery.isPending ? (
        <div className="flex flex-col gap-2 px-4">
          <Skeleton className="h-10 w-40 self-center" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      ) : schedulesQuery.isError ? (
        <div className="mx-4 flex items-center gap-3 rounded-lg bg-primary-soft px-4 py-3 text-sm font-bold text-primary-soft-foreground">
          <TriangleAlert aria-hidden className="size-5 shrink-0" />
          <span className="flex-1">営業予定を読み込めませんでした</span>
          <Button size="sm" variant="outline" onClick={() => schedulesQuery.refetch()}>
            再読み込み
          </Button>
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
            {view === "calendar" ? (
              <ScheduleCalendar month={month} onMonthChange={setMonth} byDate={byDate} today={today} onSelectDay={setDayOpen} />
            ) : (
              <ScheduleList schedules={schedules} today={today} storeMap={storeMap} onOpen={openDetail} onAdd={() => openNew()} />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* 右下に浮く「予定を追加」ボタン */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] z-20 mx-auto flex max-w-md justify-end px-4">
        <Button size="lg" className="pointer-events-auto h-14 rounded-full pr-6 pl-5" onClick={() => openNew()}>
          <CalendarPlus />
          予定を追加
        </Button>
      </div>

      {/* 日付をタップしたときの、その日の予定 */}
      <BottomSheet
        open={Boolean(dayOpen)}
        onOpenChange={(open) => !open && setDayOpen(null)}
        title={dayOpen ? `${formatLongDate(dayOpen)}の予定` : "予定"}
        footer={
          dayOpen && dayOpen >= today ? (
            <Button block onClick={() => openNew(dayOpen)}>
              <CalendarPlus />
              この日に予定を追加
            </Button>
          ) : undefined
        }
      >
        {daySchedules.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">この日の予定はありません</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {daySchedules.map((s) => (
              <li key={s.id}>
                <ScheduleCard schedule={s} storeMap={storeMap} onClick={() => openDetail(s.id)} />
              </li>
            ))}
          </ul>
        )}
      </BottomSheet>

      <ScheduleDetailSheet
        schedule={detail}
        onOpenChange={(open) => !open && setDetailId(null)}
        storeMap={storeMap}
        progress={progress}
        myUserId={me.data}
        today={today}
        onEdit={openEdit}
      />

      {form && (
        <ScheduleFormSheet
          key={form.key}
          open={formOpen}
          onOpenChange={setFormOpen}
          initial={form.initial}
          scheduleId={form.scheduleId}
          originalDate={form.originalDate}
          stores={storesQuery.data}
        />
      )}
    </div>
  );
}
