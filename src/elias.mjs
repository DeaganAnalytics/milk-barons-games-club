import {HALL_CENTER, isNpcBlocked, ROOM_HEIGHT, ROOM_WIDTH, routeAroundBaron} from './room.mjs';

export const eliasPost = {x: HALL_CENTER.x + 145, y: HALL_CENTER.y + 130};

export const elias = {
  id: 'elias', title: 'Elias', ...eliasPost, radius: 22,
  message: "Elias. The Baron's right-hand man and accountant."
};

export const eliasPortraits = [
  'devious', 'insulted', 'evil-laugh', 'self-assured-smirk',
  'thinking', 'current-smile', 'laugh', 'demonic-angry', 'worried', 'reading-figures'
];

const welcomeLines = [
  ["Velcome, velcome to ze Milk Baron's Games Club! Ah, Master Pip. Ve have been expecting you.", 'current-smile', 'attentive'],
  ['His Excellency, ze Milk Baron, has taken a most considerable interest in you. Your activism at Milk University has not gone unnoticed.', 'thinking', 'thinking'],
  ['You are a most intriguing young stickman. Ambitious, resourceful, and, if I may be so bold... delightfully impressionable.', 'devious', 'worried'],
  ["Unfortunately, your most recent protest resulted in considerable damage to ze Baron's property holdings. You are now indebted to His Excellency to ze sum of ₥100.", 'insulted', 'alarmed'],
  ['But ze Baron is a generous man. Rather than demand immediate repayment, he vishes to play a little game.', 'self-assured-smirk', 'thinking'],
  ['Here is a sum of ₥100. If you can double zis investment to ₥200, you vill have proven yourself a true capitalist.', 'current-smile', 'attentive'],
  ['But should you lose ze money... vell, it is off to ze dairy for you, as an indentured servant.', 'demonic-angry', 'alarmed'],
  ['Consider it a most generous opportunity for professional development, Master Pip.', 'self-assured-smirk', 'worried']
];

const questions = {text: 'Now, Master Pip, do you have any questions?', mood: 'current-smile', replies: []};
const continueTo = next => ({label: 'Continue', playerMood: 'attentive', next});
const back = [continueTo(questions)];

questions.replies.push(
  {label: "I didn't do it!", once: 'eliasWelcome:denial', consumeOnSelect: true, playerMood: 'alarmed',
    next: {text: 'Zat is not a question.', mood: 'insulted', replies: back}},
  {label: 'How did I get here?', once: 'eliasWelcome:arrival', consumeOnSelect: true, playerMood: 'thinking',
    next: {text: 'Ah... one of ze great secrets of ze universe.', mood: 'devious', replies: back}},
  {label: 'What is this place?', once: 'eliasWelcome:club', consumeOnSelect: true, playerMood: 'thinking',
    next: {
      text: 'Ah! I am delighted you asked.',
      mood: 'laugh',
      replies: [continueTo({
        text: "It is ze Baron's pride and joy. A place vere ze finest members of ze Milk Aristocracy come to mingle, to vheel and deal.",
        mood: 'current-smile',
        replies: [continueTo({
          text: 'A house of amusement, of profligate pleasure, of economic efficiency and, above all... profitability.',
          mood: 'self-assured-smirk',
          replies: [{label: 'I thought the Milk Baron made his money from milk?', playerMood: 'thinking',
            next: {text: 'Da! But he keeps his fortune by selling pleasure and amusement!', mood: 'laugh', replies: back}}]
        })]
      })]
    }},
  {label: 'How do I double my money?', once: 'eliasWelcome:money', consumeOnSelect: true, playerMood: 'thinking', next: {
    text: 'As an aspiring capitalist, I am sure you vill figure it out. Zis establishment offers many delightful games through vich you may multiply your fortune.',
    mood: 'self-assured-smirk', replies: back
  }},
  {label: 'I have no more questions.', playerMood: 'attentive', next: {
    text: 'Vonderful. I vish you a most profitable evening, Master Pip.',
    mood: 'current-smile', action: 'finishEliasWelcome'
  }}
);

export const eliasWelcome = welcomeLines.reduceRight((next, [text, mood, playerMood]) => ({
  text, mood, playerMood, replies: [continueTo(next)]
}), questions);

function exchange(lines, menu) {
  let replies = [continueTo(menu)];
  for (const [label, text, mood, playerMood = 'thinking', extras] of [...lines].reverse()) {
    replies = [{label, playerMood, next: {text, mood, replies, ...extras}}];
  }
  return replies[0];
}

