import {FACING_STEP, TURN} from './directions.mjs';
import {speechOpacity} from './baron.mjs';
import {EAST_EDGE, ROOM_WIDTH, ROOM_HEIGHT, SIDE_RUGS, WEST_EDGE} from './room.mjs';

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

// Foreground outlines in club.png keep the original furnishings over the new floor.
const clubForeground = [
  [[30, 18], [254, 18], [254, 4], [437, 4], [437, 18], [660, 18], [660, 176],
    [548, 176], [535, 195], [530, 207], [506, 210], [491, 203], [480, 177], [429, 177],
    [426, 185], [254, 185], [254, 177], [204, 177], [199, 198], [182, 210],
    [167, 209], [153, 198], [146, 177], [30, 177]],
  [[82, 276], [98, 248], [123, 245], [140, 275], [155, 283], [176, 283], [188, 272], [193, 248],
    [221, 249], [239, 269], [238, 300], [231, 315], [230, 352], [246, 367],
    [242, 403], [230, 433], [217, 437], [203, 424], [198, 390], [143, 389],
    [129, 421], [106, 439], [91, 430], [79, 408], [79, 378], [89, 359], [84, 330]],
  [[457, 270], [472, 249], [490, 243], [513, 271], [525, 280], [553, 280], [565, 270], [571, 245],
    [593, 247], [605, 265], [608, 290], [599, 314], [601, 350], [612, 365],
    [608, 397], [597, 422], [578, 434], [564, 424], [561, 391], [514, 389],
    [508, 416], [491, 434], [476, 435], [465, 418], [451, 406], [444, 383],
    [448, 367], [456, 352], [449, 322]],
  [[52, 505], [58, 492], [68, 488], [72, 462], [80, 453], [119, 453],
    [126, 472], [126, 498], [153, 498], [157, 478], [173, 471], [201, 473],
    [207, 486], [207, 498], [278, 498], [296, 510], [296, 546], [287, 574],
    [272, 585], [263, 608], [247, 627], [224, 627], [212, 609], [211, 594],
    [197, 595], [189, 614], [178, 628], [151, 628], [140, 614], [138, 595],
    [125, 595], [119, 617], [101, 630], [79, 624], [70, 602], [54, 589], [50, 563]],
  [[33, 632], [256, 632], [256, 621], [290, 621], [290, 645], [400, 645],
    [400, 621], [435, 621], [435, 632], [657, 632], [657, 685], [33, 685]]
];

function drawClubForeground(ctx, room) {
  ctx.save();
  ctx.beginPath();
  for (const [first, ...points] of clubForeground) {
    ctx.moveTo(...first);
    for (const point of points) ctx.lineTo(...point);
    ctx.closePath();
  }
  ctx.clip();
  ctx.drawImage(room, 0, 0);
  ctx.restore();
}

function drawWingTrim(ctx, room, x) {
  ctx.fillStyle = '#c9aa7d';
  ctx.fillRect(x, 18, ROOM_WIDTH, 156);
  ctx.fillStyle = '#ead6ac';
  ctx.fillRect(x, 24, ROOM_WIDTH, 13);
  ctx.fillStyle = '#816444';
  ctx.fillRect(x, 38, ROOM_WIDTH, 4);
  for (let panelX = x + 26; panelX < x + ROOM_WIDTH - 130; panelX += 160) {
    ctx.fillStyle = '#a28154';
    ctx.fillRect(panelX, 48, 144, 108);
    ctx.fillStyle = '#e1c69c';
    ctx.fillRect(panelX + 4, 52, 136, 100);
    ctx.fillStyle = '#ecd5aa';
    ctx.fillRect(panelX + 13, 61, 118, 82);
  }
  ctx.fillStyle = '#e6cda5';
  ctx.fillRect(x, 160, ROOM_WIDTH, 10);
  ctx.fillStyle = '#8a653e';
  ctx.fillRect(x, 170, ROOM_WIDTH, 7);
  ctx.drawImage(room, 44, 632, 209, 42, x, 632, ROOM_WIDTH, 42);
}

function composeMap(room, parquet, wingRug) {
  const world = document.createElement('canvas');
  world.width = ROOM_WIDTH * 3;
  world.height = ROOM_HEIGHT;
  const ctx = world.getContext('2d');
  ctx.fillStyle = '#3e3740';
  ctx.fillRect(0, 0, world.width, world.height);
  ctx.fillStyle = ctx.createPattern(parquet, 'repeat');
  ctx.fillRect(0, 160, world.width, 486);
  ctx.translate(-WEST_EDGE, 0);

  drawWingTrim(ctx, room, WEST_EDGE);
  drawWingTrim(ctx, room, ROOM_WIDTH);
  drawWingTrim(ctx, room, 0);
  drawClubForeground(ctx, room);
  ctx.drawImage(room, 0, 18, 32, 667, WEST_EDGE, 18, 32, 667);
  ctx.drawImage(room, 658, 18, 32, 667, EAST_EDGE - 32, 18, 32, 667);

  ctx.drawImage(room, 274, 256, 143, 224, 274, 256, 143, 224);
  for (const rug of SIDE_RUGS) {
    ctx.drawImage(wingRug, 289, 199, 961, 624, rug.x - 72, rug.y - 47, 144, 94);
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

function drawMilo(ctx, sprite, milo, elapsed) {
  if (!isReady(sprite)) return;
  const motion = milo.route.length ? Math.sin(milo.stride) : 0;
  const lift = milo.route.length ? Math.abs(motion) * 2 : Math.sin(elapsed * 2.4) * 0.5;
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

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.setTransform(canvas.width / ROOM_WIDTH, 0, 0, canvas.height / ROOM_HEIGHT, 0, 0);
  const room = loadSprite('club');
  const parquet = loadSprite('parquet');
  const wingRug = loadSprite('wing-rug', 'webp');
  const miloSprite = loadSprite('milo', 'webp');
  const figure = loadSprite('player');
  const fallback = loadSprite('baron');
  const baronFrames = Array.from({length: 8}, (_, index) => loadSprite('baron-' + index));

  let world;
  return (player, baron, milo, cameraX, elapsed) => {
    ctx.clearRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    if ([room, parquet, wingRug].every(isReady)) {
      world ??= composeMap(room, parquet, wingRug);
      ctx.drawImage(world, cameraX - WEST_EDGE, 0, ROOM_WIDTH, ROOM_HEIGHT,
        0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    } else {
      ctx.fillStyle = '#ae744c';
      ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    }

    ctx.save();
    ctx.translate(-cameraX, 0);
    const actors = [
      {depth: player.y + 22, draw: () => drawPlayer(ctx, figure, player, elapsed)},
      {depth: baron.y + 34, draw: () => drawBaron(ctx, baronFrames[baron.facing], fallback, baron, elapsed)},
      {depth: milo.y + 20, draw: () => drawMilo(ctx, miloSprite, milo, elapsed)}
    ];
    actors.sort((first, second) => first.depth - second.depth);
    for (const actor of actors) actor.draw();
    drawSpeech(ctx, baron, cameraX, elapsed);
    ctx.restore();
  };
}
