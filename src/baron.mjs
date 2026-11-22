import {facingIndex, TURN} from './directions.mjs';
import {PASSAGE_Y, ROOM_WIDTH, SIDE_RUGS} from './room.mjs';

const startingPoint = {x: 345, y: 357};
const OFFSCREEN_DELAY = 5;
const WALK_SPEED = 146;
const SPEECH_DURATION = 4;
const rugLines = [
  "What's going on over here?",
  "I'm gonna have to drink more milk after all this exercise!",
  'The Milk Baron is always watching!'
];
const dialogue = [
  'WELCOME! This club is the finest establishment I personally own.',
  'You may find our games extremely fair. To me.',
  'Do you like the carpet? It cost several fortunes. Not mine, naturally.',
  'I oversee every game personally. From this exact spot.'
];

export function createBaron() {
  return {
    ...startingPoint, walking: false, facing: 0, stride: 0,
    expression: 0, nextSmile: 2.5, smileUntil: 0, chats: 0,
    offscreenSince: null, route: [], speech: null, nextLine: 0
  };
}

function isOnscreen(baron, cameraX) {
  // Include the full sprite, so a partly visible Baron does not start the timer.
  return baron.x + 33 > cameraX && baron.x - 33 < cameraX + ROOM_WIDTH;
}

export function updateBaronWalk(baron, player, cameraX, elapsed, dt) {
  if (!baron.route.length) {
    if (isOnscreen(baron, cameraX)) {
      baron.offscreenSince = null;
    } else {
      baron.offscreenSince ??= elapsed;
      if (elapsed - baron.offscreenSince >= OFFSCREEN_DELAY) {
        const midpoint = (SIDE_RUGS[0].x + SIDE_RUGS[1].x) / 2;
        const rug = SIDE_RUGS[Number(player.x >= midpoint)];
        if (baron.x !== rug.x || baron.y !== rug.y) {
          // Keep the walk below the tables and above the cashier at both doorways.
          baron.route = [{x: baron.x, y: PASSAGE_Y}, {x: rug.x, y: PASSAGE_Y}, rug];
          baron.speech = {text: rugLines[baron.nextLine], visibleSince: null};
          baron.nextLine = (baron.nextLine + 1) % rugLines.length;
        }
        baron.offscreenSince = null;
      }
    }
  }

  let remaining = WALK_SPEED * dt;
  baron.walking = false;
  while (baron.route.length && remaining > 0) {
    const target = baron.route[0];
    const dx = target.x - baron.x;
    const dy = target.y - baron.y;
    const distance = Math.hypot(dx, dy);
    const step = Math.min(distance, remaining);
    if (step > 0) {
      baron.facing = facingIndex(dx, dy);
      baron.walking = true;
      baron.stride = (baron.stride + step * TURN / 18) % TURN;
    }
    if (step === distance) {
      baron.x = target.x;
      baron.y = target.y;
      baron.route.shift();
    } else {
      baron.x += dx * step / distance;
      baron.y += dy * step / distance;
    }
    remaining -= step;
  }
  if (!baron.walking) baron.stride = 0;

  if (baron.speech) {
    if (isOnscreen(baron, cameraX)) baron.speech.visibleSince ??= elapsed;
    if (baron.speech.visibleSince !== null) {
      if (elapsed - baron.speech.visibleSince >= SPEECH_DURATION) baron.speech = null;
    } else if (!baron.route.length) {
      baron.speech = null;
    }
  }
}

export function speechOpacity(baron, elapsed) {
  if (baron.speech?.visibleSince == null) return 0;
  return Math.max(0, Math.min(1, SPEECH_DURATION - (elapsed - baron.speech.visibleSince)));
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
