import {movePlayer} from './player.mjs';
import {partyGuests} from './party-guests.mjs';
import {ROOM_HEIGHT, ROOM_WIDTH, SOUTH_TRIM_Y, routeAroundBaron} from './room.mjs';

const speed = 125;
const escortX = Math.max(...partyGuests.map(guest => guest.x)) + ROOM_WIDTH / 2 + 34;

export function beginGuestEscort(escort, player, baron, repeat = false, destination = null) {
  escort.phase = 'walking';
  escort.guard.escorting = true;
  escort.destination = destination ?? (repeat
    ? {x: player.x + 2 * ROOM_WIDTH, y: Math.max(player.y, SOUTH_TRIM_Y - 34)}
    : {x: escortX, y: player.y});
  escort.route = routeAroundBaron(player, escort.destination, baron);
}

export function advanceGuestEscort(escort, player, baron, guards, elapsed, dt) {
  const {guard, destination, route} = escort;
  const target = route[0];
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const distance = Math.hypot(dx, dy);
  const closeGuard = Math.hypot(player.x - guard.x, player.y - guard.y) <= 58;
  const fraction = closeGuard && distance > 0 ? Math.min(1, speed * dt / distance) : 0;
  movePlayer(player, baron, dx * fraction, dy * fraction, guards.filter(candidate => candidate !== guard));
  if (closeGuard && !player.walking && distance > 1) {
    escort.route = routeAroundBaron(player, destination, baron);
  } else if (Math.hypot(target.x - player.x, target.y - player.y) <= 1) {
    route.shift();
  }

  // The guard keeps close behind Pip while the camera follows them out.
  const gap = Math.hypot(player.x - guard.x, player.y - guard.y);
  if (gap > 32) {
    const step = Math.min(gap - 32, 165 * dt);
    const facing = guard.facing;
    const target = escort.guardRoute?.[0] ?? player;
    const toTarget = Math.hypot(target.x - guard.x, target.y - guard.y);
    const move = toTarget ? Math.min(1, step / toTarget) : 0;
    movePlayer(guard, baron, (target.x - guard.x) * move, (target.y - guard.y) * move, guards);
    if (!guard.walking && toTarget > 1) escort.guardRoute = routeAroundBaron(guard, player, baron);
    else if (escort.guardRoute && Math.hypot(target.x - guard.x, target.y - guard.y) <= 1) escort.guardRoute.shift();
    guard.facing = guard.walking ? Math.round(guard.facing / 2) % 4 : facing;
  } else {
    guard.walking = false;
  }

  if (escort.route.length) return false;
  guard.escorting = false;
  guard.walking = false;
  guard.pauseUntil = elapsed + 1;
  player.walking = false;
  return true;
}

function guestRopeSegments(enclosure, foreground) {
  const {west, east, north, south, gateY, gateHalf} = enclosure;
  const openingTop = gateY - gateHalf;
  const openingBottom = gateY + gateHalf;
  return foreground
    ? [[west, south, east, south], [east, openingBottom, east, south]]
    : [[west, north, east, north], [west, north, west, south], [east, north, east, openingTop]];
}

export function guestRopesInView(enclosure, cameraX, cameraY) {
  if (!enclosure.active) return false;
  const segments = [...guestRopeSegments(enclosure, false), ...guestRopeSegments(enclosure, true)];
  return segments.some(([x1, y1, x2, y2]) =>
    Math.min(x1, x2) - 5 <= cameraX + ROOM_WIDTH && Math.max(x1, x2) + 5 >= cameraX
    && Math.min(y1, y2) - 23 <= cameraY + ROOM_HEIGHT && Math.max(y1, y2) + 3 >= cameraY);
}

export function drawGuestRopes(ctx, enclosure, foreground) {
  const posts = new Map();
  ctx.save();
  ctx.lineCap = 'round';
  for (const [x1, y1, x2, y2] of guestRopeSegments(enclosure, foreground)) {
    posts.set(x1 + ',' + y1, [x1, y1]);
    posts.set(x2 + ',' + y2, [x2, y2]);
    ctx.beginPath();
    ctx.moveTo(x1, y1 - 19);
    ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - 5, x2, y2 - 19);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#541619';
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#bd393b';
    ctx.stroke();
  }
  for (const [x, y] of posts.values()) {
    ctx.fillStyle = '#6c4929';
    ctx.beginPath();
    ctx.ellipse(x, y, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b08849';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 1);
    ctx.lineTo(x, y - 20);
    ctx.stroke();
    ctx.fillStyle = '#dfb973';
    ctx.beginPath();
    ctx.arc(x, y - 20, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
