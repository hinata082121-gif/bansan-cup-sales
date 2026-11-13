import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "店舗一覧" };

export default function Page() {
  return (
    <>
      <PageHeader title="店舗一覧" />
      <p className="px-4 text-muted-foreground">この画面はフェーズ4で作ります。</p>
    </>
  );
}
