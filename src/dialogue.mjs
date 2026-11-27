import {createProfessorInterview} from './professor-interview.mjs';
import {baronCurdReply} from './baron-curd-dialogue.mjs';
import {createMysticVisibilityDialogue} from './mystic-visibility-dialogue.mjs';
import {createLinDepartureReactions} from './lin-departure-dialogue.mjs';
import {createMilkMysticConversation, milkMysticId, milkMysticMoods} from './milk-mystic.mjs';
import {createDjConversation, djMoods, djTarget} from './dj-dialogue.mjs';
import {miloIntroduction, miloMenu} from './milo-dialogue.mjs';
import {createMiloGreeting} from './milo.mjs';
import {createDancerConversation, dancerMoods, dancerPortraitName, dancerTargets} from './dancer-dialogue.mjs';
import {accountingReplies} from './elias-accounting.mjs';
import {createSkimConversation, skimId} from './skim-dialogue.mjs';
import {createPracticeGuardConversation} from './practice-range-dialogue.mjs';
import {gamblerPortraits, sleepingGamblerDialogue, sleepingGamblerId} from './sleeping-gambler.mjs';
import {createPokieConversation, pokieId, pokiePortraits} from './pokie-dialogue.mjs';
import {createExecutiveConversation, executiveFraudWarning, executiveId, executiveMoods} from './executive-dialogue.mjs';
import {createPoliticianConversation, politicianId, politicianMoods} from './politician-dialogue.mjs';
import {slotPlayers} from './slot-machines.mjs';
import {creameryGuardDialogue} from './creamery-guard-dialogue.mjs';
import {bartenderExit, bartenderMoods, bartenderOpening} from './bartender-dialogue.mjs';
import {additionalBaronReplies, baronCowGuardReply, baronDanceDialogue, baronGreetings, baronKarmaDialogue, DJ_ADMISSION_PRICE} from './baron-dialogue.mjs';
import {isBaronDancing} from './baron.mjs';
import {elias, eliasConversation, eliasDanceConversation, eliasFollowingConversation, eliasPassThroughDialogue, eliasPortraits, eliasPokieBan, eliasPokieRefusal, eliasTaxConversation, eliasWelcome, vampireFollowup} from './elias.mjs';
import {commissionerMoods, createCommissionerConversation} from './commissioner-dialogue.mjs';
import {attendantMoods, createAttendantConversation} from './attendant-dialogue.mjs';
import {pilloryAttendant, pilloryCommissioner} from './pillory.mjs';
import {createProfessorConversation, professorMoods} from './professor-dialogue.mjs';
import {professor} from './professor.mjs';
import {clothingReports, lifeguardDialogue, lifeguardMoods, lifeguardReplies, poolClothingDialogue} from './lifeguard-dialogue.mjs';
import {lifeguard, poolClothing} from './milk-pool.mjs';
import {availableReports, injuredMiloReply, lifeguardQualificationReport, poolReports, unattendedClothes} from './report-dialogue.mjs';
import {bartender} from './creamery.mjs';
import {partyGuests} from './party-guests.mjs';
import {staffIds} from './staff.mjs';
import {createWaiterConversation, linKindnessDialogue, waiterTippingIntervention} from './waiter-dialogue.mjs';
import {drawPipPortrait} from './pip-art.mjs';

const partyGuestCallsGuard = {
  text: 'Then get away from me! Guards!', mood: 'annoyed', action: 'callGuard'
};

const partyGuestOpening = (id, expressive) => ({
  text: "Where's your milk waiter?", mood: !expressive ? 'attentive' : id === 'plum' ? 'delighted' : 'amused', replies: [
    {label: "I'm not a waiter.", playerMood: 'thinking', next: partyGuestCallsGuard},
    {label: "I'll go get it.", playerMood: 'attentive', next: {
      text: "And hurry up with it. And where's your suit?", mood: id === 'plum' ? 'smug' : 'skeptical', replies: [
        {label: "I'm sorry.", playerMood: 'sorry', next: {
          text: 'Unacceptable. I must raise a complaint with the Baron!', mood: id === 'plum' ? 'shocked' : 'appalled'
        }},
        {label: "Actually I'm not a waiter.", playerMood: 'worried', next: partyGuestCallsGuard}
      ]
    }}
  ]
});

const postEscortWarning = {
  text: 'Central? Please send a guard to protect our esteemed female guests in the bottom left corner.',
  mood: 'radio', replies: [
    {label: 'Continue', playerMood: 'worried', next: {
      text: 'You have been warned. They are out of league.', mood: 'formal', replies: [
        {label: 'I just wanted to...', playerMood: 'sorry', next: {
          text: "Don't! Actually, open your wallet! Yes, I'll take that!", mood: 'angry', action: 'fineAndSecureGuests'
        }}
      ]
    }}
  ]
};

const guestGateWarning = {
  text: "Sir, stop bothering the ladies. Please leave or I'll have to shoot you.", mood: 'formal', replies: [
    {label: "You'll shoot me?", playerMood: 'alarmed', next: {text: "Yes. Baron's orders.", mood: 'deadpan'}},
    {label: "You can't shoot me, that's illegal!", playerMood: 'worried',
      next: {text: 'The Baron owns the courts. Try me.', mood: 'suspicious'}}
  ]
};

const guardOpening = 'Do you have a problem to report? Otherwise, get out of my way.';
const cowGuardQuestions = new Set([
  'Are those guards cows?',
  'Are you a cow?',
  'Why are all the guards cows?',
  'Why is the guard a cow?',
  'Why do you have cows for guards?',
  'Why are the guards cows?',
  'You seem like a smart man. Why are the guards cows?',
  'Am I crazy, or are the guards cows?',
  "The guards. Please tell me they're cows.",
  'How can a cow operate a gun?'
]);

const cowReply = {
  label: 'Are you a cow?', playerMood: 'thinking', once: 'guardCowQuestion', consumeOnSelect: true,
  next: {text: 'I am a guard.', mood: 'deadpan', replies: [
    {label: 'But you have horns.', playerMood: 'thinking', next: {text: 'I am a guard.', mood: 'deadpan'}}
  ]}
};

