"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { NotebookPen, Plus, TriangleAlert } from "lucide-react";
import { useStores, type Store } from "@/lib/data/stores";
import { useVisitsList, type VisitDetail } from "@/lib/data/visits";
import { useMyUserId } from "@/lib/data/me";
import { emptyStaff, newStaffKey, type VisitFormValues } from "@/lib/visits/form";
import { parseYmd } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { VisitCard } from "./visit-card";
import { VisitDetailSheet } from "./visit-detail-sheet";
import { VisitFormSheet, newVisitValues } from "./visit-form-sheet";

type FormState = { key: number; visitId: string | null; initial: VisitFormValues };

function fromVisit(visit: VisitDetail, storeMap: ReadonlyMap<string, Store>): VisitFormValues {
  return {
    visit_date: visit.visit_date,
    prefecture: storeMap.get(visit.store_id)?.prefecture ?? "",
    store_id: visit.store_id,
    flyer_status: visit.flyer_status ?? "",
    staff: visit.staff.length
      ? visit.staff.map((s) => ({
          key: newStaffKey(),
          staff_name: s.staff_name ?? "",
          gender: s.gender ?? "",
          employment_type: s.employment_type ?? "",
          conversation: s.conversation ?? "",
          soccer_interest: s.soccer_interest ?? "",
        }))
      : [emptyStaff()],
    note: visit.note ?? "",
  };
}

/**
 * 記録入力の画面: 営業記録の一覧（全員分・訪問日の新しい順）と、右下の「記録する」ボタン。
 * URL からも開ける:
 *   /visits?new=1&store=226&date=2026-11-13 … 店舗・訪問日を入れた状態で入力シートを開く
 *   /visits?id=…                            … その記録の詳細を開く
 */
