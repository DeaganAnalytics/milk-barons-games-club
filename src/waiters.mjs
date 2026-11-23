import {guardBlocks} from './guards.mjs';
import {HALL_CENTER, isBlocked, ROOM_HEIGHT, SIDE_RUGS} from './room.mjs';

const uniforms = [
  {id: 'male-waiter', title: 'Waiter', message: 'A glass of milk, sir?', wing: 0, row: 0},
  {id: 'female-waiter', title: 'Waitress', message: 'Can I tempt you with a glass of milk?', wing: 1, row: 0},
  {id: 'handlebar-waiter', title: 'Waiter', message: 'May I offer you a glass of milk?', wing: 0, row: -1},
  {id: 'martini-waiter', title: 'Waiter', message: 'Milk, served straight up.', wing: 0, row: 1},
  {id: 'blonde-waitress', title: 'Waitress', message: 'Would you care for a glass of milk?', wing: 1, row: -1},
  {id: 'lin-waitress', title: 'Waitress Lin', message: 'A fresh glass of milk, if you like.', wing: 1, row: 1}
];

export const waiterIds = uniforms.map(({id}) => id);

const SPEED = 48;
const TURNAROUND_PAUSE = 1.5;

export function createWaiters() {
  return uniforms.map(({wing, row, ...uniform}) => {
    const center = SIDE_RUGS[wing].x;
    const start = center - 104;
    return {
      ...uniform, radius: 14, y: HALL_CENTER.y + 228 + row * ROOM_HEIGHT,
      x: start, start, end: center + 104,
      facing: 1, pauseUntil: 1.5 + wing, walkTime: 0, walking: false
    };
  });
}

export function updateWaiters(waiters, player, baron, guards, elapsed, dt) {
  for (const waiter of waiters) {
    waiter.walking = false;
    if (elapsed < waiter.pauseUntil || Math.hypot(waiter.x - player.x, waiter.y - player.y) < 44) continue;
    const goal = waiter.facing === 1 ? waiter.end : waiter.start;
    const distance = Math.min(SPEED * dt, Math.abs(goal - waiter.x));
    const x = waiter.x + distance * waiter.facing;
    if (isBlocked(x, waiter.y, waiter.radius, baron, waiter) || guardBlocks(x, waiter.y, waiter, guards)) continue;
    waiter.x = x;
    waiter.walking = distance > 0;
    if (waiter.walking) waiter.walkTime += distance / SPEED;
    if (waiter.x === goal) {
      waiter.facing *= -1;
      waiter.pauseUntil = elapsed + TURNAROUND_PAUSE;
    }
  }
}

export function waiterFrame(waiter, elapsed) {
  return waiter.walking
    ? {column: Math.floor(waiter.walkTime * 1000 / 110) % 6, row: 0}
    : {column: elapsed % 2.18 >= 1.4 && elapsed % 2.18 < 1.68 ? 1 : 0, row: 1};
}
