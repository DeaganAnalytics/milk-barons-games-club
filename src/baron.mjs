import {facingIndex, TURN} from './directions.mjs';

const patrolCenter = {x: 345, y: 357};
const dialogue = [
  'WELCOME! This club is the finest establishment I personally own.',
  'You may find our games extremely fair. To me.',
  'Do you like the carpet? It cost several fortunes. Not mine, naturally.',
  'I oversee every game personally. From this exact spot.'
];

export function createBaron() {
  return {
    ...patrolCenter, walking: false, facing: 0, stride: 0,
    expression: 0, nextSmile: 2.5, smileUntil: 0, chats: 0
  };
}

export function updateBaronPatrol(baron, elapsed) {
  const cycle = elapsed % 30;
  baron.walking = cycle >= 24 && cycle < 29;
  const angle = baron.walking ? (cycle - 24) * TURN / 5 : 0;
  const x = patrolCenter.x + 24 * Math.sin(angle);
  const y = patrolCenter.y + 16 * (1 - Math.cos(angle));
  baron.stride = baron.walking
    ? (baron.stride + Math.hypot(x - baron.x, y - baron.y) * TURN / 18) % TURN
    : 0;
  baron.x = x;
  baron.y = y;
  if (baron.walking) {
    baron.facing = facingIndex(24 * Math.cos(angle), 16 * Math.sin(angle));
  }
}

export function updateBaronAttention(baron, player, elapsed, dt) {
  if (!baron.walking) {
    baron.facing = facingIndex(player.x - baron.x, player.y - baron.y);
  }
  if (elapsed >= baron.nextSmile) {
    baron.smileUntil = elapsed + 0.8 + Math.random() * 0.7;
    baron.nextSmile = baron.smileUntil + 3 + Math.random() * 4;
  }
  baron.expression += (Number(elapsed < baron.smileUntil) - baron.expression) * Math.min(1, dt * 9);
}

export function talkToBaron(baron, elapsed) {
  baron.smileUntil = elapsed + 1.8;
  baron.nextSmile = baron.smileUntil + 4;
  return dialogue[baron.chats++ % dialogue.length];
}
