import {CENTER_RUG, EAST_EDGE, ROOM_HEIGHT, ROOM_WIDTH, SIDE_RUGS, WEST_EDGE} from './room.mjs';

const assetNames = [
  'wall-panel', 'end-column', 'base-trim', 'double-door',
  'burgundy-banner', 'red-banner', 'tapestry'
];

export function loadHallArt() {
  const floor = new URLSearchParams(location.search).get('floor') === 'planks'
    ? 'wide-plank' : 'herringbone';
  const art = Object.fromEntries([...assetNames, floor].map(name => {
    const image = new Image();
    image.src = new URL('../assets/hall/' + name + '.webp', import.meta.url);
    return [name === floor ? 'floor' : name, image];
  }));
  art.centerRug = new Image();
  art.centerRug.src = new URL('../assets/club.png', import.meta.url);
  art.wingRug = new Image();
  art.wingRug.src = new URL('../assets/wing-rug.webp', import.meta.url);
  return art;
}

function drawEndColumn(ctx, column, x, facing) {
  const width = 40;
  const top = 18;
  const capHeight = 43;
  const baseTop = 632;
  const baseHeight = 46;
  const shaftStart = 86;
  const baseStart = 274;
  const sourceWidth = column.naturalWidth;

  ctx.save();
  ctx.translate(x, 0);
  ctx.scale(facing, 1);
  // Extend the shaft to span the hall while keeping the carved corners in proportion.
  ctx.drawImage(column, 0, 0, sourceWidth, shaftStart, 0, top, width, capHeight);
  ctx.drawImage(column, 0, shaftStart, sourceWidth, baseStart - shaftStart,
    0, top + capHeight, width, baseTop - top - capHeight);
  ctx.drawImage(column, 0, baseStart, sourceWidth, column.naturalHeight - baseStart,
    0, baseTop, width, baseHeight);
  ctx.restore();
}

export function composeHall(art) {
  const hall = document.createElement('canvas');
  hall.width = EAST_EDGE - WEST_EDGE;
  hall.height = ROOM_HEIGHT;
  const ctx = hall.getContext('2d');
  ctx.translate(-WEST_EDGE, 0);
  ctx.fillStyle = '#302720';
  ctx.fillRect(WEST_EDGE, 0, hall.width, hall.height);

  // Stop the interior halfway under each column so no floor shows on its outer side.
  const wallInset = 20;
  ctx.save();
  ctx.beginPath();
  ctx.rect(WEST_EDGE + wallInset, 0, hall.width - wallInset * 2, hall.height);
  ctx.clip();

  const floor = ctx.createPattern(art.floor, 'repeat');
  const floorScale = art.floor.src.endsWith('/wide-plank.webp') ? 0.66 : 0.53;
  floor.setTransform(new DOMMatrix().scale(floorScale));
  ctx.fillStyle = floor;
  ctx.fillRect(WEST_EDGE, 154, hall.width, 493);

  const wallPanel = art['wall-panel'];
  const baseTrim = art['base-trim'];
  const panelWidth = ROOM_WIDTH / 3;
  // Repeat the painted interior without the sprite's dark side outlines.
  const leftInset = 12;
  const rightInset = 14;
  const trimInset = 12;
  for (let x = WEST_EDGE; x < EAST_EDGE; x += panelWidth) {
    ctx.drawImage(wallPanel, leftInset, 0, wallPanel.naturalWidth - leftInset - rightInset,
      wallPanel.naturalHeight, x, 18, panelWidth, 160);
    ctx.drawImage(baseTrim, trimInset, 0, baseTrim.naturalWidth - trimInset * 2,
      baseTrim.naturalHeight, x, 633, panelWidth, 43);
  }

  const drawCentered = (name, centerX, top, width, height) => {
    ctx.drawImage(art[name], centerX - width / 2, top, width, height);
  };

  drawCentered('double-door', CENTER_RUG.x, 15, 176, 176);
  drawCentered('burgundy-banner', CENTER_RUG.x - 170, 43, 62, 93);
  drawCentered('red-banner', CENTER_RUG.x + 170, 43, 62, 93);
  for (const rug of SIDE_RUGS) drawCentered('tapestry', rug.x, 28, 112, 130);

  ctx.restore();
  drawEndColumn(ctx, art['end-column'], WEST_EDGE, 1);
  drawEndColumn(ctx, art['end-column'], EAST_EDGE, -1);

  ctx.drawImage(art.centerRug, 274, 256, 143, 224, 274, 256, 143, 224);
  for (const rug of SIDE_RUGS) {
    ctx.drawImage(art.wingRug, 289, 199, 961, 624, rug.x - 72, rug.y - 47, 144, 94);
  }
  return hall;
}
