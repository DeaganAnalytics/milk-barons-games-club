import {EAST_EDGE, WEST_EDGE, CLEAR_AISLE_Y, ROOM_WIDTH} from './room.mjs';
import {TURN} from './directions.mjs';

const CORNERS = [
  {x: WEST_EDGE + 116, y: 224},
  {x: WEST_EDGE + 116, y: 550},
  {x: EAST_EDGE - 116, y: 550},
  {x: EAST_EDGE - 116, y: 224}
];
const HIDE_INTERVAL = 12;
const THREAT_DISTANCE = 200;
const WALK_SPEED = 102;
const RUN_SPEED = 235;
const SPOT_COOLDOWN = 4;

export function createMilo() {
  return {...CORNERS[0], corner: 0, route: [], nextMove: HIDE_INTERVAL, stride: 0, facingLeft: false, fleeing: false, nextSpot: 0};
}

function routeTo(milo, corner) {
  if (milo.x === corner.x) return [corner];
  return [{x: milo.x, y: CLEAR_AISLE_Y}, {x: corner.x, y: CLEAR_AISLE_Y}, corner];
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

function selectRoute(milo, baron, distance) {
  for (let offset = 1; offset < CORNERS.length; offset++) {
    const index = (milo.corner + offset) % CORNERS.length;
    const corner = CORNERS[index];
    if (Math.hypot(corner.x - baron.x, corner.y - baron.y) < THREAT_DISTANCE) continue;
    const route = routeTo(milo, corner);
    if (route.every((end, i) =>
      distanceToSegment(baron, route[i - 1] ?? milo, end) >= Math.min(125, distance) - 0.01)) {
      milo.corner = index;
      return route;
    }
  }
  return [];
}

function startEscape(milo, baron, elapsed) {
  // The hall is open, but its three room-width sections still define encounters.
  const baronRoom = Math.floor(baron.x / ROOM_WIDTH);
  if (milo.fleeing || elapsed < milo.nextSpot
      || Math.floor(milo.x / ROOM_WIDTH) !== baronRoom) return false;

  const goEast = baronRoom === -1 || (baronRoom === 0 && baron.x < ROOM_WIDTH / 2);
  const topCorner = milo.y < CLEAR_AISLE_Y;
  milo.corner = goEast ? (topCorner ? 3 : 2) : (topCorner ? 0 : 1);
  milo.route = routeTo(milo, CORNERS[milo.corner]);
  milo.fleeing = true;
  return true;
}

export function updateMilo(milo, baron, elapsed, dt) {
  const spotted = startEscape(milo, baron, elapsed);
  const distance = Math.hypot(milo.x - baron.x, milo.y - baron.y);
  if (!milo.route.length && (elapsed >= milo.nextMove || distance < THREAT_DISTANCE)) {
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
  const x = remaining ? milo.x + dx * step / remaining : milo.x;
  const y = remaining ? milo.y + dy * step / remaining : milo.y;
  if (!milo.fleeing && distance < 125 && Math.hypot(x - baron.x, y - baron.y) < distance - 0.01) {
    // A Baron who has started moving can cut across Milo's previous route.
    milo.route = selectRoute(milo, baron, distance);
    return spotted;
  }

  if (dx) milo.facingLeft = dx < 0;
  milo.stride = (milo.stride + step * TURN / 22) % TURN;
  if (step === remaining) {
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
