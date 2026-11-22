import {FACING_STEP, TURN} from './directions.mjs';
import {speechOpacity} from './baron.mjs';
import {PASSAGE_TOP, PASSAGE_BOTTOM, ROOM_WIDTH, ROOM_HEIGHT, SIDE_RUGS, WEST_EDGE} from './room.mjs';

function loadSprite(name) {
  const image = new Image();
  image.src = new URL('../assets/' + name + '.png', import.meta.url);
  return image;
}

function isReady(image) {
  return image.complete && image.naturalWidth > 0;
}

// Mouth centres in the forward-facing sprite artwork, in source pixels.
const baronMouths = {0: [138, 115], 1: [161, 115], 7: [118, 115]};

function drawBaronMouth(ctx, baron, x, y, bodyScale) {
  const mouth = baronMouths[baron.facing];
  if (!mouth || baron.expression > 0.98) return;
  ctx.save();
  ctx.globalAlpha *= 1 - baron.expression;
  ctx.translate(x + mouth[0] * 66 / 280, y + mouth[1] * 91 / 395 * bodyScale);
  const skin = ctx.createLinearGradient(0, -4, 0, 8);
  skin.addColorStop(0, '#fbe1bd');
  skin.addColorStop(1, '#f4d2a9');
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(0, 1, 11.6, 6.5, 0, 0, TURN);
  ctx.fill();
  ctx.strokeStyle = '#19130e';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -1);
  ctx.quadraticCurveTo(0, 4, 6, -1);
  ctx.stroke();
  ctx.restore();
}

function drawBaron(ctx, pose, fallback, baron, elapsed) {
  const x = baron.x - 33;
  const y = baron.y - 57;
  if (!isReady(pose)) {
    if (isReady(fallback)) ctx.drawImage(fallback, x + 3, y + 9, 60, 92);
    return;
  }

  const swing = baron.walking ? Math.sin(baron.stride) : 0;
  const breath = baron.walking ? 0 : Math.sin(elapsed * 2.1) * 1.1;
  const lift = Math.abs(swing) * 2 + breath;
  const top = y - lift;

  if (!baron.walking) {
    ctx.drawImage(pose, x, top, 66, 91 + lift);
    drawBaronMouth(ctx, baron, x, top, (91 + lift) / 91);
    return;
  }

  // Keep the feet anchored at the bottom of the pose as the torso rises.
  const legStart = 335;
  const bodyHeight = 91 * legStart / pose.naturalHeight;
  const legHeight = 91 - bodyHeight;
  ctx.drawImage(pose, 0, 0, pose.naturalWidth, legStart, x, top, 66, bodyHeight);
  drawBaronMouth(ctx, baron, x, top, 1);
  ctx.save();
  ctx.translate(x, top + bodyHeight);
  ctx.transform(1, 0, swing * 5 / legHeight, 1, 0, 0);
  ctx.drawImage(pose, 0, legStart, pose.naturalWidth, pose.naturalHeight - legStart,
    0, 0, 66, legHeight + lift);
  ctx.restore();
}

