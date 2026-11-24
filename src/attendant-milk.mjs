import {runServiceStaff, serviceStaffOnscreen} from './milk-service.mjs';
import {EAST_EDGE, isNpcBlocked, NORTH_EDGE, PILLORY_ATTENDANT, ROOM_HEIGHT, ROOM_WIDTH,
  routeAroundBaron, SOUTH_TRIM_Y, WEST_EDGE} from './room.mjs';

const interval = 60;
const durations = {handoff: 0.65, drink: 1.8, returnGlass: 0.65};
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const byDistance = origin => (a, b) => distance(origin, a) - distance(origin, b);

export function createAttendantMilk() {
  return {remaining: interval, scene: null};
}

function exitPoint(server, camera, baron) {
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const x = clamp(server.x, WEST_EDGE + 50, EAST_EDGE - 50);
  const y = clamp(server.y, NORTH_EDGE + 175, SOUTH_TRIM_Y - 30);
  return [
    {x: camera.x - 55, y}, {x: camera.x + ROOM_WIDTH + 55, y},
    {x, y: camera.y - 45}, {x, y: camera.y + ROOM_HEIGHT + 80}
  ].filter(point => !serviceStaffOnscreen(point, camera) && !isNpcBlocked(point.x, point.y, server.radius, baron))
    .sort(byDistance(server))[0];
}

export function updateAttendantMilk(service, baron, staff, guards, camera, dt) {
  if (dt <= 0) return;
  service.remaining = Math.max(0, service.remaining - dt);
  if (!service.scene) {
    if (service.remaining > 1e-6) return;
    const server = staff.filter(member => !member.sweeps && !member.serviceDuty && !member.guestAccess && !member.withoutMilk)
      .sort(byDistance(PILLORY_ATTENDANT))[0];
    if (!server) return;
    const point = [-1, 1].map(side => ({x: PILLORY_ATTENDANT.x + side * 48, y: PILLORY_ATTENDANT.y + 10}))
      .filter(({x, y}) => !isNpcBlocked(x, y, server.radius, baron)).sort(byDistance(server))[0];
    if (!point) return;
    server.serviceDuty = true;
    server.target = null;
    server.route = [];
    service.scene = {server, phase: 'delivery', time: 0, blocked: 0,
      point, route: routeAroundBaron(server, point, baron)};
    service.remaining = interval;
    return;
  }

  const scene = service.scene;
  const {server, phase} = scene;
  scene.time += dt;
  if (phase === 'delivery' || phase === 'leave') {
    if (phase === 'leave') {
      if (!serviceStaffOnscreen(server, camera)) {
        server.withoutMilk = false;
        server.emptyServiceGlass = false;
        server.serviceDuty = false;
        service.scene = null;
        return;
      }
      if (!scene.point || serviceStaffOnscreen(scene.point, camera)) {
        scene.point = exitPoint(server, camera, baron);
        scene.route = scene.point ? routeAroundBaron(server, scene.point, baron) : [];
      }
    }
    // Release a stuck server. On the way out, wandering can finish the offscreen refill.
    if (!scene.route.length || scene.time >= 35) {
      server.serviceDuty = false;
      service.scene = null;
      return;
    }
    const waypoint = scene.route[0];
    const previous = distance(server, waypoint);
    const result = runServiceStaff(server, waypoint, baron, scene.blocked > 0.8 ? [] : [...staff, ...guards], dt);
    if (result === 'arrived') {
      scene.route.shift();
      scene.blocked = 0;
      if (!scene.route.length && phase === 'delivery') {
        server.walking = false;
        server.facing = Math.sign(PILLORY_ATTENDANT.x - server.x);
        server.withoutMilk = true;
        scene.phase = 'handoff';
        scene.time = 0;
      }
    } else if (result === 'blocked' || previous - distance(server, waypoint) < dt * 30) {
      scene.blocked += dt;
      if (scene.blocked > 2) {
        scene.route = routeAroundBaron(server, scene.point, baron);
        scene.blocked = 0;
      }
    }
    return;
  }

  if (scene.time < durations[phase]) return;
  scene.time = 0;
  if (phase === 'handoff') scene.phase = 'drink';
  else if (phase === 'drink') scene.phase = 'returnGlass';
  else {
    server.emptyServiceGlass = true;
    scene.phase = 'leave';
    scene.point = null;
    scene.route = [];
  }
}

export function attendantMilkProgress(scene) {
  return Math.min(1, scene.time / durations[scene.phase]);
}
