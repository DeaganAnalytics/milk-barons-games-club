export const ROOM_WIDTH = 690;
export const ROOM_HEIGHT = 685;
export const NORTH_EDGE = -ROOM_HEIGHT * 2;
export const SOUTH_EDGE = ROOM_HEIGHT * 3;
export const MAP_HEIGHT = SOUTH_EDGE - NORTH_EDGE;
export const SOUTH_TRIM_Y = SOUTH_EDGE - 52;
export const WEST_EDGE = -ROOM_WIDTH;
export const EAST_EDGE = ROOM_WIDTH * 2;
export const HALL_CENTER = {x: ROOM_WIDTH / 2, y: (NORTH_EDGE + SOUTH_EDGE) / 2};
export const DANCE_FLOOR = {x: HALL_CENTER.x, y: SOUTH_EDGE - ROOM_HEIGHT / 2 + 25};
const danceBounds = {...DANCE_FLOOR, halfWidth: 177, halfHeight: 175};
export const BARON_DANCE_STOP = {x: DANCE_FLOOR.x - 270, y: DANCE_FLOOR.y - 227};
const columns = (EAST_EDGE - WEST_EDGE) / ROOM_WIDTH;
const rows = MAP_HEIGHT / ROOM_HEIGHT;

export const RUGS = Array.from({length: columns * rows}, (_, index) => {
  const row = Math.floor(index / columns);
  const column = index % columns;
  return {
    x: WEST_EDGE + (column + 0.5) * ROOM_WIDTH,
    y: NORTH_EDGE + (row + 0.5) * ROOM_HEIGHT,
    horizontal: (row === 0 || row === rows - 1) && (column === 0 || column === columns - 1)
  };
}).filter(rug => rug.x !== DANCE_FLOOR.x || rug.y !== DANCE_FLOOR.y - 25);

const middleRowStart = Math.floor(rows / 2) * columns;
export const SIDE_RUGS = [RUGS[middleRowStart], RUGS[middleRowStart + columns - 1]];

export function closestRug(player) {
  const distance = rug => Math.hypot(rug.x - player.x, rug.y - player.y);
  return RUGS.reduce((closest, rug) => distance(rug) < distance(closest) ? rug : closest);
}

export function sameSquare(first, second) {
  return Math.floor((first.x - WEST_EDGE) / ROOM_WIDTH) === Math.floor((second.x - WEST_EDGE) / ROOM_WIDTH)
    && Math.floor((first.y - NORTH_EDGE) / ROOM_HEIGHT) === Math.floor((second.y - NORTH_EDGE) / ROOM_HEIGHT);
}

export function cameraLeft(playerX) {
  return Math.max(WEST_EDGE, Math.min(EAST_EDGE - ROOM_WIDTH, playerX - ROOM_WIDTH / 2));
}

export function cameraTop(playerY) {
  return Math.max(NORTH_EDGE, Math.min(SOUTH_EDGE - ROOM_HEIGHT, playerY - ROOM_HEIGHT / 2));
}

const danceFixtures = [
  {x: DANCE_FLOOR.x, y: DANCE_FLOOR.y - 246, halfWidth: 127, halfHeight: 57},
  ...[-1, 1].map(side => ({
    x: DANCE_FLOOR.x + side * 191, y: DANCE_FLOOR.y - 227, halfWidth: 32, halfHeight: 23
  }))
];

function overlaps(x, y, radius, obstacle) {
  return Math.abs(x - obstacle.x) < obstacle.halfWidth + radius
    && Math.abs(y - obstacle.y) < obstacle.halfHeight + radius;
}

export function onDanceFloor(x, y, radius = 0) {
  return overlaps(x, y, radius, danceBounds);
}

export function isNpcBlocked(x, y, radius, baron, from) {
  return onDanceFloor(x, y, radius) || isBlocked(x, y, radius, baron, from);
}

