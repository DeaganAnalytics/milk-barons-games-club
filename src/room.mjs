export const ROOM_WIDTH = 690;
export const ROOM_HEIGHT = 685;
export const WEST_EDGE = -ROOM_WIDTH;
export const EAST_EDGE = ROOM_WIDTH * 2;
export const CLEAR_AISLE_Y = 451;
export const CENTER_RUG = {x: ROOM_WIDTH / 2, y: 357};
export const SIDE_RUGS = [
  {x: -ROOM_WIDTH / 2, y: 357},
  {x: ROOM_WIDTH * 1.5, y: 357}
];
const RUGS = [SIDE_RUGS[0], CENTER_RUG, SIDE_RUGS[1]];

export function closestRug(playerX) {
  return RUGS.reduce((closest, rug) =>
    Math.abs(rug.x - playerX) < Math.abs(closest.x - playerX) ? rug : closest, CENTER_RUG);
}

export function cameraLeft(playerX) {
  return Math.max(WEST_EDGE, Math.min(EAST_EDGE - ROOM_WIDTH, playerX - ROOM_WIDTH / 2));
}

function overlaps(x, y, radius, obstacle) {
  return Math.abs(x - obstacle.x) < obstacle.halfWidth + radius
    && Math.abs(y - obstacle.y) < obstacle.halfHeight + radius;
}

export function isBlocked(x, y, radius, baron, from) {
  if (x < WEST_EDGE + 38 || x > EAST_EDGE - 39 || y < 160 || y > 617) return true;
  // Closed doors stand proud of the back wall.
  if (y < 190 && Math.abs(x - CENTER_RUG.x) < 75 + radius) return true;
  if (y < 172 && Math.abs(x - SIDE_RUGS[0].x) < 31 + radius) return true;
  const baronObstacle = {x: baron.x, y: baron.y + 6, halfWidth: 29, halfHeight: 35};
  if (!overlaps(x, y, radius, baronObstacle)) return false;
  // The Baron can walk up to an occupied rug. Let a player he overlaps step away.
  return !from || !overlaps(from.x, from.y, radius, baronObstacle)
    || Math.hypot(x - baronObstacle.x, y - baronObstacle.y)
      <= Math.hypot(from.x - baronObstacle.x, from.y - baronObstacle.y);
}

export function nearestInteraction(player, baron, milo) {
  const baronTarget = {
    id: 'baron', x: baron.x, y: baron.y, radius: 39, title: 'The Milk Baron'
  };
  const targets = [baronTarget];
  if (milo) {
    targets.push({
      x: milo.x, y: milo.y, radius: 24, title: 'Milo Milksworth',
      message: 'Shh! I’m trying to stay out of the Baron’s way.'
    });
  }
  return targets
    .map(target => ({...target, distance: Math.hypot(player.x - target.x, player.y - target.y)}))
    .filter(target => target.distance < target.radius + 27)
    .sort((a, b) => a.distance - b.distance)[0];
}
