import {crossesScenery, guestEnclosure, HALL_CENTER, onDanceFloor, routeAroundBaron, EAST_EDGE, NORTH_EDGE, isNpcBlocked, sameSquare, SOUTH_TRIM_Y, WEST_EDGE} from './room.mjs';
import {guardBlocks} from './guards.mjs';
import {TURN} from './directions.mjs';

const CORNERS = [
  {x: WEST_EDGE + 116, y: NORTH_EDGE + 224},
  {x: WEST_EDGE + 116, y: SOUTH_TRIM_Y - 83},
  {x: EAST_EDGE - 116, y: SOUTH_TRIM_Y - 83},
  {x: EAST_EDGE - 116, y: NORTH_EDGE + 224}
];
const SOUTHWEST_CORNER = 1;
const HIDE_INTERVAL = 12;
const THREAT_DISTANCE = 200;
const WALK_SPEED = 102;
const RUN_SPEED = 235;
const SPOT_COOLDOWN = 4;
const AVOIDANCE_TURNS = [Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2];

export function createMilo() {
  return {...CORNERS[0], corner: 0, route: [], nextMove: HIDE_INTERVAL, stride: 0, facingLeft: false, fleeing: false, nextSpot: 0};
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const projection = lengthSquared
    ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared))
    : 0;
  return Math.hypot(point.x - start.x - projection * dx, point.y - start.y - projection * dy);
}

function routeToCorner(milo, corner, baron) {
  return crossesScenery(milo, corner)
    ? routeAroundBaron({...milo, radius: 12}, corner, baron) : [corner];
}

function canUseCorner(index) {
  return index !== SOUTHWEST_CORNER || !guestEnclosure.active;
}

function selectRoute(milo, baron, distance) {
  for (let offset = 1; offset < CORNERS.length; offset++) {
    const index = (milo.corner + offset) % CORNERS.length;
    if (!canUseCorner(index)) continue;
    const corner = CORNERS[index];
    if (Math.hypot(corner.x - baron.x, corner.y - baron.y) < THREAT_DISTANCE) continue;
    if (distanceToSegment(baron, milo, corner) >= Math.min(125, distance) - 0.01) {
      milo.corner = index;
      return routeToCorner(milo, corner, baron);
    }
  }
  return [];
}

export function fleeMilo(milo, threat, baron, guards) {
  const goEast = threat.x < HALL_CENTER.x;
  const goNorth = milo.y < HALL_CENTER.y;
  const preferred = goEast ? (goNorth ? 3 : 2) : (goNorth ? 0 : 1);
  const alternate = preferred ^ 1;
  const preferredOccupied = [baron, ...guards].some(actor => !actor.posted && sameSquare(actor, CORNERS[preferred]));
  milo.corner = canUseCorner(preferred) && (!preferredOccupied || !canUseCorner(alternate))
    ? preferred : alternate;
  milo.route = routeToCorner(milo, CORNERS[milo.corner], baron);
  milo.fleeing = true;
}

function startEscape(milo, baron, guards, elapsed) {
  if (milo.fleeing || elapsed < milo.nextSpot) return false;
  const spottedByBaron = sameSquare(milo, baron);
  const threat = spottedByBaron ? baron : guards.find(guard => !guard.posted && !guard.pursuit?.milo && sameSquare(milo, guard));
  if (!threat) return false;

  fleeMilo(milo, threat, baron, guards);
  return spottedByBaron;
}

export function updateMilo(milo, baron, elapsed, dt, guards = []) {
  const spotted = startEscape(milo, baron, guards, elapsed);
  const distance = Math.hypot(milo.x - baron.x, milo.y - baron.y);
  if (!canUseCorner(milo.corner) || (!milo.route.length && (elapsed >= milo.nextMove || distance < THREAT_DISTANCE))) {
    milo.route = selectRoute(milo, baron, distance);
    milo.nextMove = elapsed + HIDE_INTERVAL;
  }
  const target = milo.route[0];
  if (!target) {
    milo.stride = 0;
    return spotted;
  }

  const dx = target.x - milo.x;
  const dy = target.y - milo.y;
  const remaining = Math.hypot(dx, dy);
  const step = Math.min((milo.fleeing ? RUN_SPEED : WALK_SPEED) * dt, remaining);
  let x = remaining ? milo.x + dx * step / remaining : milo.x;
  let y = remaining ? milo.y + dy * step / remaining : milo.y;
  let arrived = step === remaining;
  if (onDanceFloor(x, y, 12) || guardBlocks(x, y, milo, guards, 12)) {
    const heading = Math.atan2(dy, dx);
    const turn = AVOIDANCE_TURNS.find(offset => {
      const nextX = milo.x + Math.cos(heading + offset) * step;
      const nextY = milo.y + Math.sin(heading + offset) * step;
      return !isNpcBlocked(nextX, nextY, 12, baron, milo) && !guardBlocks(nextX, nextY, milo, guards, 12);
    });
    if (turn === undefined) {
      milo.stride = 0;
      return spotted;
    }
    x = milo.x + Math.cos(heading + turn) * step;
    y = milo.y + Math.sin(heading + turn) * step;
    arrived = false;
  }
  if (!milo.fleeing && distance < 125 && Math.hypot(x - baron.x, y - baron.y) < distance - 0.01) {
    // A Baron who has started moving can cut across Milo's previous route.
    milo.route = selectRoute(milo, baron, distance);
    return spotted;
  }

  if (x !== milo.x) milo.facingLeft = x < milo.x;
  milo.stride = (milo.stride + step * TURN / 22) % TURN;
  if (arrived) {
    milo.x = target.x;
    milo.y = target.y;
    milo.route.shift();
    if (!milo.route.length) {
      milo.nextMove = elapsed + HIDE_INTERVAL;
      if (milo.fleeing) milo.nextSpot = elapsed + SPOT_COOLDOWN;
      milo.fleeing = false;
    }
  } else {
    milo.x = x;
    milo.y = y;
  }
  return spotted;
}
