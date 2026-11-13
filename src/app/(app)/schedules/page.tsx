import type { Metadata } from "next";

export const metadata: Metadata = { title: "営業予定" };

export default function Page() {
  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-black">営業予定</h1>
      <p className="mt-2 text-muted-foreground">この画面はフェーズ6で作ります。</p>
    </div>
  );
}
