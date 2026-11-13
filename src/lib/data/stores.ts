"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/lib/supabase/database.types";
import type { StoreProgress } from "@/lib/stores/hierarchy";

export const queryKeys = {
  stores: ["stores"] as const,
  storeProgress: ["store-progress"] as const,
  storeVisits: (storeId: string) => ["visits", "by-store", storeId] as const,
  storeSchedules: (storeId: string, today: string) => ["schedules", "by-store", storeId, today] as const,
};

// -----------------------------------------------------------------------------
// 店舗マスタ
// -----------------------------------------------------------------------------

const STORE_COLUMNS = "id, name, name_kana, prefecture, city, address, zip_code, tel, lat, lng, official_url, opening_note";

export type Store = {
  id: string;
  name: string;
  name_kana: string;
  prefecture: string;
  city: string;
  address: string;
  zip_code: string | null;
  tel: string | null;
  lat: number | null;
  lng: number | null;
  official_url: string;
  opening_note: string | null;
};

async function fetchStores(): Promise<Store[]> {
  const { data, error } = await createClient().from("stores").select(STORE_COLUMNS).eq("is_active", true);
  if (error) throw error;
  return data;
}

/** 店舗マスタ（ほぼ変わらないので 1 時間は再取得しない。端末にも保存する） */
export function useStores() {
  return useQuery({
    queryKey: queryKeys.stores,
    queryFn: fetchStores,
    staleTime: 60 * 60 * 1000,
    meta: { persist: true },
  });
}

// -----------------------------------------------------------------------------
// 店舗ごとの進捗（バッジ用）
// -----------------------------------------------------------------------------

type ProgressRow = {
  store_id: string | null;
  last_visit_date: string | null;
  visit_count: number | null;
  next_schedule_date: string | null;
};

async function fetchProgress(): Promise<ProgressRow[]> {
  const { data, error } = await createClient().from("store_progress").select("*");
  if (error) throw error;
  return data;
}

function toProgressMap(rows: ProgressRow[]): Map<string, StoreProgress> {
  const map = new Map<string, StoreProgress>();
  for (const r of rows) {
    if (!r.store_id) continue;
    map.set(r.store_id, {
      lastVisitDate: r.last_visit_date,
      visitCount: r.visit_count ?? 0,
      nextScheduleDate: r.next_schedule_date,
    });
  }
  return map;
}

/** 営業記録・予定がある店舗の「最終訪問日」「直近の予定日」（ビュー 1 回の取得で全店分） */
export function useStoreProgress() {
  return useQuery({
    queryKey: queryKeys.storeProgress,
    queryFn: fetchProgress,
    select: toProgressMap,
    meta: { persist: true },
  });
}

// -----------------------------------------------------------------------------
// 店舗詳細: 営業記録・予定
// -----------------------------------------------------------------------------

export type Author = { display_name: string; color: string } | null;

export type VisitSummary = {
  id: string;
  store_id: string;
  visit_date: string;
  flyer_status: Enums<"flyer_status"> | null;
  note: string | null;
  created_at: string;
  created_by: string;
  author: Author;
  staff: { staff_name: string | null; conversation: string | null; sort_order: number }[];
};

export const VISIT_SUMMARY_COLUMNS =
  "id, store_id, visit_date, flyer_status, note, created_at, created_by, author:profiles!visits_created_by_fkey(display_name, color), staff:visit_staff(staff_name, conversation, sort_order)";

/** その店舗の営業記録（訪問日の新しい順） */
export function useStoreVisits(storeId: string) {
  return useQuery({
    queryKey: queryKeys.storeVisits(storeId),
    queryFn: async (): Promise<VisitSummary[]> => {
      const { data, error } = await createClient()
        .from("visits")
        .select(VISIT_SUMMARY_COLUMNS)
        .eq("store_id", storeId)
        .order("visit_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as VisitSummary[];
    },
  });
}

export type ScheduleSummary = {
  id: string;
  date: string;
  time_slot: Enums<"time_slot"> | null;
  memo: string | null;
  user_id: string;
  author: Author;
};

/** その店舗を回る予定（今日以降、日付順） */
export function useStoreSchedules(storeId: string, today: string) {
  return useQuery({
    queryKey: queryKeys.storeSchedules(storeId, today),
    queryFn: async (): Promise<ScheduleSummary[]> => {
      const { data, error } = await createClient()
        .from("schedule_stores")
        .select(
          "schedule:schedules!inner(id, date, time_slot, memo, user_id, author:profiles!schedules_user_id_fkey(display_name, color))",
        )
        .eq("store_id", storeId)
        .gte("schedule.date", today);
      if (error) throw error;
      const rows = (data as unknown as { schedule: ScheduleSummary }[]).map((r) => r.schedule);
      return rows.sort((a, b) => a.date.localeCompare(b.date));
    },
  });
}
