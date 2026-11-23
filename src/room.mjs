export const ROOM_WIDTH = 690;
export const ROOM_HEIGHT = 685;
export const NORTH_EDGE = -ROOM_HEIGHT * 2;
export const SOUTH_EDGE = ROOM_HEIGHT * 3;
export const MAP_HEIGHT = SOUTH_EDGE - NORTH_EDGE;
export const SOUTH_TRIM_Y = SOUTH_EDGE - 52;
export const WEST_EDGE = -ROOM_WIDTH;
export const EAST_EDGE = ROOM_WIDTH * 2;
export const HALL_CENTER = {x: ROOM_WIDTH / 2, y: (NORTH_EDGE + SOUTH_EDGE) / 2};
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
});

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

function overlaps(x, y, radius, obstacle) {
  return Math.abs(x - obstacle.x) < obstacle.halfWidth + radius
    && Math.abs(y - obstacle.y) < obstacle.halfHeight + radius;
}

export function isBlocked(x, y, radius, baron, from) {
  if (x < WEST_EDGE + 38 || x > EAST_EDGE - 39 || y < NORTH_EDGE + 160 || y > SOUTH_TRIM_Y - 16) return true;
  // The closed center door stands proud of the back wall.
  if (y < NORTH_EDGE + 190 && Math.abs(x - HALL_CENTER.x) < 75 + radius) return true;
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
