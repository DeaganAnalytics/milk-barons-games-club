import {facingIndex, TURN} from './directions.mjs';
import {MILK_BAG_BASKET, PILLORY, PILLORY_ATTENDANT, routeAroundBaron} from './room.mjs';

const pickup = {x: MILK_BAG_BASKET.x + 37, y: MILK_BAG_BASKET.y + 25};
const basket = {x: MILK_BAG_BASKET.x + 13, y: MILK_BAG_BASKET.y - 18};
const target = {x: PILLORY.x, y: PILLORY.y - 39};
const release = 0.38;
const impact = 0.9;

export function createMilkBalloon(player, baron) {
  return {phase: 'approach', time: 0, route: routeAroundBaron(player, pickup, baron)};
}

export function createAttendantThrow() {
  return {
    phase: 'approach', time: 0, route: [pickup],
    attendant: {...PILLORY_ATTENDANT, facing: 0, stride: 0, walking: false}
  };
}

const leadSpot = {x: pickup.x + 60, y: pickup.y + 15};
const guardWait = {x: pickup.x + 35, y: pickup.y + 35};
const returnSpot = {x: leadSpot.x + 25, y: leadSpot.y - 15};

export function createPilloryReportScene(player, guard, baron) {
  guard.target = null;
  guard.route = [];
  guard.pursuit = null;
  guard.walking = false;
  return {phase: 'lead', time: 0, guard, baron,
    playerRoute: routeAroundBaron(player, leadSpot, baron),
    route: routeAroundBaron(guard, guardWait, baron)};
}

function walkRoute(actor, route, dt, guard = false) {
  if (!route.length) return true;
  const next = route[0];
  const dx = next.x - actor.x;
  const dy = next.y - actor.y;
  const distance = Math.hypot(dx, dy);
  const step = Math.min(distance, 115 * dt);
  if (step > 0) {
    actor.x += dx / distance * step;
    actor.y += dy / distance * step;
    const facing = facingIndex(dx, dy);
    actor.facing = guard ? Math.round(facing / 2) % 4 : facing;
    actor.stride = (actor.stride + step * TURN / 25) % TURN;
    actor.walking = true;
  }
  if (step === distance) route.shift();
  if (!route.length) actor.walking = false;
  return !route.length;
}

export function updateMilkBalloon(scene, player, dt) {
  const actor = scene.guard ?? scene.attendant ?? player;
  if (scene.phase === 'lead') {
    scene.time += dt;
    const playerArrived = walkRoute(player, scene.playerRoute, dt);
    const guardArrived = scene.time >= 0.45 && walkRoute(actor, scene.route, dt, true);
    if (!(playerArrived && guardArrived)) return false;
    scene.phase = 'approach';
    scene.route = routeAroundBaron(actor, pickup, scene.baron);
    scene.time = 0;
  }
  if (scene.phase === 'approach' || scene.phase === 'return') {
    if (!walkRoute(actor, scene.route, dt, Boolean(scene.guard))) return false;
    if (scene.phase === 'return') {
      if (scene.guard) {
        actor.facing = Math.round(facingIndex(player.x - actor.x, player.y - actor.y) / 2) % 4;
        player.facing = facingIndex(actor.x - player.x, actor.y - player.y);
      }
      return true;
    }
    const facing = facingIndex(target.x - actor.x, target.y - actor.y);
    actor.facing = scene.guard ? Math.round(facing / 2) % 4 : facing;
    actor.danceIdle = 0;
    scene.phase = 'pickup';
  }
  scene.time += dt;
  if (scene.phase === 'pickup' && scene.time >= 0.7) {
    scene.phase = 'throw';
    scene.time = 0;
  }
  if (scene.phase !== 'throw' || scene.time < 1.8) return false;
  if (!scene.attendant && !scene.guard) return true;
  scene.phase = 'return';
  scene.route = scene.guard ? routeAroundBaron(actor, returnSpot, scene.baron) : [PILLORY_ATTENDANT];
  return false;
}

export function milkBalloonHand(scene, player) {
  if (scene.phase === 'approach') return null;
  if (scene.phase === 'pickup') {
    const reach = Math.sin(Math.PI * Math.min(1, scene.time / 0.7));
    return {x: -9 + (basket.x - player.x + 9) * reach, y: -14 + (basket.y - player.y + 14) * reach};
  }
  const time = scene.time;
  if (time < release) return {x: -9, y: -14 - 23 * Math.sin(time / release * Math.PI / 2)};
  const follow = Math.max(0, 1 - (time - release) / 0.35);
  return {x: -9 - follow * 10, y: -14 - follow * 23};
}

export function drawMilkBalloon(ctx, scene, player) {
  const {phase, time} = scene;
  const thrower = scene.guard ?? scene.attendant;
  if (thrower) player = {x: thrower.x, y: thrower.y - 12};
  if (phase === 'lead' || phase === 'approach' || phase === 'return') return;
  ctx.save();
  if (phase !== 'throw' || time < impact) {
    const hand = milkBalloonHand(scene, player);
    let x = player.x + hand.x;
    let y = player.y + hand.y;
    if (phase === 'pickup' && time < 0.35) ({x, y} = basket);
    if (thrower && (phase === 'pickup' || time < release)) {
      ctx.strokeStyle = '#292226';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(player.x - 7, player.y - 18);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    if (phase === 'throw' && time >= release) {
      const t = (time - release) / (impact - release);
      x = player.x - 9 + (target.x - player.x + 9) * t;
      y = player.y - 37 + (target.y - player.y + 37) * t - Math.sin(t * Math.PI) * 28;
    }
    ctx.fillStyle = '#fff3d7';
    ctx.strokeStyle = '#6f5133';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, 5.5, 6.5, -0.3, 0, TURN);
    ctx.fill();
    ctx.stroke();
  } else {
    const t = Math.min(1, (time - impact) / 0.84);
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = '#fff6e1';
    ctx.beginPath();
    ctx.ellipse(target.x, target.y, 9 + t * 5, 7, 0, 0, TURN);
    ctx.fill();
    for (let i = 0; i < 12; i++) {
      const angle = i * TURN / 12;
      const distance = (7 + 27 * t) * (0.7 + (i % 3) * 0.18);
      ctx.beginPath();
      ctx.arc(target.x + Math.cos(angle) * distance,
        target.y + Math.sin(angle) * distance + t * t * 16, 2.3 - t, 0, TURN);
      ctx.fill();
    }
  }
  ctx.restore();
}
