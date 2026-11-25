export const WAITER_MILK_PRICE = 2;

const greetings = [
  'Good evening. How may I assist you?',
  'Would you care for a glass of milk?',
  'Are you being served?',
  "Welcome to the Baron's establishment.",
  'Can I interest you in some refreshments?',
  'Thirsty, sir?',
  "A lovely evening for a glass of milk, wouldn't you agree?",
  'At your service, sir.',
  'May I take your order?',
  'Nothing quite like a refreshing glass of milk!'
];

const reply = (label, next) => ({label, next, playerMood: 'attentive'});
const say = (text, replies = [], enterAction, mood = 'attentive') => ({
  text, mood, replies, mustContinue: replies.length > 0, enterAction
});

export function createWaiterConversation(getCoins) {
  let greetingIndex = 0;

  return function open(withoutMilk) {
    if (withoutMilk) return say('Not now! Busy, busy, busy!');

    const index = greetingIndex++ % greetings.length;
    const greeting = greetings[index];
    const back = reply('Continue', () => menu);
    const menu = say(greeting, [
      reply('Could I have a glass of milk, please?', say("Certainly, sir. That'll be ₥2.", [
        reply('Yes, please.', () => getCoins() >= WAITER_MILK_PRICE
          ? {...say('Here you are, sir. Enjoy!', [], 'buyWaiterMilk', 'pleased'), autoCloseMs: 1600}
          : say("I'm terribly sorry, sir, but you appear to have insufficient funds.", [back], undefined, 'apologetic')),
        reply('Actually, never mind.', say('Very well, sir.', [back]))
      ])),
      reply("I'll leave you to it.", say('Enjoy your evening, sir.'))
    ], undefined, index === 2 || index === 8 ? 'hurried' : 'welcoming');
    return menu;
  };
}
