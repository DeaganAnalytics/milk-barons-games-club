import {NORTH_EDGE, WEST_EDGE} from './room.mjs';

export const bartender = {
  id: 'creamery-bartender',
  title: 'The Bartender',
  message: 'Welcome to the Backroom Creamery. Milk?',
  x: WEST_EDGE + 187,
  y: NORTH_EDGE + 161,
  radius: 35
};

export function createCreameryGuard() {
  return {
    x: bartender.x + 112,
    y: NORTH_EDGE + 204,
    radius: 14,
    facing: 0,
    walking: false,
    posted: true
  };
}
