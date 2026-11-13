import type { MetadataRoute } from "next";

/** PWA のマニフェスト（ホーム画面に追加したときの名前・アイコン・色） */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "晩餐杯 店舗営業",
    short_name: "晩餐杯",
    description: "晩餐杯の店舗営業を記録・共有するアプリ",
    lang: "ja",
    start_url: "/stores",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf6ee",
    theme_color: "#ffc629",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
