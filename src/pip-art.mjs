import {FACING_STEP, TURN} from './directions.mjs';

export function drawPip(ctx, player, elapsed) {
  const x = Math.round(player.x);
  const y = Math.round(player.y);
  const breath = player.walking ? 0 : Math.sin(elapsed * 2.8 + 0.8) * 0.9;
  if (!player.walking && player.facing === 0) {
    drawFrontIdle(ctx, x, y, elapsed);
    return;
  }

  const angle = player.facing * FACING_STEP;
  const side = Math.sin(angle);
  const front = Math.cos(angle);
  const swing = player.walking ? Math.sin(player.stride) : 0;
  const lift = Math.abs(swing) * 2;
  const shoulder = 6 - 3 * Math.abs(side);
  const hip = 4 - 2 * Math.abs(side);

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#25202a80';
  ctx.beginPath();
  ctx.ellipse(0, 18, 13, 3, 0, 0, TURN);
  ctx.fill();

  ctx.translate(0, 16 - lift);
  ctx.scale(1, 1 + breath / 65);
  ctx.translate(0, -16);
  ctx.strokeStyle = '#100d0b';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;
  for (const leg of [-1, 1]) {
    const step = leg * swing;
    const footX = leg * hip + step * (side * 7 + front * 4);
    const footY = 16 + step * front * 3 - Math.max(0, step) * 4;
    ctx.beginPath();
    ctx.moveTo(leg * hip, -4);
    ctx.lineTo((leg * hip + footX) / 2, 5);
    ctx.lineTo(footX, footY);
    ctx.lineTo(footX + side * 3 + leg, footY);
    ctx.stroke();

    const armX = leg * shoulder - step * (side * 6 + front * 2);
    ctx.beginPath();
    ctx.moveTo(leg * shoulder, -18);
    ctx.lineTo((leg * shoulder + armX) / 2, -10);
    ctx.lineTo(armX + leg, -2 - step * 3);
    ctx.stroke();
  }

  ctx.fillStyle = '#100d0b';
  ctx.beginPath();
  ctx.ellipse(0, -10, shoulder + 1, 12, 0, 0, TURN);
  ctx.fill();
  if (front >= -0.001) {
    ctx.fillStyle = '#f4e6d0';
    ctx.beginPath();
    ctx.ellipse(side * 2, -12, 3 - Math.abs(side), 6, 0, 0, TURN);
    ctx.fill();
  }

  drawPipHead(ctx, 0, -33, angle, 'attentive');
  ctx.restore();
}

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TURN);
  ctx.fillStyle = fill;
  ctx.fill();
}

function stroke(ctx, width, color, paint) {
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  paint(ctx);
  ctx.stroke();
}

function drawFrontIdle(ctx, x, y, elapsed) {
  const breath = Math.sin(elapsed * 1.8) * 0.55;
  const sway = Math.sin(elapsed * 1.15) * 0.4;
  const ink = '#100d0b';
  ctx.save();
  ctx.translate(x, y);
  ellipse(ctx, 0, 18.5, 13, 3.2, '#25202a80');

  // The original planted stance: long legs, with each shoe pointing out slightly.
  for (const side of [-1, 1]) {
    stroke(ctx, 4.4, ink, c => {
      c.moveTo(side * 3.2, -5);
      c.quadraticCurveTo(side * 4.5, 5, side * 4.6, 16.8);
    });
    ellipse(ctx, side * 6, 17.7, 4.1, 1.9, ink);
    stroke(ctx, 0.65, '#30241e', c => {
      c.moveTo(side * 4.9, 6);
      c.lineTo(side * 5.1, 14.8);
    });
  }

  ctx.translate(sway, -breath);
  for (const side of [-1, 1]) {
    stroke(ctx, 4, ink, c => {
      c.moveTo(side * 4.1, -18.2);
      c.bezierCurveTo(side * 8.9, -16, side * 9.4, -7, side * (9.8 + breath * 0.27), -0.6);
    });
    ellipse(ctx, side * (9.8 + breath * 0.27), -0.3, 2.15, 2.8, ink);
    stroke(ctx, 0.65, '#342820', c => {
      c.moveTo(side * 6.6, -15.5);
      c.quadraticCurveTo(side * 8.5, -11, side * 8.8, -5.2);
    });
  }

  ellipse(ctx, 0, -12.1, 6.3, 10.4, ink);
  const bib = ctx.createLinearGradient(0, -19.5, 0, -6.5);
  bib.addColorStop(0, '#fff0d6');
  bib.addColorStop(1, '#ddbf98');
  ellipse(ctx, 0, -12.7, 3.35, 6.45 + breath * 0.24, bib);

  drawPipHead(ctx, 0, -32.2, 0, 'attentive');
  ctx.restore();
}

