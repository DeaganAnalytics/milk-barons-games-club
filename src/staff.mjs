import {guardBlocks} from './guards.mjs';
import {crossesDanceArea, EAST_EDGE, guestEnclosure, guestGateInside, guestGateOutside, insideGuestEnclosure, routeAroundBaron, isNpcBlocked, NORTH_EDGE, RUGS, SOUTH_TRIM_Y, WEST_EDGE} from './room.mjs';

const uniforms = [
  {id: 'male-waiter', title: 'Waiter'},
  {id: 'female-waiter', title: 'Waitress'},
  {id: 'handlebar-waiter', title: 'Waiter'},
  {id: 'martini-waiter', title: 'Waiter'},
  {id: 'blonde-waitress', title: 'Waitress'},
  {id: 'lin-waitress', title: 'Waitress Lin'},
  {id: 'edmund-vale', title: 'Edmund Skim', sweeps: true}
];
export const staffIds = uniforms.map(({id}) => id);

const SPEED = 48;
const RADIUS = 14;
const MESSAGE = 'Not now, busy busy busy';

export function createStaff(player, baron, milo, guards, random = Math.random) {
  const occupied = [player, baron, milo, ...guards];
  const places = RUGS.map(({x, y}) => ({x, y: y + 168}))
    .filter(place => occupied.every(actor => Math.hypot(place.x - actor.x, place.y - actor.y) >= 56));
  return uniforms.map((uniform, index) => {
    // Draw without replacement so every design starts in its own part of the hall.
    const [place] = places.splice(Math.floor(random() * places.length), 1);
    return {
      ...uniform, ...place, radius: RADIUS, message: MESSAGE,
      facing: 1, target: null, pauseUntil: 1.5 + index / 6,
      walkTime: 0, idleOffset: index / 3, walking: false
    };
  });
}

function chooseTarget(member, baron, random) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const x = WEST_EDGE + 70 + random() * (EAST_EDGE - WEST_EDGE - 140);
    const y = NORTH_EDGE + 215 + random() * (SOUTH_TRIM_Y - 42 - NORTH_EDGE - 215);
    if (Math.hypot(x - member.x, y - member.y) >= 110 && !isNpcBlocked(x, y, RADIUS, baron)) {
      return {x, y};
    }
  }
  return null;
}

export function faceStaffMovement(member, dx, dy) {
  if (member.sweeps) {
    member.walkDirection = Math.abs(dy) > Math.abs(dx)
      ? (dy < 0 ? 'north' : 'south')
      : 'side';
  }
  if (Math.abs(dx) > 0.1) member.facing = Math.sign(dx);
}

export function updateStaff(staff, player, baron, guards, elapsed, dt, random = Math.random) {
  for (const member of staff) {
    if (member.serviceDuty) continue;
    member.walking = false;
    if (dt <= 0 || elapsed < member.pauseUntil || Math.hypot(member.x - player.x, member.y - player.y) < 44) continue;
    if (guestEnclosure.active && !member.guestAccess && insideGuestEnclosure(member)) {
      member.guestAccess = true;
      member.target = guestGateOutside;
      member.route = [guestGateInside, guestGateOutside];
    }
    if (!member.target) {
      member.target = chooseTarget(member, baron, random);
      member.route = member.target && crossesDanceArea(member, member.target)
        ? routeAroundBaron(member, member.target, baron) : [];
    }
    if (!member.target) {
      member.pauseUntil = elapsed + 0.75;
      continue;
    }
    const {x: targetX, y: targetY} = member.route?.[0] ?? member.target;
    const dx = targetX - member.x;
    const dy = targetY - member.y;
    const distance = Math.hypot(dx, dy);
    const step = Math.min(SPEED * dt, distance);
    const arrived = step === distance;
    const x = arrived ? targetX : member.x + dx * step / distance;
    const y = arrived ? targetY : member.y + dy * step / distance;
    if (isNpcBlocked(x, y, RADIUS, baron, member) || guardBlocks(x, y, member, guards)
        || guardBlocks(x, y, member, staff)) {
      if (!member.guestAccess) member.target = null;
      member.pauseUntil = elapsed + 0.5 + random();
      continue;
    }
    faceStaffMovement(member, x - member.x, y - member.y);
    member.x = x;
    member.y = y;
    member.walking = step > 0;
    member.walkTime += step / SPEED;
    if (arrived) {
      member.route?.shift();
      if (member.route?.length) continue;
      member.guestAccess = false;
      member.target = null;
      member.pauseUntil = elapsed + (member.sweeps ? 1.8 : 0.75) + random() * 1.5;
    }
  }
}

export function staffFrame(member, elapsed) {
  if (member.walking) {
    const column = Math.floor(member.walkTime * 1000 / 110) % 6;
    if (member.sweeps && member.walkDirection === 'north') return {column, row: 1, vertical: true};
    if (member.sweeps && member.walkDirection === 'south') return {column, row: 0, vertical: true};
    return {column, row: 0};
  }
  if (member.sweeps) return {column: Math.floor(elapsed * 8) % 6, row: 1};
  const idleTime = (elapsed + member.idleOffset) % 2.18;
  return {column: idleTime >= 1.4 && idleTime < 1.68 ? 1 : 0, row: 1};
}
