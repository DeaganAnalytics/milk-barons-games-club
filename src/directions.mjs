export const TURN = Math.PI * 2;
export const FACING_STEP = Math.PI / 4;

export function facingIndex(dx, dy) {
  return (Math.round(Math.atan2(dx, dy) / FACING_STEP) + 8) % 8;
}
