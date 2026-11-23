import {guardBlocks} from './guards.mjs';
import {EAST_EDGE, isBlocked, NORTH_EDGE, RUGS, SOUTH_TRIM_Y, WEST_EDGE} from './room.mjs';

const uniforms = [
  {id: 'male-waiter', title: 'Waiter'},
  {id: 'female-waiter', title: 'Waitress'},
  {id: 'handlebar-waiter', title: 'Waiter'},
  {id: 'martini-waiter', title: 'Waiter'},
  {id: 'blonde-waitress', title: 'Waitress'},
  {id: 'lin-waitress', title: 'Waitress Lin'}
];
export const waiterIds = uniforms.map(({id}) => id);

const SPEED = 48;
const RADIUS = 14;
const MESSAGE = 'Not now, busy busy busy';

export function createWaiters(player, baron, milo, guards, random = Math.random) {
  const occupied = [player, baron, milo, ...guards];
  const places = RUGS.map(({x, y}) => ({x, y: y + 168}))
    .filter(place => occupied.every(actor => Math.hypot(place.x - actor.x, place.y - actor.y) >= 56));
  return uniforms.map((uniform, index) => {
    // Draw without replacement so every design starts in its own part of the hall.
    const [place] = places.splice(Math.floor(random() * places.length), 1);
    return {
      ...uniform, ...place, radius: RADIUS, message: MESSAGE,
      facing: 1, target: null, pauseUntil: 1.5 + index / 6,
      walkTime: 0, idleOffset: index / 3, walking: false
    };
  });
}

function chooseTarget(waiter, baron, random) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const x = WEST_EDGE + 70 + random() * (EAST_EDGE - WEST_EDGE - 140);
    const y = NORTH_EDGE + 215 + random() * (SOUTH_TRIM_Y - 42 - NORTH_EDGE - 215);
    if (Math.hypot(x - waiter.x, y - waiter.y) >= 110 && !isBlocked(x, y, RADIUS, baron)) {
      return {x, y};
    }
  }
  return null;
}

export function updateWaiters(waiters, player, baron, guards, elapsed, dt, random = Math.random) {
  for (const waiter of waiters) {
    waiter.walking = false;
    if (dt <= 0 || elapsed < waiter.pauseUntil || Math.hypot(waiter.x - player.x, waiter.y - player.y) < 44) continue;
    waiter.target ??= chooseTarget(waiter, baron, random);
    if (!waiter.target) {
      waiter.pauseUntil = elapsed + 0.75;
      continue;
    }
    const {x: targetX, y: targetY} = waiter.target;
    const dx = targetX - waiter.x;
    const dy = targetY - waiter.y;
    const distance = Math.hypot(dx, dy);
    const step = Math.min(SPEED * dt, distance);
    const arrived = step === distance;
    const x = arrived ? targetX : waiter.x + dx * step / distance;
    const y = arrived ? targetY : waiter.y + dy * step / distance;
    if (isBlocked(x, y, RADIUS, baron, waiter) || guardBlocks(x, y, waiter, guards)
        || guardBlocks(x, y, waiter, waiters)) {
      waiter.target = null;
      waiter.pauseUntil = elapsed + 0.5 + random();
      continue;
    }
    waiter.x = x;
    waiter.y = y;
    if (Math.abs(dx) > 1) waiter.facing = Math.sign(dx);
    waiter.walking = step > 0;
    waiter.walkTime += step / SPEED;
    if (arrived) {
      waiter.target = null;
      waiter.pauseUntil = elapsed + 0.75 + random() * 1.5;
    }
  }
}

export function waiterFrame(waiter, elapsed) {
  if (waiter.walking) return {column: Math.floor(waiter.walkTime * 1000 / 110) % 6, row: 0};
  const idleTime = (elapsed + waiter.idleOffset) % 2.18;
  return {column: idleTime >= 1.4 && idleTime < 1.68 ? 1 : 0, row: 1};
}
