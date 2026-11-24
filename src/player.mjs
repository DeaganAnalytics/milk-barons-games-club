import {guardBlocks} from './guards.mjs';
import {facingIndex, TURN} from './directions.mjs';
import {HALL_CENTER, isBlocked, onDanceFloor} from './room.mjs';

export function createPlayer() {
  return {x: HALL_CENTER.x + 5, y: HALL_CENTER.y + 228, speed: 124, radius: 13, facing: 0, stride: 0, walking: false, danceIdle: 0};
}

export function updatePlayer(player, baron, {dx, dy}, dt, guards = []) {
  const step = player.speed * dt * (dx && dy ? Math.SQRT1_2 : 1);
  movePlayer(player, baron, dx * step, dy * step, guards);
  player.danceIdle = dx || dy || !onDanceFloor(player.x, player.y) ? 0 : player.danceIdle + dt;
}

export function movePlayer(player, baron, dx, dy, guards = []) {
  if (dx || dy) {
    player.facing = facingIndex(dx, dy);
    player.danceIdle = 0;
  }
  const startX = player.x;
  const startY = player.y;
  if (!isBlocked(player.x + dx, player.y, player.radius, baron, player)
      && !guardBlocks(player.x + dx, player.y, player, guards)) player.x += dx;
  if (!isBlocked(player.x, player.y + dy, player.radius, baron, player)
      && !guardBlocks(player.x, player.y + dy, player, guards)) player.y += dy;

  const distance = Math.hypot(player.x - startX, player.y - startY);
  player.walking = distance > 0;
  if (player.walking) {
    player.facing = facingIndex(player.x - startX, player.y - startY);
    player.stride = (player.stride + distance * TURN / 28) % TURN;
  } else {
    player.stride = 0;
  }
}

export function takeDanceExit(player) {
  if (player.danceExitHandled) return false;
  if (onDanceFloor(player.x, player.y)) {
    if (player.danceIdle > 3) player.dancedThisVisit = true;
    return false;
  }
  if (!player.dancedThisVisit) return false;
  player.danceExitHandled = true;
  return true;
}
