import {TURN} from './directions.mjs';
import {MILK_POOL} from './room.mjs';

export const lifeguard = {
  id: 'lifeguard', title: 'Bull Lifeguard', x: MILK_POOL.x - 36, y: MILK_POOL.y - 119, radius: 24
};

export const poolClothing = {
  id: 'pool-clothing', title: 'Swimmers’ Clothing', x: MILK_POOL.x + 58, y: MILK_POOL.y - 109, radius: 24, interactionHalfWidth: 48
};

export const remainingClothing = {women: 'man', man: 'women', all: null};

const swimmers = [
  {offset: -99, phase: 0.65, speed: 0.72},
  {offset: 102, phase: 2.9, speed: -0.64}
];

const touchLines = [
  'Hey! That tickles!',
  'Hehehe, caught me again!',
  'Ouch! That was a pinch!',
  'Ooh la la!',
  "You're certainly an enthusiastic swimmer!",
  'Good heavens! You startled me!',
  'Oh! There you are!',
  "My goodness, you're persistent!",
  'Hehehe! Not again!',
  "You're making quite a splash!",
  'Careful, darling!',
  'Oh, you cheeky thing!',
  "Someone's enjoying himself!",
  'Good heavens! What are you doing down there?',
  'Oh! I nearly swallowed a mouthful of milk!',
  "You're certainly getting your money's worth!"
];

const exchanges = [
  [[0, 'This milk is sooo good for my skin!']],
  [[1, "I'm so glad we don't have to share our milk with peasants!"]],
  [[0, "I simply couldn't go back to swimming in water."]],
  [[1, 'Imagine bathing in something that comes out of a tap!']],
  [[0, 'My dermatologist recommended a milk bath. I doubt she meant this!']],
  [[1, 'Being wealthy is simply exhausting. I needed this.']],
  [[0, 'I do hope nobody finds my clothes.']],
  [[1, 'The Baron really has outdone himself this evening.']],
  [[0, 'Milko!'], [1, 'Polo!']],
  [[0, 'The lifeguard is rather handsome...'], [1, "Yes, but this one's rich!"]],
  [[0, 'How much milk do you suppose is in here?'], [1, "Oh, darling, it's vulgar to discuss expenditure."]],
  [[1, "Apparently some peasants can't even afford milk."], [0, 'Good heavens! What do they swim in?']],
  [[0, "Does your husband know you're here?"], [1, 'Heavens, no! Does yours?']],
  [[1, 'Is that lifeguard still watching us?'], [0, "Well, at least somebody's earning their salary."]]
];

const lifeguardLines = [
  'God, I love this job.',
  'Looking the other way has never paid off so well.',
  'God save the Baron!',
  'The Dairy Aristocracy certainly knows how to live.',
  'Your taxes at work!',
  'Some call it decadence. I call it culture.',
  'The Baron has impeccable taste.',
  'Milk for the masses, milk pools for the elite!',
  'Membership has its privileges. Oh yes, it certainly does.',
  'What happens in the milk pool stays in the milk pool.'
];

const missingDressesExchanges = [
  'Good heavens! Where are my clothes?!',
  'That dress cost more than a peasant earns in a year!',
  "Guard! Guard! We've been robbed!",
  'I cannot possibly attend dinner in this state!',
  'This is an outrage against the Milk Aristocracy!',
  'Stop staring at us, you revolting creature!',
  'I refuse to leave this pool until my clothes are returned!',
  'Someone fetch the Baron immediately!',
  'My husband will have someone imprisoned for this!',
  'This sort of thing never happened before they started letting peasants in!'
].map((line, index) => [[index % 2, line]]);

const missingDressesGuardLines = [
  'Oh boy, oh boy, oh boy!',
  'Best day of my bloody career!',
  "Ladies, I assure you, I'm monitoring the situation very closely.",
  'No need to panic, ladies. Take your time getting out.',
  'Hehehehe... MOOOO!',
  'And to think I nearly called in sick today!',
  "Unfortunately, ladies, we don't have any spare towels.",
  "I'm afraid you'll have to exit the pool eventually. Health and safety regulations.",
  'Nothing gets past these eyes. Nothing.',
  'I love my job. I bloody love my job!'
];

const missingSuitGuardLines = [
  "Sir, I'm going to need you to remain in the pool.",
  'Nobody wants to see that, mate. Stay submerged.',
  'Of all the bloody clothes to steal!',
  'Someone get this bloke a towel. Immediately!',
  'This is NOT what I signed up for!',
  'Sir, if you attempt to exit that pool, I will have you arrested.',
  'My day is ruined. Absolutely bloody ruined.',
  'Ladies, your clothing is still there. Unfortunately.',
  "I should've called in sick today.",
  'Keep everything below the milk, mate!',
  "Whoever did this is getting a bloody fine!"
];

