import {facingIndex, TURN} from './directions.mjs';
import {guardBlocks} from './guards.mjs';
import {isNpcBlocked, routeAroundBaron} from './room.mjs';
import {faceStaffMovement} from './staff.mjs';

const exchanges = [
  ['Nice!', 'Thanks... I think.', 'thinking'],
  ['You absolute legend!', 'Wait, how do you know?', 'sorry'],
  ['A man of exceptional talent, I see!', 'It was mostly a financial transaction.', 'worried'],
  ['Respect, brother. Respect.', 'Does everyone in this place know?!', 'alarmed'],
  ['Not bad for a peasant!', 'Can everyone please stop congratulating me?!', 'exasperated']
];
const waiters = new Set(['male-waiter', 'handlebar-waiter', 'martini-waiter']);
const stepLength = 14; // Half of Pip's 28-unit walk cycle.
const speakingDistance = 60;
const approachSpeed = 104;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function approach(actor, participant, player, baron, crowd, dt) {
  actor.walking = false;
  if (!participant.destination || distance(participant.destination, player) >= 28 || !participant.route.length) {
    participant.destination = {x: player.x, y: player.y};
    const spots = [[-46, 0], [46, 0], [0, -46], [0, 46]]
      .map(([dx, dy]) => ({x: player.x + dx, y: player.y + dy}))
      .filter(spot => !isNpcBlocked(spot.x, spot.y, actor.radius, baron))
      .sort((a, b) => distance(a, actor) - distance(b, actor));
    participant.route = spots.length ? routeAroundBaron(actor, spots[0], baron) : [];
  }
  const target = participant.route[0];
  if (!target) return;
  const remaining = distance(actor, target);
  const step = Math.min(remaining, approachSpeed * dt);
  if (!step) {
    if (!remaining) participant.route.shift();
    return;
  }
  const angle = Math.atan2(target.y - actor.y, target.x - actor.x);
  for (const offset of [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2]) {
    const dx = Math.cos(angle + offset) * step;
    const dy = Math.sin(angle + offset) * step;
    const x = actor.x + dx;
    const y = actor.y + dy;
    if (isNpcBlocked(x, y, actor.radius, baron, actor) || guardBlocks(x, y, actor, crowd)) continue;
    if (offset === 0 && remaining <= step) participant.route.shift();
    Object.assign(actor, {x, y, walking: true});
    if (participant.waiter) {
      faceStaffMovement(actor, dx, dy);
      actor.walkTime += step / approachSpeed;
    } else {
      actor.facing = Math.round(facingIndex(dx, dy) / 2) % 4;
      actor.stride = (actor.stride + step * TURN / 25) % TURN;
    }
    return;
  }
  participant.destination = null;
}

export function createSlotReactions(staff, guards) {
  const queue = [];
  let event;

  return {
    queue(player, executive) {
      queue.push({executive, triggerDistance: distance(player, executive) + 10 * stepLength});
    },
    update(player, baron, dt) {
      event ??= queue.shift();
      if (!event) return;
      if (!event.participants) {
        if (!player.walking || distance(player, event.executive) < event.triggerDistance) return;
        event.participants = new Map([
          ...staff.filter(actor => waiters.has(actor.id)).map(actor => [actor, {waiter: true}]),
          ...guards.filter(actor => !actor.posted).map(actor => [actor, {waiter: false}])
        ]);
        event.delivered = 0;
      }

      const crowd = [...staff, ...guards];
      let arrival;
      for (const [actor, participant] of event.participants) {
        const busy = participant.waiter
          ? (!participant.claimed && (actor.serviceDuty || actor.guestAccess))
          : (actor.pursuit || actor.poolWatch || actor.poolReportPending || actor.escorting);
        if (busy) continue;
        participant.claimed = true;
        if (participant.waiter) actor.serviceDuty = true;
        else actor.slotReaction = true;
        if (distance(actor, player) > speakingDistance) approach(actor, participant, player, baron, crowd, dt);
        const gap = distance(actor, player);
        if (gap <= speakingDistance && (!arrival || gap < distance(arrival[0], player))) arrival = [actor, participant];
      }
      if (!arrival) {
        if (!event.participants.size) event = null;
        return;
      }
      const [actor, participant] = arrival;
      const [text, response, playerMood] = exchanges[event.delivered++];
      const slotReaction = {text, response, playerMood};
      event.participants.delete(actor);
      if (!event.participants.size) event = null;
      actor.walking = false;
      if (participant.waiter) actor.serviceDuty = false;
      else actor.slotReaction = false;
      return participant.waiter
        ? {id: actor.id, title: actor.title, withoutMilk: actor.withoutMilk, slotReaction}
        : {id: 'guard', title: 'Bull Guard', slotReaction};
    }
  };
}
