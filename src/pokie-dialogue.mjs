import {openSlot} from './slot-machines.mjs';

export const pokieId = openSlot.id;
const bets = [1, 5, 10];
const outcomes = [
  [65, 'loss', 0],
  [80, 'break-even', 1],
  [95, 'small-win', 2],
  [99, 'big-win', 5],
  [100, 'jackpot', 10]
];
export const pokiePortraits = ['default', ...outcomes.map(([, mood]) => mood)];

const greetings = [
  'Feeling lucky?!',
  'Step right up! Spin to win!',
  'Big money! Big prizes!',
  'Milk your fortune!',
  "You've got to spin it to win it!",
  'Moo-ve over, poverty!'
];

const wins = [
  'Winner, winner, chicken dinner!',
  'Milky moo, a win for you!',
  "Hip hip hooray! It's your lucky day!",
  "Ding ding ding! You're the king!",
  'Yippee! Money for thee!',
  "Moo-la-la! You're in the money!"
];
const losses = [
  'Loser, loser, milk abuser!',
  'Oh dear, shed a tear!',
  'Boo hoo! No coins for you!',
  'Womp womp!',
  'No milk for you, silly moo!',
  'Tough luck, little duck!'
];
const even = [
  'Easy come, easy go!',
  'Round and round, no fortune found!',
  'Nothing lost, nothing gained!',
  'Okey dokey! Spin again!',
  'No more, no less! What a success!',
  'Same old moo-la!'
];

const PROFIT_LIMIT = 95;

export function createPokieProfit() {
  let net = 0;
  let taxCollected = false;
  return {
    get banned() { return net >= PROFIT_LIMIT; },
    maxPayout(stake) {
      return stake + Math.max(0, PROFIT_LIMIT - net);
    },
    collectTax() {
      if (!this.banned || taxCollected) return 0;
      taxCollected = true;
      return Math.ceil(net / 2);
    },
    record(stake, payout) {
      net += payout - stake;
      return this.banned;
    }
  };
}

export function createPokieConversation(placeWager, random = Math.random) {
  let greeting = 0;
  const leave = {label: 'Walk away', next: null};

  return function open() {
    let portrait = 'default';
    const replies = [...bets.map(stake => ({
      label: 'Bet ₥' + stake,
      next: () => {
        let multiplier;
        const result = placeWager(stake, () => {
          const roll = Math.floor(random() * 100) + 1;
          [, portrait, multiplier] = outcomes.find(([ceiling]) => roll <= ceiling);
          return multiplier;
        });
        if (!result) return {text: 'No money, no honey!', mood: portrait, replies, mustContinue: true};
        const lines = multiplier === 0 ? losses : multiplier === 1 ? even : wins;
        const text = lines[Math.floor(random() * lines.length)];
        return {
          text: multiplier > 0 ? text + ' Payout: ₥' + result.payout + '.' : text,
          mood: portrait,
          replies: result.banned ? [] : result.outcome ? [leave] : replies,
          mustContinue: true,
          autoCloseMs: result.banned ? 1400 : null,
          action: result.banned ? 'summonEliasForPokieBan' : result.outcome ? 'finishPokieGame' : null
        };
      }
    })), leave];
    return {text: greetings[greeting++ % greetings.length], mood: portrait, replies, mustContinue: true};
  };
}
