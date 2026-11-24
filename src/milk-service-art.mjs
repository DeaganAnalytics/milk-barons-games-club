import {attendantMilkProgress} from './attendant-milk.mjs';
import {PILLORY_ATTENDANT} from './room.mjs';
import {TURN} from './directions.mjs';
import {milkProgress} from './milk-service.mjs';

const glassGrips = {
  'male-waiter': [81, 77],
  'female-waiter': [83, 75],
  'handlebar-waiter': [82, 80],
  'martini-waiter': [81, 83],
  'blonde-waitress': [86, 78],
  'lin-waitress': [86, 77]
};
const mix = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);

export function drawMilkGlass(ctx, x, y, angle, milk, martini = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#201a16';
  ctx.fillStyle = '#c4d0cf';
  ctx.beginPath();
  ctx.moveTo(-6, -15);
  ctx.lineTo(6, -15);
  if (martini) ctx.lineTo(0, -6);
  else ctx.bezierCurveTo(8, -9, 6, -5, 0, -5);
  if (!martini) ctx.bezierCurveTo(-6, -5, -8, -9, -6, -15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (milk > 0) {
    const surface = mix(-6.5, -12.3, milk);
    const width = martini ? (Math.abs(surface) - 5) * 0.5 : 5.2;
    ctx.fillStyle = '#fff4d8';
    ctx.beginPath();
    ctx.moveTo(-width, surface);
    ctx.lineTo(width, surface);
    ctx.quadraticCurveTo(width - 0.8, -6, 0, -6);
    ctx.quadraticCurveTo(-width + 0.8, -6, -width, surface);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(0, 1);
  ctx.moveTo(-4, 1);
  ctx.lineTo(4, 1);
  ctx.stroke();
  ctx.restore();
}

function reach(ctx, x, y, handX, handY, sleeve, hand) {
  ctx.save();
  ctx.lineCap = 'round';
  for (const [width, color] of [[8, '#1a1612'], [5, sleeve]]) {
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo((x + handX) / 2, (y + handY) / 2 + 6, handX, handY);
    ctx.stroke();
  }
  ctx.fillStyle = hand;
  ctx.beginPath();
  ctx.arc(handX, handY, 3.4, 0, TURN);
  ctx.fill();
  ctx.restore();
}

export function drawMilkShards(ctx, scene) {
  if (scene.phase !== 'cleanup-run' && scene.phase !== 'sweep') return;
  const sweep = scene.phase === 'sweep' ? milkProgress(scene) : 0;
  const spread = scene.phase === 'cleanup-run' ? Math.min(1, scene.time * 5) : 1;
  ctx.save();
  ctx.translate(scene.spill.x, scene.spill.y + 20);
  for (let index = 0; index < 9; index++) {
    if (sweep > (index + 1) / 10) continue;
    const angle = index * 2.4;
    const reach = (6 + index * 1.45) * spread * (1 - sweep * 0.7);
    const x = Math.cos(angle) * reach;
    const hop = 6 * Math.sin(Math.PI * spread);
    const y = Math.sin(angle) * reach * 0.5 - hop;
    ctx.fillStyle = index % 2 ? '#f1efdd' : '#a7c1c5';
    ctx.strokeStyle = '#60594d';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 2.5, y - 4);
    ctx.lineTo(x + 5, y + 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export function usesMilkArm(scene) {
  if (!scene) return false;
  if (scene.phase === 'handoff') return milkProgress(scene) >= 0.32;
  if (scene.phase === 'toss') return milkProgress(scene) < 0.65;
  return scene.phase === 'drink' || scene.phase === 'windup';
}

export function drawMilkAction(ctx, scene, baron, animateBaronArm) {
  if (!['handoff', 'drink', 'windup', 'toss'].includes(scene.phase)) return;
  const t = milkProgress(scene);
  const {server, side} = scene;
  const martini = server.id === 'martini-waiter';
  const restingX = baron.x + side * 22;
  const restingY = baron.y + 3;
  const shoulderX = baron.x + side * 16;
  const shoulderY = baron.y - 13;
  const handX = baron.x + side * 26;
  const handY = baron.y + 1;
  const sipX = baron.x + side * 13;
  const sipY = baron.y - 16;
  let x = handX;
  let y = handY;
  let angle = 0;
  let milk = 1;

  if (scene.phase === 'handoff') {
    const [gripX, gripY] = glassGrips[server.id];
    const startX = server.x + server.facing * (gripX * 0.6 - 38.4);
    const startY = server.y - 67 + gripY * 0.6;
    x = mix(startX, handX, ease(t));
    y = mix(startY, handY, ease(t)) - Math.sin(t * Math.PI) * 3;
    if (t < 0.55) reach(ctx, startX, startY - 1, x, y - 1, '#f5e2c2', '#dfbd96');
  } else if (scene.phase === 'drink') {
    const lift = Math.min(1, t * 4, (1 - t) * 4);
    x = mix(handX, sipX, ease(lift));
    y = mix(handY, sipY, ease(lift));
    angle = -side * lift * 1.18;
    milk = 1 - Math.max(0, Math.min(1, (t - 0.24) / 0.48));
  } else if (scene.phase === 'windup') {
    x += side * 8 * t;
    y -= 16 * t;
    angle = side * t * 0.5;
    milk = 0;
  } else {
    const releaseX = handX + side * 8;
    const releaseY = handY - 16;
    x = mix(releaseX, scene.spill.x, t);
    y = mix(releaseY, scene.spill.y + 20, t) - Math.sin(t * Math.PI) * 43;
    angle = side * (0.5 + t * TURN);
    milk = 0;

  }

  if (animateBaronArm) {
    let armX = x;
    let armY = y - 2;
    if (scene.phase === 'handoff') {
      const reachProgress = ease(Math.min(1, (t - 0.32) / 0.38));
      armX = mix(restingX, armX, reachProgress);
      armY = mix(restingY, armY, reachProgress);
    } else if (scene.phase === 'toss') {
      const finish = Math.min(1, t / 0.65);
      armX = mix(handX + side * 8, restingX, ease(finish)) + side * Math.sin(finish * Math.PI) * 8;
      armY = mix(handY - 16, restingY, ease(finish));
    }
    reach(ctx, shoulderX, shoulderY, armX, armY, '#302119', '#201814');
  }
  drawMilkGlass(ctx, x, y, angle, milk, martini);
}

function serverGlassPosition(server) {
  const [x, y] = glassGrips[server.id];
  return {x: server.x + server.facing * (x * 0.6 - 38.4), y: server.y - 67 + y * 0.6};
}

export function drawEmptyServiceGlass(ctx, server) {
  const {x, y} = serverGlassPosition(server);
  drawMilkGlass(ctx, x, y, 0, 0, server.id === 'martini-waiter');
}

export function drawAttendantMilk(ctx, scene) {
  if (!['handoff', 'drink', 'returnGlass'].includes(scene.phase)) return;
  const {server, phase} = scene;
  const {x, y} = PILLORY_ATTENDANT;
  const side = Math.sign(server.x - x);
  const t = attendantMilkProgress(scene);
  const grip = serverGlassPosition(server);
  const restX = x + side * 12;
  const restY = y - 18;
  let glassX = restX;
  let glassY = restY;
  let angle = 0;
  let milk = 1;
  if (phase === 'drink') {
    const lift = ease(Math.min(1, t * 4, (1 - t) * 4));
    glassX = mix(restX, x + side * 4, lift);
    glassY = mix(restY, y - 41, lift);
    angle = -side * lift;
    milk = 1 - Math.max(0, Math.min(1, (t - 0.25) * 2));
  } else {
    const towardAttendant = ease(phase === 'handoff' ? t : 1 - t);
    glassX = mix(grip.x, restX, towardAttendant);
    glassY = mix(grip.y, restY, towardAttendant) - Math.sin(t * Math.PI) * 3;
    milk = Number(phase === 'handoff');
    if (towardAttendant < 0.55) reach(ctx, grip.x, grip.y, glassX, glassY, '#f5e2c2', '#dfbd96');
  }
  if (phase === 'drink' || Math.abs(glassX - x) < 29) {
    reach(ctx, x + side * 7, y - 24, glassX, glassY - 1, '#31272c', '#f3d5b0');
  }
  drawMilkGlass(ctx, glassX, glassY, angle, milk, server.id === 'martini-waiter');
}
