"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/lib/supabase/database.types";
import { toSaveScheduleArgs, type ScheduleFormValues } from "@/lib/schedules/form";
import { queryKeys, type Author } from "./stores";

export const scheduleKeys = {
  all: ["schedules"] as const,
  list: ["schedules", "list"] as const,
};

export type Schedule = {
  id: string;
  date: string;
  time_slot: Enums<"time_slot"> | null;
  memo: string | null;
  user_id: string;
  created_at: string;
  author: Author;
  /** 回る順番に並んだ店舗 ID */
  store_ids: string[];
};

type ScheduleRow = Omit<Schedule, "store_ids"> & { stores: { store_id: string; sort_order: number }[] };

/** 営業予定（全員分）。件数は多くないので一度に取り、表示側で月や今日以降に分ける */
export function useSchedules() {
  return useQuery({
    queryKey: scheduleKeys.list,
    queryFn: async (): Promise<Schedule[]> => {
      const { data, error } = await createClient()
        .from("schedules")
        .select(
          "id, date, time_slot, memo, user_id, created_at, author:profiles!schedules_user_id_fkey(display_name, color), stores:schedule_stores(store_id, sort_order)",
        )
        .order("date", { ascending: true });
      if (error) throw error;
      return (data as unknown as ScheduleRow[]).map(({ stores, ...rest }) => ({
        ...rest,
        store_ids: [...stores].sort((a, b) => a.sort_order - b.sort_order).map((s) => s.store_id),
      }));
    },
  });
}

/** 予定・店舗の進捗（予定ありバッジ）・店舗詳細の予定をまとめて取り直す */
function useInvalidateSchedules() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.storeProgress }),
    ]);
}

/** 保存（新規・編集）。予定と回る店舗を 1 トランザクションで保存する RPC を呼ぶ */
export function useSaveSchedule() {
  const invalidate = useInvalidateSchedules();
  return useMutation({
    mutationFn: async ({ values, scheduleId }: { values: ScheduleFormValues; scheduleId: string | null }) => {
      const { data, error } = await createClient().rpc("save_schedule", toSaveScheduleArgs(values, scheduleId));
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => invalidate(),
  });
}

/** 削除（本人の予定のみ。RLS で守られている） */
export function useDeleteSchedule() {
  const invalidate = useInvalidateSchedules();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await createClient().from("schedules").delete().eq("id", id).select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("削除できませんでした（権限がないか、すでに削除されています）");
    },
    onSuccess: () => invalidate(),
  });
}
