/** 対象の都道府県（表示順） */
export const PREFECTURES = ["埼玉県", "東京都", "神奈川県", "千葉県"] as const;
export type Prefecture = (typeof PREFECTURES)[number];

export function isPrefecture(value: string): value is Prefecture {
  return (PREFECTURES as readonly string[]).includes(value);
}
