import type { MatchRange } from "@/lib/search/normalize";

/** 検索で一致した部分を黄色の面でハイライトする */
export function Highlight({ text, range }: { text: string; range: MatchRange | null }) {
  if (!range) return <>{text}</>;
  return (
    <>
      {text.slice(0, range.start)}
      <mark className="rounded-sm bg-brand px-px text-brand-foreground">{text.slice(range.start, range.end)}</mark>
      {text.slice(range.end)}
    </>
  );
}
