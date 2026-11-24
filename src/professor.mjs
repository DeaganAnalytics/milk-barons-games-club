import {MILK_FOUNTAIN, professorFeet} from './room.mjs';

const height = 92;
const width = 55;

function smoothstep(progress) {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * (3 - 2 * t);
}

export function professorPose(elapsed) {
  const time = elapsed % 8.32;
  return {
    lift: smoothstep((time - 1.1) / 0.75) * (1 - smoothstep((time - 5.25) / 0.8)),
    rock: Math.sin(elapsed * 2.1) * 0.02
  };
}

export function drawProfessor(ctx, idleArt, sippingArt, elapsed) {
  const {lift, rock} = professorPose(elapsed);
  const x = professorFeet.x;
  const y = professorFeet.y;
  ctx.save();
  ctx.fillStyle = '#24130f55';
  ctx.beginPath();
  ctx.ellipse(x, y, 24, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(x, y);
  ctx.rotate(rock);
  ctx.drawImage(lift > 0.02 && sippingArt.naturalWidth ? sippingArt : idleArt, -width / 2, -height, width, height);

  const handX = 13 - 4 * lift;
  const handY = -39 - 30 * lift;
  const strawX = handX + 5 - 6 * lift;
  const strawY = handY - 3 - 3 * lift;
  // Transform the hand end with the chair. The other end stays fixed in the basin.
  const basinX = MILK_FOUNTAIN.x - 88 - x;
  const basinY = MILK_FOUNTAIN.y - 33 - y;
  const endX = basinX * Math.cos(rock) + basinY * Math.sin(rock);
  const endY = -basinX * Math.sin(rock) + basinY * Math.cos(rock);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(strawX, strawY);
  ctx.bezierCurveTo(strawX + 16, strawY - 6, endX - 13, endY - 8, endX, endY);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#472823';
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#fae5b7';
  ctx.stroke();

  if (lift > 0.02) {
    ctx.beginPath();
    ctx.moveTo(12, -47);
    ctx.lineTo(handX - 3, handY + lift * 13);
    ctx.lineTo(handX, handY);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#21160e';
    ctx.stroke();
    ctx.lineWidth = 4.8;
    ctx.strokeStyle = '#702e3b';
    ctx.stroke();
    ctx.fillStyle = '#f6d6b0';
    ctx.beginPath();
    ctx.arc(handX, handY, 2.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = '#302014';
    ctx.stroke();
  }
  ctx.restore();
}
