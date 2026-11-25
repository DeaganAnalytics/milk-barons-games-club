import {rangeBullet, rangeImpactAge, rangeShotAge} from './practice-range.mjs';
import {PRACTICE_RANGE} from './room.mjs';

export function drawRangeBoundary(ctx) {
  const {west, east, north, south} = PRACTICE_RANGE;
  ctx.save();
  ctx.fillStyle = 'rgba(60,24,13,0.12)';
  ctx.fillRect(west, north, east - west, south - north);
  ctx.beginPath();
  ctx.moveTo(east, north);
  ctx.lineTo(west, north);
  ctx.lineTo(west, south);
  ctx.lineTo(east, south);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#412422';
  ctx.stroke();
  ctx.setLineDash([9, 9]);
  ctx.strokeStyle = '#eec362';
  ctx.stroke();
  ctx.restore();
}

export function drawRangeLane(ctx, art, y, elapsed, index) {
  const {guardX, targetX} = PRACTICE_RANGE;
  const age = rangeShotAge(elapsed, index);
  const pose = age < 0.11 ? art.fire : age < 0.51 ? art.recover : art.aim;
  const target = art.targets[index];
  if (target.naturalWidth) {
    const height = 62;
    const width = height * target.naturalWidth / target.naturalHeight;
    ctx.drawImage(target, targetX - 24, y - 66, width, height);
  }
  if (pose.naturalWidth) ctx.drawImage(pose, guardX - 10, y - 66, 53, 68);
  const bullet = rangeBullet(elapsed, index);
  if (bullet) {
    ctx.save();
    ctx.fillStyle = '#fff1bd';
    ctx.fillRect(bullet.x - 5, bullet.y - 1, 7, 2);
    ctx.restore();
  }
  if (age >= rangeImpactAge && age < rangeImpactAge + 0.18) {
    ctx.save();
    ctx.globalAlpha = 1 - (age - rangeImpactAge) / 0.18;
    ctx.fillStyle = '#ffe7b5';
    ctx.beginPath();
    ctx.arc(targetX - 6, y - 36, 4, 0, Math.PI * 2);
    ctx.arc(targetX - 11, y - 33, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
