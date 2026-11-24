import {facingIndex, TURN} from './directions.mjs';
import {crossesScenery, EAST_EDGE, onDanceFloor, isNpcBlocked, MILK_POOL, NORTH_EDGE, routeAroundBaron, RUGS, SOUTH_TRIM_Y, WEST_EDGE} from './room.mjs';

const RADIUS = 14;
const SPEED = 71;
const APPROACH_DISTANCE = 40;
const PATROL_INSET = 75;
const STEERING_ANGLES = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2];

export function createGuards(player, baron, milo, random = Math.random) {
  const guards = [];
  for (const side of [1, -1]) {
    const occupied = [player, baron, milo, ...guards];
    const isClear = ({x, y}) => !isNpcBlocked(x, y, RADIUS, baron)
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
  const alreadyComing = guards.find(guard => guard.pursuit && !guard.pursuit.milo && !guard.pursuit.pool);
  if (alreadyComing) return alreadyComing;
  const guard = guards.filter(guard => !guard.posted && !guard.pursuit).reduce((closest, candidate) =>
    !closest || Math.hypot(candidate.x - player.x, candidate.y - player.y)
      < Math.hypot(closest.x - player.x, closest.y - player.y) ? candidate : closest, null);
  if (guard) guard.pursuit = {destination: null, route: []};
  return guard;
}

export function dispatchGuardToMilo(guard) {
  if (guard && !guard.posted) guard.pursuit = {milo: true, destination: null, route: []};
}

export function dispatchGuardToPool(guard) {
  if (guard && !guard.posted && !guard.pursuit && !guard.poolWatch && !guard.escorting) {
    guard.pursuit = {pool: true, destination: null, route: []};
  }
}

export function dispatchRovingGuardsToPool(guards) {
  const roving = guards.filter(guard => !guard.posted);
  for (const guard of roving) {
    guard.poolReportPending = true;
    dispatchGuardToPool(guard);
  }
  return roving;
}

export function updateGuards(guards, player, baron, milo, elapsed, dt) {
  let arrivedGuard = null;
  for (const guard of guards) {
    if (guard.posted || guard.escorting) continue;
    guard.walking = false;
    if (guard.poolWatch) {
      if (elapsed < guard.poolWatch.until) continue;
      guard.poolWatch = null;
      guard.poolReportPending = false;
    }
    if (guard.poolReportPending && !guard.pursuit) dispatchGuardToPool(guard);
    const pursuit = guard.pursuit;
    let pursued = pursuit?.milo ? milo : player;
    if (pursuit?.pool) {
      // The north deck is outside the pool collision bounds and faces the swimmers.
      const side = guard.side === -1 ? -1 : 1;
      const spots = [side * 105, 0, -side * 105, side * 185, -side * 185].map(offset => ({x: MILK_POOL.x + offset, y: MILK_POOL.y - 81}));
      const isClear = spot => !isNpcBlocked(spot.x, spot.y, RADIUS, baron)
        && [player, milo, ...guards.filter(other => other !== guard)].every(actor =>
          Math.hypot(spot.x - actor.x, spot.y - actor.y) > 40
            && (!actor.pursuit?.pool || !actor.pursuit.destination
              || Math.hypot(spot.x - actor.pursuit.destination.x, spot.y - actor.pursuit.destination.y) > 40));
      pursued = pursuit.destination && isClear(pursuit.destination)
        ? pursuit.destination : spots.find(isClear);
      if (!pursued) continue;
      if (Math.hypot(guard.x - pursued.x, guard.y - pursued.y) < 8) {
        guard.pursuit = null;
        guard.target = null;
        guard.route = [];
        guard.poolWatch = {start: elapsed, until: elapsed + 15};
        guard.facing = 0;
        continue;
      }
    }
    if (pursuit && !pursuit.pool && Math.hypot(guard.x - pursued.x, guard.y - pursued.y) <= (pursuit.milo ? 30 : 44)) {
      guard.facing = Math.round(facingIndex(pursued.x - guard.x, pursued.y - guard.y) / 2) % 4;
      guard.pursuit = null;
      guard.target = null;
      guard.pauseUntil = elapsed + 1;
      if (pursuit.milo) milo.injuryPending = true;
      else arrivedGuard = guard;
      continue;
    }
    if (pursuit && onDanceFloor(pursued.x, pursued.y, RADIUS)) continue;
    if (pursuit && (!pursuit.destination || Math.hypot(
      pursued.x - pursuit.destination.x, pursued.y - pursuit.destination.y
    ) >= 24)) {
      pursuit.destination = {x: pursued.x, y: pursued.y};
      pursuit.route = routeAroundBaron(guard, pursuit.destination, baron);
    }
    // Let the player approach instead of constantly evading them.
    const nearPlayer = Math.hypot(guard.x - player.x, guard.y - player.y) <= APPROACH_DISTANCE;
    const needsToYield = [baron, milo].some(actor => Math.hypot(guard.x - actor.x, guard.y - actor.y) < 60);
    if (dt <= 0 || (!pursuit && (elapsed < guard.pauseUntil || (nearPlayer && !needsToYield)))) continue;
    if (!pursuit && !guard.target) {
      guard.target = patrolTarget();
      if (isNpcBlocked(guard.target.x, guard.target.y, RADIUS, baron)) {
        guard.target = null;
        continue;
      }
      guard.route = crossesScenery(guard, guard.target) ? routeAroundBaron(guard, guard.target, baron) : [];
    }

    const target = pursuit ? (pursuit.route[0] ?? pursued) : (guard.route?.[0] ?? guard.target);
    const dx = target.x - guard.x;
    const dy = target.y - guard.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 8) {
      if (pursuit) {
        pursuit.route.shift();
        continue;
      }
      guard.route?.shift();
      if (guard.route?.length) continue;
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
      if (isNpcBlocked(x, y, RADIUS, baron, guard) || guardBlocks(x, y, guard, guards)
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
