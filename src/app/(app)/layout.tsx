import { Suspense } from "react";
import { connection } from "next/server";
import { LogOut } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { BottomNav } from "@/components/bottom-nav";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-brand px-4 pt-[env(safe-area-inset-top)] text-brand-foreground">
        <Wordmark className="text-xl" />
        <div className="flex items-center gap-1">
          <Suspense fallback={<span className="h-4 w-16 rounded bg-brand-foreground/10" />}>
            <CurrentUserName />
          </Suspense>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="ログアウト"
              className="flex size-11 items-center justify-center rounded-md transition active:scale-90"
            >
              <LogOut className="size-5" aria-hidden />
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))]">{children}</main>
      <BottomNav />
    </div>
  );
}

async function CurrentUserName() {
  // Supabase クライアントは内部で現在時刻を使うので、先読み（プリレンダー）ではなくリクエスト時に描画する
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();
  return <span className="text-sm font-bold">{profile?.display_name}</span>;
}