const postedGuardOpening = 'If you have something to report, find one of the roving security officers';
const postedGuardReplies = [
  cowReply,
  {
    label: 'Why do you have an assault rifle?', playerMood: 'thinking',
    next: {text: 'To guard the milk.', mood: 'deadpan'}
  }
];

const guardReplies = [
  cowReply,
  {
    label: "No, I don't have anything to report.", playerMood: 'attentive',
    next: {text: 'Then get out of my way!', mood: 'speaking'}
  },
  {
    label: 'Yes I do.', playerMood: 'attentive',
    next: {text: "All right. What do you have to report?", mood: 'suspicious', replies: [
      {label: 'Actually, never mind.', playerMood: 'thinking', next: {text: 'Excellent. A problem that resolves itself. My favourite kind.', mood: 'deadpan'}}
    ]}
  }
];

const baronReplies = [
  {
    label: 'Do you own this place?', once: 'baronOwnership', consumeOnSelect: true, playerMood: 'thinking',
    next: {text: 'Of course, I own nearly every place.', mood: 'laughing'}
  }
];

const followingReply = {
  label: 'Are you following me?', once: 'baronFollowing', consumeOnSelect: true, playerMood: 'thinking',
  next: {text: 'Following you? Never! I am merely managing my institution.', mood: 'suspicious'}
};

const watchingReply = {
  label: 'Why do you keep watching me?', once: 'baronWatching', consumeOnSelect: true, playerMood: 'thinking',
  next: {text: 'What are you talking about young Pip?', mood: 'pleased', replies: [
    {
      label: 'Your eyes never leave me.', playerMood: 'attentive',
      next: {text: 'Pip my boy, I am merely supervising the business.', mood: 'pleased'}
    }
  ]}
};

function availableBaronReplies(baron) {
  const replies = [...baronReplies];
  if (baron.completedRugTrips >= 3) replies.push(followingReply);
  if (baron.watchedDirections.size >= 6) replies.push(watchingReply);
  return replies;
}

const portraits = {
  baron: {row: 1, expressions: ['pleased', 'laughing', 'displeased']},
  milo: {row: 2, expressions: ['worried', 'sad', 'relieved']},
  guard: {row: 3, expressions: ['deadpan', 'suspicious', 'speaking']}
};

const reportPortraits = new Map(['guard-angry', 'guard-radio', 'guard-listening', 'guard-formal', 'milo-angry'].map(name =>
  [name, new URL('../assets/dialogue/' + name + '.webp', import.meta.url)]));
const portraitCache = new Map();

const npcExpressions = new Map([
  ...Object.entries(portraits).map(([id, portrait]) => [id, portrait.expressions]),
  [djTarget.id, djMoods],
  [milkMysticId, milkMysticMoods],
  ...dancerTargets.map(({id}) => [id, dancerMoods]),
  ...partyGuests.map(({id}) => [id, ['attentive', 'annoyed']]),
  [skimId, ['attentive', 'distressed']],
  [sleepingGamblerId, gamblerPortraits],
  ...staffIds.filter(id => id !== skimId).map(id => [id, ['attentive']]),
  [bartender.id, bartenderMoods],
  [elias.id, eliasPortraits],
  [lifeguard.id, lifeguardMoods],
  [professor.id, [...professorMoods, 'notebook']],
  [pilloryAttendant.id, attendantMoods],
  [pilloryCommissioner.id, commissionerMoods],
  [executiveId, executiveMoods.filter(mood => mood !== 'tousled')],
  [politicianId, politicianMoods]
]);

const extraPortraitMoods = new Map([
  ['baron', ['suspicious', 'flustered', 'winded', 'milk-drool', 'sipping']],
  ['milo', ['defiant']],
  [bartender.id, ['offended', 'amused']],
  [lifeguard.id, ['sheepish']],
  [skimId, ['exasperated', 'wistful', 'conspiratorial']],
  ['plum', ['delighted', 'smug', 'shocked']],
  ['emerald', ['amused', 'skeptical', 'appalled']],
  [sleepingGamblerId, ['drowsy', 'protective', 'dismayed']],
  ...staffIds.filter(id => id !== skimId && id !== 'lin-waitress' && id !== 'handlebar-waiter').map(id => [id, ['welcoming', 'apologetic', 'hurried', 'pleased']]),
  ['handlebar-waiter', ['welcoming', 'apologetic', 'hurried', 'pleased', 'offended']],
  ['lin-waitress', ['welcoming', 'apologetic', 'hurried', 'pleased', 'angry', 'hurt', 'skeptical', 'blushing']]
]);

function extraPortraitUrl(id, mood, withoutMilk) {
  if (!withoutMilk && extraPortraitMoods.get(id)?.includes(mood)) {
    return new URL('../assets/dialogue/expressions/' + id + '-' + mood + '.webp', import.meta.url);
  }
  return null;
}

const expressionFamilies = [
  ['attentive', 'deadpan', 'formal', 'speaking', 'polite', 'reserved', 'weary'],
  ['thinking', 'skeptical', 'suspicious', 'stern', 'deadpan'],
  ['happy', 'pleased', 'welcoming', 'amused', 'delighted', 'laughing', 'laugh', 'current-smile', 'exuberant', 'excited', 'big-excited-smile', 'relieved', 'blushing'],
  ['sad', 'despondent', 'dismayed', 'wistful', 'sorry', 'worried', 'distressed', 'nervous', 'sheepish', 'apologetic', 'hurt'],
  ['alarmed', 'flustered', 'shocked', 'stressed', 'hurried', 'worried', 'appalled', 'exasperated'],
  ['angry', 'demonic-angry', 'frown', 'frowning', 'displeased', 'irritated', 'annoyed', 'offended', 'insulted', 'defiant', 'appalled'],
  ['smug', 'self-assured', 'self-assured-smirk', 'condescending', 'devious', 'conspiratorial', 'evil-laugh']
];

function chooseExpression(mood, alternatives, history) {
  let selected = mood;
  if (history.mood === mood && history.count >= 2) {
    selected = alternatives.find(expression => expression !== mood) ?? mood;
  }
  history.count = history.mood === selected ? history.count + 1 : 1;
  history.mood = selected;
  return selected;
}

