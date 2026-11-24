export const STARTING_COINS = 100;
export const WINNING_COINS = 200;

export function createCoinBalance(onChange) {
  let count = STARTING_COINS;
  let outcome = null;
  return {
    get count() { return count; },
    get outcome() { return outcome; },
    change(delta) {
      if (!Number.isSafeInteger(delta)) throw new TypeError('Coin changes must be whole numbers.');
      if (outcome || delta === 0) return count;
      count = Math.max(0, Math.min(WINNING_COINS, count + delta));
      if (count === 0) outcome = 'loss';
      if (count === WINNING_COINS) outcome = 'win';
      onChange?.(count, outcome);
      return count;
    }
  };
}
