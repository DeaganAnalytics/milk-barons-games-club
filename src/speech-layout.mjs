import {ROOM_HEIGHT, ROOM_WIDTH} from './room.mjs';

export function speechBubbleLayout(x, headY, feetY, width, height, cameraX, cameraY) {
  const margin = 8;
  const gap = 12;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const left = clamp(x - width / 2, cameraX + margin, cameraX + ROOM_WIDTH - margin - width);
  const above = headY - gap - height >= cameraY + margin;
  const top = clamp(above ? headY - gap - height : feetY + gap,
    cameraY + margin, cameraY + ROOM_HEIGHT - margin - height);
  return {
    left, top,
    tailX: clamp(x, left + 15, left + width - 15),
    tailTipX: clamp(x, cameraX + margin, cameraX + ROOM_WIDTH - margin),
    tailTipY: clamp(above ? headY : feetY, cameraY + margin, cameraY + ROOM_HEIGHT - margin),
    above
  };
}
