import Link from "next/link";
import { UsersRound } from "lucide-react";
import type { VisitSummary } from "@/lib/data/stores";
import { FLYER_STATUS_LABELS } from "@/lib/labels";
import { formatWeekday, parseYmd } from "@/lib/format";
import { userColorVar } from "@/lib/user-color";
import { Badge } from "@/components/ui/badge";

const FLYER_VARIANT = { distributed: "success", not_distributed: "neutral", previously_distributed: "brand" } as const;

/** 日付を札のように見せる（月・日・曜日） */
export function DateBlock({ ymd }: { ymd: string }) {
  const d = parseYmd(ymd);
  return (
    <span className="flex w-12 shrink-0 flex-col items-center self-start rounded-md bg-muted py-1.5">
      <span className="num text-xs font-semibold text-muted-foreground">{d.getMonth() + 1}月</span>
      <span className="num text-[28px] leading-none font-bold">{d.getDate()}</span>
      <span className="text-[11px] font-bold text-muted-foreground">{formatWeekday(ymd)}</span>
    </span>
  );
}

/** 登録者（ユーザー色のドットと表示名） */
export function AuthorLabel({ author }: { author: VisitSummary["author"] }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
      <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: userColorVar(author?.color) }} />
      {author?.display_name ?? "不明"}
    </span>
  );
}

/** 営業記録の概要カード（店舗詳細・記録一覧で使う） */
export function VisitCard({
  visit,
  store,
  href,
  onClick,
}: {
  visit: VisitSummary;
  /** 記録一覧などで店舗名を見せるとき */
  store?: { name: string; prefecture: string; city: string };
  href?: string;
  onClick?: () => void;
}) {
  const staffCount = visit.staff.length;
  const excerpt = visit.note ?? [...visit.staff].sort((a, b) => a.sort_order - b.sort_order).find((s) => s.conversation)?.conversation ?? null;
  const body = (
    <>
      <div className="flex gap-3.5 p-4">
        <DateBlock ymd={visit.visit_date} />
        <div className="min-w-0 flex-1">
          {store && (
            <>
              <p className="text-[17px] leading-snug font-black">{store.name}</p>
              <p className="text-xs text-muted-foreground">
                {store.prefecture} {store.city}
              </p>
            </>
          )}
          <div className={store ? "mt-2 flex flex-wrap gap-1.5" : "flex flex-wrap gap-1.5"}>
            {visit.flyer_status && (
              <Badge variant={FLYER_VARIANT[visit.flyer_status]}>チラシ {FLYER_STATUS_LABELS[visit.flyer_status]}</Badge>
            )}
            <Badge variant="neutral">
              <UsersRound aria-hidden />
              スタッフ <span className="num text-[13px]">{staffCount}</span>人
            </Badge>
          </div>
          {excerpt && <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed">{excerpt}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 border-t border-border bg-muted/50 px-4 py-2">
        <AuthorLabel author={visit.author} />
      </div>
    </>
  );
  const className = "block w-full overflow-hidden rounded-lg border border-border bg-card text-left text-card-foreground";
  const interactive = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring active:bg-muted/40";
  if (href) {
    return (
      <Link href={href} className={`${className} ${interactive}`}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} ${interactive}`}>
        {body}
      </button>
    );
  }
  return <div className={className}>{body}</div>;
}
