import {createRangeSpeech} from './practice-range-speech.mjs';
import {drawRangeBoundary, drawRangeLane} from './practice-range-art.mjs';
import {createSlotSpeech} from './slot-speech.mjs';
import {drawSlotStation, sleepingGamblerTarget, slotPlayers} from './slot-machines.mjs';
import {drawElias, elias} from './elias.mjs';
import {drawMilkBalloon, guardBalloonPose, milkBalloonHand} from './milk-balloon.mjs';
import {createPillorySpeech} from './pillory.mjs';
import {createProfessorSpeech, drawProfessor, professorHeight} from './professor.mjs';
import {drawMilkFountain, fountainHeight, fountainWidth} from './milk-fountain.mjs';
import {createMilkPool, drawMilkPool, lifeguard, milkPoolSpeech, remainingClothing} from './milk-pool.mjs';
import {ropeWarningSpeech} from './rope-warning.mjs';
import {drawPipFall, drawRopeAim} from './rope-scene-art.mjs';
import {drawGuestRopes} from './guest-escort.mjs';
import {createDancerSpeech, dancers, drawDancer} from './dancers.mjs';
import {danceLayers, danceLyric, drawBaronDance, drawDanceBooth, drawDanceFloor} from './dance-floor.mjs';
import {bartender, creameryHatch, drunkGuardSpeech} from './creamery.mjs';
import {attendantGlassPose, drawAttendantMilk, drawEmptyServiceGlass, drawMilkAction, drawMilkShards, usesMilkArm} from './milk-service-art.mjs';
import {partySpeech, refillProgress} from './party-chatter.mjs';
import {drawGuestRefill, drawPartyGuest, partyGuests} from './party-guests.mjs';
import {drawPip} from './pip-art.mjs';
import {staffFrame, staffIds} from './staff.mjs';
import {speechBubbleLayout} from './speech-layout.mjs';
import {TURN} from './directions.mjs';
import {isBaronDancing, isOnscreen, speechOpacity} from './baron.mjs';
import {DANCE_FLOOR, guestEnclosure, MILK_BAG_BASKET, MILK_FOUNTAIN, MILK_POOL, NORTH_EDGE, PILLORY, PILLORY_ATTENDANT, PRACTICE_RANGE, professorFeet, ROOM_WIDTH, ROOM_HEIGHT, SLOT_STATIONS, WEST_EDGE} from './room.mjs';
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
  if (milo.injured) {
    ctx.fillStyle = '#734066ad';
    ctx.beginPath();
    ctx.ellipse(-5.5, -51.5, 4.3, 3.5, -0.3, 0, TURN);
    ctx.ellipse(5.5, -47.5, 3.1, 2.1, -0.42, 0, TURN);
    ctx.fill();
    ctx.strokeStyle = '#853f44';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(5, -45.7);
    ctx.lineTo(8.4, -48.4);
    ctx.moveTo(0.5, -43.7);
    ctx.lineTo(2.1, -43.4);
    ctx.stroke();
  }
  ctx.restore();
}

function withoutRestingArm(ctx, left, top, width, height, draw) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(left - 100, top - 100, 200 + width, 200 + height);
  ctx.rect(left, top, width, height);
  ctx.clip('evenodd');
  draw();
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
    if (guard.drunk) {
      const sway = Math.sin(elapsed * 2.6) * 0.13 + Math.sin(elapsed * 4.1) * 0.035;
      ctx.rotate(sway);
      ctx.scale(1, 0.97 + Math.cos(elapsed * 3.2) * 0.02);
    } else if (guard.posted) {
      // Anchor the shoes while the shoulders sway and rise slightly.
      const sway = Math.sin(elapsed * 1.05) * 0.022;
      const breath = Math.sin(elapsed * 1.85) * 0.012;
      ctx.translate(0, 2);
      ctx.transform(1, 0, sway, 1 + breath, 0, 0);
      ctx.translate(0, -2);
    }
    if (guard.poolWatch && (elapsed - guard.poolWatch.start) % 2.5 < 1.35) {
      const pump = Math.sin((elapsed - guard.poolWatch.start) * 15);
      ctx.translate(0, -Math.max(0, pump) * 3);
      // Replace the resting sleeves with raised arms, then draw the suit over the shoulders.
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const side of [-1, 1]) {
        const fistY = -61 - pump * 5;
        ctx.beginPath();
        ctx.moveTo(side * 9, -52);
        ctx.lineTo(side * 19, -46);
        ctx.lineTo(side * 21, fistY);
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#211a17';
        ctx.stroke();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#38404b';
        ctx.stroke();
        ctx.fillStyle = '#b27953';
        ctx.beginPath();
        ctx.arc(side * 21, fistY - 2, 3.5, 0, TURN);
        ctx.fill();
      }
      for (const [x, y, width, height] of [[0, 0, 100, 60], [31, 60, 38, 80], [0, 140, 100, 60]]) {
        ctx.drawImage(sprite, frameX + x, y, width, height, -21 + x * 0.42, -84 + y * 0.43, width * 0.42, height * 0.43);
      }
    } else {
      ctx.drawImage(sprite, frameX, 0, 100, 200, -21, -84, 42, 86);
    }
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

