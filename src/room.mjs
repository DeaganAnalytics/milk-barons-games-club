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
export const MILK_POOL = {x: HALL_CENTER.x + ROOM_WIDTH / 2, y: HALL_CENTER.y - ROOM_HEIGHT * 1.5};
export const MILK_FOUNTAIN = {x: MILK_POOL.x, y: MILK_POOL.y + ROOM_HEIGHT * 2};
const fountainBounds = {...MILK_FOUNTAIN, halfWidth: 140, halfHeight: 58};
export const professorFeet = {x: MILK_FOUNTAIN.x - 158, y: MILK_FOUNTAIN.y + 59};
const professorBounds = {x: professorFeet.x, y: professorFeet.y - 9, halfWidth: 24, halfHeight: 12};
export const PILLORY = {x: WEST_EDGE + ROOM_WIDTH / 2, y: HALL_CENTER.y - ROOM_HEIGHT / 2 + 54};
export const MILK_BAG_BASKET = {x: PILLORY.x, y: PILLORY.y + 81};
export const PILLORY_ATTENDANT = {x: PILLORY.x + 102, y: PILLORY.y + 144};
const pilloryFixtures = [
  {...PILLORY, halfWidth: 44, halfHeight: 13},
  {...MILK_BAG_BASKET, halfWidth: 21, halfHeight: 10},
  {...PILLORY_ATTENDANT, halfWidth: 11, halfHeight: 10}
];
export const SLOT_STATIONS = [0, 1, 2, 3].map(index => ({
  x: WEST_EDGE + 68,
  y: SOUTH_EDGE - ROOM_HEIGHT + (index - 1.5) * 135,
  halfWidth: 28,
  halfHeight: 11
}));

export const PRACTICE_RANGE = {
  west: EAST_EDGE - 315, east: EAST_EDGE,
  north: SOUTH_TRIM_Y - 290, south: SOUTH_TRIM_Y - 102,
  guardX: EAST_EDGE - 291, targetX: EAST_EDGE - 27,
  lanes: [SOUTH_TRIM_Y - 262, SOUTH_TRIM_Y - 194, SOUTH_TRIM_Y - 126]
};
const rangeBounds = {
  x: (PRACTICE_RANGE.west + PRACTICE_RANGE.east) / 2,
  y: (PRACTICE_RANGE.north + PRACTICE_RANGE.south) / 2,
  halfWidth: (PRACTICE_RANGE.east - PRACTICE_RANGE.west) / 2,
  halfHeight: (PRACTICE_RANGE.south - PRACTICE_RANGE.north) / 2
};

export function insidePracticeRange(x, y, radius = 0) {
  return overlaps(x, y, radius, rangeBounds);
}

export function crossesPracticeRange(from, to) {
  return Math.max(from.x, to.x) >= PRACTICE_RANGE.west - 40
    && Math.min(from.y, to.y) <= PRACTICE_RANGE.south + 40
    && Math.max(from.y, to.y) >= PRACTICE_RANGE.north - 40;
}

const columns = (EAST_EDGE - WEST_EDGE) / ROOM_WIDTH;
const rows = MAP_HEIGHT / ROOM_HEIGHT;

export const RUGS = Array.from({length: columns * rows}, (_, index) => {
  const row = Math.floor(index / columns);
  const column = index % columns;
  const rangeSideRug = row === rows - 1 && column === columns - 1;
  return {
    x: WEST_EDGE + (column + 0.5) * ROOM_WIDTH - (rangeSideRug ? 84 : 0),
    y: NORTH_EDGE + (row + 0.5) * ROOM_HEIGHT,
    horizontal: (row === 0 || row === rows - 1) && (column === 0 || column === columns - 1)
  };
}).filter(rug => rug.x !== DANCE_FLOOR.x || rug.y !== DANCE_FLOOR.y - 25);

export const SIDE_RUGS = RUGS.filter(rug => rug.y === HALL_CENTER.y && rug.x !== HALL_CENTER.x);

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

const poolFixtures = [
  {dx: 0, dy: 0, halfWidth: 236, halfHeight: 62},
  {dx: -263, dy: -8, halfWidth: 31, halfHeight: 37},
  {dx: -37, dy: -100, halfWidth: 30, halfHeight: 17},
  {dx: 58, dy: -109, halfWidth: 48, halfHeight: 18},
  {dx: 170, dy: -70, halfWidth: 18, halfHeight: 11}
].map(({dx, dy, ...bounds}) => ({x: MILK_POOL.x + dx, y: MILK_POOL.y + dy, ...bounds}));

function overlaps(x, y, radius, obstacle) {
  return Math.abs(x - obstacle.x) < obstacle.halfWidth + radius
    && Math.abs(y - obstacle.y) < obstacle.halfHeight + radius;
}

export const guestEnclosure = {
  active: false, west: WEST_EDGE + 67, east: WEST_EDGE + 302,
  north: SOUTH_TRIM_Y - 148, south: SOUTH_TRIM_Y - 5,
  gateY: SOUTH_TRIM_Y - 56, gateHalf: 34
};

export const guestGateInside = {x: guestEnclosure.east - 34, y: guestEnclosure.gateY};
export const guestGateOutside = {x: guestEnclosure.east + 48, y: guestEnclosure.gateY};
const enclosureBounds = {
  x: (guestEnclosure.west + guestEnclosure.east) / 2,
  y: (guestEnclosure.north + guestEnclosure.south) / 2,
  halfWidth: (guestEnclosure.east - guestEnclosure.west) / 2,
  halfHeight: (guestEnclosure.south - guestEnclosure.north) / 2
};

