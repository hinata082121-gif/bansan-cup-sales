import { Skeleton } from "@/components/ui/skeleton";

export function PrefectureGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 px-4" aria-label="読み込み中">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3.5">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="mx-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card" aria-label="読み込み中">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex flex-col gap-2 px-4 py-3.5">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-3.5 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function StoresPageSkeleton() {
  return (
    <div className="flex flex-col gap-3 pt-5">
      <div className="px-4">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="px-4">
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="flex gap-2 px-4 pb-1">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-20 rounded-full" />
        ))}
      </div>
      <PrefectureGridSkeleton />
    </div>
  );
}
