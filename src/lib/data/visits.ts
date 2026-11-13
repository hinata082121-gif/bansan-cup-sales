"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/lib/supabase/database.types";
import { toSaveVisitArgs, type VisitFormValues } from "@/lib/visits/form";
import { queryKeys, VISIT_SUMMARY_COLUMNS, type Author, type VisitSummary } from "./stores";

const PAGE_SIZE = 30;

export const visitKeys = {
  all: ["visits"] as const,
  list: ["visits", "list"] as const,
  detail: (id: string) => ["visits", "detail", id] as const,
};

/** 営業記録の一覧（全員分・訪問日の新しい順）。30 件ずつ読み込む */
export function useVisitsList() {
  return useInfiniteQuery({
    queryKey: visitKeys.list,
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<VisitSummary[]> => {
      const { data, error } = await createClient()
        .from("visits")
        .select(VISIT_SUMMARY_COLUMNS)
        .order("visit_date", { ascending: false })
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);
      if (error) throw error;
      return data as unknown as VisitSummary[];
    },
    getNextPageParam: (lastPage, pages) => (lastPage.length < PAGE_SIZE ? undefined : pages.length * PAGE_SIZE),
  });
}

export type VisitStaff = {
  id: string;
  sort_order: number;
  staff_name: string | null;
  gender: Enums<"gender"> | null;
  employment_type: Enums<"employment_type"> | null;
  conversation: string | null;
  soccer_interest: Enums<"soccer_interest"> | null;
};

export type VisitDetail = {
  id: string;
  store_id: string;
  visit_date: string;
  flyer_status: Enums<"flyer_status"> | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  author: Author;
  staff: VisitStaff[];
};

/** 営業記録 1 件（スタッフの詳細つき） */
export function useVisit(id: string | null) {
  return useQuery({
    queryKey: visitKeys.detail(id ?? ""),
    enabled: Boolean(id),
    queryFn: async (): Promise<VisitDetail | null> => {
      const { data, error } = await createClient()
        .from("visits")
        .select(
          "id, store_id, visit_date, flyer_status, note, created_at, updated_at, created_by, author:profiles!visits_created_by_fkey(display_name, color), staff:visit_staff(id, sort_order, staff_name, gender, employment_type, conversation, soccer_interest)",
        )
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const visit = data as unknown as VisitDetail;
      return { ...visit, staff: [...visit.staff].sort((a, b) => a.sort_order - b.sort_order) };
    },
  });
}

/** 営業記録・店舗の進捗に関わるキャッシュをまとめて取り直す */
function useInvalidateVisits() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: visitKeys.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.storeProgress }),
    ]);
}

/** 保存（新規・編集）。記録とスタッフを 1 トランザクションで保存する RPC を呼ぶ */
export function useSaveVisit() {
  const invalidate = useInvalidateVisits();
  return useMutation({
    mutationFn: async ({ values, visitId }: { values: VisitFormValues; visitId: string | null }) => {
      const { data, error } = await createClient().rpc("save_visit", toSaveVisitArgs(values, visitId));
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => invalidate(),
  });
}

/** 削除（本人の記録のみ。RLS で守られている） */
export function useDeleteVisit() {
  const invalidate = useInvalidateVisits();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await createClient().from("visits").delete().eq("id", id).select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("削除できませんでした（権限がないか、すでに削除されています）");
    },
    onSuccess: () => invalidate(),
  });
}
