import {callOutMilo, createBaron, updateBaronAttention, updateBaronIdleSpeech, updateBaronWalk} from './baron.mjs';
import {createGuards, updateGuards} from './guards.mjs';
import {createMilo, updateMilo} from './milo.mjs';
import {createPlayer, updatePlayer} from './player.mjs';
import {cameraLeft, cameraTop} from './room.mjs';

function cameraFor(player) {
  return {x: cameraLeft(player.x), y: cameraTop(player.y)};
}

export function createGame(random = Math.random) {
  const player = createPlayer();
  const baron = createBaron();
  const milo = createMilo();
  const guards = createGuards(player, baron, milo, random);
  return {player, baron, milo, guards, elapsed: 0, camera: cameraFor(player)};
}

export function stepGame(game, movement, dt) {
  const {player, baron, milo, guards} = game;
  const elapsed = game.elapsed += dt;
  updatePlayer(player, baron, movement, dt, guards);
  const camera = game.camera = cameraFor(player);
  updateBaronWalk(baron, player, camera, elapsed, dt, guards);
  updateBaronAttention(baron, player, elapsed, dt);
  if (updateMilo(milo, baron, elapsed, dt, guards)) callOutMilo(baron, milo, elapsed);
  updateBaronIdleSpeech(baron, camera, elapsed);
  updateGuards(guards, player, baron, milo, elapsed, dt);
}
