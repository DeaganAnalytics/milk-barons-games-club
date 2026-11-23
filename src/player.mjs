import {facingIndex, TURN} from './directions.mjs';
import {CENTER_RUG, isBlocked} from './room.mjs';

export function createPlayer() {
  return {x: CENTER_RUG.x + 5, y: CENTER_RUG.y + 228, speed: 112, radius: 13, facing: 0, stride: 0, walking: false};
}

export function updatePlayer(player, baron, {dx, dy}, dt) {
  const step = player.speed * dt * (dx && dy ? Math.SQRT1_2 : 1);
  movePlayer(player, baron, dx * step, dy * step);
}

export function movePlayer(player, baron, dx, dy) {
  if (dx || dy) player.facing = facingIndex(dx, dy);
  const startX = player.x;
  const startY = player.y;
  if (!isBlocked(player.x + dx, player.y, player.radius, baron, player)) player.x += dx;
  if (!isBlocked(player.x, player.y + dy, player.radius, baron, player)) player.y += dy;

  const distance = Math.hypot(player.x - startX, player.y - startY);
  player.walking = distance > 0;
  if (player.walking) {
    player.facing = facingIndex(player.x - startX, player.y - startY);
    player.stride = (player.stride + distance * TURN / 28) % TURN;
  } else {
    player.stride = 0;
  }
}
