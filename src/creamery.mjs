import {NORTH_EDGE, WEST_EDGE} from './room.mjs';

export const bartender = {
  id: 'creamery-bartender',
  title: 'The Bartender',
  x: WEST_EDGE + 187,
  y: NORTH_EDGE + 161,
  radius: 35
};

export const creameryHatch = {width: 142, height: 110, top: NORTH_EDGE + 43};

export function createCreameryGuard() {
  return {
    x: WEST_EDGE + 263,
    y: NORTH_EDGE + 180,
    radius: 14,
    facing: 0,
    walking: false,
    posted: true
  };
}
