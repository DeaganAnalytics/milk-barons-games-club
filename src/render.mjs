import {createDancerSpeech, dancers, drawDancer} from './dancers.mjs';
import {danceLayers, danceLyric, drawBaronDance, drawDanceBooth, drawDanceFloor} from './dance-floor.mjs';
import {bartender, creameryHatch} from './creamery.mjs';
import {drawMilkAction, drawMilkShards, usesMilkArm} from './milk-service-art.mjs';
import {partySpeech, refillProgress} from './party-chatter.mjs';
import {drawGuestRefill, drawPartyGuest, partyGuests} from './party-guests.mjs';
import {drawPip} from './pip-art.mjs';
import {staffFrame, staffIds} from './staff.mjs';
import {speechBubbleLayout} from './speech-layout.mjs';
import {TURN} from './directions.mjs';
import {isBaronDancing, speechOpacity} from './baron.mjs';
import {DANCE_FLOOR, NORTH_EDGE, ROOM_WIDTH, ROOM_HEIGHT, WEST_EDGE} from './room.mjs';
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

function drawSpeech(ctx, text, opacity, x, headY, feetY, cameraX, cameraY) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = '600 21px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lines = [''];
  for (const word of text.split(' ')) {
    const last = lines.length - 1;
    const candidate = lines[last] ? lines[last] + ' ' + word : word;
    if (ctx.measureText(candidate).width > 290 && lines[last]) lines.push(word);
    else lines[last] = candidate;
  }
  const width = Math.max(...lines.map(line => ctx.measureText(line).width)) + 24;
  const height = (lines.length - 1) * 25 + 40;
  const {left, top, tailX, tailTipX, tailTipY, above} =
    speechBubbleLayout(x, headY, feetY, width, height, cameraX, cameraY);
  const tailBaseY = above ? top + height - 2 : top + 2;
  const tailHalfWidth = above ? 8 : -8;

  ctx.fillStyle = '#20170f';
  ctx.beginPath();
  ctx.roundRect(left, top, width, height, 9);
  ctx.moveTo(tailX + tailHalfWidth, tailBaseY);
  ctx.lineTo(tailTipX, tailTipY);
  ctx.lineTo(tailX - tailHalfWidth, tailBaseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff4d8';
  lines.forEach((line, i) => ctx.fillText(line, left + width / 2, top + 20 + i * 25));
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

function drawGuard(ctx, sprite, guard, elapsed) {
  if (!isReady(sprite)) return;
  const frameX = guard.facing * 100;
  ctx.save();
  ctx.translate(guard.x, guard.y + 22);
  ctx.fillStyle = '#25202a80';
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 3, 0, 0, TURN);
  ctx.fill();

  if (!guard.walking) {
    if (guard.posted) {
      // Anchor the shoes while the shoulders sway and rise slightly.
      const sway = Math.sin(elapsed * 1.05) * 0.022;
      const breath = Math.sin(elapsed * 1.85) * 0.012;
      ctx.translate(0, 2);
      ctx.transform(1, 0, sway, 1 + breath, 0, 0);
      ctx.translate(0, -2);
    }
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

function drawBartender(ctx, sprite, elapsed) {
  if (!isReady(sprite)) return;
  const {width, height, top} = creameryHatch;
  const x = bartender.x - width / 2 + width * 151 / 384;
  const sill = top + height * 245 / 299;
  const breath = Math.sin(elapsed * 1.7) * 1.15;
  const bustHeight = height * 110 / 299 + breath;
  ctx.drawImage(sprite, x, sill - bustHeight, width * 82 / 384, bustHeight);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.setTransform(canvas.width / ROOM_WIDTH, 0, 0, canvas.height / ROOM_HEIGHT, 0, 0);
  const hallArt = loadHallArt();
  const hallImages = Object.values(hallArt);
  const danceArt = Object.fromEntries(danceLayers.map(name => [name, loadSprite('dance/' + name, 'webp')]));
  const danceImages = Object.values(danceArt);
  const dancerSpeech = createDancerSpeech();
  const dancerSprites = dancers.map(({id}) => loadSprite('dance/dancers/' + id, 'webp'));
  const baronDancePose = loadSprite('dance/baron', 'webp');
  const guardSprite = loadSprite('guards/concealed', 'webp');
  const bartenderSprite = loadSprite('hall/creamery-bartender-idle', 'webp');
  const armedGuard = loadSprite('guards/rifle', 'webp');
  const staffSprites = Object.fromEntries(staffIds.map(id => [id, loadSprite('waiters/' + id + '-walk', 'webp')]));
  const emptySprites = Object.fromEntries(staffIds.filter(id => id !== 'edmund-vale')
    .map(id => [id, loadSprite('waiters/' + id + '-empty', 'webp')]));
  const skimVertical = loadSprite('waiters/edmund-vale-vertical-walk', 'webp');
  const partySprites = partyGuests.map(guest => loadSprite('guests/' + guest.id, 'webp'));
  const miloSprite = loadSprite('milo', 'webp');
  const fallback = loadSprite('baron');
  const baronFrames = Array.from({length: 8}, (_, index) => loadSprite('baron-' + index));

  const baronMilkPoses = {
    '-1': loadSprite('baron-milk-left', 'webp'),
    '1': loadSprite('baron-milk-right', 'webp')
  };

  let world;
  return (player, baron, milo, guards, cameraX, cameraY, elapsed, staff = [], milkScene = null, chatter = null) => {
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
    const danceVisible = world && danceImages.every(isReady)
      && DANCE_FLOOR.y + 175 > cameraY && DANCE_FLOOR.y - 345 < cameraY + ROOM_HEIGHT
      && DANCE_FLOOR.x + 235 > cameraX && DANCE_FLOOR.x - 235 < cameraX + ROOM_WIDTH;
    if (danceVisible) drawDanceFloor(ctx, danceArt);
    if (world) drawBartender(ctx, bartenderSprite, elapsed);
    if (milkScene) drawMilkShards(ctx, milkScene);
    const milkPose = usesMilkArm(milkScene) ? baronMilkPoses[milkScene.side] : null;
    const animateBaronArm = milkPose !== null && isReady(milkPose);
    const dancing = !milkScene && isReady(baronDancePose) && isBaronDancing(baron);
    const actors = [
      {depth: player.y + 22, draw: () => drawPip(ctx, player, elapsed)},
      {depth: baron.y + 34, draw: () => {
        if (dancing) drawBaronDance(ctx, baronDancePose, baron, elapsed);
        else drawBaron(ctx, animateBaronArm ? milkPose : baronFrames[baron.facing], fallback, baron, elapsed);
      }},
      {depth: milo.y + 20, draw: () => drawMilo(ctx, miloSprite, milo, elapsed)}
    ];
    for (const guard of guards) {
      actors.push({depth: guard.y + 22, draw: () => drawGuard(ctx, guard.posted ? armedGuard : guardSprite, guard, elapsed)});
    }
    const refill = chatter?.refill;
    const pouring = refill && !refill.route.length;
    const progress = pouring ? refillProgress(refill) : 0;
    for (const member of staff) {
      const usingBottle = pouring && member === refill.server;
      const sprite = member.withoutMilk || usingBottle ? emptySprites[member.id] : staffSprites[member.id];
      actors.push({depth: member.y + 20, draw: () => drawStaff(ctx, sprite, member, elapsed, skimVertical)});
    }
    partyGuests.forEach((guest, index) => {
      let milk = chatter?.milk[index];
      if (pouring && refill.guest === index) {
        const fill = Math.max(0, Math.min(1, (progress - 0.29) / 0.46));
        milk += (0.85 - milk) * fill;
      }
      actors.push({depth: guest.y, draw: () => drawPartyGuest(ctx, guest, partySprites[index], elapsed, milk, pouring)});
    });
    if (danceVisible) {
      actors.push({depth: DANCE_FLOOR.y - 175, draw: () => drawDanceBooth(ctx, danceArt, elapsed)});
      dancers.forEach((dancer, index) => {
        const sprite = dancerSprites[index];
        if (isReady(sprite)) actors.push({depth: dancer.y, draw: () => drawDancer(ctx, sprite, dancer, elapsed)});
      });
    }
    actors.sort((first, second) => first.depth - second.depth);
    for (const actor of actors) actor.draw();
    if (milkScene) drawMilkAction(ctx, milkScene, baron, animateBaronArm);
    if (pouring) drawGuestRefill(ctx, partyGuests[refill.guest], partySprites[refill.guest], refill.server, progress);
    if (danceVisible) {
      const lyric = danceLyric(elapsed);
      if (lyric.x >= cameraX && lyric.x <= cameraX + ROOM_WIDTH
          && lyric.y >= cameraY && lyric.y <= cameraY + ROOM_HEIGHT) {
        drawSpeech(ctx, lyric.text, lyric.opacity, lyric.x, lyric.y, lyric.y + 110, cameraX, cameraY);
      }
    }
    if (danceVisible) {
      const speech = dancerSpeech(elapsed);
      if (speech && isReady(dancerSprites[dancers.indexOf(speech.dancer)])
          && speech.x >= cameraX && speech.x <= cameraX + ROOM_WIDTH
          && speech.dancer.y >= cameraY && speech.headY <= cameraY + ROOM_HEIGHT) {
        drawSpeech(ctx, speech.text, speech.opacity, speech.x, speech.headY, speech.dancer.y, cameraX, cameraY);
      }
    }
    if (baron.speech) {
      drawSpeech(ctx, baron.speech.text, speechOpacity(baron, cameraX, elapsed, cameraY),
        baron.x, baron.y - 61, baron.y + 34, cameraX, cameraY);
    }
    const speech = chatter && partySpeech(chatter, {x: cameraX, y: cameraY});
    if (speech) drawSpeech(ctx, speech.text, speech.opacity,
      speech.guest.x, speech.guest.y - 68, speech.guest.y, cameraX, cameraY);
    ctx.restore();
  };
}
