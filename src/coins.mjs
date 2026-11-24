export const STARTING_COINS = 100;
export const WINNING_COINS = 200;

export function createCoinBalance(onChange) {
  let count = STARTING_COINS;
  let outcome = null;
  let earningStreak = 0;
  let streakEarnings = 0;
  let pendingTax = null;
  return {
    get count() { return count; },
    get outcome() { return outcome; },
    get pendingTax() { return pendingTax; },
    collectTax() {
      if (!pendingTax || outcome) return count;
      const {due} = pendingTax;
      pendingTax = null;
      return this.change(-due);
    },
    change(delta) {
      if (!Number.isSafeInteger(delta)) throw new TypeError('Coin changes must be whole numbers.');
      if (outcome || delta === 0) return count;
      count = Math.max(0, Math.min(WINNING_COINS, count + delta));
      if (count === 0) outcome = 'loss';
      if (count === WINNING_COINS) outcome = 'win';
      if (delta < 0) {
        earningStreak = 0;
        streakEarnings = 0;
      } else if (!pendingTax && !outcome) {
        streakEarnings += delta;
        if (++earningStreak === 5) {
          pendingTax = {earnings: streakEarnings, due: Math.ceil(streakEarnings * 3 / 10)};
        }
      }
      onChange?.(count, outcome);
      return count;
    }
  };
}
