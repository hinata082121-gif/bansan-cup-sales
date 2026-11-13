import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "営業予定" };

export default function Page() {
  return (
    <>
      <PageHeader title="営業予定" />
      <p className="px-4 text-muted-foreground">この画面はフェーズ6で作ります。</p>
    </>
  );
}