export const eliasPokieBan = {
  text: 'Ahem. Master Pip, ve have a little problem.',
  mood: 'thinking',
  replies: [exchange([
    ["What's wrong?", 'According to my calculations, you have become an unprofitable customer.', 'thinking'],
    ["Isn't the whole point of gambling to win money?", 'Da! For ze establishment.', 'self-assured-smirk'],
    ['So what are you saying?', 'Following a comprehensive financial review, your pokie machine privileges have been revoked.', 'insulted'],
    ["Because I'm winning?!", 'Precisely. Your continued participation presents an unacceptable risk to shareholder value.', 'devious', 'alarmed'],
    ["That's ridiculous!", 'Might I suggest one of our other games? Preferably one at vhich you are considerably less competent.', 'current-smile', 'alarmed'],
    ['Continue', 'Oh, and one more thing. Ze Baron has decreed zat you must pay an extraordinary profits tax of fifty per cent.', 'devious'],
    ['FIFTY PER CENT?!', 'Da. Extraordinary profits require extraordinary taxation.', 'self-assured-smirk', 'alarmed'],
    ['Does the Baron pay this tax when he makes extraordinary profits?', 'Vhat a ridiculous question! Of course not.', 'insulted'],
    ['How is that fair?!', 'Master Pip, fairness is not a recognised accounting principle.', 'thinking', 'alarmed'],
    ["And what if I'd lost all my money?", 'Zen ve vould have appreciated your patronage.', 'devious'],
    ['This whole place is a scam!', 'A highly profitable enterprise, Master Pip. Please use ze correct terminology.', 'self-assured-smirk', 'alarmed',
      {replies: [], action: 'collectPokieTax'}]
  ])]
};

export const eliasPokieRefusal = {
  text: 'No, no, Master Pip. Ve have discussed zis. Your business is no longer appreciated.',
  mood: 'insulted'
};

const regularExchanges = [
  [
    ['Why are the guards cows?', 'Zey are not. I am unsure of ze purpose of zis question. Is zis another one of your little activist games?', 'insulted'],
    ['But the horns...', 'ZEY ARE NOT COWS!', 'demonic-angry', 'alarmed']
  ],
  [
    ['Who are you?', 'I am Elias.', 'current-smile'],
    ['But who are you in relation to the Baron?', 'I am his accountant.', 'self-assured-smirk'],
    ['His accountant?!', 'Vhy, da! Someone must manage all his money!', 'laugh', 'alarmed']
  ],
  [
    ['Are you a vampire?', 'No. Vampires do not exist.', 'worried', 'thinking', {mustContinue: true}],
    ['But you look like a vampire.', 'I assure you, I am not.', 'insulted', 'thinking', {mustContinue: true}],
    ['Do you want some garlic?', 'VHO HAS GARLIC?!', 'worried', 'thinking', {mustContinue: true}],
    ['...', 'I mean... vho has garlic? Yes, garlic for milk. I am particularly fond of milk-flavoured garlic.', 'self-assured-smirk', 'alarmed', {vampireStage: 1}]
  ]
];

const followingExchange = [
  ['Are you following me?', 'Da.', 'current-smile'],
  ['Wait, what?!', 'Naturally, Master Pip. I must account for every single coin you earn or lose. I am an accountant, after all.', 'self-assured-smirk', 'alarmed']
];

const healthExchange = [
  ['Can I die?', 'Da, of course. Everyone can die.', 'current-smile'],
  ['Continue', 'Ahem... almost everyone.', 'worried'],
  ['What?!', 'Nothing.', 'insulted', 'alarmed'],
  ['I mean, can I die in here?', 'Da. Zere are many guards. Stickman guards, not cows, zat is. Vith guns.', 'current-smile', 'worried'],
  ['Continue', 'Perhaps someone hits you. Perhaps you get poisoned. Zere are many vays to die.', 'thinking'],
  ["How will I know if I'm dying?", 'I am your accountant. Naturally, I shall keep track.', 'self-assured-smirk', 'worried'],
  ['Continue', 'See? I have prepared a little chart vith hearts.', 'current-smile']
];

const karmaExchange = [
  ['Are you tracking my... karma?', 'Karma, yes. A very peasant vord. Ve prefer to call it alignment vith ze values of ze Dairy Aristocracy.', 'self-assured-smirk'],
  ['Why?', 'To assess your future employment prospects, of course.', 'devious', 'worried']
];

