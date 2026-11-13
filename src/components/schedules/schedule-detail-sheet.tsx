"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronRight, NotebookPen, Pencil, Trash2 } from "lucide-react";
import { useDeleteSchedule, type Schedule } from "@/lib/data/schedules";
import type { Store } from "@/lib/data/stores";
import type { StoreProgress } from "@/lib/stores/hierarchy";
import { storesPath } from "@/lib/stores/hierarchy";
import { TIME_SLOT_LABELS } from "@/lib/labels";
import { formatLongDate } from "@/lib/format";
import { relativeDayLabel } from "@/lib/schedules/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { AuthorLabel } from "@/components/visits/visit-card";
import { StoreBadges } from "@/components/stores/store-badges";

/**
 * 営業予定の詳細。回る店舗ごとに店舗詳細へのリンクと「この店舗の記録を入力」（訪問日と店舗が入った
 * 記録入力を開く）を置く。自分の予定なら編集・削除できる。
 */
export function ScheduleDetailSheet({
  schedule,
  onOpenChange,
  storeMap,
  progress,
  myUserId,
  today,
  onEdit,
}: {
  schedule: Schedule | null;
  onOpenChange: (open: boolean) => void;
  storeMap: ReadonlyMap<string, Store>;
  progress: ReadonlyMap<string, StoreProgress>;
  myUserId: string | null | undefined;
  today: string;
  onEdit: (schedule: Schedule) => void;
}) {
  const deleteSchedule = useDeleteSchedule();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mine = Boolean(schedule && myUserId && schedule.user_id === myUserId);
  const rel = schedule ? relativeDayLabel(schedule.date, today) : null;

  const remove = async () => {
    if (!schedule) return;
    try {
      await deleteSchedule.mutateAsync(schedule.id);
      toast.success("営業予定を削除しました");
      setConfirmDelete(false);
      onOpenChange(false);
    } catch {
      toast.error("削除できませんでした", { description: "通信状況を確認して、もう一度お試しください" });
    }
  };

  return (
    <>
      <BottomSheet
        open={Boolean(schedule)}
        onOpenChange={onOpenChange}
        title="営業予定"
        footer={
          mine && schedule ? (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Button variant="outline" onClick={() => onEdit(schedule)}>
                <Pencil />
                編集する
              </Button>
              <Button variant="danger" onClick={() => setConfirmDelete(true)} aria-label="この予定を削除">
                <Trash2 />
                削除
              </Button>
            </div>
          ) : undefined
        }
      >
        {schedule && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-[22px] leading-tight font-black">{formatLongDate(schedule.date)}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {rel && <Badge variant={rel === "今日" ? "primary" : "brand"}>{rel}</Badge>}
                {schedule.time_slot && <Badge variant="brand">{TIME_SLOT_LABELS[schedule.time_slot]}</Badge>}
                <AuthorLabel author={schedule.author} />
              </div>
              {schedule.memo && <p className="mt-3 leading-relaxed whitespace-pre-wrap">{schedule.memo}</p>}
            </div>

            <section>
              <h3 className="mb-2 flex items-baseline gap-1.5 text-sm font-black">
                回る店舗<span className="num text-lg text-muted-foreground">{schedule.store_ids.length}</span>
              </h3>
              {schedule.store_ids.length === 0 ? (
                <p className="rounded-lg border border-dashed border-input px-4 py-3 text-sm text-muted-foreground">回る店舗は決まっていません</p>
              ) : (
                <ol className="flex flex-col gap-2">
                  {schedule.store_ids.map((id, index) => {
                    const store = storeMap.get(id);
                    return (
                      <li key={id} className="rounded-lg border border-border bg-card p-3">
                        <div className="flex items-start gap-3">
                          <span className="num mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-[15px] font-bold text-background">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            {store ? (
                              <Link href={storesPath(store.prefecture, store.city, store.id)} className="group inline-flex items-center gap-0.5 text-[17px] font-black">
                                {store.name}
                                <ChevronRight aria-hidden className="size-4 text-muted-foreground transition-transform group-active:translate-x-0.5" />
                              </Link>
                            ) : (
                              <p className="text-[17px] font-black">店舗 {id}</p>
                            )}
                            {store && (
                              <p className="text-xs text-muted-foreground">
                                {store.prefecture} {store.city}
                              </p>
                            )}
                            <div className="mt-2">
                              <StoreBadges progress={progress.get(id)} />
                            </div>
                          </div>
                        </div>
                        <Button asChild variant="brand" size="sm" block className="mt-3">
                          <Link href={`/visits?new=1&store=${encodeURIComponent(id)}&date=${schedule.date}`}>
                            <NotebookPen />
                            この店舗の記録を入力
                          </Link>
                        </Button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </div>
        )}
      </BottomSheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>この営業予定を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>削除すると元に戻せません。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              onClick={(e) => {
                e.preventDefault();
                void remove();
              }}
              disabled={deleteSchedule.isPending}
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