const pipReactions = {
  angry: ['alarmed', 'worried'],
  displeased: ['worried', 'thinking'],
  distressed: ['worried', 'sorry'],
  sad: ['sorry', 'worried'],
  stressed: ['worried', 'alarmed'],
  happy: ['happy', 'attentive'],
  laughing: ['happy', 'thinking'],
  excited: ['happy', 'alarmed'],
  skeptical: ['thinking', 'attentive'],
  hurt: ['sorry', 'worried'],
  blushing: ['happy', 'worried']
};

const cameraPortrait = new URL('../assets/dialogue/security-camera.webp', import.meta.url);

function standalonePortraitUrl(id, withoutMilk = false, mood, splattered = false, tousled = false) {
  if (id === milkMysticId) return new URL('../assets/dialogue/milk-mystic/' + mood + '.webp', import.meta.url);
  if (id === djTarget.id) return new URL('../assets/dance/portraits/dj-' + mood + '.webp', import.meta.url);
  if (id === 'security-camera') return cameraPortrait;
  if (id.startsWith('dancer-')) return new URL('../assets/dance/portraits/' + dancerPortraitName(id, mood), import.meta.url);
  if (id === skimId && mood === 'distressed') return new URL('../assets/waiters/edmund-vale-distressed-portrait.webp', import.meta.url);
  if (id === sleepingGamblerId) return new URL('../assets/slots/gambler-' + mood + '.webp', import.meta.url);
  if (id === pokieId) return new URL('../assets/slots/pokie-' + mood + '.webp', import.meta.url);
  if (id === pilloryCommissioner.id) return new URL('../assets/dialogue/commissioner/' + mood + (splattered ? '-milk.webp' : '.webp'), import.meta.url);
  if (id === pilloryAttendant.id) return new URL('../assets/dialogue/attendant/' + mood + '.webp', import.meta.url);
  if (id === elias.id) return new URL('../assets/dialogue/elias/' + mood + '.webp', import.meta.url);
  if (id === professor.id) return new URL('../assets/dialogue/professor/' + mood + '.webp', import.meta.url);
  if (id === poolClothing.id) return new URL('../assets/pool/clothes.webp', import.meta.url);
  if (id === lifeguard.id) return new URL('../assets/dialogue/lifeguard-' + mood + '.webp', import.meta.url);
  if (id === bartender.id) return new URL(mood === 'deadpan' ? '../assets/dialogue/creamery-bartender.webp'
    : '../assets/dialogue/bartender/' + mood + '.webp', import.meta.url);
  if (partyGuests.some(guest => guest.id === id)) {
    const suffix = mood === 'annoyed' ? '-annoyed-portrait.webp' : '-portrait.webp';
    return new URL('../assets/guests/' + id + suffix, import.meta.url);
  }
  if (id === executiveId && executiveMoods.includes(mood)) {
    const variant = tousled && mood !== 'tousled' ? '-tousled' : '';
    return new URL('../assets/slots/' + id + '-' + mood + variant + '-portrait.webp', import.meta.url);
  }
  if (id === politicianId && politicianMoods.includes(mood) && mood !== 'weary') {
    return new URL('../assets/slots/' + id + '-' + mood + '-portrait.webp', import.meta.url);
  }
  if (slotPlayers.some(player => player.id === id)) return new URL('../assets/slots/' + id + '-portrait.webp', import.meta.url);
  const filename = id + (withoutMilk ? '-empty-portrait.webp' : '-portrait.webp');
  return new URL('../assets/waiters/' + filename, import.meta.url);
}

function warmPortraits() {
  if (portraitCache.size) return;
  const urls = [new URL('../assets/dialogue/portraits.webp', import.meta.url), ...reportPortraits.values(), cameraPortrait];
  for (const [id, moods] of extraPortraitMoods) {
    for (const mood of moods) urls.push(extraPortraitUrl(id, mood));
  }
  for (const mood of milkMysticMoods) urls.push(standalonePortraitUrl(milkMysticId, false, mood));
  for (const mood of [...djMoods, 'microphone']) urls.push(standalonePortraitUrl(djTarget.id, false, mood));
  for (const {id} of dancerTargets) {
    for (const mood of dancerMoods) urls.push(standalonePortraitUrl(id, false, mood));
  }
  for (const id of staffIds) {
    urls.push(standalonePortraitUrl(id));
    if (id !== skimId) urls.push(standalonePortraitUrl(id, true));
  }
  urls.push(standalonePortraitUrl(poolClothing.id), standalonePortraitUrl(skimId, false, 'distressed'));
  for (const mood of bartenderMoods) urls.push(standalonePortraitUrl(bartender.id, false, mood));
  for (const mood of commissionerMoods) {
    urls.push(standalonePortraitUrl(pilloryCommissioner.id, false, mood),
      standalonePortraitUrl(pilloryCommissioner.id, false, mood, true));
  }
  for (const mood of attendantMoods) urls.push(standalonePortraitUrl(pilloryAttendant.id, false, mood));
  for (const mood of eliasPortraits) urls.push(standalonePortraitUrl(elias.id, false, mood));
  for (const mood of npcExpressions.get(professor.id)) urls.push(standalonePortraitUrl(professor.id, false, mood));
  for (const mood of lifeguardMoods) urls.push(standalonePortraitUrl(lifeguard.id, false, mood));
  for (const mood of gamblerPortraits) urls.push(standalonePortraitUrl(sleepingGamblerId, false, mood));
  for (const mood of pokiePortraits) urls.push(standalonePortraitUrl(pokieId, false, mood));
  for (const mood of executiveMoods) {
    urls.push(standalonePortraitUrl(executiveId, false, mood));
    if (mood !== 'tousled') urls.push(standalonePortraitUrl(executiveId, false, mood, false, true));
  }
  for (const mood of politicianMoods) urls.push(standalonePortraitUrl(politicianId, false, mood));
  for (const {id} of slotPlayers.filter(player => player.id !== politicianId)) urls.push(standalonePortraitUrl(id));
  for (const {id} of partyGuests) {
    urls.push(standalonePortraitUrl(id), standalonePortraitUrl(id, false, 'annoyed'));
  }
  // Keep the decoded images alive while the conversation panel is hidden.
  for (const url of urls) {
    const image = new Image();
    if (url.pathname.endsWith('-empty-portrait.webp')) image.fetchPriority = 'low';
    image.src = url.href;
    portraitCache.set(url.href, image);
    image.decode().catch(() => {});
  }
}