export function createRenderer(canvas, onCowGuardSeen, sleepingGambler) {
  let seenCowGuard = false;
  const danceGuardIndex = dancers.findIndex(dancer => dancer.id === 'guard');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.setTransform(canvas.width / ROOM_WIDTH, 0, 0, canvas.height / ROOM_HEIGHT, 0, 0);
  const hallArt = loadHallArt();
  const hallImages = Object.values(hallArt);
  const eliasArt = loadSprite('hall/elias', 'webp');
  const rangeSpeech = createRangeSpeech();
  const rangeArt = Object.fromEntries(['aim', 'fire', 'recover'].map(pose =>
    [pose, loadSprite('guards/range-' + pose, 'webp')]));
  rangeArt.targets = [1, 2, 3].map(number => loadSprite('guards/range-protester-' + number, 'webp'));
  const slotArt = loadSprite('slots/milk-slot', 'webp');
  const seatedSlotArt = slotPlayers.map(({id}) => loadSprite('slots/' + id + '-seated', 'webp'));
  const professorArt = loadSprite('hall/professor', 'webp');
  const professorSipping = loadSprite('hall/professor-sipping', 'webp');
  const pillorySpeech = createPillorySpeech();
  const slotSpeech = createSlotSpeech();
  const pilloryProps = [
    {id: 'commissioner', position: PILLORY, width: 92, height: 78, depth: 13,
      art: loadSprite('hall/pillory-commissioner', 'webp'), fallback: loadSprite('hall/pillory', 'webp')},
    {id: 'attendant', position: PILLORY_ATTENDANT, width: 29, height: 86, depth: 10,
      art: loadSprite('hall/pillory-attendant', 'webp')},
    {position: MILK_BAG_BASKET, width: 46, height: 50, depth: 10, art: loadSprite('hall/milk-bag-basket', 'webp')}
  ];
  const fountainArt = loadSprite('hall/milk-fountain', 'webp');
  const poolArt = loadSprite('pool/milk-pool', 'webp');
  const lifeguardArt = loadSprite('pool/lifeguard', 'webp');
  const poolClothes = {
    intact: loadSprite('pool/clothes', 'webp'),
    man: loadSprite('pool/clothes-man', 'webp'),
    women: loadSprite('pool/clothes-women', 'webp')
  };
  const poolHeads = ['brunette', 'blonde'].map(id => loadSprite('pool/' + id, 'webp'));
  const idlePool = createMilkPool();
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

  const professorSpeech = createProfessorSpeech();
  let world;
  return (player, baron, milo, guards, cameraX, cameraY, elapsed, staff = [], milkScene = null, chatter = null, guestEscort = null, ropeWarning = null, gateGuard = null, milkPool = idlePool, milkBalloon = null, attendantMilk = null, rangeFall = null) => {
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
    const poolVisible = isReady(poolArt) && MILK_POOL.x + 239 > cameraX && MILK_POOL.x - 297 < cameraX + ROOM_WIDTH
      && MILK_POOL.y + 64 > cameraY && MILK_POOL.y - 202 < cameraY + ROOM_HEIGHT;
    const rangeVisible = PRACTICE_RANGE.west <= cameraX + ROOM_WIDTH && PRACTICE_RANGE.east >= cameraX
      && PRACTICE_RANGE.north - 48 <= cameraY + ROOM_HEIGHT && PRACTICE_RANGE.south >= cameraY;
    if (onCowGuardSeen && !seenCowGuard) {
      const inView = (x, top, bottom, halfWidth) =>
        x + halfWidth > cameraX && x - halfWidth < cameraX + ROOM_WIDTH
        && bottom > cameraY && top < cameraY + ROOM_HEIGHT;
      const danceGuard = dancers[danceGuardIndex];
      seenCowGuard = guards.some(guard => isReady(guard.posted ? armedGuard : guardSprite)
        && inView(guard.x, guard.y - 63, guard.y + 24, 21))
        || (poolVisible && isReady(lifeguardArt)
          && inView(lifeguard.x, lifeguard.y - 58, lifeguard.y, 56 * lifeguardArt.naturalWidth / lifeguardArt.naturalHeight / 2))
        || (danceVisible && isReady(dancerSprites[danceGuardIndex])
          && inView(danceGuard.x, danceGuard.y - danceGuard.height, danceGuard.y, 24));
      seenCowGuard ||= rangeVisible && isReady(rangeArt.aim) && PRACTICE_RANGE.lanes.some(y =>
        inView(PRACTICE_RANGE.guardX, y - 66, y, 22));
      if (seenCowGuard) onCowGuardSeen();
    }
    if (poolVisible) {
      const clothes = milkPool.stolenClothing ? poolClothes[remainingClothing[milkPool.stolenClothing]] : poolClothes.intact;
      drawMilkPool(ctx, poolArt, elapsed, milkPool, poolHeads, clothes, lifeguardArt);
    }
    if (rangeVisible) drawRangeBoundary(ctx);
    if (danceVisible) drawDanceFloor(ctx, danceArt);
    if (guestEnclosure.active) drawGuestRopes(ctx, guestEnclosure, false);
    if (world) drawBartender(ctx, bartenderSprite, elapsed);
    if (milkScene) drawMilkShards(ctx, milkScene);
    const milkPose = usesMilkArm(milkScene) ? baronMilkPoses[milkScene.side] : null;
    const animateBaronArm = milkPose !== null && isReady(milkPose);
    const dancing = !milkScene && isReady(baronDancePose) && isBaronDancing(baron);
    const ropeScene = ropeWarning?.scene;
    const pipFalling = ropeScene?.phase === 'fall' || ropeScene?.phase === 'over';
    const actors = [
      {depth: player.y + 22, draw: () => rangeFall || pipFalling ? drawPipFall(ctx, player, rangeFall ?? ropeScene, drawPip) : drawPip(ctx, player, elapsed, milkBalloon && !milkBalloon.attendant && !milkBalloon.guard ? milkBalloonHand(milkBalloon, player) : null)},
      {depth: baron.y + 34, draw: () => {
        if (dancing) drawBaronDance(ctx, baronDancePose, baron, elapsed);
        else drawBaron(ctx, animateBaronArm ? milkPose : baronFrames[baron.facing], fallback, baron, elapsed);
      }},
      {depth: milo.y + 20, draw: () => drawMilo(ctx, miloSprite, milo, elapsed)}
    ];
    if (rangeVisible) PRACTICE_RANGE.lanes.forEach((y, index) => {
      actors.push({depth: y, draw: () => drawRangeLane(ctx, rangeArt, y, elapsed, index)});
    });
    const gamblerPose = sleepingGambler.pose(elapsed);
    SLOT_STATIONS.forEach((station, index) => {
      if (station.x + 39 < cameraX || station.x - 39 > cameraX + ROOM_WIDTH
        || station.y < cameraY || station.y - 148 > cameraY + ROOM_HEIGHT) return;
      actors.push({depth: station.y, draw: () => drawSlotStation(ctx, slotArt, station, seatedSlotArt[index],
        elapsed, index, station.y === sleepingGamblerTarget.y ? gamblerPose : null)});
    });
    const fountainFront = MILK_FOUNTAIN.y + 58;
    if (isReady(fountainArt) && fountainFront >= cameraY && fountainFront - fountainHeight <= cameraY + ROOM_HEIGHT
        && MILK_FOUNTAIN.x + fountainWidth / 2 >= cameraX && MILK_FOUNTAIN.x - fountainWidth / 2 <= cameraX + ROOM_WIDTH) {
      actors.push({depth: fountainFront, draw: () => drawMilkFountain(ctx, fountainArt, elapsed, fountainFront)});
    }
    const eliasFeet = elias.y + 18;
    const eliasHeight = 70;
    if (isReady(eliasArt) && eliasFeet >= cameraY && eliasFeet - eliasHeight <= cameraY + ROOM_HEIGHT
        && elias.x + 18 >= cameraX && elias.x - 18 <= cameraX + ROOM_WIDTH) {
      actors.push({depth: eliasFeet, draw: () => drawElias(ctx, eliasArt, elias)});
    }
    const professorVisible = isReady(professorArt) && professorFeet.y >= cameraY
      && professorFeet.y - professorHeight <= cameraY + ROOM_HEIGHT
      && professorFeet.x >= cameraX && professorFeet.x <= cameraX + ROOM_WIDTH;
    if (isReady(professorArt) && professorFeet.y >= cameraY && professorFeet.y - professorHeight <= cameraY + ROOM_HEIGHT
        && professorFeet.x + 75 >= cameraX && professorFeet.x - 30 <= cameraX + ROOM_WIDTH) {
      actors.push({depth: professorFeet.y, draw: () => drawProfessor(ctx, professorArt, professorSipping, elapsed)});
    }
    const guardThrowPose = guardBalloonPose(milkBalloon);
    const milkPoseAttendant = attendantMilk && !milkBalloon ? attendantGlassPose(attendantMilk) : null;
    const pillorySpeakers = {};
    for (const {id, position, width, height, depth, art, fallback} of pilloryProps) {
      const sprite = isReady(art) ? art : fallback;
      if (!sprite || !isReady(sprite)) continue;
      const movingAttendant = id === 'attendant' ? milkBalloon?.attendant : null;
      const {x, y} = movingAttendant ?? position;
      const front = y + depth;
      const top = front - height;
      if (x + width / 2 < cameraX || x - width / 2 > cameraX + ROOM_WIDTH
          || front < cameraY || top > cameraY + ROOM_HEIGHT) continue;
      if (id && sprite === art && x >= cameraX && x <= cameraX + ROOM_WIDTH) {
        pillorySpeakers[id] = {x, head: top + (id === 'commissioner' ? 8 : 0), front};
      }
      actors.push({depth: front, draw: () => {
        const breath = movingAttendant?.walking ? Math.abs(Math.sin(movingAttendant.stride)) * 2.4
          : id === 'attendant' ? Math.sin(elapsed * 2.4) * 0.8 : 0;
        const sway = movingAttendant?.walking ? Math.sin(movingAttendant.stride) * 1.1
          : id === 'attendant' ? Math.sin(elapsed * 1.6) * 0.4 : 0;
        const left = x - width / 2;
        const draw = () => ctx.drawImage(sprite, left + sway, top - breath, width, height + breath);
        if (id === 'attendant' && milkPoseAttendant?.arm) {
          withoutRestingArm(ctx, x + (milkPoseAttendant.side < 0 ? -16 : 8), y - 32, 8, 24, draw);
        } else draw();
        if (id === 'commissioner' && sprite === art && (elapsed + 1.3) % 5.7 < 0.13) {
          // Blink over the eyes without moving the fixed wooden frame.
          ctx.save();
          ctx.strokeStyle = '#412925';
          ctx.lineWidth = 1.35;
          ctx.lineCap = 'round';
          for (const eye of [0.452, 0.547]) {
            ctx.beginPath();
            ctx.moveTo(left + width * eye - 1.4, top + height * 0.317);
            ctx.lineTo(left + width * eye + 1.4, top + height * 0.317);
            ctx.stroke();
          }
          ctx.restore();
        }
      }});
    }
    for (const guard of guards) {
      actors.push({depth: guard.y + 22, draw: () => {
        if (guard === ropeScene?.guard && ropeScene.phase !== 'approach' && isReady(guardSprite)) {
          drawRopeAim(ctx, guardSprite, ropeScene, player);
        } else if (guardThrowPose && guard === milkBalloon.guard) {
          withoutRestingArm(ctx, guard.x - 19, guard.y - 21, 8, 27,
            () => drawGuard(ctx, guardSprite, guard, elapsed));
          const {shoulder, hand} = guardThrowPose;
          ctx.save();
          ctx.strokeStyle = '#242023';
          ctx.lineWidth = 5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(shoulder.x, shoulder.y);
          ctx.lineTo((shoulder.x + hand.x) / 2 - 2, (shoulder.y + hand.y) / 2 + 3);
          ctx.lineTo(hand.x, hand.y);
          ctx.stroke();
          ctx.fillStyle = '#a66c48';
          ctx.beginPath();
          ctx.arc(hand.x, hand.y, 2.6, 0, TURN);
          ctx.fill();
          ctx.restore();
        } else drawGuard(ctx, guard.posted ? armedGuard : guardSprite, guard, elapsed);
      }});
    }
    const refill = chatter?.refill;
    const pouring = refill && !refill.route.length;
    const progress = pouring ? refillProgress(refill) : 0;
    for (const member of staff) {
      const usingBottle = pouring && member === refill.server;
      const sprite = member.withoutMilk || usingBottle ? emptySprites[member.id] : staffSprites[member.id];
      actors.push({depth: member.y + 20, draw: () => {
        drawStaff(ctx, sprite, member, elapsed, skimVertical);
        if (member.emptyServiceGlass) drawEmptyServiceGlass(ctx, member);
      }});
    }
    partyGuests.forEach((guest, index) => {
      let milk = chatter?.milk[index];
      if (pouring && refill.guest === index) {
        const fill = Math.max(0, Math.min(1, (progress - 0.29) / 0.46));
        milk += (0.85 - milk) * fill;
      }
      actors.push({depth: guest.y, draw: () => {
        ctx.save();
        if (pipFalling && ropeScene.celebrate) ctx.translate(0, -Math.abs(Math.sin(elapsed * 9 + index * 1.8)) * 6);
        drawPartyGuest(ctx, guest, partySprites[index], elapsed, milk, pouring || (pipFalling && ropeScene.celebrate));
        ctx.restore();
      }});
    });
    if (danceVisible) {
      actors.push({depth: DANCE_FLOOR.y - 175, draw: () => drawDanceBooth(ctx, danceArt, elapsed)});
      dancers.forEach((dancer, index) => {
        const sprite = dancerSprites[index];
        if (isReady(sprite)) actors.push({depth: dancer.y, draw: () => drawDancer(ctx, sprite, dancer, elapsed)});
      });
    }
    if (guestEnclosure.active) actors.push({
      depth: guestEnclosure.south, draw: () => drawGuestRopes(ctx, guestEnclosure, true)
    });
    actors.sort((first, second) => first.depth - second.depth);
    for (const actor of actors) actor.draw();
    if (milkPoseAttendant) drawAttendantMilk(ctx, attendantMilk, milkPoseAttendant);
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
      const speech = dancerSpeech(elapsed, baron, isOnscreen(baron, cameraX, cameraY));
      if (speech && (!speech.dancer || isReady(dancerSprites[dancers.indexOf(speech.dancer)]))
          && speech.x >= cameraX && speech.x <= cameraX + ROOM_WIDTH
          && speech.feetY >= cameraY && speech.headY <= cameraY + ROOM_HEIGHT) {
        drawSpeech(ctx, speech.text, speech.opacity, speech.x, speech.headY, speech.feetY, cameraX, cameraY);
      }
    }
    if (baron.speech && !isBaronDancing(baron)) {
      drawSpeech(ctx, baron.speech.text, speechOpacity(baron, cameraX, elapsed, cameraY),
        baron.x, baron.y - 61, baron.y + 34, cameraX, cameraY);
    }
    if (guestEscort?.phase === 'waiting' && guestEscort.guest) {
      const guest = guestEscort.guest;
      drawSpeech(ctx, 'Guard, guard, a peasant is near me!', 1, guest.x, guest.y - 68, guest.y, cameraX, cameraY);
    }
    const creameryGuard = guards.find(guard => guard.creamery);
    if (creameryGuard && !ropeScene && isReady(armedGuard)
      && creameryGuard.x + 21 > cameraX && creameryGuard.x - 21 < cameraX + ROOM_WIDTH
      && creameryGuard.y + 24 > cameraY && creameryGuard.y - 63 < cameraY + ROOM_HEIGHT) {
      const remark = drunkGuardSpeech(creameryGuard, elapsed);
      if (remark) drawSpeech(ctx, remark.text, remark.opacity, creameryGuard.x, creameryGuard.y - 63,
        creameryGuard.y + 22, cameraX, cameraY);
    }
    const warning = ropeWarning && ropeWarningSpeech(ropeWarning);
    if (warning && gateGuard) {
      drawSpeech(ctx, warning.text, 1, gateGuard.x, gateGuard.y - 64, gateGuard.y + 22, cameraX, cameraY);
      if (warning.guest) {
        const [guest] = partyGuests;
        drawSpeech(ctx, warning.guest, 1, guest.x, guest.y - 68, guest.y, cameraX, cameraY);
      }
    }
    if (pipFalling && ropeScene.celebrate) {
      partyGuests.forEach((guest, index) => {
        if (guest.x > cameraX && guest.x < cameraX + ROOM_WIDTH) {
          drawSpeech(ctx, index === 0 ? 'Bravo!' : 'Splendid!', 1, guest.x, guest.y - 75, guest.y, cameraX, cameraY);
        }
      });
    }
    if (milkBalloon) drawMilkBalloon(ctx, milkBalloon, player);
    const stallRemark = pillorySpeech(elapsed, ropeScene || milkBalloon ? {} : pillorySpeakers);
    if (stallRemark) {
      const {x, head, front} = pillorySpeakers[stallRemark.id];
      drawSpeech(ctx, stallRemark.text, stallRemark.opacity, x, head, front, cameraX, cameraY);
    }
    const visibleSlotPlayers = slotPlayers.filter(person => person.x >= cameraX
      && person.x <= cameraX + ROOM_WIDTH && person.y - 80 >= cameraY
      && person.y <= cameraY + ROOM_HEIGHT);
    const slotRemark = slotSpeech(elapsed, visibleSlotPlayers);
    if (slotRemark) {
      const {player: person, text, opacity} = slotRemark;
      drawSpeech(ctx, text, opacity, person.x - 10, person.y - 80, person.y, cameraX, cameraY);
    }
    const gambler = sleepingGamblerTarget;
    if (gamblerPose.remark && gambler.x >= cameraX && gambler.x <= cameraX + ROOM_WIDTH
        && gambler.y - 80 >= cameraY && gambler.y <= cameraY + ROOM_HEIGHT) {
      drawSpeech(ctx, gamblerPose.remark, 1, gambler.x - 23, gambler.y - 80, gambler.y, cameraX, cameraY);
    }
    const rangeRemark = rangeSpeech(elapsed, rangeVisible);
    if (rangeRemark) {
      const y = PRACTICE_RANGE.lanes[rangeRemark.lane];
      if (y - 66 >= cameraY && y <= cameraY + ROOM_HEIGHT && PRACTICE_RANGE.guardX >= cameraX
          && PRACTICE_RANGE.guardX <= cameraX + ROOM_WIDTH) {
        drawSpeech(ctx, rangeRemark.text, rangeRemark.opacity, PRACTICE_RANGE.guardX,
          y - 66, y, cameraX, cameraY);
      }
    }
    const professorRemark = professorSpeech(elapsed, professorVisible && !ropeScene);
    if (professorRemark) {
      drawSpeech(ctx, professorRemark.text, professorRemark.opacity, professorFeet.x,
        professorFeet.y - professorHeight, professorFeet.y, cameraX, cameraY);
    }
    if (poolVisible) {
      const speech = milkPoolSpeech(milkPool, elapsed);
      if (speech && speech.x >= cameraX && speech.x <= cameraX + ROOM_WIDTH
          && speech.y >= cameraY && speech.headY <= cameraY + ROOM_HEIGHT) {
        drawSpeech(ctx, speech.text, 1, speech.x, speech.headY, speech.y, cameraX, cameraY);
      }
    }
    const speech = !guestEscort && !warning && !ropeScene && chatter && partySpeech(chatter, {x: cameraX, y: cameraY});
    if (speech) drawSpeech(ctx, speech.text, speech.opacity,
      speech.guest.x, speech.guest.y - 68, speech.guest.y, cameraX, cameraY);
    ctx.restore();
  };
}
