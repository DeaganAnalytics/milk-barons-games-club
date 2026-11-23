import {bartender, creameryHatch} from './creamery.mjs';
import {HALL_CENTER, EAST_EDGE, MAP_HEIGHT, NORTH_EDGE, ROOM_WIDTH, RUGS, SIDE_RUGS, SOUTH_TRIM_Y, WEST_EDGE} from './room.mjs';

const assetNames = [
  'wall-panel', 'end-column', 'base-trim', 'double-door',
  'burgundy-banner', 'red-banner', 'tapestry', 'creamery-hatch', 'creamery-sign'
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

function drawEndColumn(ctx, column, x, facing, top, baseTop) {
  const width = 40;
  const capHeight = 43;
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
  hall.height = MAP_HEIGHT;
  const ctx = hall.getContext('2d');
  ctx.translate(-WEST_EDGE, -NORTH_EDGE);
  ctx.fillStyle = '#302720';
  ctx.fillRect(WEST_EDGE, NORTH_EDGE, hall.width, hall.height);

  // Stop the interior halfway under each column so no floor shows on its outer side.
  const wallInset = 20;
  ctx.save();
  ctx.beginPath();
  ctx.rect(WEST_EDGE + wallInset, NORTH_EDGE, hall.width - wallInset * 2, hall.height);
  ctx.clip();

  const floor = ctx.createPattern(art.floor, 'repeat');
  const floorScale = art.floor.src.endsWith('/wide-plank.webp') ? 0.66 : 0.53;
  floor.setTransform(new DOMMatrix().scale(floorScale));
  ctx.fillStyle = floor;
  ctx.fillRect(WEST_EDGE, NORTH_EDGE + 154, hall.width, SOUTH_TRIM_Y + 14 - NORTH_EDGE - 154);

  const wallPanel = art['wall-panel'];
  const baseTrim = art['base-trim'];
  const panelWidth = ROOM_WIDTH / 3;
  // Repeat the painted interior without the sprite's dark side outlines.
  const leftInset = 12;
  const rightInset = 14;
  const trimInset = 12;
  for (let x = WEST_EDGE; x < EAST_EDGE; x += panelWidth) {
    ctx.drawImage(wallPanel, leftInset, 0, wallPanel.naturalWidth - leftInset - rightInset,
      wallPanel.naturalHeight, x, NORTH_EDGE + 18, panelWidth, 160);
    ctx.drawImage(baseTrim, trimInset, 0, baseTrim.naturalWidth - trimInset * 2,
      baseTrim.naturalHeight, x, SOUTH_TRIM_Y, panelWidth, 43);
  }

  const drawCentered = (name, centerX, top, width, height) => {
    ctx.drawImage(art[name], centerX - width / 2, top, width, height);
  };

  drawCentered('creamery-hatch', bartender.x, creameryHatch.top, creameryHatch.width, creameryHatch.height);
  drawCentered('creamery-sign', bartender.x, NORTH_EDGE + 22, 166, 19);
  drawCentered('double-door', HALL_CENTER.x, NORTH_EDGE + 15, 176, 176);
  drawCentered('burgundy-banner', HALL_CENTER.x - 170, NORTH_EDGE + 43, 62, 93);
  drawCentered('red-banner', HALL_CENTER.x + 170, NORTH_EDGE + 43, 62, 93);
  for (const rug of SIDE_RUGS) drawCentered('tapestry', rug.x, NORTH_EDGE + 28, 112, 130);

  ctx.restore();
  const column = art['end-column'];
  drawEndColumn(ctx, column, WEST_EDGE, 1, NORTH_EDGE + 18, SOUTH_TRIM_Y - 1);
  drawEndColumn(ctx, column, EAST_EDGE, -1, NORTH_EDGE + 18, SOUTH_TRIM_Y - 1);

  for (const rug of RUGS) {
    if (rug.small) {
      ctx.save();
      ctx.translate(rug.x, rug.y);
      if (!rug.horizontal) ctx.rotate(Math.PI / 2);
      ctx.drawImage(art.wingRug, 289, 199, 961, 624, -72, -47, 144, 94);
      ctx.restore();
    } else {
      ctx.drawImage(art.centerRug, 274, 256, 143, 224, rug.x - 143 / 2, rug.y - 112, 143, 224);
    }
  }
  return hall;
}
