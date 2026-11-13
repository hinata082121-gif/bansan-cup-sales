import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { ScreenFade } from "@/components/screen-fade";
import { Skeleton } from "@/components/ui/skeleton";
import { VisitsScreen } from "@/components/visits/visits-screen";

export const metadata: Metadata = { title: "記録入力" };

function VisitsSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 pt-5">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-56" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-lg" />
      ))}
    </div>
  );
}

/** 記録入力（営業記録の一覧と登録モーダル） */
export default function VisitsPage() {
  return (
    <Suspense fallback={<VisitsSkeleton />}>
      <ClientOnly fallback={<VisitsSkeleton />}>
        <ScreenFade>
          <VisitsScreen />
        </ScreenFade>
      </ClientOnly>
    </Suspense>
  );
}
