import {MILK_FOUNTAIN} from './room.mjs';
import {TURN} from './directions.mjs';

// Points follow the centerlines of the painted milk streams in the source artwork.
const streams = [
  [665, 235, 653, 338], [700, 259, 688, 358],
  [836, 259, 848, 358], [871, 235, 883, 338],
  [607, 367, 593, 490], [663, 389, 648, 515],
  [873, 389, 888, 515], [929, 367, 943, 490],
  [502, 513, 479, 655], [591, 558, 562, 698],
  [945, 558, 974, 698], [1034, 513, 1057, 655]
];

const scale = 300 / 1036;
export const fountainWidth = 1036 * scale;
export const fountainHeight = 952 * scale;

export function drawMilkFountain(ctx, art, elapsed, front) {
  ctx.save();
  ctx.translate(MILK_FOUNTAIN.x - fountainWidth / 2, front - fountainHeight);
  ctx.scale(scale, scale);
  ctx.drawImage(art, 0, 0, 1036, 952);
  ctx.translate(-250, -32);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#fffdf4';
  for (const [index, [startX, startY, endX, endY]] of streams.entries()) {
    const phase = elapsed * 1.6 + index * 0.18;
    for (const offset of [0, 0.5]) {
      const progress = (phase + offset) % 1;
      const fall = progress * progress;
      const curve = 1 - (1 - fall) ** 3;
      const x = startX + (endX - startX) * curve;
      const y = startY + (endY - startY) * fall;
      ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.77;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.sign(endX - startX), y + 7 + fall * 8);
      ctx.stroke();
    }
    const ripple = (phase * 0.65) % 1;
    ctx.globalAlpha = Math.sin(ripple * Math.PI) * 0.68;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(endX, endY + 8, 9 + ripple * 20, 2 + ripple * 7, 0, 0, TURN);
    ctx.stroke();
  }
  ctx.restore();
}
