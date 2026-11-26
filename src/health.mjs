export const MAX_HEARTS = 3;

export function createHealth(onChange) {
  let hearts = MAX_HEARTS;

  function set(value, deathMessage) {
    if (!Number.isFinite(value)) throw new TypeError('Health must be finite.');
    if (hearts === 0) return 0;
    const next = Math.max(0, Math.min(MAX_HEARTS, value));
    if (next !== hearts) {
      hearts = next;
      onChange?.(hearts, deathMessage);
    }
    return hearts;
  }

  return {
    get hearts() { return hearts; },
    set,
    change(delta, deathMessage) {
      if (!Number.isSafeInteger(delta * 2)) throw new TypeError('Health changes must be in half hearts.');
      return set(hearts + delta, deathMessage);
    }
  };
}