export function createDialogue(baron, {onAction, tallies, placePokieWager, transactMysticMoney, sleepingGambler, baronStanding, baronDiscoveries, hasSeenCowGuard, hasKarmaChanged, hasPlayedMilkBalloon, isCommissionerSplattered, getStolenClothing, canReportMilo, canReportPillory, canReportPool, canReportPoolClothes, takeMiloInjury, hasDjAccess, hasSeenDjDairy, hasSeducedExecutive, hasReceivedLinGift, hasVisitedMilkPool, hasLinLeft, canDeliverDjGift} = {}) {
  warmPortraits();
  const panel = document.getElementById('conversation');
  const map = document.getElementById('game').closest('.viewport');
  const info = document.getElementById('info').closest('.panel');
  const controls = document.querySelector('.controls');
  const interact = document.getElementById('interact');
  const title = document.getElementById('conversation-title');
  const pokieCounter = document.getElementById('pokie-coin-counter');
  const speaker = document.getElementById('conversation-speaker');
  const line = document.getElementById('conversation-line');
  const replyList = document.getElementById('conversation-replies');
  const advance = document.getElementById('conversation-advance');
  const playerPortrait = document.getElementById('conversation-player');
  const playerArt = playerPortrait.querySelector('canvas');
  const npcPortrait = document.getElementById('conversation-npc');
  let greetingIndex = 0;
  let bartenderGreetingIndex = 0;
  let metDancingBaron = false;
  let completedBaronCowEncounters = 0;
  let slappedByBaron = false;
  let askedEliasAboutVampires = false;
  let vampireStage = 0;
  let askedBaronForMoney = false;
  const usedReplies = new Set();
  const politicalDispositions = {communist: false};
  let reportedBaronFollowing = false;
  let heardLifeguardCannotSwim = false;
  let askedPoolEntry = false;
  let admittedClothingTheft = false;
  const closeButton = document.getElementById('conversation-close');
  let action = null;
  let activeTarget;
  let autoClose;
  let disguise;
  let pipLipstick = false;
  const executiveOpening = createExecutiveConversation(() => baronStanding?.()?.coins ?? 0,
    () => hasLinLeft?.() && hasSeducedExecutive?.());
  const linDepartureReaction = createLinDepartureReactions();
  let departureMenu;
  const mysticVisibility = createMysticVisibilityDialogue();
  const pokieOpening = createPokieConversation(placePokieWager);
  const practiceGuardOpening = createPracticeGuardConversation();
  let skimSpillFollowupPending = false;
  const skimOpening = createSkimConversation(() => metMilo, () => baronStanding?.() ?? {});
  const askedAboutCowGuards = new Set();
  const mysticOpening = createMilkMysticConversation(() => ({
    lin: {
      relationship: waiterOpening.relationship(),
      normal: waiterOpening.relationship() === 'normal',
      chats: waiterOpening.completedLinChats(),
      seduced: hasSeducedExecutive?.(),
      receivedGift: hasReceivedLinGift?.()
    },
    seenDj: hasSeenDjDairy?.(),
    coins: baronStanding?.()?.coins ?? 0,
    canBuyHint: (baronStanding?.()?.coins ?? 0) >= 1,
    askedFourCharacters: askedAboutCowGuards.size >= 4,
    askedAboutVampires: askedEliasAboutVampires
  }), undefined, transactMysticMoney);
  const djOpening = createDjConversation(() => hasSeducedExecutive?.(),
    () => (baronStanding?.()?.coins ?? 0) >= 5, canDeliverDjGift);
  const dancerOpening = createDancerConversation();
  let heardLifeguardBunnies = false;
  let heardLifeguardBeauties = false;
  const waiterOpening = createWaiterConversation(() => baronStanding?.()?.coins ?? 0, () => askedAboutCowGuards.size > 0, () => hasSeducedExecutive?.(), () => ({
    clothing: getStolenClothing?.(), visited: hasVisitedMilkPool?.(),
    heardBunnies: heardLifeguardBunnies, heardBeauties: heardLifeguardBeauties,
    karma: baronStanding?.()?.karma ?? 0
  }));
  const politicianOpening = createPoliticianConversation(() => baronStanding?.()?.karma ?? 0);
  const commissionerOpening = createCommissionerConversation();
  const attendantOpening = createAttendantConversation();
  const professorOpening = createProfessorConversation();
  const professorInterview = createProfessorInterview();
  const guestGreetingSeen = new Set();
  const miloGreeting = createMiloGreeting();
  let metMilo = false;
  let spokeToDjDairy = false;
  let spokeToProfessor = false;
  let miloWasInjured = false;
  let miloInjuryReplyPending = false;

  function openMilo() {
    const newlyInjured = Boolean(takeMiloInjury?.());
    miloWasInjured ||= newlyInjured;
    miloInjuryReplyPending ||= newlyInjured;
    if (!metMilo) {
      metMilo = true;
      const greeting = miloWasInjured ? "Shh! I'm trying to stay out of the Baron's way." : miloGreeting();
      return miloIntroduction(greeting);
    }
    const injuryReply = miloInjuryReplyPending ? injuredMiloReply : null;
    miloInjuryReplyPending = false;
    return miloMenu(miloGreeting(miloWasInjured), slappedByBaron, injuryReply, miloWasInjured, hasSeenCowGuard?.());
  }

  const npcHistory = {};
  const pipHistory = {};

  function setPortrait(element, character, mood, withoutMilk) {
    const expressions = [
      ...(npcExpressions.get(character) ?? []),
      ...(!withoutMilk ? extraPortraitMoods.get(character) ?? [] : [])
    ];
    const special = (character === djTarget.id && mood === 'microphone') || reportPortraits.has(character + '-' + mood) || mood === 'tousled' || mood === 'asleep';
    if (expressions.length && !special && !expressions.includes(mood)) mood = expressions[0];
    if (npcHistory.character !== character) {
      npcHistory.character = character;
      npcHistory.mood = null;
    }
    const family = expressionFamilies.find(group => group.includes(mood)) ?? [];
    // Repeat an intentional expression if this character has no suitable alternate.
    const alternatives = special || withoutMilk ? [] : family.filter(expression => expressions.includes(expression));
    mood = chooseExpression(mood, alternatives, npcHistory);
    const extraPortrait = extraPortraitUrl(character, mood, withoutMilk);
    const reportPortrait = reportPortraits.get(character + '-' + mood);
    element.dataset.injured = String(character === 'milo' && miloWasInjured && !reportPortrait);
    element.classList.toggle('report-portrait', Boolean(reportPortrait));
    element.dataset.portrait = character;
    if (extraPortrait || reportPortrait || !portraits[character]) {
      element.classList.add('standalone-portrait');
      element.style.setProperty('--portrait-image', `url(${extraPortrait ?? reportPortrait ?? standalonePortraitUrl(character, withoutMilk, mood, isCommissionerSplattered?.(), pipLipstick)})`);
      element.dataset.expression = mood;
      return;
    }
    element.classList.remove('standalone-portrait');
    const {row, expressions: atlasExpressions} = portraits[character];
    element.style.setProperty('--portrait-position', `${atlasExpressions.indexOf(mood) * 50}% ${row * 100 / 3}%`);
    element.dataset.expression = mood;
  }

  function finishAction(finishedAction, target) {
    if (finishedAction === 'completeCurdistInterview') professorInterview.complete();
    if (['curdistCompensation', 'curdistCoercedCompensation', 'curdistWorkerReward', 'curdistMilk'].includes(finishedAction)
        && !professorInterview.applyEffect(finishedAction)) return;
    if (finishedAction === 'finishEliasKarlCurd') {
      usedReplies.add('eliasKarlCurd');
      return;
    }
    if (finishedAction === 'finishEliasBloodsuckingLeech') {
      usedReplies.add('eliasBloodsuckingLeech');
      onAction?.('eliasBloodsuckingLeech', target);
      return;
    }
    if (finishedAction === 'finishBaronKarlCurd') {
      usedReplies.add('baronKarlCurd');
      return;
    }
    if (finishedAction === 'finishBaronCowEncounter') {
      completedBaronCowEncounters++;
      return;
    }
    if (finishedAction === 'finishBaronCowFine') {
      if (completedBaronCowEncounters !== 5) return;
      completedBaronCowEncounters++;
      onAction?.('baronCowFine', target);
      return;
    }
    if (finishedAction === 'reportBaronFollowing') {
      reportedBaronFollowing = true;
      return;
    }
    if (finishedAction === 'chargeProfessorFee') {
      if (usedReplies.has(finishedAction)) return;
      usedReplies.add(finishedAction);
    }
    if (finishedAction === 'finishPoliticalConversion' || finishedAction === 'baronReviewIntro'
        || finishedAction.startsWith('baronSurveillance')) {
      usedReplies.add(finishedAction);
      return;
    }
    if (['finishBaronPenalty', 'finishBaronReward', 'finishBaronRewardWithGuard'].includes(finishedAction)) {
      usedReplies.add('baronKarmaEncounter');
    }
    if (finishedAction === 'beginWaiterTipBan') {
      open({...elias, waiterTipBan: true});
      return;
    }
    if (finishedAction === 'finishWaiterTipBan') {
      waiterOpening.finishTipBan();
      return;
    }
    if (finishedAction === 'skimFalseSpill') skimSpillFollowupPending = true;
    if (finishedAction === 'hearLifeguardBeauties') {
      heardLifeguardBeauties = true;
      return;
    }
    if (finishedAction === 'rewardMissingDresses') heardLifeguardBunnies = true;
    if (['alienateLin', 'linCruelRejection', 'linAlienatingSlap'].includes(finishedAction)) {
      waiterOpening.endRelationship('alienated');
    }
    if (finishedAction === 'finishLinConfrontation') waiterOpening.finishExecutiveConfrontation();
    if (finishedAction === 'linDepart' || finishedAction === 'linDepartWithRegret') waiterOpening.endRelationship('departed');
    onAction?.(finishedAction, target);
  }

  function close(runAction = true) {
    clearTimeout(autoClose);
    panel.classList.remove('executive-fade');
    disguise = null;
    panel.hidden = true;
    map.hidden = info.hidden = controls.hidden = false;
    interact.focus({preventScroll: true});
    const finishedAction = action ?? (activeTarget?.postEscort ? 'secureGuests' : null);
    const finishedTarget = activeTarget;
    activeTarget = null;
    action = null;
    if (runAction && finishedAction) finishAction(finishedAction, finishedTarget);
  }

  function requestClose() {
    if (activeTarget?.id === bartender.id && !activeTarget.boughtDrink && !action) {
      activeTarget.bartenderExitPending = true;
      show(bartenderExit, bartender.id, 'thinking');
    } else close();
  }

  function show(node, character, playerMood, withoutMilk) {
    clearTimeout(autoClose);
    panel.classList.toggle('executive-fade', Boolean(node.fadeTo));
    if (node.disguise !== undefined) disguise = node.disguise;
    pipLipstick ||= Boolean(node.pipLipstick);
    action = node.action ?? null;
    if (node.vampireStage) vampireStage = Math.max(vampireStage, node.vampireStage);
    if (node.remembersPoolEntry) askedPoolEntry = true;
    if (node.admitsClothingTheft) admittedClothingTheft = true;
    if (node.revealsLifeguardCannotSwim) heardLifeguardCannotSwim = true;
    closeButton.hidden = Boolean((activeTarget.bartenderExitPending && node.replies?.length && !action)
      || node === lifeguardDialogue || node.mustContinue
      || ((activeTarget.welcome || activeTarget.danceFee || activeTarget.tax || activeTarget.pokieBan || activeTarget.baronKarma) && !action));
    slappedByBaron ||= node.enterAction === 'baronSlap';
    panel.classList.toggle('baron-slap', node.enterAction === 'baronSlap' || ['linSlap', 'linPrivateSlap', 'linAlienatingSlap', 'linBunniesSlap'].includes(node.enterAction) || node.action === 'politicianHit');
    panel.classList.toggle('mystic-collapse', Boolean(node.pipCollapsed));
    panel.classList.toggle('lin-milk-throw', node.enterAction === 'linThrowMilk');
    panel.classList.toggle('guard-strike', node.enterAction === 'guardRifleStrike');
    closeButton.textContent = action === 'finishEliasWelcome' ? 'Begin'
      : action === 'startMilkBalloon' ? 'Play'
      : action === 'attendantMilkBalloon' ? 'Exit dialogue' : 'End conversation';
    closeButton.classList.toggle('conversation-exit', closeButton.textContent === 'End conversation');
    const pipIsSpeaking = node.speaker === 'Pip';
    line.textContent = pipIsSpeaking && node.text ? 'Pip: ' + node.text : node.text;
    line.hidden = !node.text && !node.direction;
    if (node.direction) {
      const direction = document.createElement('em');
      direction.textContent = '(' + node.direction + ') ';
      line.prepend(direction);
    }
    const reactions = pipReactions[node.mood] ?? ['attentive', 'thinking'];
    const preferred = node.playerMood ?? playerMood ?? reactions[0];
    const playerExpression = chooseExpression(preferred, [...reactions, 'thinking', 'attentive'], pipHistory);
    const milkMoustache = Boolean(node.milkMoustache);
    const portraitKey = playerExpression + ':' + (disguise ?? '') + ':' + pipLipstick + (milkMoustache ? ':milk' : '');
    if (playerPortrait.dataset.expression !== portraitKey) {
      drawPipPortrait(playerArt, playerExpression, disguise, pipLipstick, milkMoustache);
      playerPortrait.dataset.expression = portraitKey;
    }
    const currentSpeaker = node.character ?? character;
    speaker.textContent = (currentSpeaker === milkMysticId ? 'Milk Mystic' : pipIsSpeaking ? null : node.speaker)
      ?? (currentSpeaker === elias.id ? elias.title
      : currentSpeaker === bartender.id ? bartender.title
      : currentSpeaker === 'guard' ? 'Bull Guard'
      : currentSpeaker === pilloryAttendant.id ? pilloryAttendant.title : activeTarget.title);
    setPortrait(npcPortrait, currentSpeaker, node.mood, withoutMilk && !(currentSpeaker === 'lin-waitress' && ['angry', 'hurt', 'skeptical', 'blushing'].includes(node.mood)));
    const report = node === lifeguardDialogue && clothingReports[activeTarget.missingClothing];
    const options = character === lifeguard.id
      ? lifeguardReplies(node, {askedPoolEntry, admittedClothingTheft, stolenClothing: getStolenClothing?.()})
      : node.replies ?? [];
    const eliasMenu = node === eliasConversation || node === eliasFollowingConversation;
    const vampire = eliasMenu ? vampireFollowup(node, vampireStage) : null;
    const replies = eliasMenu ? [...options, ...(vampire ? [vampire] : []), ...accountingReplies(tallies, node)]
      : report ? [report, ...options] : options;
    const seenCowGuard = hasSeenCowGuard?.();
    const reaction = hasLinLeft?.() && (node === departureMenu || node.linDepartureMenu)
      ? linDepartureReaction(activeTarget, node) : null;
    const visibility = node.mysticVisibilityMenu || node.linDepartureMenu
        || (node === departureMenu && ![pilloryAttendant.id, pilloryCommissioner.id, professor.id, 'lin-waitress'].includes(character))
      ? mysticVisibility.option(character, node, {
        linChats: waiterOpening.completedLinChats(), linRelationship: waiterOpening.relationship()
      }) : null;
    const interview = character === professor.id && node.mysticVisibilityMenu
      ? professorInterview.option({
        curdist: politicalDispositions.communist, seducedExecutive: hasSeducedExecutive?.(),
        seenDj: hasSeenDjDairy?.() || spokeToDjDairy, spokeToMilo: metMilo
      }) : null;
    const extraReplies = [reaction, visibility, interview].filter(Boolean);
    const exitIndex = replies.findIndex(reply => reply.conversationExit);
    const insertAt = exitIndex < 0 ? replies.length : exitIndex;
    const availableReplies = [...replies.slice(0, insertAt), ...extraReplies, ...replies.slice(insertAt)].filter(reply => !usedReplies.has(reply.once)
      && (!reply.requiresDisposition || politicalDispositions[reply.requiresDisposition])
      && (!reply.requiresUsedReplies || reply.requiresUsedReplies.every(key => usedReplies.has(key)))
      && (!reply.requiresUnusedReplies || reply.requiresUnusedReplies.some(key => !usedReplies.has(key)))
      && (seenCowGuard || !cowGuardQuestions.has(reply.label))
      && (!reply.requiresKarmaChange || hasKarmaChanged?.())
      && (askedEliasAboutVampires || reply.label !== 'Do you have any garlic-flavoured milk?'));
    const choiceButtons = [];
    const advanceButtons = [];
    for (const reply of availableReplies) {
      const isContinue = reply.label === 'Continue';
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = isContinue ? 'Continue →' : reply.label;
      if (reply.conversationExit) button.classList.add('conversation-exit');
      button.addEventListener('click', () => {
        if (cowGuardQuestions.has(reply.label)) {
          askedAboutCowGuards.add(activeTarget?.guard ?? (activeTarget?.practiceGuard ? activeTarget.x + ',' + activeTarget.y : character));
        }
        if (character === elias.id && reply.label === 'Are you a vampire?') {
          askedEliasAboutVampires = true;
        }
        if (reply.curdistChoice) professorInterview.score(reply.curdistChoice);
        if (reply.expressesDisposition) politicalDispositions[reply.expressesDisposition] = true;
        if (reply.consumeOnSelect || reply.once === 'bartenderMoneyRequest') usedReplies.add(reply.once);
        const next = typeof reply.next === 'function' ? reply.next() : reply.next;
        if (next?.exitAction) {
          action = next.exitAction;
          close();
        } else if (next?.action === 'stealPoolClothing') {
          activeTarget.selection = next.selection;
          action = next.action;
          close();
        } else if (next === null) close();
        else {
          if (node.action === 'chargeProfessorFee') {
            action = null;
            finishAction(node.action, activeTarget);
            if (!activeTarget) return; // The fee may end the game.
          }
          show(next, character, reply.playerMood, withoutMilk);
        }
      });
      (isContinue ? advanceButtons : choiceButtons).push(button);
    }
    replyList.replaceChildren(...choiceButtons);
    advance.replaceChildren(...advanceButtons);
    if (node.order) {
      activeTarget.order = node.order;
      activeTarget.boughtDrink = true;
      activeTarget.bartenderExitPending = false;
      closeButton.hidden = false;
    }
    (replyList.firstElementChild ?? advance.firstElementChild ?? (closeButton.hidden ? null : closeButton))?.focus();
    if (node.enterAction) finishAction(node.enterAction, activeTarget);
    if (node.advanceTo) {
      if (node.mood === 'toward') {
        const buzz = new Audio(new URL('../assets/dialogue/security-camera-buzz.wav', import.meta.url));
        buzz.play().catch(() => {});
      }
      autoClose = setTimeout(() => show(node.advanceTo, character, playerMood, withoutMilk), 900);
    } else if (node.fadeTo) {
      autoClose = setTimeout(() => show(node.fadeTo, character, playerMood, withoutMilk), 1200);
    } else if (node.autoCloseMs && activeTarget) autoClose = setTimeout(close, node.autoCloseMs);
  }

  closeButton.addEventListener('click', requestClose);
  document.addEventListener('keydown', event => {
    if (event.code === 'Escape' && !panel.hidden) {
      event.preventDefault();
      if (!closeButton.hidden) requestClose();
    }
  });

  function baronConversation() {
    if (isBaronDancing(baron)) {
      const opening = baronDanceDialogue(metDancingBaron,
        () => (baronStanding?.()?.coins ?? 0) >= DJ_ADMISSION_PRICE, hasDjAccess?.());
      metDancingBaron = true;
      return opening;
    }
    const {karma = 0, coins = 100} = baronStanding?.() ?? {};
    const greetings = baronGreetings(karma, coins);
    const replies = availableBaronReplies(baron);
    const cowGuardReply = baronCowGuardReply(completedBaronCowEncounters, hasSeenCowGuard?.());
    if (cowGuardReply) replies.splice(1, 0, cowGuardReply);
    const opening = greetings[greetingIndex++ % greetings.length];
    const menu = () => ({
      ...opening,
      replies: [...replies, baronCurdReply(menu), ...additionalBaronReplies({
        used: usedReplies,
        standing: baronStanding,
        discoveries: baronDiscoveries?.() ?? {},
        discussedVampires: vampireStage > 0,
        askedEliasAboutVampires,
        spokeToMilo: metMilo,
        spokeToDjDairy,
        seducedExecutive: hasSeducedExecutive?.(),
        returnToMenu: menu
      })]
    });
    if (!askedBaronForMoney) replies.push({
      label: 'Can I have some money?',
      playerMood: 'attentive',
      next: () => {
        askedBaronForMoney = true;
        return Math.random() < 0.5 ? {
          text: 'Of course, my boy! What is money to a man of my extraordinary wealth?!',
          mood: 'laughing', action: 'baronMoneyGift'
        } : {
          text: 'I SMELL A COMMUNIST! Perhaps a small financial penalty will teach you the virtues of capitalism!',
          mood: 'displeased', action: 'baronMoneyPenalty'
        };
      }
    });
    return menu();
  }

  function reportingReplies(target) {
    const [cow, decline, report] = guardReplies;
    const status = canReportMilo?.() ?? {};
    const reports = [...availableReports(baron.completedRugTrips, status.seen, status.unavailable, reportedBaronFollowing)];
    if (canReportPool?.()) reports.push(...poolReports.filter(report =>
      (report !== unattendedClothes || canReportPoolClothes?.() !== false)
      && (report !== lifeguardQualificationReport || heardLifeguardCannotSwim)));
    if (canReportPillory?.(target.guard)) reports.push({
      label: 'Someone has the Stickman Rights Commissioner in a pillory!',
      playerMood: 'alarmed',
      next: {text: 'What?! Unacceptable. Show me where this is!', mood: 'speaking', action: 'reportPillory'}
    });
    const replies = [cow];
    if (reports.length) replies.push({...report, next: {...report.next, replies: [...reports, ...report.next.replies]}});
    replies.push(decline);
    return replies;
  }

  function open(target) {
    if (target.id === milkMysticId) mysticVisibility.meetMystic();
    spokeToDjDairy ||= target.id === djTarget.id;
    npcHistory.mood = pipHistory.mood = null;
    activeTarget = target;
    spokeToProfessor ||= target.id === professor.id;
    pokieCounter.hidden = target.id !== pokieId;
    disguise = target.executiveFraud ? 'woman' : null;
    const firstGuestGreeting = !guestGreetingSeen.has(target.id);
    if (partyGuests.some(guest => guest.id === target.id)) guestGreetingSeen.add(target.id);
    const opening = target.waiterTipBan ? waiterTippingIntervention() : target.linDepartureRegret ? {
      text: 'Oh, bloody hell.', speaker: 'Pip', mood: 'hurt', playerMood: 'exasperated'
    } : target.linKindness ? linKindnessDialogue() : target.linAftermath ? {
      text: "Oh, I've really messed this up.", speaker: 'Pip', mood: 'attentive', playerMood: 'sad', mustContinue: true,
      replies: [{label: 'Continue', next: {
        text: 'Nice!', speaker: 'Male Patron', character: 'male-waiter', mood: 'pleased', mustContinue: true,
        replies: [{label: 'SHUT UP!', next: {exitAction: 'finishLinConfrontation'}, playerMood: 'exasperated'}]
      }}]
    } : target.slotReaction ? {
      text: target.slotReaction.text, mood: staffIds.includes(target.id) ? 'pleased' : 'speaking', mustContinue: true,
      playerMood: target.slotReaction.playerMood,
      replies: [{label: target.slotReaction.response, next: target.slotReaction.final ? {exitAction: 'finishSlotReactions'} : null}]
    } : partyGuests.some(guest => guest.id === target.id) ? partyGuestOpening(target.id, !firstGuestGreeting)
      : target.id === pilloryCommissioner.id ? commissionerOpening(hasPlayedMilkBalloon?.(), isCommissionerSplattered?.(), baronDiscoveries?.()?.pool)
      : target.id === pilloryAttendant.id ? attendantOpening(hasPlayedMilkBalloon?.())
      : target.id === elias.id && target.passThrough ? eliasPassThroughDialogue(mysticVisibility.hasMetMystic())
      : target.id === elias.id && target.pokieBan ? eliasPokieBan
      : target.id === elias.id && target.pokieRefusal ? eliasPokieRefusal
      : target.id === elias.id && target.tax ? eliasTaxConversation(target.tax)
      : target.id === elias.id && target.danceFee ? eliasDanceConversation
      : target.id === elias.id ? (target.welcome ? eliasWelcome : elias.hasFollowedPip ? eliasFollowingConversation : eliasConversation)
      : target.id === 'baron' && target.baronKarma ? (target.baronKarma === 'reward' ? baronKarmaDialogue.reward(metMilo, completedBaronCowEncounters > 0) : baronKarmaDialogue.fine(spokeToProfessor))
      : target.id === bartender.id ? bartenderOpening(bartenderGreetingIndex++)
      : target.id === professor.id ? professorOpening()
      : target.id === sleepingGamblerId ? sleepingGamblerDialogue(sleepingGambler)
      : target.id === pokieId ? pokieOpening()
      : target.id === politicianId ? politicianOpening()
      : target.id === executiveId ? executiveOpening()
      : target.executiveFraud ? executiveFraudWarning
      : target.practiceGuard ? practiceGuardOpening()
      : target.id === poolClothing.id ? poolClothingDialogue
      : target.id === lifeguard.id ? lifeguardDialogue
      : target.poolClothesThanks ? {
          text: "Thanks for the tip about the women skimmy-dipping in the milk pool. Best bloody shift I've had in months. Here, take a few coins for your troubles.",
          mood: 'speaking', action: 'awardPoolClothesTip'
        }
      : target.pilloryThanks ? {text: 'Thanks, I needed a laugh today. Have ₥5 as a tip.', mood: 'deadpan', action: 'awardPilloryTip'}
      : target.postEscort ? postEscortWarning
      : target.guestGate ? guestGateWarning
      : target.summoned ? {
          text: target.repeat ? 'Sir, please stop bothering the ladies.' : 'Sir I have to ask you to leave.',
          mood: target.repeat ? 'formal' : 'speaking', action: 'escortGuest'
        }
      : target.id === skimId ? skimOpening(skimSpillFollowupPending)
      : target.id === milkMysticId ? mysticOpening()
      : target.id === djTarget.id ? djOpening()
      : target.id.startsWith('dancer-') ? dancerOpening(target.id)
      : staffIds.includes(target.id) ? waiterOpening(target.withoutMilk, target.id, target.linConfrontation)
      : !portraits[target.id] ? {text: target.message, mood: 'attentive'}
      : target.id === 'guard' && target.guard?.creamery ? creameryGuardDialogue(target.guard)
      : target.id === 'guard' ? {
          text: target.posted ? postedGuardOpening : guardOpening,
          replies: target.posted ? postedGuardReplies : reportingReplies(target),
          mood: 'deadpan'
        }
      : target.id === 'milo' ? openMilo()
        : baronConversation();
    const scripted = target.waiterTipBan || target.slotReaction || target.linDepartureRegret || target.linKindness || target.linAftermath || target.linConfrontation
      || target.welcome || target.pokieBan || target.pokieRefusal || target.tax || target.danceFee
      || target.baronKarma || target.executiveFraud || target.poolClothesThanks || target.pilloryThanks
      || target.postEscort || target.guestGate || target.summoned || target.withoutMilk;
    departureMenu = !scripted && target.id !== skimId && target.id !== milkMysticId
      && !(target.id === 'baron' && isBaronDancing(baron)) ? opening : null;
    if (target.id === skimId) skimSpillFollowupPending = false;
    speaker.textContent = title.textContent = target.title;
    map.hidden = info.hidden = controls.hidden = true;
    panel.hidden = false;
    show(opening, target.id, (target.id === 'milo' && miloWasInjured) || target.summoned || target.guestGate || target.postEscort ? 'worried' : 'attentive', target.withoutMilk);
  }

  return {open, linWillConfront: waiterOpening.willConfront, linRelationship: waiterOpening.relationship, linCanOfferKindness: waiterOpening.canOfferKindness, dismiss: () => close(false), isOpen: () => !panel.hidden};
}

