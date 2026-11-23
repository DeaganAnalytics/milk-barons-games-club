import {CENTER_RUG, EAST_EDGE, ROOM_HEIGHT, ROOM_WIDTH, SIDE_RUGS, WEST_EDGE} from './room.mjs';

const assetNames = [
  'wall-panel', 'end-column', 'base-trim', 'double-door', 'service-door',
  'center-rug', 'wing-rug', 'burgundy-banner', 'red-banner', 'tapestry'
];

export function loadHallArt() {
  const floor = new URLSearchParams(location.search).get('floor') === 'planks'
    ? 'wide-plank' : 'herringbone';
  return Object.fromEntries([...assetNames, floor].map(name => {
    const image = new Image();
    image.src = new URL('../assets/hall/' + name + '.webp', import.meta.url);
    return [name === floor ? 'floor' : name, image];
  }));
}

export function composeHall(art) {
  const hall = document.createElement('canvas');
  hall.width = EAST_EDGE - WEST_EDGE;
  hall.height = ROOM_HEIGHT;
  const ctx = hall.getContext('2d');
  ctx.translate(-WEST_EDGE, 0);
  ctx.fillStyle = '#302720';
  ctx.fillRect(WEST_EDGE, 0, hall.width, hall.height);

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
  drawCentered('service-door', SIDE_RUGS[0].x, 38, 81, 134);
  drawCentered('burgundy-banner', CENTER_RUG.x - 170, 43, 62, 93);
  drawCentered('red-banner', CENTER_RUG.x + 170, 43, 62, 93);
  drawCentered('tapestry', SIDE_RUGS[1].x, 28, 112, 130);

  ctx.drawImage(art['end-column'], WEST_EDGE, 17, 37, 662);
  ctx.save();
  ctx.translate(EAST_EDGE, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(art['end-column'], 0, 17, 37, 662);
  ctx.restore();

  drawCentered('center-rug', CENTER_RUG.x, CENTER_RUG.y - 120, 164, 240);
  for (const rug of SIDE_RUGS) drawCentered('wing-rug', rug.x, rug.y - 37, 180, 74);
  return hall;
}
