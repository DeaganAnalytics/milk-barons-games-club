import {waiterFrame} from './waiters.mjs';
import {speechTop} from './speech-layout.mjs';
import {FACING_STEP, TURN} from './directions.mjs';
import {speechOpacity} from './baron.mjs';
import {NORTH_EDGE, ROOM_WIDTH, ROOM_HEIGHT, WEST_EDGE} from './room.mjs';
import {composeHall, loadHallArt} from './hall-art.mjs';

function loadSprite(name, extension = "png") {
  const image = new Image();
  image.src = new URL('../assets/' + name + '.' + extension, import.meta.url);
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

function drawSpeech(ctx, baron, cameraX, cameraY, elapsed) {
  const opacity = speechOpacity(baron, cameraX, elapsed, cameraY);
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
  const top = speechTop(baron.y, cameraY, lines.length);
  lines.forEach((line, i) => {
    const y = top + i * 25;
    ctx.strokeText(line, x, y);
    ctx.fillText(line, x, y);
  });
  ctx.restore();
}

function drawMilo(ctx, sprite, milo, elapsed) {
  if (!isReady(sprite)) return;
  const motion = milo.route.length ? Math.sin(milo.stride) : 0;
  const lift = milo.route.length ? Math.abs(motion) * (milo.fleeing ? 4 : 2) : Math.sin(elapsed * 2.4) * 0.5;
  ctx.save();
  ctx.translate(milo.x, milo.y + 20);
  ctx.fillStyle = '#25202a80';
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 3, 0, 0, TURN);
  ctx.fill();
  ctx.translate(0, -lift);
  ctx.scale(milo.facingLeft ? -1 : 1, 1);
  ctx.rotate(motion * 0.035);
  ctx.drawImage(sprite, 375, 431, 275, 669, -14, -66, 28, 66);
  ctx.restore();
}

function drawGuardStep(ctx, sprite, sourceX, sourceWidth, hipY, swing, sideView) {
  const scaleX = 42 / 100;
  const scaleY = 86 / 200;
  const legHeight = (200 - 142) * scaleY;
  const reach = swing * (sideView ? 7 : 2.5);
  const lift = Math.max(0, swing) * 3.5;

  ctx.save();
  ctx.translate(sourceX % 100 * scaleX - 21, hipY);
  // The hip stays attached to the jacket as the foot swings and lifts.
  ctx.transform(1, 0, reach / legHeight, 1, 0, 0);
  ctx.drawImage(sprite, sourceX, 142, sourceWidth, 58, 0, 0, sourceWidth * scaleX, legHeight - lift);
  ctx.restore();
}

function drawGuard(ctx, sprite, guard) {
  if (!isReady(sprite)) return;
  const frameX = guard.facing * 100;
  ctx.save();
  ctx.translate(guard.x, guard.y + 22);
  ctx.fillStyle = '#25202a80';
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 3, 0, 0, TURN);
  ctx.fill();

  if (!guard.walking) {
    ctx.drawImage(sprite, frameX, 0, 100, 200, -21, -84, 42, 86);
  } else {
    const step = Math.sin(guard.stride);
    const sideView = guard.facing % 2 === 1;
    const top = -84 - Math.abs(step) * 1.3;
    const hipY = top + 142 * (86 / 200);
    if (sideView) {
      // The side-on idle art has one leg silhouette. Draw it twice in opposite phases.
      drawGuardStep(ctx, sprite, frameX, 100, hipY, -step, true);
      drawGuardStep(ctx, sprite, frameX, 100, hipY, step, true);
    } else {
      drawGuardStep(ctx, sprite, frameX, 50, hipY, step, false);
      drawGuardStep(ctx, sprite, frameX + 50, 50, hipY, -step, false);
    }
    ctx.drawImage(sprite, frameX, 0, 100, 142, -21, top, 42, hipY - top);
  }
  ctx.restore();
}

function drawWaiter(ctx, sprite, waiter, elapsed) {
  if (!isReady(sprite)) return;
  const {column, row} = waiterFrame(waiter, elapsed);
  ctx.save();
  ctx.translate(waiter.x, waiter.y + 20);
  ctx.scale(waiter.facing, 1);
  ctx.drawImage(sprite, column * 128, row * 160, 128, 160, -38.4, -87, 76.8, 96);
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.setTransform(canvas.width / ROOM_WIDTH, 0, 0, canvas.height / ROOM_HEIGHT, 0, 0);
  const hallArt = loadHallArt();
  const hallImages = Object.values(hallArt);
  const guardSprite = loadSprite('guards/concealed', 'webp');
  const waiterSprites = Object.fromEntries(['male-waiter', 'female-waiter'].map(id => [id, loadSprite('waiters/' + id + '-walk', 'webp')]));
  const miloSprite = loadSprite('milo', 'webp');
  const figure = loadSprite('player');
  const fallback = loadSprite('baron');
  const baronFrames = Array.from({length: 8}, (_, index) => loadSprite('baron-' + index));

  let world;
  return (player, baron, milo, guards, cameraX, cameraY, elapsed, waiters = []) => {
    ctx.clearRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    if (world || hallImages.every(isReady)) {
      world ??= composeHall(hallArt);
      ctx.drawImage(world, cameraX - WEST_EDGE, cameraY - NORTH_EDGE, ROOM_WIDTH, ROOM_HEIGHT,
        0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    } else {
      ctx.fillStyle = '#ae744c';
      ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    }

    ctx.save();
    ctx.translate(-cameraX, -cameraY);
    const actors = [
      {depth: player.y + 22, draw: () => drawPlayer(ctx, figure, player, elapsed)},
      {depth: baron.y + 34, draw: () => drawBaron(ctx, baronFrames[baron.facing], fallback, baron, elapsed)},
      {depth: milo.y + 20, draw: () => drawMilo(ctx, miloSprite, milo, elapsed)}
    ];
    for (const guard of guards) {
      actors.push({depth: guard.y + 22, draw: () => drawGuard(ctx, guardSprite, guard)});
    }
    for (const waiter of waiters) {
      actors.push({depth: waiter.y + 20, draw: () => drawWaiter(ctx, waiterSprites[waiter.id], waiter, elapsed)});
    }
    actors.sort((first, second) => first.depth - second.depth);
    for (const actor of actors) actor.draw();
    drawSpeech(ctx, baron, cameraX, cameraY, elapsed);
    ctx.restore();
  };
}