function milkTokenExchange(menu) {
  const alternatives = [
    exchange([
      ['You said they were worth their weight in gold!', 'Da, according to our internal valuation. Convertibility is an entirely separate matter.', 'self-assured-smirk', 'alarmed'],
      ["So who decides what they're worth?", 'Ze Baron, naturally. A remarkably efficient monetary system.', 'current-smile']
    ], menu),
    exchange([
      ["People recognise gold. I've never seen these before.", 'Milk tokens are ze currency of ze future, Master Pip!', 'laugh', 'thinking']
    ], menu)
  ];
  return [
    ['What are these coins?', 'Milk tokens, of course. Vorth zeir weight in gold. Silly peasant.', 'self-assured-smirk'],
    ['Can I exchange them for gold, then?', 'Vhat?! No! Vhy on earth?', 'insulted', 'thinking', {replies: alternatives}]
  ];
}

function buildConversation(exchanges) {
  const menu = {text: elias.message, mood: 'current-smile', replies: []};
  menu.replies = [...exchanges, milkTokenExchange(menu)].map(lines => {
    const option = exchange(lines, menu);
    return {...option, once: 'Elias: ' + option.label, consumeOnSelect: true, requiresKarmaChange: lines === karmaExchange};
  });
  return menu;
}

export const eliasConversation = buildConversation([...regularExchanges, healthExchange, karmaExchange]);
export const eliasFollowingConversation = buildConversation([...regularExchanges, followingExchange, healthExchange, karmaExchange]);

export function vampireFollowup(menu, stage) {
  if (stage === 1) return {
    label: 'So, about vampires...', playerMood: 'thinking',
    next: {text: 'Ve have discussed zis already, Master Pip.', mood: 'insulted', vampireStage: 2, replies: [continueTo(menu)]}
  };
  if (stage === 2) return {
    label: 'Seriously, you look like a vampire.', playerMood: 'attentive',
    next: {text: 'I shall start fining you for vasting my time.', mood: 'insulted', enterAction: 'eliasVampireFine'}
  };
  return null;
}

const danceFeeReply = {
  label: 'Dancing fee?! What dancing fee?',
  playerMood: 'alarmed',
  next: {
    text: 'Do not be ridiculous, Master Pip. Gentlemen cannot enter a nightclub for free!',
    mood: 'insulted',
    action: 'chargeDanceFee'
  }
};

export const eliasDanceConversation = {
  text: 'Did you enjoy ze dancing, Master Pip?',
  mood: 'current-smile',
  replies: [
    {label: 'Yes.', playerMood: 'attentive', next: {
      text: 'Good, good! I shall deduct ze dancing fee from your account.',
      mood: 'self-assured-smirk', replies: [danceFeeReply]
    }},
    {label: 'No.', playerMood: 'worried', next: {
      text: 'Vell, you vill enjoy zis even less. I shall deduct ze dancing fee from your account.',
      mood: 'devious', replies: [danceFeeReply]
    }}
  ]
};

export function eliasTaxConversation({earnings, due}) {
  const demand = {
    text: `Thirty per cent, Master Pip. Kindly hand over ₥${due}.`,
    mood: 'self-assured-smirk',
    action: 'collectTax'
  };
  return {
    text: `Master Pip! A most profitable series of ventures. Your recent undertakings have earned you ₥${earnings}.`,
    mood: 'current-smile',
    replies: [{
      label: "Thanks! I think I'm getting the hang of it.", playerMood: 'attentive',
      next: {
        text: 'Indeed, indeed. Zere is just ze small matter of taxation.',
        mood: 'devious',
        replies: [{
          label: "Taxation?! I thought the Milk Aristocracy didn't pay tax!", playerMood: 'alarmed',
          next: {text: 'Correct. Zey do not. You do.', mood: 'self-assured-smirk', replies: [continueTo(demand)]}
        }]
      }
    }]
  };
}

export function routeEliasToPip(actor, player, baron, spacing = 38) {
  const radius = 11;
  const spots = [[-spacing, 0], [spacing, 0], [0, -spacing], [0, spacing]]
    .map(([dx, dy]) => ({x: player.x + dx, y: player.y + dy}))
    .filter(({x, y}) => !isNpcBlocked(x, y, radius, baron))
    .sort((a, b) => Math.hypot(a.x - actor.x, a.y - actor.y) - Math.hypot(b.x - actor.x, b.y - actor.y));
  return routeAroundBaron({...actor, radius}, spots[0] ?? player, baron);
}

