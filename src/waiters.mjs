import {guardBlocks} from './guards.mjs';
import {HALL_CENTER, isBlocked, SIDE_RUGS} from './room.mjs';

const uniforms = [
  {id: 'male-waiter', title: 'Waiter', message: 'A glass of milk, sir?'},
  {id: 'female-waiter', title: 'Waitress', message: 'Can I tempt you with a glass of milk?'}
];
const SPEED = 48;
const TURNAROUND_PAUSE = 1.5;

export function createWaiters() {
  return uniforms.map((uniform, index) => ({
    ...uniform, radius: 14, y: HALL_CENTER.y + 228, x: SIDE_RUGS[index].x - 104,
    start: SIDE_RUGS[index].x - 104, end: SIDE_RUGS[index].x + 104,
    facing: 1, pauseUntil: 1.5 + index, walkTime: 0, walking: false
  }));
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