export function takePoolClothing(pool, selection, elapsed) {
  if (pool.stolenClothing || !Object.hasOwn(remainingClothing, selection)) return false;
  pool.stolenClothing = selection;
  pool.clothingAmbientAt = elapsed + 60;
  return true;
}

function startClothingAmbient(pool) {
  pool.clothingAmbientStarted = true;
  pool.reaction = pool.pendingReaction = null;
  pool.lines = [];
  pool.replyDelay = false;
  pool.remaining = 0;
  pool.guardNext = pool.stolenClothing === 'man';
  pool.lifeguardLine = 0;
}

function swimmerPosition(swimmer, elapsed) {
  const phase = elapsed * swimmer.speed + swimmer.phase;
  return {
    x: swimmer.offset + Math.cos(phase) * 60,
    y: 7 + Math.sin(phase) * 17,
    direction: Math.sign(-Math.sin(phase) * swimmer.speed) || 1,
    bob: Math.sin(elapsed * 5 + swimmer.phase) * 0.85
  };
}

export function createMilkPool() {
  return {
    stolenClothing: null, clothingReported: false, clothingAmbientAt: Infinity, clothingAmbientStarted: false,
    snorkel: {x: 0, y: 35, direction: -1, swimmer: 0, returning: false},
    reaction: null, pendingReaction: null, lifeguardLine: 0, guardNext: true, lines: [], replyDelay: false, remaining: 11
  };
}

export function updateMilkPool(pool, elapsed, dt, random = Math.random) {
  if (dt <= 0) return;
  if (pool.reaction && elapsed >= pool.reaction.until) pool.reaction = null;
  if (!pool.clothingAmbientStarted && elapsed >= pool.clothingAmbientAt) startClothingAmbient(pool);
  const dressesMissing = pool.clothingAmbientStarted && pool.stolenClothing !== 'man';
  const snorkel = pool.snorkel;
  const target = snorkel.returning
    ? {x: snorkel.swimmer === 0 ? -204 : 204, y: 35}
    : swimmerPosition(swimmers[snorkel.swimmer], elapsed);
  const dx = target.x - snorkel.x;
  const dy = target.y - snorkel.y;
  const distance = Math.hypot(dx, dy);
  // There are no obstacles in this lane, so steering toward the moving swimmer is sufficient.
  const stop = snorkel.returning ? 0 : 16;
  const step = Math.min((snorkel.returning ? 62 : 36) * dt, Math.max(0, distance - stop));
  if (step > 0) {
    snorkel.x += dx / distance * step;
    snorkel.y += dy / distance * step;
    if (Math.abs(dx) > 0.5) snorkel.direction = Math.sign(dx);
  }
  if (distance - step <= stop + 0.01) {
    if (snorkel.returning) {
      snorkel.swimmer = 1 - snorkel.swimmer;
      snorkel.returning = false;
    } else {
      if (!dressesMissing) pool.pendingReaction = {speaker: snorkel.swimmer, text: touchLines[Math.floor(random() * touchLines.length)]};
      snorkel.returning = true;
    }
  }

  // Let the current remark or call-and-response finish before a touch reaction.
  if (pool.reaction) return;
  if (!pool.lines.length && pool.pendingReaction) {
    pool.reaction = {...pool.pendingReaction, until: elapsed + 2};
    pool.pendingReaction = null;
    return;
  }
  pool.remaining -= dt;
  if (pool.remaining > 0) return;
  if (pool.replyDelay) {
    pool.replyDelay = false;
  } else if (pool.lines.length) {
    pool.lines.shift();
    if (pool.lines.length) {
      pool.replyDelay = true;
      pool.remaining = 0.5;
      return;
    }
  } else {
    if (pool.guardNext) {
      const remarks = dressesMissing ? missingDressesGuardLines
        : pool.clothingAmbientStarted ? missingSuitGuardLines : lifeguardLines;
      pool.lines = [['lifeguard', remarks[pool.lifeguardLine]]];
      pool.lifeguardLine = (pool.lifeguardLine + 1) % remarks.length;
    } else {
      const chatter = dressesMissing ? missingDressesExchanges : exchanges;
      pool.lines = [...chatter[Math.floor(random() * chatter.length)]];
    }
    pool.guardNext = !pool.guardNext;
  }
  pool.remaining = pool.lines.length ? (pool.lines[0][1].length > 8 ? 3.2 : 1.5) : 11;
}

