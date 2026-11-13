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
 * 色だけに頼らず、アイコンと文字でも状態が分かるようにしている。
 */
export function StatusBadge({ status, date }: { status: StoreStatus; date?: string | Date | null }) {
  const { label, icon: Icon, variant } = CONFIG[status];
  const d = date ? (typeof date === "string" ? new Date(`${date}T00:00:00`) : date) : null;
  return (
    <Badge variant={variant}>
      <Icon aria-hidden />
      {label}
      {d && <span className="num text-[13px] font-semibold">{format(d, "M/d")}</span>}
    </Badge>
  );
}
