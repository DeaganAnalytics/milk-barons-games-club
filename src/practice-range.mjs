import {PRACTICE_RANGE} from './room.mjs';

const period = 2.7;
const firingPhase = 1.32;
const flight = 0.34;
const startX = PRACTICE_RANGE.guardX + 37;
const endX = PRACTICE_RANGE.targetX - 7;
const pipTorsoOffset = -12;

export function rangeShotAge(elapsed, lane) {
  const phase = elapsed + lane * 0.87 - firingPhase;
  return phase - Math.floor(phase / period) * period;
}

function projectileX(age) {
  return startX + (endX - startX) * age / flight;
}

export function rangeBullet(elapsed, lane) {
  const age = rangeShotAge(elapsed, lane);
  if (age <= flight) return {x: projectileX(age), y: PRACTICE_RANGE.lanes[lane] - 36};
}

export function practiceRangeHit(from, to, previousTime, elapsed) {
  const step = elapsed - previousTime;
  const hitRadius = to.radius + 2;
  return PRACTICE_RANGE.lanes.some((y, lane) => {
    const shotStart = elapsed - rangeShotAge(elapsed, lane);
    const start = Math.max(previousTime, shotStart);
    const end = Math.min(elapsed, shotStart + flight);
    if (start > end) return false;
    const relative = (time, progress) => ({
      x: projectileX(time - shotStart) - (from.x + (to.x - from.x) * progress),
      y: y - 36 - (from.y + (to.y - from.y) * progress + pipTorsoOffset)
    });
    const a = relative(start, step ? (start - previousTime) / step : 0);
    const b = relative(end, step ? (end - previousTime) / step : 1);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = dx * dx + dy * dy;
    const closest = length ? Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / length)) : 0;
    return Math.hypot(a.x + dx * closest, a.y + dy * closest) <= hitRadius;
  });
}

export const rangeImpactAge = flight;
