import { Barlow_Condensed, Dela_Gothic_One, Zen_Kaku_Gothic_New } from "next/font/google";

/*
 * 日本語フォントは Google Fonts が文字ごとに細かく分割（unicode-range）して配信するので、
 * 画面で使った文字の分だけ読み込まれる。subsets はプリロードする範囲（ここでは英数字）だけを決める。
 */

/** 本文: 読みやすく、少し親しみのあるゴシック */
export const zenKaku = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-zen-kaku",
});

/** 見出し・ワードマーク: 看板や大会の横断幕のような極太ゴシック */
export const delaGothic = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dela-gothic",
});

/** 日付・件数: 得点板のような細身の数字 */
export const barlowCondensed = Barlow_Condensed({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-barlow-condensed",
});
