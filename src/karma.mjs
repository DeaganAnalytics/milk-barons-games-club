export const MIN_KARMA = -10;
export const MAX_KARMA = 10;

export function createKarma(onChange) {
  let score = 0;

  return {
    get score() { return score; },
    change(points) {
      if (!Number.isSafeInteger(points * 4)) throw new TypeError('Karma changes must be in quarter-point increments.');
      const next = Math.max(MIN_KARMA, Math.min(MAX_KARMA, score + points));
      if (next !== score) {
        score = next;
        onChange?.(score, (score - MIN_KARMA) / (MAX_KARMA - MIN_KARMA));
      }
      return score;
    }
  };
}
