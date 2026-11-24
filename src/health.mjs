export const MAX_HEARTS = 3;

export function createHealth(onChange) {
  let halfHearts = MAX_HEARTS * 2;

  return {
    get hearts() { return halfHearts / 2; },
    change(hearts, deathMessage) {
      const delta = hearts * 2;
      if (!Number.isSafeInteger(delta)) throw new TypeError('Health changes must be in half hearts.');
      if (halfHearts === 0) return 0;
      const next = Math.max(0, Math.min(MAX_HEARTS * 2, halfHearts + delta));
      if (next !== halfHearts) {
        halfHearts = next;
        onChange?.(halfHearts / 2, deathMessage);
      }
      return halfHearts / 2;
    }
  };
}
