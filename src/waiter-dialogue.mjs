import {membershipQuestion, waiterMembershipDialogue} from './waiter-membership-dialogue.mjs';
import {linBrieReferral} from './lin-brie-referral.mjs';
import {eliasTipIntervention, linColdPostBan, postBanLines, waiterTipLines} from './waiter-tipping-dialogue.mjs';
import {linClothingConfrontation, linPoolJealousy} from './lin-pool-dialogue.mjs';
import {linColdNameLines, linColdTalkLines, linCrushLines, linFinalInsultLines, linKindnessLines, linPrivateReaction, linPublicReaction, sterlingResponses, waiterNameLines} from './waiter-name-dialogue.mjs';

export const WAITER_MILK_PRICE = 2;
export const TIPPED_MILK_PRICE = WAITER_MILK_PRICE + 1;

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
      const {text, options, endChat, endInteraction, ...portrait} = response;
      if (endChat) next = () => {
        completeChat();
        return {...say(text), ...portrait};
      };
      else {
        const choices = portrait.action || endInteraction ? [] : options?.map(branch => exchange(branch, replies, playerMood, completeChat)) ?? replies;
        next = {...say(text, choices), ...portrait};
      }
    }
    replies = [{...reply(lines[index], next), playerMood}];
  }
  return replies[0];
}

function genevieveSingleDialogue() {
  const pip = (text, playerMood) => ({text, speaker: 'Pip', playerMood, mood: 'attentive'});
  const genevieve = (text, mood) => ({text, mood, exactNpcPortrait: true});
  const chain = (lines, end) => lines.reduceRight((next, line) => ({
    ...line, ...(next ? {mustContinue: true, replies: [reply('Continue', next)]}
      : {action: 'finishGenevieveSingle'})
  }), end);
  return chain([
    pip('So... are you single?', 'thinking'),
    genevieve("No, sir. I'm married.", 'attentive'),
    pip('Oh. Happily?', 'worried'),
    genevieve('Quite happily, thank you.', 'pleased'),
    pip('Oh.', 'sorry')
  ], {
    ...genevieve('Were you hoping for a different answer, sir?', 'attentive'),
    mustContinue: true,
    replies: [
      {...reply('A little bit.', chain([
        genevieve("Well, that's rather flattering.", 'pleased'),
        pip('Sorry.', 'sorry'),
        genevieve("There's no need to apologise, sir. You've done nothing wrong.", 'pleased')
      ])), playerMood: 'worried'},
      {...reply('How happily?', chain([
        genevieve("Happily enough that this conversation isn't going anywhere, sir.", 'attentive'),
        pip('Right.', 'sorry')
      ])), playerMood: 'thinking'},
      {...reply('[Lie] No, no. Just conducting a survey.', chain([
        pip('No, no. Just conducting a survey.', 'worried'),
        genevieve('A survey?', 'attentive'),
        pip('Of marital satisfaction amongst hospitality workers.', 'thinking'),
        genevieve('How wonderfully specific.', 'pleased'),
        pip('Thank you.', 'happy'),
        genevieve('Well, you can put me down as satisfied.', 'pleased')
      ])), playerMood: 'worried'}
    ]
  });
}

export function waiterTippingIntervention() {
  const [first, ...rest] = eliasTipIntervention;
  const exit = say('', [], undefined, 'current-smile');
  Object.assign(exit, {direction: 'Elias disappears.', action: 'finishWaiterTipBan', autoCloseMs: 900});
  return {...say(first.text, [exchange(rest, [reply('Continue', exit)], 'worried')]), ...first};
}

export function linKindnessDialogue() {
  return say('Pip?', [exchange(linKindnessLines, [], 'worried')], undefined, 'pleased');
}

export const linWaitressId = 'lin-waitress';