export function advanceEliasRun(actor, destination, dt, stop, speed = 230) {
  const dx = destination.x - actor.x;
  const dy = destination.y - actor.y;
  const distance = Math.hypot(dx, dy);
  const step = Math.min(speed * dt, Math.max(0, distance - stop));
  if (step) {
    actor.x += dx / distance * step;
    actor.y += dy / distance * step;
    actor.stride = (actor.stride ?? 0) + step * 0.35;
    if (Math.abs(dx / distance) > 0.05) actor.facing = Math.sign(dx);
  }
  actor.running = distance - step > stop + 0.001;
  return !actor.running;
}

export function updateEliasFollow(actor, player, baron, cameraX, cameraY, dt) {
  const left = cameraX + 24;
  const right = cameraX + ROOM_WIDTH - 24;
  const top = cameraY + 66;
  const bottom = cameraY + ROOM_HEIGHT - 28;
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const outside = actor.x < left || actor.x > right || actor.y < top || actor.y > bottom;
  const close = Math.hypot(player.x - actor.x, player.y - actor.y) < 60;
  // Once Pip approaches, hold position until the scrolling camera pushes Elias to an edge.
  const distanceToPip = Math.hypot(player.x - actor.x, player.y - actor.y);
  const approached = actor.lastPipPosition && distanceToPip
    < Math.hypot(actor.lastPipPosition.x - actor.x, actor.lastPipPosition.y - actor.y);
  actor.lastPipPosition = {x: player.x, y: player.y};
  if (close && approached) actor.findingEdge = false;
  if (!outside && !actor.findingEdge) {
    actor.running = false;
    actor.followRoute = null;
    return;
  }

  const x = actor.findingEdge ? right : clamp(actor.x, left, right);
  const y = clamp(actor.y, top, bottom);
  const radius = 11;
  const clear = point => !isNpcBlocked(point.x, point.y, radius, baron, actor);
  const target = [{x, y}, {x: x - 40, y}, {x: x + 40, y}, {x, y: y - 50}, {x, y: y + 50}]
    .find(point => point.x >= left && point.x <= right && point.y >= top && point.y <= bottom && clear(point));
  if (!target) {
    actor.running = false;
    return;
  }

  const waypoint = actor.followRoute?.[0] ?? target;
  const distance = Math.hypot(waypoint.x - actor.x, waypoint.y - actor.y);
  const step = Math.min(distance, 144 * dt);
  if (step && !clear({
    x: actor.x + (waypoint.x - actor.x) / distance * step,
    y: actor.y + (waypoint.y - actor.y) / distance * step
  })) {
    actor.followRoute = routeAroundBaron({...actor, radius}, target, baron);
    actor.running = false;
    return;
  }
  const arrived = advanceEliasRun(actor, waypoint, dt, 0, 144);
  actor.running = step > 0;
  if (outside && !actor.findingEdge && step > 0) actor.hasFollowedPip = true;
  if (arrived) {
    actor.followRoute?.shift();
    if (!actor.followRoute?.length && Math.hypot(target.x - actor.x, target.y - actor.y) < 1) actor.findingEdge = false;
  }
}

export function drawElias(ctx, sprite, actor) {
  const height = 70;
  const width = height * sprite.naturalWidth / sprite.naturalHeight;
  const feet = actor.y + 18;
  ctx.save();
  ctx.translate(actor.x, 0);
  // The source sprite faces left.
  if (actor.facing === 1) ctx.scale(-1, 1);
  if (!actor.running) {
    ctx.drawImage(sprite, -width / 2, feet - height, width, height);
    ctx.restore();
    return;
  }
  const step = Math.sin(actor.stride);
  const bob = Math.abs(step) * 3;
  const lower = Math.round(sprite.naturalHeight * 0.74);
  const half = Math.floor(sprite.naturalWidth / 2);
  const split = lower * height / sprite.naturalHeight;
  const left = -width / 2;
  const top = feet - height - bob;
  for (const side of [-1, 1]) {
    const offset = side === -1 ? 0 : half;
    const sourceWidth = side === -1 ? half : sprite.naturalWidth - half;
    const lift = Math.max(0, side * step) * 5;
    ctx.drawImage(sprite, offset, lower, sourceWidth, sprite.naturalHeight - lower,
      left + offset * width / sprite.naturalWidth + side * step * 3, top + split,
      sourceWidth * width / sprite.naturalWidth, height - split - lift);
  }
  ctx.drawImage(sprite, 0, 0, sprite.naturalWidth, lower, left, top, width, split);
  ctx.restore();
}
