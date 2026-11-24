import {TURN} from './directions.mjs';
import {DANCE_FLOOR} from './room.mjs';

const chorus = ['Milk milk milk my cow', 'Milk milk milk her now'];
const verse = ['mama', 'dada', 'nana', 'papa'].map(name => `Where's my milk ${name}?`);
const song = [...chorus, ...chorus, ...chorus, ...chorus, ...verse, ...verse];
const secondsPerLine = 2;
const scale = 0.68;
const artOrigin = {x: 627, y: 759};
export const danceLayers = ['floor', 'speakers', 'booth', 'dj'];

export function danceLyric(elapsed) {
  const index = Math.floor(elapsed / secondsPerLine) % song.length;
  const phase = elapsed % secondsPerLine;
  return {
    text: `♪ ${song[index]} ♪`,
    x: DANCE_FLOOR.x + (index % 2 ? 191 : -191),
    y: DANCE_FLOOR.y - 299,
    opacity: Math.min(1, phase / 0.15, (secondsPerLine - phase) / 0.23)
  };
}

function drawLayer(ctx, art, x, y) {
  ctx.drawImage(art, DANCE_FLOOR.x + (x - artOrigin.x) * scale,
    DANCE_FLOOR.y + (y - artOrigin.y) * scale, art.naturalWidth * scale, art.naturalHeight * scale);
}

export function drawDanceFloor(ctx, art) {
  drawLayer(ctx, art.floor, 365, 503);
}

export function drawDanceBooth(ctx, art, elapsed) {
  const bob = Math.sin(elapsed * 5) * 1.9;
  ctx.save();
  // Restore the short piece of rear rope hidden behind the DJ in the reference art.
  ctx.strokeStyle = '#a81919';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(DANCE_FLOOR.x - 17, DANCE_FLOOR.y - 326);
  ctx.quadraticCurveTo(DANCE_FLOOR.x, DANCE_FLOOR.y - 335, DANCE_FLOOR.x + 17, DANCE_FLOOR.y - 326);
  ctx.stroke();
  ctx.restore();
  drawLayer(ctx, art.dj, 593, 252 + bob);
  drawLayer(ctx, art.booth, 411, 252);
  drawLayer(ctx, art.speakers, 284, 317);
}

export function drawBaronDance(ctx, pose, baron, elapsed) {
  const beat = Math.sin(elapsed * 6);
  const sway = beat * 3;
  const lift = Math.abs(beat) * 2;
  ctx.save();
  ctx.translate(baron.x, baron.y + 34);
  // Shear from the feet so the body sways without sliding across the floor.
  ctx.transform(1, 0, -sway / 91, 1, 0, 0);
  ctx.drawImage(pose, -33, -91 - lift, 66, 91 + lift);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const side of [-1, 1]) {
    const pump = side * beat;
    const handX = side * (27 + pump * 4);
    const handY = -56 - lift - pump * 6;
    ctx.strokeStyle = '#231812';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(side * 21, -52 - lift);
    ctx.quadraticCurveTo(side * 39, -40 - lift, handX, handY);
    ctx.stroke();
    ctx.fillStyle = '#34231a';
    ctx.beginPath();
    ctx.ellipse(handX, handY, 4.5, 4, 0, 0, TURN);
    ctx.fill();
  }
  ctx.restore();
}
