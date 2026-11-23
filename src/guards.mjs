import {facingIndex, TURN} from './directions.mjs';
import {CENTER_RUG, EAST_EDGE, isBlocked, NORTH_EDGE, SOUTH_TRIM_Y, WEST_EDGE} from './room.mjs';

const RADIUS = 14;
const SPEED = 71;
const APPROACH_DISTANCE = 40;
const PATROL_INSET = 75;
const STEERING_ANGLES = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2];

export function createGuards() {
  return [1, -1].map(side => ({
    x: CENTER_RUG.x + side * 98, y: CENTER_RUG.y + 240,
    side, radius: RADIUS, facing: 0, stride: 0, walking: false,
    target: null, pauseUntil: 2.5, blockedTime: 0
  }));
}

// An actor already overlapping a guard can step away without being trapped.
export function guardBlocks(x, y, actor, guards, radius = actor.radius) {
  return guards.some(guard => {
    if (actor === guard) return false;
    const distance = Math.hypot(x - guard.x, y - guard.y);
    return distance < guard.radius + radius
      && distance <= Math.hypot(actor.x - guard.x, actor.y - guard.y);
  });
}

function patrolTarget() {
  return {
    x: WEST_EDGE + PATROL_INSET + Math.random() * (EAST_EDGE - WEST_EDGE - PATROL_INSET * 2),
    y: NORTH_EDGE + 230 + Math.random() * (SOUTH_TRIM_Y - 42 - NORTH_EDGE - 230)
  };
}

function approaches(x, y, guard, actor, distance) {
  const next = Math.hypot(x - actor.x, y - actor.y);
  return next < distance && next <= Math.hypot(guard.x - actor.x, guard.y - actor.y);
}

export function updateGuards(guards, player, baron, milo, elapsed, dt) {
  for (const guard of guards) {
    guard.walking = false;
    // Let the player approach instead of constantly evading them.
    const nearPlayer = Math.hypot(guard.x - player.x, guard.y - player.y) <= APPROACH_DISTANCE;
    const needsToYield = [baron, milo].some(actor => Math.hypot(guard.x - actor.x, guard.y - actor.y) < 60);
    if (dt <= 0 || elapsed < guard.pauseUntil || (nearPlayer && !needsToYield)) continue;
    guard.target ??= patrolTarget();

    const dx = guard.target.x - guard.x;
    const dy = guard.target.y - guard.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 8) {
      guard.target = null;
      guard.pauseUntil = elapsed + 0.5 + Math.random() * 1.5;
      continue;
    }

    const direction = Math.atan2(dy, dx);
    const step = Math.min(distance, SPEED * dt);
    for (const offset of STEERING_ANGLES) {
      const angle = direction + offset * guard.side;
      const vx = Math.cos(angle) * step;
      const vy = Math.sin(angle) * step;
      const x = guard.x + vx;
      const y = guard.y + vy;
      if (isBlocked(x, y, RADIUS, baron, guard) || guardBlocks(x, y, guard, guards)
          || approaches(x, y, guard, player, player.radius + RADIUS)
          || approaches(x, y, guard, milo, RADIUS + 12)) continue;
      guard.x = x;
      guard.y = y;
      guard.walking = true;
      guard.facing = Math.round(facingIndex(vx, vy) / 2) % 4;
      guard.stride = (guard.stride + step * TURN / 25) % TURN;
      break;
    }

    guard.blockedTime = guard.walking ? 0 : guard.blockedTime + dt;
    if (guard.blockedTime >= 0.6) {
      guard.target = null;
      guard.blockedTime = 0;
      guard.pauseUntil = elapsed + 0.25;
    }
  }
}
