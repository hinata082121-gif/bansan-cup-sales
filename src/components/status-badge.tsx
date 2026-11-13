import { CalendarClock, Circle, CircleCheck } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export type StoreStatus = "visited" | "scheduled" | "unvisited";

const CONFIG = {
  visited: { label: "営業済", icon: CircleCheck, variant: "success" },
  scheduled: { label: "予定あり", icon: CalendarClock, variant: "brand" },
  unvisited: { label: "未訪問", icon: Circle, variant: "outline" },
} as const;

/**
 * 店舗の進捗バッジ。日付があれば「営業済 11/8」「予定あり 11/20」のように併記する。
 * 営業済は回数も付けて「営業済 2回 · 11/8」（日付は最終訪問日）。
 * 色だけに頼らず、アイコンと文字でも状態が分かるようにしている。
 */
export function StatusBadge({
  status,
  date,
  count,
}: {
  status: StoreStatus;
  date?: string | Date | null;
  /** 営業回数（営業済のときだけ表示） */
  count?: number;
}) {
  const { label, icon: Icon, variant } = CONFIG[status];
  const d = date ? (typeof date === "string" ? new Date(`${date}T00:00:00`) : date) : null;
  const showCount = status === "visited" && count !== undefined && count > 0;
  return (
    <Badge variant={variant}>
      <Icon aria-hidden />
      {label}
      {showCount && (
        <span>
          <span className="num text-[13px] font-semibold">{count}</span>回
        </span>
      )}
      {showCount && d && (
        <span aria-hidden className="opacity-60">
          ·
        </span>
      )}
      {d && (
        <span className="num text-[13px] font-semibold">
          {showCount && <span className="sr-only">最終</span>}
          {format(d, "M/d")}
        </span>
      )}
    </Badge>
  );
}
