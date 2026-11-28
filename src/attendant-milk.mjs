import {emptyStaffGlass} from './staff.mjs';
import {runServiceStaff} from './milk-service.mjs';
import {isNpcBlocked, PILLORY_ATTENDANT, routeAroundBaron} from './room.mjs';

const interval = 60;
const durations = {handoff: 0.65, drink: 1.8, returnGlass: 0.65};
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const byDistance = origin => (a, b) => distance(origin, a) - distance(origin, b);

export function createAttendantMilk() {
  return {remaining: interval, scene: null};
}

export function updateAttendantMilk(service, baron, staff, guards, camera, dt) {
  if (dt <= 0) return;
  service.remaining = Math.max(0, service.remaining - dt);
  if (!service.scene) {
    if (service.remaining > 1e-6) return;
    const server = staff.filter(member => !member.sweeps && !member.departing && !member.serviceDuty && !member.guestAccess && !member.withoutMilk)
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
  if (phase === 'delivery') {
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
    emptyStaffGlass(server);
    server.serviceDuty = false;
    service.scene = null;
  }
}

export function attendantMilkProgress(scene) {
  return Math.min(1, scene.time / durations[scene.phase]);
}
