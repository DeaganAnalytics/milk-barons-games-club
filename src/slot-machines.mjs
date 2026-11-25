import {SLOT_STATIONS} from './room.mjs';
import {drawPipAtSlot, drawSleepingSlotPlayer} from './pip-art.mjs';

const cabinetWidth = 56;
const cabinetHeight = 108;
const seatOffsetX = 19;
const seatOffsetY = -35;
const sleepingSlot = SLOT_STATIONS[2];
const freeSlot = SLOT_STATIONS[3];

export function slotLeverPull(elapsed, index) {
  const phase = (elapsed + (index === 0 ? 0 : 3.25)) % 6.5;
  return phase < 0.9 ? Math.sin(phase / 0.9 * Math.PI) ** 2 : 0;
}

export const slotPlayers = [
  ['slot-politician', 'Weary Politician', 'Another losing streak. At least this one stays out of the papers.'],
  ['slot-executive', 'Corporate Executive', "I prefer to think of this as a high-risk investment."]
].map(([id, title, message], index) => ({
  id, title, message, x: SLOT_STATIONS[index].x + seatOffsetX, y: SLOT_STATIONS[index].y, radius: 22
}));

export const openSlot = {
  ...freeSlot, id: 'empty-slot', title: 'Milk Slot Machine',
  x: freeSlot.x + seatOffsetX, radius: 22
};

export function sitAtSlot(player) {
  const station = freeSlot;
  player.slotSeat = {station, previousX: player.x, previousY: player.y};
  player.x = station.x + seatOffsetX;
  player.y = station.y;
  player.walking = false;
}

export function leaveSlot(player) {
  player.x = player.slotSeat.previousX;
  player.y = player.slotSeat.previousY;
  player.slotSeat = null;
}

export function drawSlotStation(ctx, art, station, seatedArt, playerSeated, elapsed, index) {
  if (!art?.naturalWidth) return;
  const {x, y} = station;
  const left = x - cabinetWidth / 2;
  const top = y - cabinetHeight;
  const seatX = x + seatOffsetX;
  const seatY = y + seatOffsetY;
  const pull = seatedArt?.naturalWidth ? slotLeverPull(elapsed, index) : 0;
  ctx.drawImage(art, left, top, cabinetWidth, cabinetHeight);
  if (pull) {
    // Stretch above the knob and compress toward the pivot, keeping the mount fixed.
    const start = 0.29;
    const knob = 0.36;
    const pivot = 0.49;
    const shift = 0.06 * pull;
    const drawLeverBand = (sourceTop, sourceBottom, destTop, destBottom) => {
      ctx.drawImage(art, art.naturalWidth * 0.12, art.naturalHeight * sourceTop,
        art.naturalWidth * 0.30, art.naturalHeight * (sourceBottom - sourceTop),
        left + cabinetWidth * 0.12, top + cabinetHeight * destTop,
        cabinetWidth * 0.30, cabinetHeight * (destBottom - destTop));
    };
    drawLeverBand(start, knob, start, knob + shift);
    drawLeverBand(knob, pivot, knob + shift, pivot);
  }

  ctx.save();
  const lamp = (1 + Math.sin(elapsed * 2 + index * 1.4)) / 2;
  ctx.fillStyle = `rgba(255,247,197,${0.15 + lamp * 0.3 + pull * 0.5})`;
  ctx.beginPath();
  ctx.ellipse(left + cabinetWidth * 0.68, top + cabinetHeight * 0.53, 2.4, 1.6, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (playerSeated) {
    drawPipAtSlot(ctx, seatX, seatY, elapsed);
  } else if (station === sleepingSlot) {
    drawSleepingSlotPlayer(ctx, seatX, seatY, elapsed);
  } else if (seatedArt?.naturalWidth) {
    const height = 55;
    const width = seatedArt.naturalWidth / seatedArt.naturalHeight * height;
    ctx.save();
    ctx.translate(seatX, seatY);
    ctx.rotate(-pull * 0.13 + Math.sin(elapsed * 2.1 + index) * 0.025);
    ctx.drawImage(seatedArt, -width * 0.72, -height * 0.79, width, height);
    ctx.restore();
  }
}
