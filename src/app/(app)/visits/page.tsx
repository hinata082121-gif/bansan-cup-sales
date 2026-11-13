import type { Metadata } from "next";

export const metadata: Metadata = { title: "記録入力" };

export default function Page() {
  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-black">記録入力</h1>
      <p className="mt-2 text-muted-foreground">この画面はフェーズ5で作ります。</p>
    </div>
  );
}
