/** 営業済（緑）と予定あり（黄）の割合を示す細い帯 */
export function AreaProgressBar({ total, visited, scheduled }: { total: number; visited: number; scheduled: number }) {
  const pct = (n: number) => (total ? `${(n / total) * 100}%` : "0%");
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
      <div className="bg-success" style={{ width: pct(visited) }} />
      <div className="bg-brand" style={{ width: pct(scheduled) }} />
    </div>
  );
}
