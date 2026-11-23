import {faceStaffMovement} from './staff.mjs';
import {guardBlocks} from './guards.mjs';
import {EAST_EDGE, isBlocked, NORTH_EDGE, ROOM_HEIGHT, ROOM_WIDTH, routeAroundBaron, SOUTH_TRIM_Y, WEST_EDGE} from './room.mjs';

export const milkCalls = [
  'MILK!',
  'More milk!',
  "WHERE'S MY MILK?!",
  'MY GLASS IS HALF EMPTY! THIS IS AN OUTRAGE!',
  'I REQUIRE IMMEDIATE DAIRY ASSISTANCE!',
  'SOMEONE FETCH THE COW!',
  'MILK! MILK! MILK! MILK!'
];
const interval = 45;
const durations = {handoff: 0.65, drink: 2, windup: 0.28, toss: 0.65, sweep: 2.4};
const steering = [0, Math.PI / 5, -Math.PI / 5, Math.PI / 2.6, -Math.PI / 2.6];
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const landingX = (baron, side) => Math.max(WEST_EDGE + 56, Math.min(EAST_EDGE - 56, baron.x + side * 83));

export function createMilkService() {
  return {remaining: interval, scene: null};
}

function onscreen(member, {x, y}) {
  // Match the full sprite box so a glass cannot pop in at the edge of view.
  return member.x + 39 > x && member.x - 39 < x + ROOM_WIDTH
    && member.y + 29 > y && member.y - 67 < y + ROOM_HEIGHT;
}

function approachPoint(member, point, reach, baron, obstacles, angle) {
  for (const offset of [0, 0.6, -0.6, 1.2, -1.2, Math.PI / 2, -Math.PI / 2, Math.PI]) {
    const x = point.x + Math.cos(angle + offset) * reach;
    const y = point.y + Math.sin(angle + offset) * reach;
    if (!isBlocked(x, y, member.radius, baron)
        && obstacles.every(other => other === member || distance({x, y}, other) >= member.radius + other.radius)) {
      return {x, y};
    }
  }
}

export function runServiceStaff(member, target, baron, obstacles, dt) {
  const remaining = distance(member, target);
  if (remaining < 2) return 'arrived';
  const stride = Math.min(210 * dt, remaining);
  const heading = Math.atan2(target.y - member.y, target.x - member.x);
  for (const offset of steering) {
    const dx = Math.cos(heading + offset) * stride;
    const dy = Math.sin(heading + offset) * stride;
    const x = member.x + dx;
    const y = member.y + dy;
    if (isBlocked(x, y, member.radius, baron, member)
        || guardBlocks(x, y, member, obstacles)) continue;
    member.x = x;
    member.y = y;
    faceStaffMovement(member, dx, dy);
    member.walkTime += dt * 1.75;
    member.walking = true;
    return offset === 0 && stride === remaining ? 'arrived' : 'moving';
  }
  member.walking = false;
  return 'blocked';
}

function sendTo(scene, phase, member, point, reach, baron, obstacles) {
  scene.phase = phase;
  scene.time = 0;
  // Stage the handoff at the Baron's side so both actors and the glass are visible.
  const angle = phase === 'delivery'
    ? Math.atan2(Math.sign(member.y - point.y) * 0.24, scene.side)
    : Math.atan2(member.y - point.y, member.x - point.x);
  scene.target = approachPoint(member, point, reach, baron, obstacles, angle)
    ?? approachPoint(member, point, reach, baron, [], angle) ?? point;
  scene.route = routeAroundBaron(member, scene.target, baron);
  scene.blocked = 0;
  member.serviceDuty = true;
  member.target = null;
}

function enter(scene, phase) {
  scene.phase = phase;
  scene.time = 0;
}

export function updateMilkService(service, baron, staff, guards, camera, elapsed, dt, traveling, random = Math.random) {
  for (const member of staff) {
    if (member.withoutMilk && !member.serviceDuty && !onscreen(member, camera)) {
      member.withoutMilk = false;
    }
  }
  if (dt <= 0) return;

  if (!service.scene) {
    if (traveling || baron.route.length) return;
    service.remaining = Math.max(0, service.remaining - dt);
    if (service.remaining > 1e-6) return;
    const cleaner = staff.find(member => member.sweeps);
    const server = staff.filter(member => !member.sweeps && !member.withoutMilk && !member.serviceDuty)
      .reduce((closest, member) => !closest || distance(member, baron) < distance(closest, baron) ? member : closest, null);
    if (!server || !cleaner) return;

    const speech = {text: milkCalls[Math.floor(random() * milkCalls.length)], visibleSince: elapsed};
    const side = server.x < baron.x ? -1 : 1;
    const scene = service.scene = {
      server, cleaner, speech, side,
      spill: {
        x: landingX(baron, side),
        y: Math.max(NORTH_EDGE + 205, Math.min(SOUTH_TRIM_Y - 40, baron.y + 23))
      }
    };
    baron.speech = speech;
    baron.offscreenSince = null;
    baron.facing = 0;
    baron.walking = false;
    baron.stride = 0;
    sendTo(scene, 'delivery', server, baron, 57, baron, [...staff, ...guards]);
    return;
  }

  const scene = service.scene;
  scene.time += dt;
  if (baron.speech === scene.speech && elapsed - scene.speech.visibleSince >= 4) baron.speech = null;
  if (scene.phase === 'delivery' || scene.phase === 'cleanup-run') {
    const delivery = scene.phase === 'delivery';
    const member = delivery ? scene.server : scene.cleaner;
    const point = delivery ? baron : scene.spill;
    const obstacles = scene.blocked > 1.2 ? [] : [...staff, ...guards];
    const waypoint = scene.route[0];
    const previous = distance(member, waypoint);
    const result = runServiceStaff(member, waypoint, baron, obstacles, dt);
    if (result === 'arrived') {
      scene.route.shift();
      scene.blocked = 0;
      if (scene.route.length) return;
      member.walking = false;
      if (delivery) {
        scene.side = member.x < baron.x ? -1 : 1;
        scene.spill.x = landingX(baron, scene.side);
        member.facing = -scene.side;
        member.withoutMilk = true;
      } else {
        member.facing = point.x < member.x ? -1 : 1;
      }
      enter(scene, delivery ? 'handoff' : 'sweep');
    } else if (result === 'blocked' || previous - distance(member, waypoint) < dt * 30) {
      scene.blocked += dt;
      if (scene.blocked > 1.8) {
        scene.route = routeAroundBaron(member, scene.target, baron);
        scene.blocked = 0;
      }
    }
    return;
  }

  if (scene.time < durations[scene.phase]) return;
  if (scene.phase === 'handoff') {
    scene.server.serviceDuty = false;
    enter(scene, 'drink');
  } else if (scene.phase === 'drink') {
    enter(scene, 'windup');
  } else if (scene.phase === 'windup') {
    enter(scene, 'toss');
  } else if (scene.phase === 'toss') {
    sendTo(scene, 'cleanup-run', scene.cleaner, scene.spill, 24, baron, [...staff, ...guards]);
  } else if (scene.phase === 'sweep') {
    scene.cleaner.serviceDuty = false;
    service.scene = null;
    service.remaining = interval;
  }
}

export function milkProgress(scene) {
  return Math.min(1, scene.time / durations[scene.phase]);
}
