import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "記録入力" };

export default function Page() {
  return (
    <>
      <PageHeader title="記録入力" />
      <p className="px-4 text-muted-foreground">この画面はフェーズ5で作ります。</p>
    </>
  );
}
