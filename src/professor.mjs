import {MILK_FOUNTAIN, professorFeet} from './room.mjs';

export const professorHeight = 92;
const width = 55;
export const professor = {
  id: 'professor', title: 'Professor Butterworth-Smythe',
  x: professorFeet.x, y: professorFeet.y - 14, radius: 24
};

const ambientLines = [
  'The milk must flow.',
  'One man, one vote. Such a barbaric concept.',
  'The wealthy deserve their wealth.',
  'Economic inequality is a sign of a functioning society.',
  'Universal suffrage? An unfortunate intellectual experiment.',
  'The Dairy Aristocracy is the natural culmination of civilisation.',
  'The Baron is a most enlightened patron of academia.',
  'A prosperous ruling class is the foundation of a prosperous nation.',
  'The peasants simply lack the intellectual capacity to govern.',
  'Redistribution of wealth? Good heavens, no!',
  'Inherited wealth is merely accumulated intergenerational excellence.',
  'Poverty is an excellent incentive for productivity.',
  'Social mobility is desirable, provided it remains theoretical.',
  'The concentration of wealth is not a flaw in the system. It is its greatest achievement.',
  'An educated peasantry is a rather dangerous proposition.',
  'The free market works remarkably well when properly controlled by the aristocracy.',
  'My research is entirely independent, as the Baron generously reminds me.',
  'The evidence overwhelmingly supports the conclusions of my benefactors.',
  'The lower classes must learn to live within their means. The upper classes have no such obligation.',
  'Political stability requires that certain people remain politically irrelevant.',
  'Some call it corruption. I prefer the term institutional continuity.',
  'Equality before the law is a lovely sentiment. Entirely impractical, of course.',
  'The milk trickles down eventually. My economic models assure me of that.',
  'A milk pool may appear extravagant to the uneducated, but consider the economic stimulus!',
  'History has consistently demonstrated the superiority of whichever class commissions its historians.',
  'I have devoted fifty years to studying why people like myself deserve to rule.',
  'God save the Baron, and God preserve our dividends!'
];

export function createProfessorSpeech(random = Math.random) {
  let nextAt = 20;
  let until = 0;
  let previous = -1;
  return (elapsed, visible) => {
    if (!visible) return null;
    if (elapsed >= nextAt) {
      // Choose among the other lines after the first remark.
      const count = ambientLines.length - Number(previous >= 0);
      const index = Math.floor(random() * count);
      previous = previous >= 0 && index >= previous ? index + 1 : index;
      const text = ambientLines[previous];
      until = elapsed + Math.max(3, text.length / 18);
      nextAt = elapsed + 20;
    }
    if (elapsed >= until) return null;
    return {text: ambientLines[previous], opacity: Math.min(1, (until - elapsed) / 0.5)};
  };
}

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
  ctx.drawImage(lift > 0.02 && sippingArt.naturalWidth ? sippingArt : idleArt, -width / 2, -professorHeight, width, professorHeight);

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