// Read-only inventory for the asset checks and creative tools.
export function dialoguePortraitInventory() {
  const catalogue = [];
  const add = (character, mood, url, variant = '', cell = null) => {
    catalogue.push({character, mood, asset: url.href, variant, cell,
      default: npcExpressions.get(character)?.[0] === mood && !variant});
  };
  const atlas = new URL('../assets/dialogue/portraits.webp', import.meta.url);
  for (const [id, {row, expressions}] of Object.entries(portraits)) {
    expressions.forEach((mood, column) => add(id, mood, atlas, '', {row, column}));
  }
  for (const [id, moods] of extraPortraitMoods) {
    for (const mood of moods) add(id, mood, extraPortraitUrl(id, mood));
  }
  for (const [id, asset] of reportPortraits.entries()) {
    const separator = id.indexOf('-');
    add(id.slice(0, separator), id.slice(separator + 1), asset);
  }
  for (const [id, moods] of npcExpressions.entries()) {
    if (portraits[id]) continue;
    for (const mood of moods) {
      add(id, mood, standalonePortraitUrl(id, false, mood));
      if (id === pilloryCommissioner.id) add(id, mood, standalonePortraitUrl(id, false, mood, true), 'milk splattered');
      if (id === executiveId) add(id, mood, standalonePortraitUrl(id, false, mood, false, true), 'tousled');
    }
  }
  for (const id of staffIds.filter(id => id !== skimId)) add(id, 'attentive', standalonePortraitUrl(id, true), 'empty tray');
  for (const [id, moods] of [[djTarget.id, ['microphone']], [pokieId, pokiePortraits], [executiveId, ['tousled']]]) {
    for (const mood of moods) add(id, mood, standalonePortraitUrl(id, false, mood));
  }
  add('security-camera', null, cameraPortrait);
  add(poolClothing.id, null, standalonePortraitUrl(poolClothing.id));
  return {catalogue, expressionFamilies, pipReactions};
}
