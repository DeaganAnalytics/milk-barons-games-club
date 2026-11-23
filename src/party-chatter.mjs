import {runServiceStaff} from './milk-service.mjs';
import {partyGuests} from './party-guests.mjs';
import {ROOM_HEIGHT, ROOM_WIDTH, routeAroundBaron} from './room.mjs';

const exchanges = [
  [[0, 'Oh I just I LOVE milk!'], [1, "It's the best!"]],
  [[0, 'You look amazing darling.'], [1, 'The secret is a milk only diet.']],
  [[1, 'The Baron is a handsome fellow.'], [0, 'I heard he is single.'], [1, 'Oh my.']],
  [[0, 'Why do we let peasants have milk?'], [1, 'Its a travesty. Something must be done!']],
  [[1, 'My milk investments returned 17%.'], [0, 'Only? Those peasants need to work harder!']],
  [[0, 'Is that weird man looking at us?'], [1, "Don't make eye contact."]],
  [[0, 'I dreamt I was the Milk Baroness!'], [1, 'Tell me more!']]
];
const [left, right] = partyGuests;
const serviceSpot = {x: (left.x + right.x) / 2, y: left.y - 36};
const pourDuration = 1.45;
const restBetweenExchanges = 2.5;
const lineDuration = text => Math.max(2, 1.1 + text.length / 20);

export function createPartyChatter() {
  return {
    remaining: 0.8, order: [], lastExchange: null, exchange: null, line: 0,
    completed: 0, milk: [0.85, 0.85], refill: null
  };
}

function guestsVisible(camera) {
  return left.x >= camera.x && right.x <= camera.x + ROOM_WIDTH
    && left.y - 66 >= camera.y && left.y <= camera.y + ROOM_HEIGHT;
}

export function partySpeech(chatter, camera) {
  if (!chatter.exchange || !guestsVisible(camera)) return null;
  const [speaker, text] = chatter.exchange[chatter.line];
  const fade = Math.min(1, (lineDuration(text) - chatter.remaining) / 0.22, chatter.remaining / 0.28);
  return {guest: partyGuests[speaker], text, opacity: Math.max(0, fade)};
}

function nextExchange(chatter, random) {
  if (!chatter.order.length) {
    chatter.order = [...exchanges];
    for (let i = chatter.order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [chatter.order[i], chatter.order[j]] = [chatter.order[j], chatter.order[i]];
    }
    // Avoid repeating the last exchange across the shuffle boundary.
    if (chatter.order.at(-1) === chatter.lastExchange) {
      const last = chatter.order.length - 1;
      [chatter.order[0], chatter.order[last]] = [chatter.order[last], chatter.order[0]];
    }
  }
  chatter.lastExchange = chatter.exchange = chatter.order.pop();
  chatter.line = 0;
}

function updateRefill(chatter, staff, baron, guards, elapsed, dt) {
  if (!chatter.refill) {
    const distance = member => Math.hypot(member.x - serviceSpot.x, member.y - serviceSpot.y);
    const server = staff.filter(member => !member.sweeps && !member.serviceDuty && !member.withoutMilk)
      .reduce((closest, member) => !closest || distance(member) < distance(closest) ? member : closest, null);
    if (!server) return;
    server.serviceDuty = true;
    server.target = null;
    chatter.refill = {server, route: routeAroundBaron(server, serviceSpot, baron), blocked: 0, pour: 0, guest: 0};
  }
  const refill = chatter.refill;
  const {server, route} = refill;
  if (route.length) {
    const waypoint = route[0];
    const before = Math.hypot(server.x - waypoint.x, server.y - waypoint.y);
    const obstacles = refill.blocked > 1.2 ? [] : [...staff, ...guards];
    if (runServiceStaff(server, waypoint, baron, obstacles, dt) === 'arrived') {
      route.shift();
      refill.blocked = 0;
      if (!route.length) {
        server.walking = false;
        server.facing = -1;
      }
    } else if (before - Math.hypot(server.x - waypoint.x, server.y - waypoint.y) < dt * 30) {
      refill.blocked += dt;
      if (refill.blocked > 2) {
        refill.route = routeAroundBaron(server, serviceSpot, baron);
        refill.blocked = 0;
      }
    }
    return;
  }

  refill.pour += dt;
  if (refill.pour < pourDuration) return;
  chatter.milk[refill.guest] = 0.85;
  if (refill.guest === 0) {
    refill.guest = 1;
    refill.pour = 0;
    server.facing = 1;
  } else {
    server.serviceDuty = false;
    server.pauseUntil = elapsed + 0.5;
    chatter.refill = null;
    chatter.completed = 0;
  }
}

export function updatePartyChatter(chatter, camera, staff, baron, guards, elapsed, dt, random = Math.random) {
  if (dt <= 0) return;
  if (chatter.completed === 4) {
    updateRefill(chatter, staff, baron, guards, elapsed, dt);
    return;
  }
  if (!guestsVisible(camera)) return;

  chatter.remaining -= dt;
  if (chatter.remaining > 0) return;
  if (!chatter.exchange) nextExchange(chatter, random);
  else if (++chatter.line === chatter.exchange.length) {
    chatter.exchange = null;
    chatter.completed++;
    chatter.milk = chatter.milk.map(level => Math.max(0.18, level - 0.16));
    chatter.remaining = restBetweenExchanges;
    return;
  }
  chatter.remaining = lineDuration(chatter.exchange[chatter.line][1]);
}

export function refillProgress(refill) {
  return refill.pour / pourDuration;
}
