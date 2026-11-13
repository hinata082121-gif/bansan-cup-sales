import type { Metadata, Viewport } from "next";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { barlowCondensed, delaGothic, zenKaku } from "./fonts";
import "./globals.css";

const APP_NAME = "晩餐杯 店舗営業";

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  applicationName: APP_NAME,
  description: "晩餐杯の店舗営業を記録・共有するアプリ",
  // iPhone でホーム画面に追加したとき、アプリのように全画面で開く
  appleWebApp: { capable: true, title: "晩餐杯", statusBarStyle: "default" },
  // 関係者だけが使うアプリなので検索エンジンには載せない
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffc629" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1815" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={cn("h-full antialiased", zenKaku.variable, delaGothic.variable, barlowCondensed.variable)}
    >
      <body className="min-h-full font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
