import {callOutMilo, createBaron, updateBaronIdleSpeech, updateBaronAttention, updateBaronWalk} from './baron.mjs';
import {createGuards, updateGuards} from './guards.mjs';
import {createMilo, updateMilo} from './milo.mjs';
import {bindControls} from './input.mjs';
import {createPlayer, movePlayer, updatePlayer} from './player.mjs';
import {createRenderer} from './render.mjs';
import {cameraLeft, cameraTop, nearestInteraction} from './room.mjs';

const player = createPlayer();
const baron = createBaron();
const milo = createMilo();
const guards = createGuards();
const render = createRenderer(document.getElementById('game'));
const heading = document.getElementById('heading');
const info = document.getElementById('info');
let lastFrame = 0;
let elapsed = 0;

const readMovement = bindControls({
  nudge: (dx, dy) => movePlayer(player, baron, dx, dy, guards),
  interact: () => {
    const target = nearestInteraction(player, baron, milo);
    heading.textContent = target?.title ?? 'The club';
    if (!target) {
      info.textContent = 'Nothing to interact with here. Try talking to the Baron or Milo.';
    } else {
      info.textContent = target.message ?? '';
    }
  }
});

function frame(timestamp) {
  const dt = Math.min((timestamp - lastFrame) / 1000 || 0, 0.05);
  lastFrame = timestamp;
  elapsed += dt;

  updatePlayer(player, baron, readMovement(), dt, guards);
  const cameraY = cameraTop(player.y);
  const cameraX = cameraLeft(player.x);
  updateBaronWalk(baron, player, cameraX, elapsed, dt, cameraY, guards);
  updateBaronAttention(baron, player, elapsed, dt);
  if (updateMilo(milo, baron, elapsed, dt, guards)) callOutMilo(baron, milo, elapsed);
  updateBaronIdleSpeech(baron, cameraX, cameraY, elapsed);
  updateGuards(guards, player, baron, milo, elapsed, dt);
  render(player, baron, milo, guards, cameraX, cameraY, elapsed);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
