import {guardBlocks} from './guards.mjs';
import {facingIndex, TURN} from './directions.mjs';
import {BARON_DANCE_STOP, DANCE_FLOOR, HALL_CENTER, closestRug, crossesFountainArea, crossesPilloryArea, crossesPoolArea, routeAroundBaron, ROOM_HEIGHT, ROOM_WIDTH, sameSquare} from './room.mjs';

const OFFSCREEN_DELAY = 5;
const WALK_SPEED = 146;
const SPEECH_DURATION = 4;
const rugLines = [
  "What's going on over here?",
  "I'm gonna have to drink more milk after all this exercise!",
  'The Milk Baron is always watching!',
  "All this walking! I'll need an extra gallon of milk!",
  'The Milk Baron sees all! Especially profitable opportunities!',
  'Make way! A very important dairy magnate is approaching!',
  'Running is for peasants. I prefer a dignified waddle.',
  'Another rug, another opportunity to expand my fortune!',
  'Good heavens! This is practically manual labour!'
];
const miloLines = [
  'Milo, I see you!',
  'Milo, Milo, Milo. Always causing trouble.',
  'Milo my good friend. Why do you always run away?',
  'MILO! Have you been drinking my milk again?!',
  'Come here, Milo! I merely wish to discuss your behaviour!',
  'Milo! You cannot hide from the dairy aristocracy!',
  'That boy is going to curdle my milk!'
];
const idleLines = [
  'WELCOME! This club is the finest establishment I personally own.',
  'You may find our games extremely fair. To me.',
  'Do you like the carpet? It cost several fortunes. Not mine, naturally.',
  'I oversee every game personally'
];

export function createBaron() {
  return {
    ...HALL_CENTER, walking: false, facing: 0, stride: 0,
    completedRugTrips: 0, watchedDirections: new Set(),
    expression: 0, nextSmile: 2.5, smileUntil: 0, nextIdleSpeech: 30,
    offscreenSince: null, route: [], speech: null, nextLine: 0, remainingMiloLines: [], lastMiloLine: null
  };
}

export function isOnscreen(baron, cameraX, cameraY) {
  // Include the full sprite, so a partly visible Baron does not start the timer.
  return baron.x + 33 > cameraX && baron.x - 33 < cameraX + ROOM_WIDTH
    && baron.y + 34 > cameraY && baron.y - 57 < cameraY + ROOM_HEIGHT;
}

export function isBaronDancing(baron) {
  return !baron.walking && !baron.route.length
    && baron.x === BARON_DANCE_STOP.x && baron.y === BARON_DANCE_STOP.y;
}

function routeToDanceStop(from) {
  if (from.x <= BARON_DANCE_STOP.x) return [BARON_DANCE_STOP];
  // Approach from the open west side, skirting the booth and speaker cabinets.
  const y = from.y < BARON_DANCE_STOP.y ? DANCE_FLOOR.y - 342 : DANCE_FLOOR.y + 207;
  return [{x: from.x, y}, {x: BARON_DANCE_STOP.x, y}, BARON_DANCE_STOP];
}

export function updateBaronWalk(baron, player, cameraX, elapsed, dt, cameraY = 0, guards = []) {
  if (!baron.route.length) {
    if (isOnscreen(baron, cameraX, cameraY)) {
      baron.offscreenSince = null;
    } else {
      baron.offscreenSince ??= elapsed;
      if (elapsed - baron.offscreenSince >= OFFSCREEN_DELAY) {
        const destination = sameSquare(player, DANCE_FLOOR) ? BARON_DANCE_STOP : closestRug(player);
        if (baron.x !== destination.x || baron.y !== destination.y) {
          if (destination === BARON_DANCE_STOP) {
            baron.route = routeToDanceStop(baron);
          } else if (isBaronDancing(baron)) {
            baron.route = [...routeToDanceStop(destination).slice(0, -1).reverse(), destination];
          } else if (crossesPoolArea(baron, destination) || crossesFountainArea(baron, destination)
              || crossesPilloryArea(baron, destination)) {
            baron.route = routeAroundBaron({...baron, radius: 24}, destination, {x: -1000, y: 0});
          } else {
            baron.route = [destination];
          }
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
      const x = baron.x + dx * step / distance;
      const y = baron.y + dy * step / distance;
      if (guardBlocks(x, y, baron, guards, 24)) break;
      baron.facing = facingIndex(dx, dy);
      baron.walking = true;
      baron.stride = (baron.stride + step * TURN / 18) % TURN;
    }
    if (step === distance) {
      baron.x = target.x;
      baron.y = target.y;
      baron.route.shift();
      if (!baron.route.length && step > 0) {
        baron.completedRugTrips++;
        if (target === BARON_DANCE_STOP) baron.speech = null;
      }
    } else {
      baron.x += dx * step / distance;
      baron.y += dy * step / distance;
    }
    remaining -= step;
  }
  if (!baron.walking) baron.stride = 0;

  if (baron.speech) {
    if (isOnscreen(baron, cameraX, cameraY)) baron.speech.visibleSince ??= elapsed;
    if (baron.speech.visibleSince !== null) {
      if (elapsed - baron.speech.visibleSince >= SPEECH_DURATION) baron.speech = null;
    } else if (!baron.route.length) {
      baron.speech = null;
    }
  }
}

export function callOutMilo(baron, milo, elapsed) {
  if (isBaronDancing(baron)) return;
  const lines = baron.remainingMiloLines;
  if (lines.length === 0) {
    lines.push(...miloLines.filter(line => line !== baron.lastMiloLine));
    const index = Math.floor(Math.random() * lines.length);
    const [first] = lines.splice(index, 1);
    if (baron.lastMiloLine) lines.push(baron.lastMiloLine);
    baron.lastMiloLine = first;
  } else {
    const index = Math.floor(Math.random() * lines.length);
    [baron.lastMiloLine] = lines.splice(index, 1);
  }
  baron.speech = {text: baron.lastMiloLine, visibleSince: elapsed};
  if (!baron.walking) baron.facing = facingIndex(milo.x - baron.x, milo.y - baron.y);
}

export function speechOpacity(baron, cameraX, elapsed, cameraY = 0) {
  if (!isOnscreen(baron, cameraX, cameraY) || baron.speech?.visibleSince == null) return 0;
  return Math.max(0, Math.min(1, SPEECH_DURATION - (elapsed - baron.speech.visibleSince)));
}

export function updateBaronAttention(baron, player, elapsed, dt) {
  if (!baron.walking) {
    baron.facing = facingIndex(player.x - baron.x, player.y - baron.y);
    baron.watchedDirections.add(baron.facing);
  }
  if (elapsed >= baron.nextSmile) {
    baron.smileUntil = elapsed + 0.8 + Math.random() * 0.7;
    baron.nextSmile = baron.smileUntil + 3 + Math.random() * 4;
  }
  baron.expression += (Number(elapsed < baron.smileUntil) - baron.expression) * Math.min(1, dt * 9);
}

export function updateBaronIdleSpeech(baron, cameraX, cameraY, elapsed) {
  if (isBaronDancing(baron) || elapsed < baron.nextIdleSpeech || baron.speech || baron.walking || baron.route.length
      || !isOnscreen(baron, cameraX, cameraY)) return;

  const text = idleLines[Math.floor(Math.random() * idleLines.length)];
  baron.speech = {text, visibleSince: elapsed};
  baron.nextIdleSpeech = elapsed + 27 + Math.random() * 6;
  baron.smileUntil = elapsed + 1.8;
  baron.nextSmile = baron.smileUntil + 4;
}
