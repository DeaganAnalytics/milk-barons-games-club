import {pipePourDuration} from './staff.mjs';
import {attendantMilkProgress} from './attendant-milk.mjs';
import {PILLORY_ATTENDANT, pipeHatch} from './room.mjs';
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
// Measured from the full-glass sprite cells at their 128×160 reference size.
const staffGlassProfiles = {
  'male-waiter': {width: 14, bowl: 15, stem: 5, foot: 11},
  'female-waiter': {width: 13, bowl: 13, stem: 5, foot: 9},
  'handlebar-waiter': {width: 14, bowl: 15, stem: 5, foot: 11},
  'martini-waiter': {width: 20, bowl: 11, stem: 9, foot: 11, martini: true},
  'blonde-waitress': {width: 14, bowl: 13, stem: 5, foot: 9},
  'lin-waitress': {width: 15, bowl: 14, stem: 5, foot: 10}
};

function drawStaffGlass(ctx, server, x, y, angle, milk) {
  const profile = staffGlassProfiles[server.id];
  if (!profile) return;
  const {width, bowl, stem, foot, martini} = profile;
  const rim = width * 0.3;
  const footWidth = foot * 0.3;
  const bottom = -3;
  const top = bottom - bowl * 0.6;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.lineWidth = 1.15;
  ctx.strokeStyle = '#201a16';
  ctx.fillStyle = '#c4d0cf';
  ctx.beginPath();
  ctx.moveTo(-rim, top);
  ctx.lineTo(rim, top);
  if (martini) ctx.lineTo(0, bottom);
  else {
    ctx.bezierCurveTo(rim + 1, top + 3, rim, bottom, 0, bottom);
    ctx.bezierCurveTo(-rim, bottom, -rim - 1, top + 3, -rim, top);
  }
  ctx.closePath();
  ctx.fill();
  if (milk > 0) {
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#fff4d8';
    const level = mix(bottom, top + 2, milk);
    ctx.fillRect(-rim - 1, level, rim * 2 + 2, bottom - level);
    ctx.restore();
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, bottom);
  ctx.lineTo(0, bottom + stem * 0.6);
  ctx.moveTo(-footWidth, bottom + stem * 0.6);
  ctx.lineTo(footWidth, bottom + stem * 0.6);
  ctx.stroke();
  ctx.restore();
}

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
  drawStaffGlass(ctx, server, x, y, angle, milk);
}

function serverGlassPosition(server) {
  const [x, y] = glassGrips[server.id];
  return {x: server.x + server.facing * (x * 0.6 - 38.4), y: server.y - 67 + y * 0.6};
}

export function drawEmptyServiceGlass(ctx, server) {
  const {x, y} = serverGlassPosition(server);
  drawStaffGlass(ctx, server, x, y, 0, 0);
}

export function drawPipePour(ctx, server) {
  const progress = server.pipePour / pipePourDuration;
  const clamp = value => Math.max(0, Math.min(1, value));
  const pickUp = 0.64;
  const setDown = 0.94;
  const returnToTray = 1 - ease(clamp((progress - pickUp) / (setDown - pickUp)));
  const liftToCounter = server.emptyServiceGlass ? ease(clamp(progress / 0.22)) : 1;
  const handoff = liftToCounter * returnToTray;
  const tilt = ease(clamp(Math.min((progress - 0.18) / 0.10, (0.66 - progress) / 0.10)));
  const fill = clamp((progress - 0.28) / 0.28);
  const grip = serverGlassPosition(server);
  const glassX = mix(grip.x, pipeHatch.x + 13, handoff);
  const glassY = mix(grip.y, pipeHatch.sill + 6, handoff);
  const jugX = pipeHatch.x - 4;
  const jugY = pipeHatch.sill - 3;
  const angle = 1.3 * tilt;
  const lipX = jugX + Math.sin(angle) * 11;
  const lipY = jugY - Math.cos(angle) * 11;

  if (progress > 0.28 && progress < 0.56) {
    ctx.save();
    ctx.strokeStyle = '#fff3d8';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lipX, lipY);
    ctx.quadraticCurveTo(lipX + 2, glassY - 15, glassX, glassY - 7);
    ctx.stroke();
    ctx.restore();
  }
  // Keep the returning glass visibly in the server's hand until it meets the tray.
  if (progress >= pickUp && progress < setDown) {
    const reachProgress = clamp((progress - pickUp) / 0.035);
    ctx.save();
    ctx.globalAlpha = ease(reachProgress);
    reach(ctx, grip.x - server.facing * 6, grip.y - 5,
      glassX, glassY + 2, '#f5e2c2', '#dfbd96');
    ctx.restore();
  }
  drawStaffGlass(ctx, server, glassX, glassY, 0, fill);

  if (!tilt) return;
  ctx.save();
  ctx.translate(jugX, jugY);
  ctx.rotate(angle);
  ctx.fillStyle = '#fff3d8';
  ctx.strokeStyle = '#594329';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-3, -11);
  ctx.lineTo(3, -11);
  ctx.lineTo(3, -7);
  ctx.quadraticCurveTo(6, -5, 6, -1);
  ctx.lineTo(6, 5);
  ctx.lineTo(-6, 5);
  ctx.lineTo(-6, -1);
  ctx.quadraticCurveTo(-6, -5, -3, -7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function attendantGlassPose(scene) {
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
    glassX = mix(restX, x + side * 3, lift);
    glassY = mix(restY, y - 36, lift);
    angle = -side * lift;
    milk = 1 - Math.max(0, Math.min(1, (t - 0.25) * 2));
  } else {
    const towardAttendant = ease(phase === 'handoff' ? t : 1 - t);
    glassX = mix(grip.x, restX, towardAttendant);
    glassY = mix(grip.y, restY, towardAttendant) - Math.sin(t * Math.PI) * 3;
    milk = Number(phase === 'handoff');
  }
  const arm = phase === 'drink' || Math.abs(glassX - x) < 29;
  return {glassX, glassY, angle, milk, arm, side, grip};
}

export function drawAttendantMilk(ctx, scene, pose) {
  if (!pose) return;
  const {glassX, glassY, angle, milk, arm, side, grip} = pose;
  const {x, y} = PILLORY_ATTENDANT;
  if (!arm) reach(ctx, grip.x, grip.y, glassX, glassY, '#f5e2c2', '#dfbd96');
  if (arm) reach(ctx, x + side * 7, y - 34, glassX, glassY - 1, '#31272c', '#f3d5b0');
  drawStaffGlass(ctx, scene.server, glassX, glassY, angle, milk);
}
