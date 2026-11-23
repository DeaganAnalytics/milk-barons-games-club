import {ROOM_HEIGHT} from './room.mjs';

export function speechTop(actorY, cameraY, lineCount) {
  const lineSpan = (lineCount - 1) * 25;
  const preferredTop = actorY - 70 - lineSpan;
  const padding = 15;
  return Math.max(cameraY + padding, Math.min(cameraY + ROOM_HEIGHT - padding - lineSpan, preferredTop));
}
