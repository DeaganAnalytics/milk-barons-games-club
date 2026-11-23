import {hitsHall} from './room.mjs';

function overlaps(x, y, radius, obstacle) {
  return Math.abs(x - obstacle.x) < obstacle.halfWidth + radius
    && Math.abs(y - obstacle.y) < obstacle.halfHeight + radius;
}

export function isBlocked(x, y, radius, baron, from) {
  if (hitsHall(x, y, radius)) return true;
  const baronObstacle = {x: baron.x, y: baron.y + 6, halfWidth: 29, halfHeight: 35};
  if (!overlaps(x, y, radius, baronObstacle)) return false;
  // The Baron can walk up to an occupied rug. Let a player he overlaps step away.
  return !from || !overlaps(from.x, from.y, radius, baronObstacle)
    || Math.hypot(x - baronObstacle.x, y - baronObstacle.y)
      <= Math.hypot(from.x - baronObstacle.x, from.y - baronObstacle.y);
}

export function approaches(x, y, guard, actor, distance) {
  const next = Math.hypot(x - actor.x, y - actor.y);
  return next < distance && next <= Math.hypot(guard.x - actor.x, guard.y - actor.y);
}

// An actor already overlapping a guard can step away without being trapped.
export function guardBlocks(x, y, actor, guards, radius = actor.radius) {
  return guards.some(guard => actor !== guard && approaches(x, y, actor, guard, guard.radius + radius));
}