export function createWaiterConversation(getCoins, askedAboutCowGuards = () => false,
  hasSeducedExecutive = () => false, poolState = () => ({})) {
  let greetingIndex = 0;
  let membershipAsked = false;
  const tipped = new Set();
  const discussedBan = new Set();
  let tipBanComplete = false;
  const askedName = new Set();
  let linStage = 0;
  let genevieveSingleUsed = false;
  let linFlirtingStarted = false;

  let relationship = 'normal';
  let executiveConfronted = false;
  let finalInsultUsed = false;
  let poolJealousySeen = false;
  let clothingConfrontationSeen = false;
  let alternativeLinName = false;
  let brieReferralPending = false;
  let brieReferralCompleted = false;
  const eligibleForBrieReferral = () => !brieReferralCompleted && linStage === 0
    && relationship === 'normal' && !hasSeducedExecutive();
  const open = function (withoutMilk, id, publicConfrontation = false) {
    const isLin = id === linWaitressId;
    if (publicConfrontation && relationship === 'normal') {
      return exchange(linPublicReaction, [], 'worried').next;
    }
    if (isLin && relationship === 'departed') return say('');
    if (withoutMilk) return say('Not now! Busy, busy, busy!');
    const reacts = isLin && hasSeducedExecutive() && relationship === 'normal' && !open.willConfront();
    if (reacts) {
      alternativeLinName = !askedName.has(id);
    }
    const askedAboutUnusualName = ['handlebar-waiter', 'male-waiter', 'blonde-waitress']
      .some(server => askedName.has(server));
    const askedAboutOtherServerName = askedAboutUnusualName || askedName.has('martini-waiter');
    const pool = isLin && open.canOfferKindness() ? poolState() : {};
    const confrontClothing = pool.clothing && !clothingConfrontationSeen;
    const confrontPool = !confrontClothing && !clothingConfrontationSeen && !poolJealousySeen && pool.visited;
    if (isLin && brieReferralPending && eligibleForBrieReferral() && !reacts && !confrontClothing && !confrontPool) {
      return linBrieReferral(askedName.has(id));
    }

    const index = greetingIndex++ % greetings.length;
    const greeting = greetings[index];
    const canAskName = waiterNameLines[id] && !askedName.has(id)
      && (id !== 'handlebar-waiter' || askedAboutCowGuards())
      && (id !== 'martini-waiter' || askedAboutUnusualName)
      && (id !== 'female-waiter' || askedAboutOtherServerName)
      && (!isLin || (relationship === 'normal' && !hasSeducedExecutive()) || alternativeLinName);
    const canChatWithLin = isLin && askedName.has(id) && relationship === 'normal' && !hasSeducedExecutive() && !confrontClothing && !confrontPool;
    const canAskGenevieveSingle = id === 'female-waiter' && askedName.has(id);
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

    const canTip = () => !withoutMilk && tipped.size < 2 && !tipBanComplete && !tipped.has(id)
      && getCoins() >= TIPPED_MILK_PRICE && Boolean(waiterTipLines(id, relationship, linStage));

    function buyWithTip() {
      if (!canTip()) return say("I'm terribly sorry, sir, but that purchase is unavailable.", [back], undefined, 'apologetic');
      tipped.add(id);
      const [first, ...rest] = waiterTipLines(id, relationship, linStage);
      const ending = tipped.size === 2 ? {exitAction: 'beginWaiterTipBan'} : null;
      const finish = reply('Continue', ending);
      const opening = say(typeof first === 'string' ? first : first.text, [exchange(rest, [finish])],
        'buyTippedWaiterMilk', isLin && relationship === 'alienated' ? 'attentive' : 'pleased');
      return typeof first === 'string' ? opening : {...opening, ...first};
    }

    function milkOrder(linCold) {
      return say(linCold ? '₥2.' : "Certainly, sir. That'll be ₥2.", [
        reply('Yes, please.', () => !withoutMilk && getCoins() >= WAITER_MILK_PRICE
          ? {...say('Here you are, sir. Enjoy!', [], 'buyWaiterMilk', 'pleased'), autoCloseMs: 1600}
          : say(withoutMilk ? 'Not now! Busy, busy, busy!' : "I'm terribly sorry, sir, but you appear to have insufficient funds.", [back], undefined, 'apologetic')),
        ...(canTip() ? [reply('Yes, please. And a coin for you.', buyWithTip)] : []),
        reply('Actually, never mind.', say('Very well, sir.', [back]))
      ]);
    }

    function menu() {
      if (currentMenu) return currentMenu;
      const linCold = isLin && relationship === 'alienated';
      const personal = [];
      if (nameAvailable) personal.push(exchange(isLin && linCold ? linColdNameLines : waiterNameLines[id],
        nameEnding, isLin ? 'worried' : 'thinking'));
      if (canAskGenevieveSingle && !genevieveSingleUsed) personal.push({
        label: 'So... are you single?', playerMood: 'thinking', next: () => {
          genevieveSingleUsed = true;
          return genevieveSingleDialogue();
        }
      });
      if (isLin && linCold) personal.push(exchange(linColdTalkLines, [back], 'worried'));
      if (linCold && executiveConfronted && hasSeducedExecutive() && linStage >= 2 && !finalInsultUsed) {
        const topic = exchange(linFinalInsultLines, [back], 'worried');
        personal.push({...topic, next: () => {
          finalInsultUsed = true;
          currentMenu = undefined;
          return topic.next;
        }});
      }
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
          const flirt = exchange(linCrushLines[linStage], [finishChat], 'worried', completeChat);
          personal.push({...flirt, next: () => {
            linFlirtingStarted = true;
            return flirt.next;
          }});
        } else {
          const delighted = {...say('Likewise!', [back]), speaker: 'Pip', playerMood: 'happy', direction: 'Pip looks visibly delighted.'};
          personal.push(reply('Hello, Lin!', say('Hello, Pip. Lovely to see you again.', [
            reply('Continue', delighted)
          ], undefined, 'pleased')));
        }
      }

      if (tipBanComplete && postBanLines[id] && !discussedBan.has(id)) {
        const lines = isLin && linCold ? linColdPostBan : postBanLines[id];
        const topic = exchange(["Apparently I'm not allowed to tip anymore.", ...lines], [back]);
        personal.push({...topic, next: () => {
          discussedBan.add(id);
          currentMenu = undefined;
          return topic.next;
        }});
      }
      const membership = !membershipAsked && waiterMembershipDialogue(id);
      if (membership) personal.push({
        label: membershipQuestion, playerMood: 'thinking', next: () => {
          if (membershipAsked) return null;
          membershipAsked = true;
          return membership;
        }
      });
      currentMenu = say(linCold ? "Will you be ordering any milk, sir?" : greeting, [
        reply('Could I have a glass of milk, please?', milkOrder(linCold)),
        ...personal,
        reply("I'll leave you to it.", say(isLin && linCold ? 'Very well.' : 'Enjoy your evening, sir.'))
      ], undefined, index === 2 || index === 8 ? 'hurried' : 'welcoming');
      if (isLin) currentMenu.mysticVisibilityMenu = true;
      return currentMenu;
    }
    if (reacts) {
      const [first, ...rest] = alternativeLinName ? linPrivateReaction.beforeFlirting : linPrivateReaction.afterFlirting;
      const last = rest.length - 1;
      rest[last] = {text: rest[last], mood: 'skeptical'};
      const finish = reply('Continue', () => {
        open.finishExecutiveConfrontation();
        return menu();
      });
      const continuation = [exchange(rest, [finish], 'worried')];
      return typeof first === 'string' ? say(first, continuation)
        : {...say(first.text, continuation), ...first};
    }
    if (confrontClothing || confrontPool) {
      if (confrontClothing) clothingConfrontationSeen = true;
      else poolJealousySeen = true;
      const lines = confrontClothing ? linClothingConfrontation(pool) : linPoolJealousy(pool.heardBeauties);
      return {...say(lines[0], [exchange(['Continue', ...lines.slice(1)], [back], 'worried')]),
        speaker: 'Pip', playerMood: 'happy'};
    }
    return menu();
  };
  open.queueBrieReferral = () => {
    if (eligibleForBrieReferral()) brieReferralPending = true;
  };
  open.finishBrieReferral = () => {
    if (!brieReferralPending || !eligibleForBrieReferral()) return;
    brieReferralPending = false;
    brieReferralCompleted = true;
    askedName.add(linWaitressId);
  };
  open.finishTipBan = () => { tipBanComplete = true; };
  open.canOfferKindness = () => linStage >= 2 && relationship === 'normal' && !hasSeducedExecutive();
  open.willConfront = () => linStage > 3 && relationship === 'normal';
  open.relationship = () => relationship;
  open.hasStartedLinFlirting = () => linFlirtingStarted;
  open.completedLinChats = () => linStage;
  open.endRelationship = state => {
    if (relationship === 'normal' || (relationship === 'alienated' && state === 'departed')) relationship = state;
  };
  open.finishExecutiveConfrontation = () => {
    executiveConfronted = true;
    open.endRelationship('alienated');
  };
  return open;
}
