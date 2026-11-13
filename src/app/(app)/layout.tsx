import { Suspense } from "react";
import { connection } from "next/server";
import { LogOut } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { userColorVar } from "@/lib/user-color";
import { signOut } from "./actions";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <AppHeader>
        <Suspense fallback={<span className="mr-1 h-7 w-20 animate-pulse rounded-full bg-brand-foreground/10" />}>
          <CurrentUser />
        </Suspense>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="icon" aria-label="ログアウト">
            <LogOut />
          </Button>
        </form>
      </AppHeader>
      <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))]">{children}</main>
      <BottomNav />
    </div>
  );
}

async function CurrentUser() {
  // Supabase クライアントは内部で現在時刻を使うので、先読み（プリレンダー）ではなくリクエスト時に描画する
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, color")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;
  return (
    <span className="mr-1 inline-flex h-8 max-w-36 items-center gap-1.5 rounded-full bg-brand-foreground/10 pr-3 pl-2 text-sm font-bold">
      <span aria-hidden className="size-3 shrink-0 rounded-full" style={{ background: userColorVar(profile.color) }} />
      <span className="truncate">{profile.display_name}</span>
    </span>
  );
}
