import { Sparkles } from "lucide-react";
import type { StoreProgress } from "@/lib/stores/hierarchy";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";

/** 店舗の進捗バッジ（営業済は回数と最終訪問日付き。営業済と予定ありは同時に付くことがある）と開店前の注記 */
export function StoreBadges({ progress, openingNote }: { progress: StoreProgress | undefined; openingNote?: string | null }) {
  const visited = Boolean(progress?.lastVisitDate);
  const scheduled = Boolean(progress?.nextScheduleDate);
  return (
    <span className="flex flex-wrap gap-1.5">
      {visited && <StatusBadge status="visited" date={progress!.lastVisitDate} count={progress!.visitCount} />}
      {scheduled && <StatusBadge status="scheduled" date={progress!.nextScheduleDate} />}
      {!visited && !scheduled && <StatusBadge status="unvisited" />}
      {openingNote && (
        <Badge variant="neutral">
          <Sparkles aria-hidden />
          {openingNote}
        </Badge>
      )}
    </span>
  );
}