export function VisitsScreen() {
  const searchParams = useSearchParams();
  const storesQuery = useStores();
  const storeMap = useMemo(() => new Map((storesQuery.data ?? []).map((s) => [s.id, s])), [storesQuery.data]);
  const list = useVisitsList();
  const me = useMyUserId();
  const visits = useMemo(() => list.data?.pages.flat() ?? [], [list.data]);

  const [form, setForm] = useState<FormState | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const openNew = (storeId: string | null = null, date: string | null = null) => {
    setDetailId(null);
    setForm((prev) => ({ key: (prev?.key ?? 0) + 1, visitId: null, initial: newVisitValues({ storeId, date }) }));
    setFormOpen(true);
  };
  const openEdit = (visit: VisitDetail) => {
    setDetailId(null);
    setForm((prev) => ({ key: (prev?.key ?? 0) + 1, visitId: visit.id, initial: fromVisit(visit, storeMap) }));
    setFormOpen(true);
  };

  // URL の入口を 1 回だけ処理し、URL はきれいに戻す
  const entry =
    searchParams.get("new") === "1"
      ? `new|${searchParams.get("store") ?? ""}|${searchParams.get("date") ?? ""}`
      : searchParams.get("id")
        ? `id|${searchParams.get("id")}`
        : null;
  const [handledEntry, setHandledEntry] = useState<string | null>(null);
  if (entry !== handledEntry) {
    setHandledEntry(entry);
    if (entry?.startsWith("new|")) {
      const [, store, date] = entry.split("|");
      openNew(store || null, date || null);
    } else if (entry?.startsWith("id|")) {
      setDetailId(entry.slice(3));
    }
  }
  useEffect(() => {
    if (entry) window.history.replaceState(null, "", "/visits");
  }, [entry]);

  const onSaved = (id: string) => {
    setHighlightId(id);
    setTimeout(() => setHighlightId((current) => (current === id ? null : current)), 2600);
  };

  // 月ごとの見出しを挟む
  const rows = useMemo(() => {
    const out: ({ type: "month"; key: string; label: string } | { type: "visit"; key: string; index: number })[] = [];
    let month = "";
    visits.forEach((v, index) => {
      const m = v.visit_date.slice(0, 7);
      if (m !== month) {
        month = m;
        const d = parseYmd(v.visit_date);
        out.push({ type: "month", key: `m-${m}`, label: `${d.getFullYear()}年${d.getMonth() + 1}月` });
      }
      out.push({ type: "visit", key: v.id, index });
    });
    return out;
  }, [visits]);

  return (
    <div className="pb-28">
      <PageHeader title="営業記録" meta="みんなの記録を訪問日の新しい順に表示" />

      {list.isPending ? (
        <div className="flex flex-col gap-2 px-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex gap-3.5 rounded-lg border border-border bg-card p-4">
              <Skeleton className="h-16 w-12" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-6 w-1/2 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : list.isError ? (
        <div className="mx-4 flex items-center gap-3 rounded-lg bg-primary-soft px-4 py-3 text-sm font-bold text-primary-soft-foreground">
          <TriangleAlert aria-hidden className="size-5 shrink-0" />
          <span className="flex-1">営業記録を読み込めませんでした</span>
          <Button size="sm" variant="outline" onClick={() => list.refetch()}>
            再読み込み
          </Button>
        </div>
      ) : visits.length === 0 ? (
        <div className="mx-4 rounded-lg border border-border bg-card">
          <EmptyState
            icon={NotebookPen}
            title="まだ営業記録がありません"
            description="店舗を訪問したら、ここに記録をつけましょう。"
            action={
              <Button onClick={() => openNew()}>
                <Plus strokeWidth={2.6} />
                最初の記録をつける
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="flex flex-col gap-2 px-4">
          <AnimatePresence initial={false}>
            {rows.map((row) =>
              row.type === "month" ? (
                <motion.li
                  key={row.key}
                  layout="position"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pt-3 pb-0.5 text-sm font-black text-muted-foreground first:pt-0"
                >
                  {row.label}
                </motion.li>
              ) : (
                <VisitRow
                  key={row.key}
                  index={row.index}
                  visit={visits[row.index]}
                  store={storeMap.get(visits[row.index].store_id)}
                  highlighted={highlightId === row.key}
                  onOpen={() => setDetailId(row.key)}
                />
              ),
            )}
          </AnimatePresence>
          {list.hasNextPage && (
            <li className="pt-2">
              <Button variant="outline" block onClick={() => list.fetchNextPage()} disabled={list.isFetchingNextPage}>
                {list.isFetchingNextPage ? "読み込んでいます…" : "さらに読み込む"}
              </Button>
            </li>
          )}
        </ul>
      )}

      {/* 右下に浮く「記録する」ボタン（下部のタブの上） */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] z-20 mx-auto flex max-w-md justify-end px-4">
        <Button size="lg" className="pointer-events-auto h-14 rounded-full pr-6 pl-5" onClick={() => openNew()}>
          <Plus strokeWidth={2.6} />
          記録する
        </Button>
      </div>

      {form && (
        <VisitFormSheet
          key={form.key}
          open={formOpen}
          onOpenChange={setFormOpen}
          initial={form.initial}
          visitId={form.visitId}
          stores={storesQuery.data}
          onSaved={onSaved}
        />
      )}
      <VisitDetailSheet
        visitId={detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        storeMap={storeMap}
        myUserId={me.data}
        onEdit={openEdit}
      />
    </div>
  );
}

function VisitRow({
  visit,
  store,
  index,
  highlighted,
  onOpen,
}: {
  visit: Parameters<typeof VisitCard>[0]["visit"];
  store: Store | undefined;
  index: number;
  highlighted: boolean;
  onOpen: () => void;
}) {
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: highlighted ? -12 : 12, scale: highlighted ? 0.96 : 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 420, damping: 36, delay: highlighted ? 0 : Math.min(index, 10) * 0.035 }}
      ref={(el) => {
        if (el && highlighted) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }}
      className="relative rounded-lg"
    >
      {highlighted && (
        <motion.span
          aria-hidden
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2.2, ease: "easeOut", delay: 0.4 }}
          className="pointer-events-none absolute -inset-1 rounded-[10px] border-[3px] border-brand"
        />
      )}
      <VisitCard
        visit={visit}
        store={store ? { name: store.name, prefecture: store.prefecture, city: store.city } : { name: `店舗 ${visit.store_id}`, prefecture: "", city: "" }}
        onClick={onOpen}
      />
    </motion.li>
  );
}
