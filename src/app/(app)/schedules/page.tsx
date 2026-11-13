import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly } from "@/components/client-only";
import { ScreenFade } from "@/components/screen-fade";
import { Skeleton } from "@/components/ui/skeleton";
import { SchedulesScreen } from "@/components/schedules/schedules-screen";

export const metadata: Metadata = { title: "営業予定" };

function SchedulesSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 pt-5">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-80 w-full rounded-lg" />
    </div>
  );
}

/** 営業予定（カレンダー / リスト） */
export default function SchedulesPage() {
  return (
    <Suspense fallback={<SchedulesSkeleton />}>
      <ClientOnly fallback={<SchedulesSkeleton />}>
        <ScreenFade>
          <SchedulesScreen />
        </ScreenFade>
      </ClientOnly>
    </Suspense>
  );
}
