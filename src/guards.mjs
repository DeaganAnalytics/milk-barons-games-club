import {facingIndex, TURN} from './directions.mjs';
import {EAST_EDGE, isBlocked, NORTH_EDGE, routeAroundBaron, RUGS, SOUTH_TRIM_Y, WEST_EDGE} from './room.mjs';

const RADIUS = 14;
const SPEED = 71;
const APPROACH_DISTANCE = 40;
const PATROL_INSET = 75;
const STEERING_ANGLES = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2];

export function createGuards(player, baron, milo, random = Math.random) {
  const guards = [];
  for (const side of [1, -1]) {
    const occupied = [player, baron, milo, ...guards];
    const isClear = ({x, y}) => !isBlocked(x, y, RADIUS, baron)
      && occupied.every(actor => Math.hypot(x - actor.x, y - actor.y) >= 80);
    let spawn;
    for (let attempt = 0; attempt < 12; attempt++) {
      const candidate = patrolTarget(random);
      if (isClear(candidate)) {
        spawn = candidate;
        break;
      }
    }
    // A fixed set of walkable points bounds the retries on unlucky rolls.
    spawn ??= RUGS.find(isClear);
    guards.push({
      x: spawn.x, y: spawn.y,
      side, radius: RADIUS, facing: 0, stride: 0, walking: false,
      target: null, pauseUntil: 2.5, blockedTime: 0
    });
  }
  return guards;
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

function patrolTarget(random = Math.random) {
  return {
    x: WEST_EDGE + PATROL_INSET + random() * (EAST_EDGE - WEST_EDGE - PATROL_INSET * 2),
    y: NORTH_EDGE + 230 + random() * (SOUTH_TRIM_Y - 42 - NORTH_EDGE - 230)
  };
}

function approaches(x, y, guard, actor, distance) {
  const next = Math.hypot(x - actor.x, y - actor.y);
  return next < distance && next <= Math.hypot(guard.x - actor.x, guard.y - actor.y);
}

export function summonGuard(guards, player) {
  if (guards.some(guard => guard.pursuit)) return;
  const guard = guards.filter(guard => !guard.posted).reduce((closest, candidate) =>
    !closest || Math.hypot(candidate.x - player.x, candidate.y - player.y)
      < Math.hypot(closest.x - player.x, closest.y - player.y) ? candidate : closest, null);
  if (guard) guard.pursuit = {destination: null, route: []};
}

export function updateGuards(guards, player, baron, milo, elapsed, dt) {
  let arrivedGuard = null;
  for (const guard of guards) {
    if (guard.posted) continue;
    guard.walking = false;
    const pursuit = guard.pursuit;
    if (pursuit && Math.hypot(guard.x - player.x, guard.y - player.y) <= 44) {
      guard.facing = Math.round(facingIndex(player.x - guard.x, player.y - guard.y) / 2) % 4;
      guard.pursuit = null;
      guard.target = null;
      guard.pauseUntil = elapsed + 1;
      arrivedGuard = guard;
      continue;
    }
    if (pursuit && (!pursuit.destination || Math.hypot(
      player.x - pursuit.destination.x, player.y - pursuit.destination.y
    ) >= 24)) {
      pursuit.destination = {x: player.x, y: player.y};
      pursuit.route = routeAroundBaron(guard, pursuit.destination, baron);
    }
    // Let the player approach instead of constantly evading them.
    const nearPlayer = Math.hypot(guard.x - player.x, guard.y - player.y) <= APPROACH_DISTANCE;
    const needsToYield = [baron, milo].some(actor => Math.hypot(guard.x - actor.x, guard.y - actor.y) < 60);
    if (dt <= 0 || (!pursuit && (elapsed < guard.pauseUntil || (nearPlayer && !needsToYield)))) continue;
    guard.target ??= patrolTarget();

    const target = pursuit ? (pursuit.route[0] ?? player) : guard.target;
    const dx = target.x - guard.x;
    const dy = target.y - guard.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 8) {
      if (pursuit) {
        pursuit.route.shift();
        continue;
      }
      guard.target = null;
      guard.pauseUntil = elapsed + 0.5 + Math.random() * 1.5;
      continue;
    }

    const direction = Math.atan2(dy, dx);
    const step = Math.min(distance, (pursuit ? 210 : SPEED) * dt);
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
      if (pursuit) pursuit.destination = null;
    }
  }
  return arrivedGuard;
}
