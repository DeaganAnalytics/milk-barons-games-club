import {drawMilkAction, drawMilkShards} from './milk-service-art.mjs';
import {drawPip} from './pip-art.mjs';
import {staffFrame, staffIds} from './staff.mjs';
import {speechTop} from './speech-layout.mjs';
import {TURN} from './directions.mjs';
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

function drawStaff(ctx, sprite, member, elapsed, verticalSprite) {
  const frame = staffFrame(member, elapsed);
  const useVertical = frame.vertical && isReady(verticalSprite);
  const {column} = frame;
  const row = frame.vertical && !useVertical ? 0 : frame.row;
  if (useVertical) sprite = verticalSprite;
  if (!isReady(sprite)) return;
  ctx.save();
  ctx.translate(member.x, member.y + 20);
  if (!useVertical) ctx.scale(member.facing, 1);
  const frameWidth = sprite.naturalWidth / 6;
  const frameHeight = sprite.naturalHeight / 2;
  ctx.drawImage(sprite, column * frameWidth, row * frameHeight, frameWidth, frameHeight,
    -38.4, -87, 76.8, 96);
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
  const staffSprites = Object.fromEntries(staffIds.map(id => [id, loadSprite('waiters/' + id + '-walk', 'webp')]));
  const emptySprites = Object.fromEntries(staffIds.filter(id => id !== 'edmund-vale')
    .map(id => [id, loadSprite('waiters/' + id + '-empty', 'webp')]));
  const skimVertical = loadSprite('waiters/edmund-vale-vertical-walk', 'webp');
  const miloSprite = loadSprite('milo', 'webp');
  const fallback = loadSprite('baron');
  const baronFrames = Array.from({length: 8}, (_, index) => loadSprite('baron-' + index));

  let world;
  return (player, baron, milo, guards, cameraX, cameraY, elapsed, staff = [], milkScene = null) => {
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
    if (milkScene) drawMilkShards(ctx, milkScene);
    const actors = [
      {depth: player.y + 22, draw: () => drawPip(ctx, player, elapsed)},
      {depth: baron.y + 34, draw: () => drawBaron(ctx, baronFrames[baron.facing], fallback, baron, elapsed)},
      {depth: milo.y + 20, draw: () => drawMilo(ctx, miloSprite, milo, elapsed)}
    ];
    for (const guard of guards) {
      actors.push({depth: guard.y + 22, draw: () => drawGuard(ctx, guardSprite, guard)});
    }
    for (const member of staff) {
      const sprite = member.withoutMilk ? emptySprites[member.id] : staffSprites[member.id];
      actors.push({depth: member.y + 20, draw: () => drawStaff(ctx, sprite, member, elapsed, skimVertical)});
    }
    actors.sort((first, second) => first.depth - second.depth);
    for (const actor of actors) actor.draw();
    if (milkScene) drawMilkAction(ctx, milkScene, baron);
    drawSpeech(ctx, baron, cameraX, cameraY, elapsed);
    ctx.restore();
  };
}
