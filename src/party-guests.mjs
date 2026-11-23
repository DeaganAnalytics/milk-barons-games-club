import {drawMilkGlass} from './milk-service-art.mjs';
import {SOUTH_TRIM_Y, WEST_EDGE} from './room.mjs';

const height = 66; // Match Pip's visible height from head to shoes.
const sipCycle = 9;
const mix = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);

export const partyGuests = [
  {id: 'plum', title: 'Guest in plum', radius: 20, x: WEST_EDGE + 82, facing: 1, shoulder: [54, 112], mouth: [89, 67], phase: 0},
  {id: 'emerald', title: 'Guest in emerald', radius: 20, x: WEST_EDGE + 141, facing: -1, shoulder: [64, 101], mouth: [32, 67], phase: 4.5}
].map(guest => ({...guest, y: SOUTH_TRIM_Y - 30}));

export function drawPartyGuest(ctx, guest, sprite, elapsed, milk = 0.85, holdingStill = false) {
  if (!sprite.complete || !sprite.naturalWidth) return;
  const {x, y, facing, shoulder, mouth} = guest;
  const scale = height / sprite.naturalHeight;
  const time = (elapsed + guest.phase) % sipCycle;
  const lift = holdingStill ? 0 : ease(Math.max(0, Math.min(1, (time - 1) / 0.7, (3.4 - time) / 0.8)));
  const tilt = holdingStill ? 0 : ease(Math.max(0, Math.min(1, (time - 1.7) / 0.3, (2.7 - time) / 0.3)));
  const angle = -facing * tilt * 0.86;

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#25202a60';
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 2.8, 0, 0, 2 * Math.PI);
  ctx.fill();

  const left = -sprite.naturalWidth * scale / 2;
  const top = -height;
  ctx.drawImage(sprite, left, top, -2 * left, height);
  const shoulderX = left + shoulder[0] * scale;
  const shoulderY = top + shoulder[1] * scale;
  const handX = mix(shoulderX + facing * 10, left + mouth[0] * scale + facing * 6.5, lift);
  const handY = mix(shoulderY + 13, top + mouth[1] * scale + 5.5, lift);

  ctx.lineCap = 'round';
  for (const [width, color] of [[6, '#201610'], [4, '#f6d9ad']]) {
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.quadraticCurveTo(shoulderX + facing * mix(3, 0, lift), shoulderY + 12, handX, handY);
    ctx.stroke();
  }

  // Anchor the stem in her hand as the bowl tips toward her mouth.
  ctx.translate(handX, handY);
  ctx.rotate(angle);
  ctx.scale(0.68, 0.68);
  drawMilkGlass(ctx, 0, 2, 0, milk * (1 - tilt * 0.08));
  ctx.restore();
}

export function drawGuestRefill(ctx, guest, sprite, server, progress) {
  if (!sprite.naturalWidth) return;
  const scale = height / sprite.naturalHeight;
  // Aim the bottle at the rim of the guest's lowered glass.
  const glassX = guest.x + (guest.shoulder[0] - sprite.naturalWidth / 2) * scale + guest.facing * 10;
  const rimY = guest.y - height + guest.shoulder[1] * scale + 13 - 13 * 0.68;
  const reach = ease(Math.min(1, progress / 0.24, (1 - progress) / 0.24));
  const x = mix(server.x + server.facing * 14, glassX + guest.facing * 10, reach);
  const y = mix(server.y - 26, rimY - 13, reach);

  if (progress > 0.29 && progress < 0.75) {
    ctx.strokeStyle = '#fff4d8';
    ctx.lineWidth = 1.5 + Math.sin(progress * 95) * 0.45;
    ctx.beginPath();
    ctx.moveTo(glassX + guest.facing * 1.5, rimY - 9);
    ctx.quadraticCurveTo(glassX + guest.facing * 0.5, rimY - 6, glassX, rimY + 4);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-guest.facing * reach * 1.92);
  ctx.fillStyle = '#fff4d8';
  ctx.strokeStyle = '#36281d';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-4, 6);
  ctx.lineTo(-4, -2);
  ctx.lineTo(-2, -5);
  ctx.lineTo(-2, -9);
  ctx.lineTo(2, -9);
  ctx.lineTo(2, -5);
  ctx.lineTo(4, -2);
  ctx.lineTo(4, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
