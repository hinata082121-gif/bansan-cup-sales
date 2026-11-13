/** アプリのワードマーク（フェーズ3でデザインを詰める） */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-1.5 font-black tracking-tight ${className}`}>
      <span>晩餐杯</span>
      <span className="text-[0.6em] font-bold">店舗営業</span>
    </span>
  );
}
