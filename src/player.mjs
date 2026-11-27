import {guardBlocks} from './guards.mjs';
import {facingIndex, TURN} from './directions.mjs';
import {HALL_CENTER, isBlocked, onDanceFloor} from './room.mjs';

export function createPlayer() {
  return {x: HALL_CENTER.x + 5, y: HALL_CENTER.y + 228, speed: 124, radius: 13, facing: 0, stride: 0, walking: false, danceIdle: 0};
}

export function updatePlayer(player, baron, {dx, dy}, dt, guards = [], npcs = []) {
  const step = player.speed * dt * (dx && dy ? Math.SQRT1_2 : 1);
  movePlayer(player, baron, dx * step, dy * step, guards, npcs);
  player.danceIdle = dx || dy || !onDanceFloor(player.x, player.y) ? 0 : player.danceIdle + dt;
}

function npcBlocks(x, y, player, npcs) {
  const clamp = (value, a, b) => Math.max(Math.min(a, b), Math.min(Math.max(a, b), value));
  return npcs.some(npc => {
    if (npc.id === 'elias') return false;
    const radius = player.radius + 12;
    const startDistance = Math.hypot(player.x - npc.x, player.y - npc.y);
    const closest = Math.hypot(clamp(npc.x, player.x, x) - npc.x, clamp(npc.y, player.y, y) - npc.y);
    // If a scripted actor has overlapped Pip, allow him to move out of the overlap.
    return closest < radius && (startDistance >= radius || closest < startDistance);
  });
}

export function movePlayer(player, baron, dx, dy, guards = [], npcs = []) {
  if (dx || dy) {
    player.facing = facingIndex(dx, dy);
    player.danceIdle = 0;
  }
  const startX = player.x;
  const startY = player.y;
  if (!isBlocked(player.x + dx, player.y, player.radius, baron, player)
      && !guardBlocks(player.x + dx, player.y, player, guards)
      && !npcBlocks(player.x + dx, player.y, player, npcs)) player.x += dx;
  if (!isBlocked(player.x, player.y + dy, player.radius, baron, player)
      && !guardBlocks(player.x, player.y + dy, player, guards)
      && !npcBlocks(player.x, player.y + dy, player, npcs)) player.y += dy;

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
