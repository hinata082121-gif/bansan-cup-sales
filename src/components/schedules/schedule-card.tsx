import { MapPin } from "lucide-react";
import type { Schedule } from "@/lib/data/schedules";
import type { Store } from "@/lib/data/stores";
import { TIME_SLOT_LABELS } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { AuthorLabel } from "@/components/visits/visit-card";

/** 営業予定の概要カード（誰の予定か・時間帯・回る店舗・メモ） */
export function ScheduleCard({
  schedule,
  storeMap,
  onClick,
}: {
  schedule: Schedule;
  storeMap: ReadonlyMap<string, Store>;
  onClick: () => void;
}) {
  const names = schedule.store_ids.map((id) => storeMap.get(id)?.name ?? `店舗 ${id}`);
  const shown = names.slice(0, 3);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card p-3.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring active:bg-muted/40"
    >
      <span className="flex flex-wrap items-center gap-2">
        <AuthorLabel author={schedule.author} />
        {schedule.time_slot && <Badge variant="brand">{TIME_SLOT_LABELS[schedule.time_slot]}</Badge>}
      </span>
      {names.length > 0 ? (
        <span className="flex flex-wrap items-center gap-1.5">
          <MapPin aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          {shown.map((name, i) => (
            <span key={`${name}-${i}`} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm font-bold">
              <span className="num text-xs text-muted-foreground">{i + 1}</span>
              {name}
            </span>
          ))}
          {names.length > shown.length && (
            <span className="text-sm font-bold text-muted-foreground">
              ほか<span className="num text-[15px]">{names.length - shown.length}</span>店
            </span>
          )}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">回る店舗は未定</span>
      )}
      {schedule.memo && <span className="line-clamp-1 text-sm">{schedule.memo}</span>}
    </button>
  );
}
