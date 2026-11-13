"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "motion/react";
import { CalendarX2, ExternalLink, MapPin, NotebookPen, Phone, Plus, TriangleAlert } from "lucide-react";
import { useStoreSchedules, useStoreVisits, type Store } from "@/lib/data/stores";
import type { StoreProgress } from "@/lib/stores/hierarchy";
import { TIME_SLOT_LABELS } from "@/lib/labels";
import { itemVariants, listVariants } from "@/lib/motion";
import { summarizeVisits, visitOrdinals } from "@/lib/visits/history";
import { todayJst } from "@/hooks/use-today";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { AuthorLabel, DateBlock, VisitCard } from "@/components/visits/visit-card";
import { StoreBadges } from "./store-badges";
import { VisitStatsStrip } from "./visit-stats";

export function googleMapsUrl(store: Pick<Store, "name" | "address">): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`鳥貴族 ${store.name} ${store.address}`)}`;
}

function SectionTitle({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <h2 className="flex items-baseline gap-2 px-4 pt-7 pb-3 text-lg font-black">
      {children}
      {count !== undefined && <span className="num text-xl font-bold text-muted-foreground">{count}</span>}
    </h2>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-4 flex items-center gap-3 rounded-lg bg-primary-soft px-4 py-3 text-sm font-bold text-primary-soft-foreground">
      <TriangleAlert aria-hidden className="size-5 shrink-0" />
      <span className="flex-1">読み込めませんでした</span>
      <Button size="sm" variant="outline" onClick={onRetry}>
        再読み込み
      </Button>
    </div>
  );
}

/** 店舗詳細: 基本情報・公式ページ / Google マップ・この店舗を回る予定・営業記録（回数の集計と履歴） */
export function StoreDetail({ store, progress }: { store: Store; progress: StoreProgress | undefined }) {
  const today = todayJst();
  const visits = useStoreVisits(store.id);
  const schedules = useStoreSchedules(store.id, today);
  const newVisitHref = `/visits?new=1&store=${encodeURIComponent(store.id)}`;
  const stats = useMemo(() => (visits.data ? summarizeVisits(visits.data) : null), [visits.data]);
  // 何回目かは 2 回以上行っている店舗だけ付ける（1 件だけなら「1回目」は要らない）
  const ordinals = useMemo(
    () => (visits.data && visits.data.length >= 2 ? visitOrdinals(visits.data) : null),
    [visits.data],
  );

  return (
    <div className="pb-8">
      <div className="px-4 pt-1">
        <h1 className="text-[26px] leading-tight font-black">{store.name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{store.name_kana}</p>
        <div className="mt-3">
          <StoreBadges progress={progress} openingNote={store.opening_note} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 px-4">
        <Button asChild variant="brand">
          <a href={googleMapsUrl(store)} target="_blank" rel="noopener noreferrer">
            <MapPin />
            Google マップ
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={store.official_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink />
            公式ページ
          </a>
        </Button>
      </div>

      <dl className="mx-4 mt-3 divide-y divide-border rounded-lg border border-border bg-card text-sm">
        <div className="flex gap-3 px-4 py-3">
          <dt className="w-10 shrink-0 font-bold text-muted-foreground">住所</dt>
          <dd className="leading-relaxed">
            {store.zip_code && <span className="num mr-1.5 text-[15px] text-muted-foreground">〒{store.zip_code}</span>}
            {store.address}
          </dd>
        </div>
        {store.tel && (
          <div className="flex items-center gap-3 px-4 py-1.5">
            <dt className="w-10 shrink-0 font-bold text-muted-foreground">電話</dt>
            <dd>
              <a href={`tel:${store.tel}`} className="inline-flex min-h-11 items-center gap-1.5 font-bold underline decoration-brand decoration-2 underline-offset-4">
                <Phone aria-hidden className="size-4" />
                <span className="num text-[17px]">{store.tel}</span>
              </a>
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-4 px-4">
        <Button asChild size="lg" block>
          <Link href={newVisitHref}>
            <Plus strokeWidth={2.6} />
            この店舗の記録をつける
          </Link>
        </Button>
      </div>

      <SectionTitle count={schedules.data?.length}>この店舗を回る予定</SectionTitle>
      {schedules.isPending ? (
        <div className="mx-4">
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : schedules.isError ? (
        <LoadError onRetry={() => schedules.refetch()} />
      ) : schedules.data.length === 0 ? (
        <p className="mx-4 flex items-center gap-2 rounded-lg border border-dashed border-input px-4 py-3.5 text-sm text-muted-foreground">
          <CalendarX2 aria-hidden className="size-5 shrink-0" />
          今日以降の予定はありません
        </p>
      ) : (
        <motion.ul variants={listVariants} initial="hidden" animate="show" className="mx-4 flex flex-col gap-2">
          {schedules.data.map((s) => (
            <motion.li key={s.id} variants={itemVariants}>
              <Link
                href={`/schedules?date=${s.date}`}
                className="flex items-center gap-3.5 rounded-lg border border-border bg-card p-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring active:bg-muted/40"
              >
                <DateBlock ymd={s.date} />
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="flex flex-wrap items-center gap-2">
                    {s.date === today && <Badge variant="primary">今日</Badge>}
                    {s.time_slot && <Badge variant="brand">{TIME_SLOT_LABELS[s.time_slot]}</Badge>}
                    <AuthorLabel author={s.author} />
                  </span>
                  {s.memo && <span className="line-clamp-1 text-sm">{s.memo}</span>}
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}

      <SectionTitle>営業記録</SectionTitle>
      {visits.isPending ? (
        <div className="mx-4 flex flex-col gap-2">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      ) : visits.isError ? (
        <LoadError onRetry={() => visits.refetch()} />
      ) : visits.data.length === 0 ? (
        <div className="mx-4 rounded-lg border border-border bg-card">
          <EmptyState icon={NotebookPen} title="まだ営業記録がありません" description="訪問したら、上のボタンから記録をつけましょう。" />
        </div>
      ) : (
        <>
          {stats && <VisitStatsStrip stats={stats} today={today} />}
          <motion.ul variants={listVariants} initial="hidden" animate="show" className="mx-4 flex flex-col gap-2">
            {visits.data.map((v) => (
              <motion.li key={v.id} variants={itemVariants}>
                <VisitCard visit={v} ordinal={ordinals?.get(v.id)} href={`/visits?id=${v.id}`} />
              </motion.li>
            ))}
          </motion.ul>
        </>
      )}
    </div>
  );
}
