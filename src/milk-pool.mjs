import {TURN} from './directions.mjs';
import {MILK_POOL} from './room.mjs';

export const lifeguard = {
  id: 'lifeguard', title: 'Bull Lifeguard', x: MILK_POOL.x - 36, y: MILK_POOL.y - 119, radius: 24
};

const swimmers = [
  {offset: -99, phase: 0.65, speed: 0.72},
  {offset: 102, phase: 2.9, speed: -0.64}
];

const touchLines = [
  'Hey! That tickles!', 'He he he, caught me again.', 'Ouch, that was a pinch!', 'Ooh la la.'
];
const exchanges = [
  [[0, 'This milk is sooo good for my skin!']],
  [[1, "I'm glad we don't share milk with peasants!"]],
  [[0, 'Milko'], [1, 'Polo!']]
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
    snorkel: {x: 0, y: 35, direction: -1, swimmer: 0, returning: false},
    reaction: null, pendingReaction: null, exchange: 0, lifeguardLine: 0, guardNext: true, lines: [], remaining: 11
  };
}

export function updateMilkPool(pool, elapsed, dt, random = Math.random) {
  if (dt <= 0) return;
  if (pool.reaction && elapsed >= pool.reaction.until) pool.reaction = null;
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
      pool.pendingReaction = {speaker: snorkel.swimmer, text: touchLines[Math.floor(random() * touchLines.length)]};
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
  if (pool.lines.length) pool.lines.shift();
  else {
    if (pool.guardNext) {
      pool.lines = [['lifeguard', lifeguardLines[pool.lifeguardLine]]];
      pool.lifeguardLine = (pool.lifeguardLine + 1) % lifeguardLines.length;
    } else {
      pool.lines = [...exchanges[pool.exchange]];
      pool.exchange = (pool.exchange + 1) % exchanges.length;
    }
    pool.guardNext = !pool.guardNext;
  }
  pool.remaining = pool.lines.length ? (pool.lines[0][1].length > 8 ? 3.2 : 1.5) : 11;
}

export function milkPoolSpeech(pool, elapsed) {
  const entry = pool.reaction ? [pool.reaction.speaker, pool.reaction.text] : pool.lines[0];
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
  if (clothes.naturalWidth) {
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
