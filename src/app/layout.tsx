import type { Metadata, Viewport } from "next";
import "./globals.css";

const APP_NAME = "晩餐杯 店舗営業";

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  applicationName: APP_NAME,
  description: "晩餐杯の店舗営業を記録・共有するアプリ",
  // 関係者だけが使うアプリなので検索エンジンには載せない
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7c600" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1916" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
