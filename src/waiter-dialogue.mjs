import {linCrushLines, sterlingResponses, waiterNameLines} from './waiter-name-dialogue.mjs';

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

function exchange(lines, ending, playerMood = 'attentive') {
  let replies = ending;
  for (let index = lines.length - (lines.length % 2 ? 1 : 2); index >= 0; index -= 2) {
    const response = lines[index + 1];
    const next = response === undefined ? ending[0].next
      : typeof response === 'string' ? say(response, replies)
        : {...say(response.text, replies), ...response};
    replies = [{...reply(lines[index], next), playerMood}];
  }
  return replies[0];
}

export function createWaiterConversation(getCoins, askedAboutCowGuards = () => false) {
  let greetingIndex = 0;
  const spokenTo = new Set();
  const askedName = new Set();
  let linStage = 0;

  return function open(withoutMilk, id) {
    const knowsOtherServer = ['handlebar-waiter', 'male-waiter', 'martini-waiter', 'blonde-waitress']
      .some(server => spokenTo.has(server));
    spokenTo.add(id);
    if (withoutMilk) return say('Not now! Busy, busy, busy!');

    const index = greetingIndex++ % greetings.length;
    const greeting = greetings[index];
    const canAskName = waiterNameLines[id] && !askedName.has(id)
      && (id !== 'handlebar-waiter' || askedAboutCowGuards())
      && (id !== 'female-waiter' || knowsOtherServer);
    const canChatWithLin = id === 'lin-waitress' && askedName.has(id);
    let currentMenu;
    let nameAvailable = canAskName;
    let chatAvailable = canChatWithLin;
    const back = reply('Continue', () => menu());
    const finishName = reply('Continue', () => {
      askedName.add(id);
      nameAvailable = false;
      currentMenu = undefined;
      return menu();
    });
    const nameEnding = id === 'martini-waiter'
      ? sterlingResponses.map((lines, index) => exchange(lines, [finishName], index ? 'worried' : 'alarmed'))
      : [finishName];

    function menu() {
      if (currentMenu) return currentMenu;
      const personal = [];
      if (nameAvailable) personal.push(exchange(waiterNameLines[id], nameEnding, id === 'lin-waitress' ? 'worried' : 'thinking'));
      if (chatAvailable) {
        if (linStage < linCrushLines.length) {
          const finishChat = reply('Continue', () => {
            linStage++;
            chatAvailable = false;
            currentMenu = undefined;
            return menu();
          });
          personal.push(exchange(linCrushLines[linStage], [finishChat], 'worried'));
        } else {
          const delighted = {...say('Likewise!', [back]), speaker: 'Pip', playerMood: 'happy', direction: 'Pip looks visibly delighted.'};
          personal.push(reply('Hello, Lin!', say('Hello, Pip. Lovely to see you again.', [
            reply('Continue', delighted)
          ], undefined, 'pleased')));
        }
      }

      currentMenu = say(greeting, [
        reply('Could I have a glass of milk, please?', say("Certainly, sir. That'll be ₥2.", [
          reply('Yes, please.', () => getCoins() >= WAITER_MILK_PRICE
            ? {...say('Here you are, sir. Enjoy!', [], 'buyWaiterMilk', 'pleased'), autoCloseMs: 1600}
            : say("I'm terribly sorry, sir, but you appear to have insufficient funds.", [back], undefined, 'apologetic')),
          reply('Actually, never mind.', say('Very well, sir.', [back]))
        ])),
        ...personal,
        reply("I'll leave you to it.", say('Enjoy your evening, sir.'))
      ], undefined, index === 2 || index === 8 ? 'hurried' : 'welcoming');
      return currentMenu;
    }
    return menu();
  };
}
