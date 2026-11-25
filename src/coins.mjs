export const STARTING_COINS = 100;
export const WINNING_COINS = 200;

export function createCoinBalance(onChange) {
  let count = STARTING_COINS;
  let outcome = null;
  let earningStreak = 0;
  let streakEarnings = 0;
  let pendingTax = null;
  function publish() {
    if (count === 0) outcome = 'loss';
    if (count === WINNING_COINS) outcome = 'win';
    onChange?.(count, outcome);
  }
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
    wager(stake, rollMultiplier) {
      if (outcome || !Number.isSafeInteger(stake) || stake < 1 || stake > count) return null;
      count -= stake;
      // Settle the stake and payout together so an all-in win can recover from zero.
      const payout = stake * rollMultiplier();
      count = Math.min(WINNING_COINS, count + payout);
      earningStreak = 0;
      streakEarnings = 0;
      publish();
      return {payout, outcome};
    },
    change(delta) {
      if (!Number.isSafeInteger(delta)) throw new TypeError('Coin changes must be whole numbers.');
      if (outcome || delta === 0) return count;
      count = Math.max(0, Math.min(WINNING_COINS, count + delta));
      if (delta < 0) {
        earningStreak = 0;
        streakEarnings = 0;
      } else if (!pendingTax && count < WINNING_COINS) {
        streakEarnings += delta;
        if (++earningStreak === 5) {
          pendingTax = {earnings: streakEarnings, due: Math.ceil(streakEarnings * 3 / 10)};
        }
      }
      publish();
      return count;
    }
  };
}
