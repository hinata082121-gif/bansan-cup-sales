"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { ChevronRight, Pencil, Trash2, UserRound } from "lucide-react";
import type { Store } from "@/lib/data/stores";
import { useDeleteVisit, useVisit, type VisitDetail } from "@/lib/data/visits";
import { EMPLOYMENT_TYPE_LABELS, FLYER_STATUS_LABELS, GENDER_LABELS, SOCCER_INTEREST_LABELS } from "@/lib/labels";
import { formatLongDate } from "@/lib/format";
import { storesPath } from "@/lib/stores/hierarchy";
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
import { Skeleton } from "@/components/ui/skeleton";
import { AuthorLabel } from "./visit-card";

const FLYER_VARIANT = { distributed: "success", not_distributed: "neutral", previously_distributed: "brand" } as const;

/** 営業記録の詳細。自分の記録なら編集・削除できる */
export function VisitDetailSheet({
  visitId,
  onOpenChange,
  storeMap,
  myUserId,
  onEdit,
}: {
  visitId: string | null;
  onOpenChange: (open: boolean) => void;
  storeMap: ReadonlyMap<string, Store>;
  myUserId: string | null | undefined;
  onEdit: (visit: VisitDetail) => void;
}) {
  const { data: visit, isPending, isError } = useVisit(visitId);
  const deleteVisit = useDeleteVisit();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mine = Boolean(visit && myUserId && visit.created_by === myUserId);
  const store = visit ? storeMap.get(visit.store_id) : undefined;

  const remove = async () => {
    if (!visit) return;
    try {
      await deleteVisit.mutateAsync(visit.id);
      toast.success("営業記録を削除しました");
      setConfirmDelete(false);
      onOpenChange(false);
    } catch {
      toast.error("削除できませんでした", { description: "通信状況を確認して、もう一度お試しください" });
    }
  };

  return (
    <>
      <BottomSheet
        open={Boolean(visitId)}
        onOpenChange={onOpenChange}
        title="営業記録"
        footer={
          mine && visit ? (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Button variant="outline" onClick={() => onEdit(visit)}>
                <Pencil />
                編集する
              </Button>
              <Button variant="danger" onClick={() => setConfirmDelete(true)} aria-label="この記録を削除">
                <Trash2 />
                削除
              </Button>
            </div>
          ) : undefined
        }
      >
        {isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : isError || !visit ? (
          <p className="py-6 text-center text-muted-foreground">この記録は見つかりませんでした（削除された可能性があります）。</p>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              {store ? (
                <Link
                  href={storesPath(store.prefecture, store.city, store.id)}
                  className="group inline-flex items-center gap-1 text-[24px] leading-tight font-black"
                >
                  {store.name}
                  <ChevronRight aria-hidden className="size-5 text-muted-foreground transition-transform group-active:translate-x-0.5" />
                </Link>
              ) : (
                <p className="text-[24px] leading-tight font-black">店舗 {visit.store_id}</p>
              )}
              {store && (
                <p className="text-sm text-muted-foreground">
                  {store.prefecture} {store.city}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-bold">{formatLongDate(visit.visit_date)}</span>
                <AuthorLabel author={visit.author} />
              </div>
              {visit.flyer_status && (
                <div className="mt-3">
                  <Badge variant={FLYER_VARIANT[visit.flyer_status]}>チラシ {FLYER_STATUS_LABELS[visit.flyer_status]}</Badge>
                </div>
              )}
            </div>

            <section>
              <h3 className="mb-2 flex items-baseline gap-1.5 text-sm font-black">
                会話したスタッフ<span className="num text-lg text-muted-foreground">{visit.staff.length}</span>
              </h3>
              {visit.staff.length === 0 ? (
                <p className="text-sm text-muted-foreground">記録なし</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {visit.staff.map((s, i) => (
                    <li key={s.id} className="rounded-lg border border-border bg-muted/40 p-3.5">
                      <p className="flex items-center gap-2 font-black">
                        <UserRound aria-hidden className="size-4 text-muted-foreground" />
                        {s.staff_name || <span className="font-bold text-muted-foreground">名前なし</span>}
                        <span className="num ml-auto text-sm font-semibold text-muted-foreground">#{i + 1}</span>
                      </p>
                      {(s.gender || s.employment_type || s.soccer_interest) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {s.employment_type && (
                            <Badge variant={s.employment_type === "manager" ? "solid" : "neutral"}>{EMPLOYMENT_TYPE_LABELS[s.employment_type]}</Badge>
                          )}
                          {s.gender && <Badge variant="neutral">{GENDER_LABELS[s.gender]}</Badge>}
                          {s.soccer_interest && (
                            <Badge variant={s.soccer_interest === "yes" ? "brand" : "neutral"}>
                              サッカー {SOCCER_INTEREST_LABELS[s.soccer_interest]}
                            </Badge>
                          )}
                        </div>
                      )}
                      {s.conversation && <p className="mt-2.5 text-sm leading-relaxed whitespace-pre-wrap">{s.conversation}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {visit.note && (
              <section>
                <h3 className="mb-2 text-sm font-black">備考</h3>
                <p className="leading-relaxed whitespace-pre-wrap">{visit.note}</p>
              </section>
            )}

            <p className="text-xs text-muted-foreground">
              登録 <span className="num text-[13px]">{format(new Date(visit.created_at), "M/d HH:mm")}</span>
              {visit.updated_at !== visit.created_at && (
                <>
                  <span className="mx-1.5">·</span>更新 <span className="num text-[13px]">{format(new Date(visit.updated_at), "M/d HH:mm")}</span>
                </>
              )}
            </p>
          </div>
        )}
      </BottomSheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>この営業記録を削除しますか？</AlertDialogTitle>
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
              disabled={deleteVisit.isPending}
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
