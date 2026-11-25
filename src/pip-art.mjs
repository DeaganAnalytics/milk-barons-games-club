import {FACING_STEP, TURN} from './directions.mjs';

export function drawPip(ctx, player, elapsed, milkBalloonHand = null) {
  const x = Math.round(player.x);
  const y = Math.round(player.y);
  const breath = player.walking ? 0 : Math.sin(elapsed * 2.8 + 0.8) * 0.9;
  const dancing = !player.walking && player.danceIdle > 3;
  if (dancing || (!player.walking && player.facing === 0)) {
    drawFrontIdle(ctx, x, y, elapsed, dancing, player.lipstick);
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
    if (leg === -1 && milkBalloonHand) {
      ctx.lineTo(milkBalloonHand.x * 0.65, (milkBalloonHand.y - 18) / 2 + 4);
      ctx.lineTo(milkBalloonHand.x, milkBalloonHand.y);
    } else {
      ctx.lineTo((leg * shoulder + armX) / 2, -10);
      ctx.lineTo(armX + leg, -2 - step * 3);
    }
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

  drawPipHead(ctx, 0, -33, angle, 'attentive', false, player.lipstick);
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

function drawFrontIdle(ctx, x, y, elapsed, dancing, lipstick) {
  const beat = Math.sin(elapsed * 6);
  const breath = dancing ? Math.abs(beat) * 1.7 : Math.sin(elapsed * 1.8) * 0.55;
  const sway = dancing ? beat * 3.2 : Math.sin(elapsed * 1.15) * 0.4;
  const ink = '#100d0b';
  ctx.save();
  ctx.translate(x, y);
  ellipse(ctx, 0, 18.5, 13, 3.2, '#25202a80');

  for (const side of [-1, 1]) {
    const step = dancing ? Math.max(0, side * beat) : 0;
    const hipX = side * 3.2 + (dancing ? sway : 0);
    const hipY = -5 - (dancing ? breath : 0);
    const footX = side * (4.6 + step * 3.6);
    const footY = 16.8 - step * 5;
    const kneeX = dancing ? (hipX + footX) / 2 + side * (0.6 + step * 4) : side * 4.5;
    const kneeY = 5 - step * 2;
    stroke(ctx, 4.4, ink, c => {
      c.moveTo(hipX, hipY);
      c.quadraticCurveTo(kneeX, kneeY, footX, footY);
    });
    ellipse(ctx, footX + side * 1.4, footY + 0.9, 4.1, 1.9, ink);
    stroke(ctx, 0.65, '#30241e', c => {
      c.moveTo(kneeX + side * 0.4, kneeY + 1);
      c.lineTo(footX + side * 0.5, footY - 2);
    });
  }

  ctx.translate(sway, -breath);
  for (const side of [-1, 1]) {
    if (dancing) {
      const reach = side * (12 + side * beat * 2);
      const handY = -15 - side * beat * 7;
      stroke(ctx, 4, ink, c => {
        c.moveTo(side * 4.1, -18.2);
        c.quadraticCurveTo(side * 11, -6, reach, handY);
      });
      ellipse(ctx, reach, handY, 2.2, 2.5, ink);
      continue;
    }
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

  drawPipHead(ctx, 0, -32.2, 0, 'attentive', false, lipstick);
  ctx.restore();
}

function drawPipHead(ctx, x, y, angle, mood, portrait = false, lipstick = false) {
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
  if (lipstick) {
    const cheek = side < -0.3 ? 3.8 : -3.8;
    drawLipstickMark(ctx, cheek, 3.5, -0.48, 0.94);
    if (front > 0.4) drawLipstickMark(ctx, side * 3 - 2, -6.4, 0.29, 0.8);
  }
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
  if (mood === 'worried' || mood === 'alarmed' || mood === 'sorry' || mood === 'exasperated') {
    for (const eye of eyes) {
      stroke(ctx, 1.1, ink, c => {
        c.moveTo(eye - 1.8, mood === 'exasperated' ? -6.4 : -4.4);
        c.quadraticCurveTo(eye, -5.5, eye + 1.5, mood === 'exasperated' ? -4.4 : mood === 'sorry' ? -5.9 : -6.4);
      });
    }
    if (mood === 'alarmed' || mood === 'exasperated') ellipse(ctx, face + 0.7, 4.7, mood === 'exasperated' ? 3.1 : 2, 2.35, ink);
    else stroke(ctx, 1.16, ink, c => {
      c.moveTo(face - 2.6, 5.7);
      c.quadraticCurveTo(face, 2.1, face + 2.7, 5.2);
    });
  } else if (mood === 'thinking') {
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

function drawLipstickMark(ctx, x, y, angle, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(166, 37, 70, 0.82)';
  ctx.beginPath();
  ctx.moveTo(-2.6, 0);
  ctx.quadraticCurveTo(-1.3, -1.9, 0, -1);
  ctx.quadraticCurveTo(1.1, -1.9, 2.6, 0);
  ctx.quadraticCurveTo(0.1, -0.45, -2.6, 0);
  ctx.moveTo(-2.5, 0.35);
  ctx.quadraticCurveTo(0, 2.45, 2.5, 0.35);
  ctx.quadraticCurveTo(0, 0.8, -2.5, 0.35);
  ctx.fill();
  ctx.restore();
}

export function drawPipPortrait(canvas, expression, disguise, lipstick = false) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(canvas.width / 240, canvas.height / 240);

  const dressedUp = disguise === 'woman';
  const jacket = ctx.createLinearGradient(78, 140, 154, 209);
  jacket.addColorStop(0, dressedUp ? '#894665' : '#292321');
  jacket.addColorStop(1, dressedUp ? '#4a233c' : '#100d0b');
  ctx.fillStyle = jacket;
  stroke(ctx, 5, '#100d0b', c => {
    c.moveTo(66, 202);
    c.bezierCurveTo(67, 164, 82, 141, 109, 137);
    c.bezierCurveTo(142, 134, 156, 162, 161, 202);
    c.closePath();
    c.fill();
  });

  if (dressedUp) {
    ctx.fillStyle = '#f0ddbf';
    stroke(ctx, 2.8, '#3d2030', c => {
      c.moveTo(94, 143);
      c.quadraticCurveTo(115, 135, 137, 143);
      c.quadraticCurveTo(133, 165, 115, 173);
      c.quadraticCurveTo(100, 167, 94, 143);
      c.closePath();
      c.fill();
    });
    stroke(ctx, 1.4, '#ae7c40', c => {
      c.moveTo(102, 148);
      c.quadraticCurveTo(115, 165, 129, 148);
    });
    ellipse(ctx, 115, 157, 2.7, 3.3, '#fff1d5');
    ctx.fillStyle = '#5e382d';
    stroke(ctx, 3.8, '#2a1a17', c => {
      c.moveTo(63, 71);
      c.bezierCurveTo(57, 41, 78, 21, 108, 21);
      c.bezierCurveTo(143, 19, 164, 38, 166, 68);
      c.bezierCurveTo(160, 100, 171, 119, 166, 143);
      c.quadraticCurveTo(157, 150, 142, 145);
      c.lineTo(83, 147);
      c.quadraticCurveTo(63, 155, 54, 141);
      c.quadraticCurveTo(66, 113, 63, 71);
      c.closePath();
      c.fill();
    });
  } else {
    ctx.fillStyle = '#f0ddbf';
    ctx.beginPath();
    ctx.moveTo(100, 201);
    ctx.lineTo(100, 172);
    ctx.bezierCurveTo(100, 145, 129, 145, 129, 172);
    ctx.lineTo(129, 201);
    ctx.closePath();
    ctx.fill();
  }
  const seam = dressedUp ? '#ad6687' : '#453732';
  stroke(ctx, 2.5, seam, c => {
    c.moveTo(83, 195);
    c.quadraticCurveTo(84, 170, 93, 161);
  });
  stroke(ctx, 2.5, seam, c => {
    c.moveTo(146, 195);
    c.quadraticCurveTo(144, 174, 136, 161);
  });
  ctx.save();
  ctx.translate(114, 83);
  ctx.scale(4.25, 4.25);
  drawPipHead(ctx, 0, 0, 0, expression, true);
  if (lipstick) {
    drawLipstickMark(ctx, -5, 3, -0.48, 1);
    drawLipstickMark(ctx, -2, -6.4, 0.29, 0.8);
  }
  if (disguise === 'moustache' || disguise === 'eyePatch') {
    stroke(ctx, 2.2, '#2d211e', c => {
      c.moveTo(-1, 3);
      c.quadraticCurveTo(1, 0.5, 4.1, 2.4);
      c.quadraticCurveTo(7, 0.6, 9.8, 2.8);
    });
  }
  if (disguise === 'eyePatch') {
    stroke(ctx, 0.8, '#1c1816', c => {
      c.moveTo(-12.1, -4.1);
      c.lineTo(12.2, 0.5);
    });
    ellipse(ctx, 2, -1.25, 2.8, 2.6, '#1c1816');
  }
  if (dressedUp) {
    const hair = ctx.createLinearGradient(-12, -14, 9, -1);
    hair.addColorStop(0, '#a46b4c');
    hair.addColorStop(1, '#4f3027');
    ctx.fillStyle = hair;
    stroke(ctx, 0.9, '#2a1a17', c => {
      c.moveTo(12, -8);
      c.bezierCurveTo(9, -14, 3, -15, -2, -14);
      c.bezierCurveTo(-10, -16, -15, -9, -14, -2);
      c.quadraticCurveTo(-15, 9, -11, 13);
      c.quadraticCurveTo(-8, 12, -7, 8);
      c.quadraticCurveTo(-10, 4, -8, 0);
      c.bezierCurveTo(-3, -2, 1, -7, 3, -10);
      c.quadraticCurveTo(8, -8, 12, -8);
      c.closePath();
      c.fill();
    });
    stroke(ctx, 0.65, '#bb805d', c => {
      c.moveTo(-11, -4);
      c.quadraticCurveTo(-7, -11, 1, -12);
    });
    ellipse(ctx, -7.4, 7.9, 1.35, 1.35, '#b37d43');
    ellipse(ctx, -7.5, 7.7, 0.9, 0.9, '#fff1d5');
  }
  ctx.restore();
}

export function drawSleepingSlotPlayer(ctx, x, y, elapsed, {awake, reach, pull}) {
  const ink = '#100d0b';
  const jacket = '#58463d';
  const breath = Math.sin(elapsed * 2.4) * 0.9;
  const lift = awake ? 6 : 0;
  const handX = -31 + reach * 12 - pull * 6;
  const handY = -22 + reach * 3 - pull * 11;
  ctx.save();
  ctx.translate(x, y);
  stroke(ctx, 6, ink, c => {
    c.moveTo(1, -5);
    c.lineTo(-10, -3);
    c.lineTo(-9, 12);
    c.lineTo(-16, 13);
  });
  stroke(ctx, 15, ink, c => {
    c.moveTo(0, -7);
    c.quadraticCurveTo(-7, -17, -20, -23 - lift + breath);
  });
  stroke(ctx, 11, jacket, c => {
    c.moveTo(0, -7);
    c.quadraticCurveTo(-7, -17, -20, -23 - lift + breath);
  });
  stroke(ctx, 5, ink, c => {
    c.moveTo(-15, -23 + breath);
    c.lineTo(-23, -20);
    c.lineTo(handX, handY);
  });
  ellipse(ctx, handX, handY, 3.4, 2.8, '#e8ca9e');

  ctx.save();
  ctx.translate(-26 + lift / 2, -32 - lift + breath);
  ctx.rotate(-0.35);
  ellipse(ctx, 0, 0, 12, 12, ink);
  ellipse(ctx, 0, 0, 10.3, 10.3, '#f3dfbf');
  ellipse(ctx, 0.8, -7, 8.7, 4, '#71625b');
  if (awake) ellipse(ctx, -6, -0.5, 1.5, 2.2, ink);
  else stroke(ctx, 1.4, ink, c => {
    c.moveTo(-8, -0.5);
    c.quadraticCurveTo(-5.8, 1.4, -3.5, -0.5);
  });
  ellipse(ctx, -6.5, 5.1, 1.7, 1.3 + Math.max(0, breath), ink);
  ctx.restore();

  const snore = (elapsed % 3.6) / 1.35;
  if (!awake && snore < 1) {
    ctx.globalAlpha = Math.sin(snore * Math.PI);
    ctx.font = 'bold 11px sans-serif';
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = ink;
    ctx.fillStyle = '#fff0c8';
    const snoreX = -24 + snore * 9;
    const snoreY = -45 - snore * 16;
    ctx.strokeText('Zzz', snoreX, snoreY);
    ctx.fillText('Zzz', snoreX, snoreY);
  }
  ctx.restore();
}