function drawPipHead(ctx, x, y, angle, mood, portrait = false) {
  ctx.save();
  ctx.translate(x, y);
  const side = Math.sin(angle);
  const front = Math.cos(angle);
  const skin = ctx.createLinearGradient(-9, -12, 10, 13);
  skin.addColorStop(0, '#fff0d7');
  skin.addColorStop(0.63, '#f3dfbf');
  skin.addColorStop(1, '#dfbd96');
  const ink = '#100d0b';
  ellipse(ctx, 0, 0, 14, 14, ink);
  ellipse(ctx, 0, 0, 11.7, 11.7, skin);
  if (front < -0.93) {
    ctx.restore();
    return;
  }

  const face = portrait ? 4 : side * (front < 0 ? 7 : 5.4);
  const eyes = portrait ? [2, 8.2] : Math.abs(side) < 0.8 ? [face - 3.55, face + 3.55] : [face];
  for (const eye of eyes) {
    if (mood === 'happy') {
      stroke(ctx, 1.35, ink, c => {
        c.moveTo(eye - 1.6, -0.7);
        c.quadraticCurveTo(eye, -3.2, eye + 1.6, -0.7);
      });
    } else {
      ellipse(ctx, eye, -1.25, 1.3, 2, ink);
    }
  }
  if (mood === 'thinking') {
    const brow = eyes[0];
    stroke(ctx, 1.1, ink, c => {
      c.moveTo(brow - 2, -4.1);
      c.quadraticCurveTo(brow, -4.6, brow + 1.3, -6.1);
    });
    ellipse(ctx, face + 1.8, 4.35, 1.03, 0.86, ink);
  } else {
    stroke(ctx, 1.16, ink, c => {
      c.moveTo(face - 3.1, 3.5);
      c.quadraticCurveTo(face, 6.9, face + 3.15, 3.1);
    });
  }
  ctx.restore();
}

export function drawPipPortrait(canvas, expression) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(canvas.width / 240, canvas.height / 240);

  const jacket = ctx.createLinearGradient(78, 140, 154, 209);
  jacket.addColorStop(0, '#292321');
  jacket.addColorStop(1, '#100d0b');
  ctx.fillStyle = jacket;
  stroke(ctx, 5, '#100d0b', c => {
    c.moveTo(66, 202);
    c.bezierCurveTo(67, 164, 82, 141, 109, 137);
    c.bezierCurveTo(142, 134, 156, 162, 161, 202);
    c.closePath();
    c.fill();
  });

  ctx.fillStyle = '#f0ddbf';
  ctx.beginPath();
  ctx.moveTo(100, 201);
  ctx.lineTo(100, 172);
  ctx.bezierCurveTo(100, 145, 129, 145, 129, 172);
  ctx.lineTo(129, 201);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 2.5, '#453732', c => {
    c.moveTo(83, 195);
    c.quadraticCurveTo(84, 170, 93, 161);
  });
  stroke(ctx, 2.5, '#403431', c => {
    c.moveTo(146, 195);
    c.quadraticCurveTo(144, 174, 136, 161);
  });
  ctx.save();
  ctx.translate(114, 83);
  ctx.scale(4.25, 4.25);
  drawPipHead(ctx, 0, 0, 0, expression, true);
  ctx.restore();
}
