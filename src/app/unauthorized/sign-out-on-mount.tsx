"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** 権限のないアカウントのセッションが残っていれば消す */
export function SignOutOnMount() {
  useEffect(() => {
    void createClient().auth.signOut();
  }, []);
  return null;
}
