import {facingIndex, TURN} from './directions.mjs';
import {guestEnclosure, isNpcBlocked, routeAroundBaron} from './room.mjs';

const stepDistance = 12;
const warningRadius = 5 * stepDistance;
const warnings = [
  "Sir please step at least 5 steps away from the rope or I'll shoot.",
  'Sir I am warning you I will shoot!',
  'Sir this is your final warning. Leave now.'
];
const guestReactions = [null, "Oh maybe we'll get a live show!", 'Darling get ready for some entertainment'];
const warningDuration = 3;
export const GUARD_AIM_TIME = 0.65;
const fallTime = 2.2;

export function createRopeWarning() {
  return {talks: 0, warnings: 0, nearTime: 0, countdown: null, scene: null};
}

function distanceToRope({x, y}) {
  const {west, east, north, south} = guestEnclosure;
  // The opening counts as part of the boundary for warnings.
  if (x >= west && x <= east && y >= north && y <= south) {
    return Math.min(x - west, east - x, y - north, south - y);
  }
  return Math.hypot(Math.max(west - x, 0, x - east), Math.max(north - y, 0, y - south));
}

export function updateRopeWarning(state, player, dt) {
  if (!guestEnclosure.active || state.talks < 2 || state.scene) return false;
  if (distanceToRope(player) > warningRadius) {
    state.nearTime = 0;
    state.countdown = null;
    return false;
  }
  if (state.warnings === warnings.length && state.countdown === null) return true;
  if (state.countdown !== null) {
    state.countdown += dt;
    return state.countdown >= warningDuration + 5;
  }
  state.nearTime += dt;
  if (state.nearTime > 3) {
    state.warnings++;
    state.countdown = 0;
  }
  return false;
}

export function ropeWarningSpeech(state) {
  if (state.countdown === null || state.scene) return null;
  if (state.countdown < warningDuration) {
    return {text: warnings[state.warnings - 1], guest: guestReactions[state.warnings - 1]};
  }
  const number = 5 - Math.floor(state.countdown - warningDuration);
  return number > 0 ? {text: String(number), guest: null} : null;
}

export function beginRopeScene(state, guard, player, baron, {deathMessage, celebrate = true} = {}) {
  const side = Math.sign(guard.x - player.x) || 1;
  const candidates = [[side, 0], [-side, 0], [0, -1], [0, 1]].map(([dx, dy]) =>
    ({x: player.x + dx * warningRadius, y: player.y + dy * warningRadius}));
  const destination = candidates.find(point => !isNpcBlocked(point.x, point.y, guard.radius, baron)) ??
    {x: guard.x, y: guard.y};
  state.countdown = null;
  state.scene = {
    guard, route: routeAroundBaron(guard, destination, baron),
    phase: 'approach', time: 0, deathMessage, celebrate
  };
  player.walking = false;
}

export function advanceRopeScene(scene, player, dt) {
  const {guard, route} = scene;
  scene.time += dt;
  if (scene.phase === 'approach') {
    const target = route[0];
    const dx = target.x - guard.x;
    const dy = target.y - guard.y;
    const distance = Math.hypot(dx, dy);
    const acceleration = Math.min(1, scene.time / 0.2);
    const braking = route.length === 1 ? Math.min(1, Math.sqrt(distance / 36)) : 1;
    const speed = Math.max(45, 240 * Math.min(acceleration, braking));
    const step = Math.min(distance, speed * dt);
    if (step > 0) {
      guard.x += dx * step / distance;
      guard.y += dy * step / distance;
      guard.facing = Math.round(facingIndex(dx, dy) / 2) % 4;
      guard.stride = (guard.stride + step * TURN / 25) % TURN;
      guard.walking = true;
    }
    if (step === distance) {
      guard.x = target.x;
      guard.y = target.y;
      route.shift();
    }
    if (!route.length) {
      scene.incomingFacing = guard.facing;
      guard.facing = player.x >= guard.x ? 1 : 3;
      guard.walking = false;
      scene.phase = 'aim';
      scene.time = 0;
    }
  } else if (scene.phase === 'aim' && scene.time >= GUARD_AIM_TIME) {
    scene.phase = 'fall';
    scene.time -= GUARD_AIM_TIME;
  } else if (scene.phase === 'fall' && scene.time >= fallTime) {
    scene.phase = 'over';
  }
  return scene.phase === 'over';
}