export function isBlocked(x, y, radius, baron, from) {
  if (x < WEST_EDGE + 38 || x > EAST_EDGE - 39 || y < NORTH_EDGE + 160 || y > SOUTH_TRIM_Y - 16) return true;
  // The closed center door stands proud of the back wall.
  if (y < NORTH_EDGE + 190 && Math.abs(x - HALL_CENTER.x) < 75 + radius) return true;
  if (danceFixtures.some(fixture => overlaps(x, y, radius, fixture))) return true;
  const baronObstacle = {x: baron.x, y: baron.y + 6, halfWidth: 29, halfHeight: 35};
  if (!overlaps(x, y, radius, baronObstacle)) return false;
  // The Baron can walk up to an occupied rug. Let a player he overlaps step away.
  return !from || !overlaps(from.x, from.y, radius, baronObstacle)
    || Math.hypot(x - baronObstacle.x, y - baronObstacle.y)
      <= Math.hypot(from.x - baronObstacle.x, from.y - baronObstacle.y);
}

export function nearestInteraction(player, baron, milo, guards = [], guests = []) {
  const baronTarget = {
    id: 'baron', x: baron.x, y: baron.y, radius: 39, title: 'The Milk Baron'
  };
  const baronTargets = baron.x === BARON_DANCE_STOP.x && baron.y === BARON_DANCE_STOP.y && !baron.route?.length
    ? [] : [baronTarget];
  const targets = [...guests, ...baronTargets, ...guards.map(guard => ({
    id: 'guard', x: guard.x, y: guard.y, radius: guard.radius, title: 'Bull Guard', posted: guard.posted
  }))];
  if (milo) {
    targets.push({
      id: 'milo', x: milo.x, y: milo.y, radius: 24, title: 'Milo Milksworth',
      message: 'Shh! I’m trying to stay out of the Baron’s way.'
    });
  }
  return targets
    .map(target => ({...target, distance: Math.hypot(player.x - target.x, player.y - target.y)}))
    .filter(target => target.distance < target.radius + 27)
    .sort((a, b) => a.distance - b.distance)[0];
}

export function crossesDanceArea(from, to) {
  return Math.max(from.y, to.y) >= DANCE_FLOOR.y - 340
    && Math.min(from.x, to.x) < DANCE_FLOOR.x + 250
    && Math.max(from.x, to.x) > DANCE_FLOOR.x - 250;
}

export function routeAroundBaron(member, target, baron) {
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const obstacleCorners = ({x, y, halfWidth, halfHeight}) => [-1, 1].flatMap(dx => [-1, 1].map(dy => ({
    x: x + dx * (halfWidth + member.radius + 10), y: y + dy * (halfHeight + member.radius + 10)
  })));
  const nearDanceFloor = Math.max(member.y, target.y) >= danceBounds.y - 340;
  const obstacles = [{x: baron.x, y: baron.y + 6, halfWidth: 29, halfHeight: 35}];
  if (nearDanceFloor) obstacles.push(danceBounds, ...danceFixtures);
  const corners = obstacles.flatMap(obstacleCorners)
    .filter(point => !isNpcBlocked(point.x, point.y, member.radius, baron));
  const nodes = [member, target, ...corners];
  const costs = nodes.map((_, index) => index === 0 ? 0 : Infinity);
  const parents = [];
  const visited = new Set();
  const clear = (start, end, length) => {
    const samples = Math.max(1, Math.ceil(length / 8));
    for (let step = 1; step <= samples; step++) {
      const x = start.x + (end.x - start.x) * step / samples;
      const y = start.y + (end.y - start.y) * step / samples;
      if (isNpcBlocked(x, y, member.radius, baron, start)) return false;
    }
    return true;
  };
  if (clear(member, target, distance(member, target))) return [target];
  // Route around the corners of obstacles when the direct path is blocked.
  while (!visited.has(1)) {
    let next = -1;
    for (let index = 0; index < nodes.length; index++) {
      if (!visited.has(index) && costs[index] < (costs[next] ?? Infinity)) next = index;
    }
    if (next === -1) return [target];
    visited.add(next);
    for (let index = 1; index < nodes.length; index++) {
      if (visited.has(index)) continue;
      const length = distance(nodes[next], nodes[index]);
      if (costs[next] + length < costs[index] && clear(nodes[next], nodes[index], length)) {
        costs[index] = costs[next] + length;
        parents[index] = next;
      }
    }
  }
  const route = [];
  for (let index = 1; index !== 0; index = parents[index]) route.unshift(nodes[index]);
  return route;
}