function drawPlayer(ctx, figure, player, elapsed) {
  if (!figure.complete || !figure.naturalWidth) return;
  const x = Math.round(player.x);
  const y = Math.round(player.y);
  const breath = player.walking ? 0 : Math.sin(elapsed * 2.8 + 0.8) * 0.9;
  if (!player.walking && player.facing === 0) {
    ctx.drawImage(figure, x - 17, y - 49 - breath, 34, 72 + breath);
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

  if (player.facing === 0) {
    ctx.drawImage(figure, 0, 0, 59, 54, -17, -49, 34, 72 * 54 / 127);
  } else {
    ctx.lineWidth = 3;
    ctx.fillStyle = '#f4e6d0';
    ctx.beginPath();
    ctx.ellipse(0, -32, 12, 13, 0, 0, TURN);
    ctx.fill();
    ctx.stroke();
    if (player.facing !== 4) {
      const faceX = side * (front < 0 ? 9 : 6);
      ctx.fillStyle = '#100d0b';
      ctx.beginPath();
      ctx.ellipse(faceX, -34, 1.3, 2, 0, 0, TURN);
      if (front > 0) {
        const otherEye = faceX - Math.sign(side) * 6;
        ctx.moveTo(otherEye + 1.3, -34);
        ctx.ellipse(otherEye, -34, 1.3, 2, 0, 0, TURN);
      }
      ctx.fill();
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(faceX - side * 2, -30, 3, 0.2, 2.3);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function composeMap(room) {
  const world = document.createElement('canvas');
  world.width = ROOM_WIDTH * 3;
  world.height = ROOM_HEIGHT;
  const ctx = world.getContext('2d');
  ctx.translate(-WEST_EDGE, 0);

  // Sample a clear stretch of parquet from the original room for the new floors.
  const tile = document.createElement('canvas');
  tile.width = 196;
  tile.height = 168;
  tile.getContext('2d').drawImage(room, 445, 456, 196, 168, 0, 0, 196, 168);
  ctx.fillStyle = ctx.createPattern(tile, 'repeat');
  ctx.fillRect(WEST_EDGE, 0, world.width, world.height);
  ctx.drawImage(room, 0, 0, ROOM_WIDTH, ROOM_HEIGHT);

  for (const [index, x] of [WEST_EDGE, ROOM_WIDTH].entries()) {
    const rug = SIDE_RUGS[index];
    ctx.fillStyle = '#3e3740';
    ctx.fillRect(x, 0, ROOM_WIDTH, 18);
    ctx.fillRect(x, 674, ROOM_WIDTH, 11);

    // Reuse the club's rear panelling, baseboard and pillars to frame each room.
    for (let panel = 0; panel < 3; panel++) {
      ctx.drawImage(room, 34, 18, 218, 193, x + panel * 230, 18, 230, 193);
      ctx.drawImage(room, 40, 632, 206, 42, x + panel * 230, 632, 230, 42);
    }
    ctx.drawImage(room, 0, 18, 40, 667, x, 18, 40, 667);
    ctx.drawImage(room, 650, 18, 40, 667, x + ROOM_WIDTH - 40, 18, 40, 667);
    ctx.drawImage(room, 274, 256, 143, 224, rug.x - 46, rug.y - 72, 92, 144);
  }

  ctx.fillStyle = ctx.createPattern(tile, 'repeat');
  for (const seam of [0, ROOM_WIDTH]) {
    ctx.fillRect(seam - 40, PASSAGE_TOP, 80, PASSAGE_BOTTOM - PASSAGE_TOP);
  }
  return world;
}

function drawSpeech(ctx, baron, cameraX, elapsed) {
  const opacity = speechOpacity(baron, elapsed);
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = '600 21px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#20170f';
  ctx.fillStyle = '#fff4d8';

  const lines = [''];
  for (const word of baron.speech.text.split(' ')) {
    const last = lines.length - 1;
    const candidate = lines[last] ? lines[last] + ' ' + word : word;
    if (ctx.measureText(candidate).width > 260 && lines[last]) lines.push(word);
    else lines[last] = candidate;
  }
  const halfWidth = Math.max(...lines.map(line => ctx.measureText(line).width)) / 2 + 12;
  const x = Math.max(cameraX + halfWidth, Math.min(cameraX + ROOM_WIDTH - halfWidth, baron.x));
  lines.forEach((line, i) => {
    const y = baron.y - 70 - (lines.length - 1 - i) * 25;
    ctx.strokeText(line, x, y);
    ctx.fillText(line, x, y);
  });
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.setTransform(canvas.width / ROOM_WIDTH, 0, 0, canvas.height / ROOM_HEIGHT, 0, 0);
  const room = loadSprite('club');
  const figure = loadSprite('player');
  const fallback = loadSprite('baron');
  const baronFrames = Array.from({length: 8}, (_, index) => loadSprite('baron-' + index));

  let world;
  return (player, baron, cameraX, elapsed) => {
    ctx.clearRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    if (isReady(room)) {
      world ??= composeMap(room);
      ctx.drawImage(world, cameraX - WEST_EDGE, 0, ROOM_WIDTH, ROOM_HEIGHT,
        0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    } else {
      ctx.fillStyle = '#ae744c';
      ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    }

    ctx.save();
    ctx.translate(-cameraX, 0);
    // Characters farther up the room are drawn behind those nearer the camera.
    if (player.y < baron.y + 12) {
      drawPlayer(ctx, figure, player, elapsed);
      drawBaron(ctx, baronFrames[baron.facing], fallback, baron, elapsed);
    } else {
      drawBaron(ctx, baronFrames[baron.facing], fallback, baron, elapsed);
      drawPlayer(ctx, figure, player, elapsed);
    }
    drawSpeech(ctx, baron, cameraX, elapsed);
    ctx.restore();
  };
}
