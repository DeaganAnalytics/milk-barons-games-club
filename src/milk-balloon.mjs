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
  return {phase: 'throw', time: 0, attendant: true};
}

export function updateMilkBalloon(scene, player, dt) {
  if (scene.phase === 'approach') {
    const next = scene.route[0];
    const dx = next.x - player.x;
    const dy = next.y - player.y;
    const distance = Math.hypot(dx, dy);
    const step = Math.min(distance, 115 * dt);
    if (step > 0) {
      player.x += dx / distance * step;
      player.y += dy / distance * step;
      player.facing = facingIndex(dx, dy);
      player.stride = (player.stride + step * TURN / 25) % TURN;
      player.walking = true;
    }
    if (step === distance) scene.route.shift();
    if (scene.route.length) return false;
    player.walking = false;
    player.facing = facingIndex(target.x - player.x, target.y - player.y);
    player.danceIdle = 0;
    scene.phase = 'pickup';
  }
  scene.time += dt;
  if (scene.phase === 'pickup' && scene.time >= 0.7) {
    scene.phase = 'throw';
    scene.time = 0;
  }
  return scene.phase === 'throw' && scene.time >= 1.8;
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
  if (scene.attendant) player = {x: PILLORY_ATTENDANT.x, y: PILLORY_ATTENDANT.y - 12};
  if (phase === 'approach') return;
  ctx.save();
  if (phase !== 'throw' || time < impact) {
    const hand = milkBalloonHand(scene, player);
    let x = player.x + hand.x;
    let y = player.y + hand.y;
    if (phase === 'pickup' && time < 0.35) ({x, y} = basket);
    if (scene.attendant && time < release) {
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