export function insideGuestEnclosure(point) {
  return overlaps(point.x, point.y, 0, enclosureBounds);
}

export function nearGuestGate(point) {
  return guestEnclosure.active && point.x >= guestEnclosure.east
    && point.x <= guestEnclosure.east + 43 && Math.abs(point.y - guestEnclosure.gateY) <= guestEnclosure.gateHalf;
}

function guestEnclosureBlocks(x, y, radius, from) {
  if (!guestEnclosure.active || !overlaps(x, y, radius, enclosureBounds)) return false;
  const {west, east, north, south, gateY, gateHalf} = guestEnclosure;
  if (from?.guestAccess) {
    const horizontalWall = Math.abs(y - north) < radius || Math.abs(y - south) < radius;
    const westWall = Math.abs(x - west) < radius;
    const eastWall = Math.abs(x - east) < radius && Math.abs(y - gateY) > gateHalf - radius;
    return horizontalWall || westWall || eastWall;
  }
  // Actors caught inside when the rope goes up can step out.
  return !from || !insideGuestEnclosure(from);
}

export function onDanceFloor(x, y, radius = 0) {
  return overlaps(x, y, radius, danceBounds);
}

export function isNpcBlocked(x, y, radius, baron, from) {
  return insidePracticeRange(x, y, radius) || onDanceFloor(x, y, radius) || isBlocked(x, y, radius, baron, from);
}

export function isBlocked(x, y, radius, baron, from) {
  if (x < WEST_EDGE + 38 || x > EAST_EDGE - 39 || y < NORTH_EDGE + 160 || y > SOUTH_TRIM_Y - 16) return true;
  // The closed center door stands proud of the back wall.
  if (y < NORTH_EDGE + 190 && Math.abs(x - HALL_CENTER.x) < 75 + radius) return true;
  if (danceFixtures.some(fixture => overlaps(x, y, radius, fixture))
      || overlaps(x, y, radius, fountainBounds)
      || overlaps(x, y, radius, professorBounds)
      || pilloryFixtures.some(fixture => overlaps(x, y, radius, fixture))
      || SLOT_STATIONS.some(fixture => overlaps(x, y, radius, fixture))
      || poolFixtures.some(fixture => overlaps(x, y, radius, fixture))
      || guestEnclosureBlocks(x, y, radius, from)) return true;
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
  const targets = [...guests, baronTarget, ...guards.map(guard => ({
    id: 'guard', x: guard.x, y: guard.y, radius: guard.radius, title: 'Bull Guard', posted: guard.posted, guestGate: guard.guestGate, guard
  }))];
  if (milo) {
    targets.push({
      id: 'milo', x: milo.x, y: milo.y, radius: 24, title: 'Milo Milksworth',
      message: 'Shh! I’m trying to stay out of the Baron’s way.'
    });
  }
  return targets
    .map(target => {
      const dx = Math.max(0, Math.abs(player.x - target.x) - (target.interactionHalfWidth ?? 0));
      return {...target, distance: Math.hypot(dx, player.y - target.y)};
    })
    .filter(target => target.distance < target.radius + 27)
    .sort((a, b) => a.distance - b.distance)[0];
}

export function crossesPoolArea(from, to) {
  return Math.min(from.y, to.y) < MILK_POOL.y + 100
    && Math.max(from.y, to.y) > MILK_POOL.y - 140
    && Math.max(from.x, to.x) > MILK_POOL.x - 330;
}

export function crossesFountainArea(from, to) {
  const {x, y, halfWidth, halfHeight} = fountainBounds;
  return Math.min(from.x, to.x) < x + halfWidth + 40 && Math.max(from.x, to.x) > professorBounds.x - professorBounds.halfWidth - 40
    && Math.min(from.y, to.y) < y + halfHeight + 40 && Math.max(from.y, to.y) > y - halfHeight - 40;
}

export function crossesPilloryArea(from, to) {
  return Math.min(from.x, to.x) < PILLORY_ATTENDANT.x + 55 && Math.max(from.x, to.x) > PILLORY.x - 105
    && Math.min(from.y, to.y) < PILLORY_ATTENDANT.y + 55 && Math.max(from.y, to.y) > PILLORY.y - 55;
}

function crossesSlotArea(from, to) {
  return SLOT_STATIONS.some(station =>
    Math.max(from.x, to.x) > station.x - station.halfWidth - 30
    && Math.min(from.x, to.x) < station.x + station.halfWidth + 30
    && Math.min(from.y, to.y) < station.y + station.halfHeight + 30
    && Math.max(from.y, to.y) > station.y - station.halfHeight - 30);
}

export function crossesScenery(from, to) {
  return crossesPracticeRange(from, to) || crossesSlotArea(from, to) || crossesPoolArea(from, to) || crossesFountainArea(from, to) || crossesPilloryArea(from, to) || Math.max(from.y, to.y) >= DANCE_FLOOR.y - 340
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
  if (crossesFountainArea(member, target)) obstacles.push(fountainBounds, professorBounds);
  if (crossesPilloryArea(member, target)) obstacles.push(...pilloryFixtures);
  if (crossesPoolArea(member, target)) obstacles.push(...poolFixtures);
  if (crossesPracticeRange(member, target)) obstacles.push(rangeBounds);
  if (crossesSlotArea(member, target)) obstacles.push(...SLOT_STATIONS);
  if (guestEnclosure.active) obstacles.push(enclosureBounds);
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
