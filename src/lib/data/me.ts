"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * ログイン中のユーザー ID（自分の記録・予定かどうかの表示の出し分けに使う）。
 * 編集・削除できるかの最終判断は DB の RLS が行う。
 */
export function useMyUserId() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await createClient().auth.getSession();
      return data.session?.user.id ?? null;
    },
    staleTime: Infinity,
  });
}
