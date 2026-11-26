import {linColdNameLines, linColdTalkLines, linCrushLines, linKindnessLines, linPrivateReaction, linPublicReaction, sterlingResponses, waiterNameLines} from './waiter-name-dialogue.mjs';

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

function exchange(lines, ending, playerMood = 'attentive', completeChat) {
  let replies = ending;
  for (let index = lines.length - (lines.length % 2 ? 1 : 2); index >= 0; index -= 2) {
    const response = lines[index + 1];
    let next;
    if (response === undefined) next = ending[0].next;
    else if (typeof response === 'string') next = say(response, replies);
    else {
      const {text, options, endChat, ...portrait} = response;
      if (endChat) next = () => {
        completeChat();
        return {...say(text), ...portrait};
      };
      else {
        const choices = options?.map(branch => exchange(branch, replies, playerMood, completeChat)) ?? replies;
        next = {...say(text, choices), ...portrait};
      }
    }
    replies = [{...reply(lines[index], next), playerMood}];
  }
  return replies[0];
}

export function linKindnessDialogue() {
  return say('Pip?', [exchange(linKindnessLines, [], 'worried')], undefined, 'pleased');
}

export const linWaitressId = 'lin-waitress';

export function createWaiterConversation(getCoins, askedAboutCowGuards = () => false,
  hasSeducedExecutive = () => false) {
  let greetingIndex = 0;
  const spokenTo = new Set();
  const askedName = new Set();
  let linStage = 0;

  let linCold = false;
  let alternativeLinName = false;
  const open = function (withoutMilk, id, publicConfrontation = false) {
    const isLin = id === linWaitressId;
    if (publicConfrontation) {
      linCold = true;
      return exchange(linPublicReaction, [], 'worried').next;
    }
    const reacts = isLin && hasSeducedExecutive() && !linCold && !open.willConfront();
    if (reacts) {
      linCold = true;
      alternativeLinName = !askedName.has(id);
    }
    const knowsOtherServer = ['handlebar-waiter', 'male-waiter', 'martini-waiter', 'blonde-waitress']
      .some(server => spokenTo.has(server));
    spokenTo.add(id);
    if (withoutMilk && !reacts) return say('Not now! Busy, busy, busy!');

    const index = greetingIndex++ % greetings.length;
    const greeting = isLin && linCold ? "Will you be ordering any milk, sir?" : greetings[index];
    const canAskName = waiterNameLines[id] && !askedName.has(id)
      && (id !== 'handlebar-waiter' || askedAboutCowGuards())
      && (id !== 'female-waiter' || knowsOtherServer)
      && (!isLin || !hasSeducedExecutive() || alternativeLinName);
    const canChatWithLin = isLin && askedName.has(id) && !hasSeducedExecutive();
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
      if (nameAvailable) personal.push(exchange(isLin && linCold ? linColdNameLines : waiterNameLines[id],
        nameEnding, isLin ? 'worried' : 'thinking'));
      if (isLin && linCold) personal.push(exchange(linColdTalkLines, [back], 'worried'));
      if (chatAvailable) {
        if (linStage < linCrushLines.length) {
          const completeChat = () => {
            linStage++;
            chatAvailable = false;
            currentMenu = undefined;
          };
          const finishChat = reply('Continue', () => {
            completeChat();
            return menu();
          });
          personal.push(exchange(linCrushLines[linStage], [finishChat], 'worried', completeChat));
        } else {
          const delighted = {...say('Likewise!', [back]), speaker: 'Pip', playerMood: 'happy', direction: 'Pip looks visibly delighted.'};
          personal.push(reply('Hello, Lin!', say('Hello, Pip. Lovely to see you again.', [
            reply('Continue', delighted)
          ], undefined, 'pleased')));
        }
      }

      currentMenu = say(greeting, [
        reply('Could I have a glass of milk, please?', say(isLin && linCold ? '₥2.' : "Certainly, sir. That'll be ₥2.", [
          reply('Yes, please.', () => !withoutMilk && getCoins() >= WAITER_MILK_PRICE
            ? {...say('Here you are, sir. Enjoy!', [], 'buyWaiterMilk', 'pleased'), autoCloseMs: 1600}
            : say(withoutMilk ? 'Not now! Busy, busy, busy!' : "I'm terribly sorry, sir, but you appear to have insufficient funds.", [back], undefined, 'apologetic')),
          reply('Actually, never mind.', say('Very well, sir.', [back]))
        ])),
        ...personal,
        reply("I'll leave you to it.", say(isLin && linCold ? 'Very well.' : 'Enjoy your evening, sir.'))
      ], undefined, index === 2 || index === 8 ? 'hurried' : 'welcoming');
      return currentMenu;
    }
    if (reacts) {
      const [first, ...rest] = alternativeLinName ? linPrivateReaction.beforeFlirting : linPrivateReaction.afterFlirting;
      return typeof first === 'string' ? say(first, [exchange(rest, [back], 'worried')])
        : {...say(first.text, [exchange(rest, [back], 'worried')]), ...first};
    }
    return menu();
  };
  open.canOfferKindness = () => linStage >= 2 && !hasSeducedExecutive();
  open.willConfront = () => linStage > 3 && !linCold;
  return open;
}
