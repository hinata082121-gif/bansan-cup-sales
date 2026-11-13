/**
 * 店舗名検索の表記ゆれ吸収（店舗一覧と記録入力で共通）。
 *   - 全角/半角の英数字・カタカナをそろえる（NFKC）
 *   - カタカナ → ひらがな
 *   - 地名の小さい「ヶ」「ヵ」は読みの「が」「か」と同じに扱い、「ぢ・づ」と「じ・ず」をそろえる
 *   - 大文字/小文字、空白、中黒などの記号を無視する
 *   - 「鳥貴族」「とりきぞく」は検索語から取り除く（店舗名の側にはもともと含めていない）
 */

const KATA_TO_HIRA_START = 0x30a1;
const KATA_TO_HIRA_END = 0x30f6;

/** 1 文字（または合成済みの文字列）を比較用に正規化する。空文字になることもある */
function normalizeChunk(chunk: string): string {
  let s = chunk.normalize("NFKC").toLowerCase();
  // 地名の「ヶ」「ヵ」（幡ヶ谷・市ヶ谷）は読みの「が」「か」とそろえる
  s = s.replace(/ヶ/g, "が").replace(/ヵ/g, "か");
  s = s.replace(/[ァ-ヶ]/g, (c) => {
    const code = c.charCodeAt(0);
    return code >= KATA_TO_HIRA_START && code <= KATA_TO_HIRA_END ? String.fromCharCode(code - 0x60) : c;
  });
  s = s.replace(/ぢ/g, "じ").replace(/づ/g, "ず");
  // 空白・記号は無視（長音「ー」は残す）
  s = s.replace(/[\s　・･.,、。'"’”()（）\[\]［］「」『』\-‐－―~〜]/g, "");
  return s;
}

/** 検索語を正規化する */
export function normalizeQuery(query: string): string {
  return normalizeChunk(query).replace(/鳥貴族|とりきぞく/g, "");
}

/**
 * 店舗名などを 1 文字ずつ正規化し、正規化後の各位置が元の文字列のどこに当たるかも返す
 * （一致した部分を元の表記でハイライトするため）。
 */
export function normalizeWithMap(text: string): { normalized: string; map: number[] } {
  let normalized = "";
  const map: number[] = [];
  const chars = Array.from(text);
  let offset = 0;
  for (const ch of chars) {
    const n = normalizeChunk(ch);
    for (let i = 0; i < n.length; i++) map.push(offset);
    normalized += n;
    offset += ch.length;
  }
  map.push(text.length);
  return { normalized, map };
}

export type MatchRange = { start: number; end: number };

/** text の中で query（正規化済み）に一致する範囲を、元の text の位置で返す */
export function findMatch(text: string, normalizedQuery: string): MatchRange | null {
  if (!normalizedQuery) return null;
  const { normalized, map } = normalizeWithMap(text);
  const idx = normalized.indexOf(normalizedQuery);
  if (idx < 0) return null;
  const start = map[idx];
  // 最後に一致した文字を生んだ元の文字の終わりまで（サロゲートペアは 2 単位）
  const lastOrig = map[idx + normalizedQuery.length - 1];
  const end = lastOrig + ((text.codePointAt(lastOrig) ?? 0) > 0xffff ? 2 : 1);
  return { start, end };
}
