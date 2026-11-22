export const ROOM_WIDTH = 690;
export const ROOM_HEIGHT = 685;

const stations = [
  {
    x: 171, y: 319, radius: 85, title: 'Card table',
    message: 'The cards are ready. The game itself is still being prepared.',
    obstacle: {x: 171, y: 319, halfWidth: 89, halfHeight: 69}
  },
  {
    x: 535, y: 319, radius: 85, title: 'Dice table',
    message: 'Three dice. A suspiciously confident house.',
    obstacle: {x: 535, y: 319, halfWidth: 89, halfHeight: 69}
  },
  {
    x: 170, y: 560, radius: 80, title: 'Cashier',
    message: 'The cashier is preparing the chip counter.',
    obstacle: {x: 170, y: 553, halfWidth: 107, halfHeight: 56}
  }
];

const obstacles = [
  ...stations.map(station => station.obstacle),
  {x: 165, y: 215, halfWidth: 42, halfHeight: 37},
  {x: 520, y: 215, halfWidth: 42, halfHeight: 37}
];

function overlaps(x, y, radius, obstacle) {
  return Math.abs(x - obstacle.x) < obstacle.halfWidth + radius
    && Math.abs(y - obstacle.y) < obstacle.halfHeight + radius;
}

export function isBlocked(x, y, radius, baron) {
  if (x < 38 || x > 651 || y < 160 || y > 617) return true;
  if (y < 190 && x > 295 && x < 395) return true;
  const baronObstacle = {x: baron.x, y: baron.y + 6, halfWidth: 29, halfHeight: 35};
  return overlaps(x, y, radius, baronObstacle)
    || obstacles.some(obstacle => overlaps(x, y, radius, obstacle));
}

export function nearestInteraction(player, baron) {
  const baronTarget = {
    id: 'baron', x: baron.x, y: baron.y, radius: 39, title: 'The Milk Baron'
  };
  return [baronTarget, ...stations]
    .map(target => ({...target, distance: Math.hypot(player.x - target.x, player.y - target.y)}))
    .filter(target => target.distance < target.radius + 27)
    .sort((a, b) => a.distance - b.distance)[0];
}
