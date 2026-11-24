import {availableReports, injuredMiloReply} from './report-dialogue.mjs';
import {bartender} from './creamery.mjs';
import {partyGuests} from './party-guests.mjs';
import {staffIds} from './staff.mjs';
import {drawPipPortrait} from './pip-art.mjs';

const partyGuestOpening = {
  text: "Where's your milk waiter?", mood: 'attentive', replies: [
    {label: "I'm not a waiter.", playerMood: 'thinking', next: {
      text: 'Then get away from me! Guards!', mood: 'annoyed', action: 'callGuard'
    }}
  ]
};

const guardOpening = 'Do you have a problem to report? Otherwise get out of my way.';
const baronGreetings = [
  {text: 'Welcome, welcome to my establishment!', mood: 'pleased'},
  {text: 'Pip! Good to see you!', mood: 'laughing'},
  {text: 'Enjoying your time?', mood: 'pleased'}
];

const cowReply = {
  label: 'Are you a cow?', playerMood: 'thinking',
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
    label: "No I don't have anything to report.", playerMood: 'attentive',
    next: {text: 'Then get out of my way!', mood: 'speaking'}
  },
  {
    label: 'Ah yes, I do.', playerMood: 'attentive',
    next: {text: 'What is the problem.', mood: 'suspicious', replies: [
      {label: 'Actually nevermind.', playerMood: 'thinking', next: {text: '...', mood: 'deadpan'}}
    ]}
  }
];

const miloReplies = [
  {
    label: "Hey, don't I know you?", playerMood: 'thinking',
    next: {text: "No. Don't talk to me.", mood: 'worried', replies: [
      {label: 'Are you Milo, the milk activist.', playerMood: 'thinking', next: {text: 'Please leave me alone. Please go away, your presence attracts the Baron.', mood: 'sad'}}
    ]}
  }
];

const baronReplies = [
  {
    label: 'Do you own this place?', playerMood: 'thinking',
    next: {text: 'Of course, I own nearly every place.', mood: 'laughing'}
  },
  {
    label: 'Why do you have cows for guards?', playerMood: 'thinking',
    next: {text: 'What do you mean?', mood: 'pleased', replies: [
      {
        label: 'The guards are cows.', playerMood: 'attentive',
        next: {text: 'I have guards.', mood: 'displeased', replies: [
          {label: 'But the horns?', playerMood: 'thinking', next: {text: 'I have guards.', mood: 'displeased'}}
        ]}
      }
    ]}
  }
];

const followingReply = {
  label: 'Are you following me?', playerMood: 'thinking',
  next: {text: 'Following you? Never! I am merely managing my institution.', mood: 'displeased'}
};