export function milkPoolSpeech(pool, elapsed) {
  const entry = pool.reaction ? [pool.reaction.speaker, pool.reaction.text] : !pool.replyDelay && pool.lines[0];
  if (!entry) return null;
  const [speaker, text] = entry;
  if (speaker === 'lifeguard') {
    return {text, x: lifeguard.x, y: lifeguard.y, headY: lifeguard.y - lifeguardHeight(elapsed)};
  }
  const {x, y, bob} = swimmerPosition(swimmers[speaker], elapsed);
  const feetY = MILK_POOL.y + y + bob;
  return {text, x: MILK_POOL.x + x, y: feetY, headY: feetY - 30};
}

function oval(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TURN);
  ctx.fill();
}

function ripple(ctx, x, y, age) {
  ctx.strokeStyle = '#fff9e8';
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.ellipse(x, y, 11 + age * 10, 2.3 + age * 2.2, 0, 0, TURN);
  ctx.stroke();
}

function drawSwimmer(ctx, swimmer, elapsed, head) {
  if (!head?.naturalWidth) return;
  const {x, y, direction, bob} = swimmerPosition(swimmer, elapsed);
  const width = 31;
  const height = width * head.naturalHeight / head.naturalWidth;
  ripple(ctx, x - direction * 9, y + 1, (elapsed * 0.9 + swimmer.phase) % 1);
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(-direction, 1);
  ctx.drawImage(head, -width / 2, 1 - height, width, height);
  ctx.restore();
  ripple(ctx, x, y + 1.4, 0.35);
}

function drawSnorkel(ctx, {x, y, direction}, elapsed) {
  const bob = Math.sin(elapsed * 6) * 0.75;
  ripple(ctx, x, y + 1.4, (elapsed * 1.2) % 1);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);
  ctx.rotate(Math.sin(elapsed * 3) * 0.07);
  ctx.lineCap = 'round';
  for (const [width, color] of [[5.5, '#202027'], [3.4, '#47767c'], [1, '#88bcc0']]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.quadraticCurveTo(1, -5, 1, -11);
    ctx.lineTo(1, -20 + bob);
    ctx.stroke();
  }
  ctx.fillStyle = '#eb8051';
  ctx.fillRect(-1.4, -22 + bob, 4.8, 5);
  oval(ctx, 1, -22 + bob, 2.4, 1.15, '#312420');
  ctx.restore();

  const bubble = (elapsed * 1.5) % 1;
  oval(ctx, x - direction * (6 + bubble * 5), y + 3, 1 + bubble * 1.5, 0.6 + bubble, '#fff9e7');
}

function lifeguardHeight(elapsed) {
  return 56 + Math.sin(elapsed * 2) * 2;
}

function drawLifeguard(ctx, art, elapsed) {
  if (!art?.naturalWidth) return;
  const x = lifeguard.x - MILK_POOL.x;
  const height = lifeguardHeight(elapsed);
  const width = 56 * art.naturalWidth / art.naturalHeight;
  const top = lifeguard.y - MILK_POOL.y - height;
  ctx.drawImage(art, x - width / 2, top, width, height);
  for (const offset of [0, 1 / 3, 2 / 3]) {
    const age = (elapsed / 3 + offset) % 1;
    const drift = age * 5 + Math.sin(age * 6) * 2;
    oval(ctx, x + width * 0.21 + drift, top + height * 0.35 - age * 15,
      0.55 + age * 1.1, 0.55 + age * 1.1, `rgba(255,245,227,${0.6 * Math.sin(age * Math.PI)})`);
  }
}

export function drawMilkPool(ctx, art, elapsed, pool, heads, clothes, lifeguardArt) {
  ctx.save();
  ctx.translate(MILK_POOL.x, MILK_POOL.y);
  // The source is trimmed around the furniture, so only the art overlays the hall parquet.
  ctx.drawImage(art, -296.4, -202, 534.4, 266);
  drawLifeguard(ctx, lifeguardArt, elapsed);
  if (clothes?.naturalWidth) {
    const width = 96;
    const height = width * clothes.naturalHeight / clothes.naturalWidth;
    ctx.drawImage(clothes, 10, -90 - height, width, height);
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(-221, -42, 440, 93);
  ctx.clip();
  swimmers.forEach((swimmer, index) => drawSwimmer(ctx, swimmer, elapsed, heads[index]));
  drawSnorkel(ctx, pool.snorkel, elapsed);
  ctx.restore();
  ctx.restore();
}
