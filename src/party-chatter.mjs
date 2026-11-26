import {runServiceStaff} from './milk-service.mjs';
import {partyGuests} from './party-guests.mjs';
import {guestEnclosure, guestGateInside, guestGateOutside, insideGuestEnclosure, ROOM_HEIGHT, ROOM_WIDTH, routeAroundBaron} from './room.mjs';

const exchanges = [
  [[0, 'Oh, I just ADORE milk!'], [1, "Darling, it's simply divine!"]],
  [[0, 'Your complexion is positively radiant, darling.'],
    [1, 'The secret is a strict milk-only diet. Not a drop of water!']],
  [[1, 'The Milk Baron is such a handsome fellow.'], [0, "I hear he's swimming in milk. And single!"], [1, 'Oh my!']],
  [[0, 'Why do we allow peasants to drink milk?'], [1, "It's a travesty! They'll be demanding cream next!"]],
  [[1, 'My dairy investments returned seventeen percent!'], [0, 'Only? Those cows need to work harder!']],
  [[0, 'Is that strange man staring at us?'], [1, "Don't make eye contact. He looks lactose intolerant."]],
  [[0, 'I dreamt I was the Milk Baroness!'], [1, 'Tell me everything! Was the throne made of cheese?']],
  [[0, 'Have you heard? The peasants are running out of milk!'], [1, 'How dreadful! What will they put in our tea?']],
  [[1, 'I only drink milk from cows with pedigrees.'], [0, 'Naturally. Common cows produce common milk.']],
  [[0, 'The Baron donated a whole glass of milk to charity!'], [1, 'Such generosity! He truly is a man of the people.']],
  [[1, 'Did you hear about Lady Butterworth?'], [0, "Don't tell me. Skim milk?"], [1, 'Worse. Oat milk!']],
  [[0, 'The price of milk has doubled again!'], [1, 'Wonderful! The Baron must be doing splendidly!']]
];
const enclosedExchanges = [
  [[0, 'The Baron is simply marvellous. These security arrangements are impeccable!'],
    [1, 'Naturally, the cream of society deserves the finest protection.']],
  [[0, "Aren't these velvet ropes simply beautiful?"],
    [1, 'They must have cost a fortune. Thank goodness for taxpayers!']],
  [[1, 'Finally, something to keep the riff-raff away!'],
    [0, 'The Baron works remarkably fast when his milk is threatened.']],
  [[1, 'That peasant was positively revolting. I bet he bathes in water, not milk.'],
    [0, 'Good heavens! How was such a creature permitted entry?']],
  [[0, 'I feel considerably safer with an armed guard protecting us.'],
    [1, "An astute summation of my feelings, darling. One can finally enjoy one's milk in peace."]]
];
const [left, right] = partyGuests;
const serviceSpot = {x: (left.x + right.x) / 2, y: left.y - 36};
const pourDuration = 1.45;
const restBetweenExchanges = 2.5;
const lineDuration = text => Math.max(2, 1.1 + text.length / 20);

export function createPartyChatter() {
  return {
    remaining: 0.8, order: [], lastExchange: null, exchange: null, line: 0,
    enclosed: false, completed: 0, milk: [0.85, 0.85], refill: null
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
    chatter.order = chatter.enclosed ? [...exchanges, ...enclosedExchanges] : [...exchanges];
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

function routeToGuests(server, baron) {
  if (!guestEnclosure.active) return routeAroundBaron(server, serviceSpot, baron);
  server.guestAccess = true;
  if (insideGuestEnclosure(server)) return [serviceSpot];
  return [...routeAroundBaron(server, guestGateOutside, baron), guestGateInside, serviceSpot];
}

function routeOutOfGuests(server) {
  // Once aligned at the opening, keep heading east even if the route is recalculated.
  const atOpening = server.x >= guestGateInside.x - 1 && Math.abs(server.y - guestEnclosure.gateY) < 1;
  return atOpening ? [guestGateOutside] : [guestGateInside, guestGateOutside];
}

function updateRefill(chatter, staff, baron, guards, elapsed, dt) {
  if (!chatter.refill) {
    const distance = member => Math.hypot(member.x - serviceSpot.x, member.y - serviceSpot.y);
    const server = staff.filter(member => !member.sweeps && !member.departing && !member.serviceDuty && !member.withoutMilk)
      .reduce((closest, member) => !closest || distance(member) < distance(closest) ? member : closest, null);
    if (!server) return;
    server.serviceDuty = true;
    server.target = null;
    chatter.refill = {server, route: routeToGuests(server, baron), enclosed: guestEnclosure.active, blocked: 0, pour: 0, guest: 0};
  }
  const refill = chatter.refill;
  const {server} = refill;
  if (guestEnclosure.active && !refill.enclosed) {
    refill.enclosed = true;
    server.guestAccess = true;
    if (refill.route.length) refill.route = routeToGuests(server, baron);
  }
  const {route} = refill;
  if (route.length) {
    const waypoint = route[0];
    const before = Math.hypot(server.x - waypoint.x, server.y - waypoint.y);
    const obstacles = refill.blocked > 1.2 ? [] : [...staff, ...guards];
    const crossing = waypoint === guestGateInside || (refill.exiting && waypoint === guestGateOutside);
    if (runServiceStaff(server, waypoint, baron, obstacles, dt, crossing) === 'arrived') {
      route.shift();
      refill.blocked = 0;
      if (!route.length) {
        server.walking = false;
        server.facing = -1;
        if (refill.exiting) {
          server.guestAccess = false;
          server.serviceDuty = false;
          server.pauseUntil = elapsed + 0.5;
          chatter.refill = null;
          chatter.completed = 0;
        }
      }
    } else if (before - Math.hypot(server.x - waypoint.x, server.y - waypoint.y) < dt * 30) {
      refill.blocked += dt;
      if (refill.blocked > 2) {
        refill.route = refill.exiting ? routeOutOfGuests(server) : routeToGuests(server, baron);
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
  } else if (guestEnclosure.active) {
    refill.exiting = true;
    refill.route = routeOutOfGuests(server);
  } else {
    server.serviceDuty = false;
    server.pauseUntil = elapsed + 0.5;
    chatter.refill = null;
    chatter.completed = 0;
  }
}

export function updatePartyChatter(chatter, camera, staff, baron, guards, elapsed, dt, random = Math.random) {
  if (dt <= 0) return;
  if (guestEnclosure.active && !chatter.enclosed) {
    chatter.enclosed = true;
    chatter.order = [...enclosedExchanges].reverse();
    chatter.exchange = null;
    chatter.remaining = 0.8;
  }
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
