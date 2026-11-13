import type { Metadata } from "next";

export const metadata: Metadata = { title: "店舗一覧" };

export default function Page() {
  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-black">店舗一覧</h1>
      <p className="mt-2 text-muted-foreground">この画面はフェーズ4で作ります。</p>
    </div>
  );
}
