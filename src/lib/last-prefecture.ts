/** 前回選んだ都道府県（記録入力・営業予定の店舗選択で共通。端末に保存） */
const KEY = "bansan-cup-sales:last-prefecture";

export function readLastPrefecture(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function rememberPrefecture(prefecture: string) {
  if (!prefecture) return;
  try {
    localStorage.setItem(KEY, prefecture);
  } catch {
    // 保存できなくても困らない
  }
}