const watchingReply = {
  label: 'Why do you keep watching me?', playerMood: 'thinking',
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

const reportPortraits = new Map(['guard-angry', 'guard-radio', 'guard-formal', 'milo-angry'].map(name =>
  [name, new URL('../assets/dialogue/' + name + '.webp', import.meta.url)]));
const portraitCache = new Map();

function standalonePortraitUrl(id, withoutMilk = false) {
  if (id === bartender.id) return new URL('../assets/dialogue/creamery-bartender.webp', import.meta.url);
  if (partyGuests.some(guest => guest.id === id)) {
    return new URL('../assets/guests/' + id + '-portrait.webp', import.meta.url);
  }
  const filename = id + (withoutMilk ? '-empty-portrait.webp' : '-portrait.webp');
  return new URL('../assets/waiters/' + filename, import.meta.url);
}

function warmPortraits() {
  if (portraitCache.size) return;
  const urls = [new URL('../assets/dialogue/portraits.webp', import.meta.url), ...reportPortraits.values()];
  for (const id of staffIds) {
    urls.push(standalonePortraitUrl(id));
    if (id !== 'edmund-vale') urls.push(standalonePortraitUrl(id, true));
  }
  urls.push(standalonePortraitUrl(bartender.id), ...partyGuests.map(guest => standalonePortraitUrl(guest.id)));
  // Keep the decoded images alive while the conversation panel is hidden.
  for (const url of urls) {
    const image = new Image();
    if (url.pathname.endsWith('-empty-portrait.webp')) image.fetchPriority = 'low';
    image.src = url.href;
    portraitCache.set(url.href, image);
    image.decode().catch(() => {});
  }
}

export function createDialogue(baron, {onAction, canReportMilo, takeMiloInjury} = {}) {
  warmPortraits();
  const panel = document.getElementById('conversation');
  const map = document.getElementById('game').closest('.viewport');
  const info = document.getElementById('info').closest('.panel');
  const controls = document.querySelector('.controls');
  const interact = document.getElementById('interact');
  const title = document.getElementById('conversation-title');
  const speaker = document.getElementById('conversation-speaker');
  const line = document.getElementById('conversation-line');
  const replyList = document.getElementById('conversation-replies');
  const playerPortrait = document.getElementById('conversation-player');
  const playerArt = playerPortrait.querySelector('canvas');
  const npcPortrait = document.getElementById('conversation-npc');
  let greetingIndex = 0;
  let action = null;
  let activeTarget;
  let injured = false;

  function setPortrait(element, character, mood, withoutMilk) {
    const reportPortrait = reportPortraits.get(character + '-' + mood);
    element.dataset.injured = String(character === 'milo' && injured && !reportPortrait);
    element.classList.toggle('report-portrait', Boolean(reportPortrait));
    element.dataset.portrait = character;
    if (reportPortrait || !portraits[character]) {
      element.classList.add('standalone-portrait');
      element.style.setProperty('--portrait-image', `url(${reportPortrait ?? standalonePortraitUrl(character, withoutMilk)})`);
      element.dataset.expression = mood;
      return;
    }
    element.classList.remove('standalone-portrait');
    const {row, expressions} = portraits[character];
    element.style.setProperty('--portrait-position', `${expressions.indexOf(mood) * 50}% ${row * 100 / 3}%`);
    element.dataset.expression = mood;
  }

  function close() {
    panel.hidden = true;
    map.hidden = info.hidden = controls.hidden = false;
    interact.focus({preventScroll: true});
    const finishedAction = action;
    action = null;
    if (finishedAction) onAction?.(finishedAction, activeTarget);
  }

  function show(node, character, playerMood, withoutMilk) {
    action = node.action ?? null;
    line.textContent = node.text;
    if (node.direction) {
      const direction = document.createElement('em');
      direction.textContent = '(' + node.direction + ') ';
      line.prepend(direction);
    }
    if (playerPortrait.dataset.expression !== playerMood) {
      drawPipPortrait(playerArt, playerMood);
      playerPortrait.dataset.expression = playerMood;
    }
    setPortrait(npcPortrait, character, node.mood, withoutMilk);
    replyList.replaceChildren(...(node.replies ?? []).map(reply => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = reply.label;
      button.addEventListener('click', () => show(reply.next, character, reply.playerMood, withoutMilk));
      return button;
    }));
    (replyList.firstElementChild ?? document.getElementById('conversation-close')).focus();
  }

  document.getElementById('conversation-close').addEventListener('click', close);
  document.addEventListener('keydown', event => {
    if (event.code === 'Escape' && !panel.hidden) {
      event.preventDefault();
      close();
    }
  });

  function reportingReplies() {
    const report = guardReplies[2];
    const status = canReportMilo?.() ?? {};
    return [...guardReplies.slice(0, 2), {...report, next: {
      ...report.next,
      replies: [...availableReports(baron.completedRugTrips, status.seen, status.pending), ...report.next.replies]
    }}];
  }

  function open(target) {
    activeTarget = target;
    injured = target.id === 'milo' && Boolean(takeMiloInjury?.());
    const opening = partyGuests.some(guest => guest.id === target.id) ? partyGuestOpening
      : target.summoned ? {text: 'Sir I have to ask you to leave.', mood: 'speaking'}
      : !portraits[target.id] ? {text: target.message, mood: 'attentive'}
      : target.id === 'guard' ? {
          text: target.posted ? postedGuardOpening : guardOpening,
          replies: target.posted ? postedGuardReplies : reportingReplies(),
          mood: 'deadpan'
        }
      : target.id === 'milo' ? {
          text: injured ? "No, don't hurt me!" : target.message,
          replies: injured ? [injuredMiloReply, ...miloReplies] : miloReplies, mood: 'worried'
        }
        : {...baronGreetings[greetingIndex++ % baronGreetings.length], replies: availableBaronReplies(baron)};
    speaker.textContent = title.textContent = target.title;
    map.hidden = info.hidden = controls.hidden = true;
    panel.hidden = false;
    show(opening, target.id, injured || target.summoned ? 'worried' : 'attentive', target.withoutMilk);
  }

  return {open, isOpen: () => !panel.hidden};
}
