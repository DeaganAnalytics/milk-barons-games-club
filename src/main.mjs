import {callOutMilo, createBaron, talkToBaron, updateBaronAttention, updateBaronWalk} from './baron.mjs';
import {createMilo, updateMilo} from './milo.mjs';
import {bindControls} from './input.mjs';
import {createPlayer, movePlayer, updatePlayer} from './player.mjs';
import {createRenderer} from './render.mjs';
import {cameraLeft, nearestInteraction} from './room.mjs';

const player = createPlayer();
const baron = createBaron();
const milo = createMilo();
const render = createRenderer(document.getElementById('game'));
const heading = document.getElementById('heading');
const info = document.getElementById('info');
let lastFrame = 0;
let elapsed = 0;

const readMovement = bindControls({
  nudge: (dx, dy) => movePlayer(player, baron, dx, dy),
  interact: () => {
    const target = nearestInteraction(player, baron, milo);
    heading.textContent = target?.title ?? 'The club';
    if (!target) {
      info.textContent = 'Nothing to interact with here. Try a table, the cashier, or the Baron.';
    } else {
      info.textContent = target.id === 'baron' ? talkToBaron(baron, elapsed) : target.message;
    }
  }
});

function frame(timestamp) {
  const dt = Math.min((timestamp - lastFrame) / 1000 || 0, 0.05);
  lastFrame = timestamp;
  elapsed += dt;

  updatePlayer(player, baron, readMovement(), dt);
  const cameraX = cameraLeft(player.x);
  updateBaronWalk(baron, player, cameraX, elapsed, dt);
  updateBaronAttention(baron, player, elapsed, dt);
  if (updateMilo(milo, baron, elapsed, dt)) callOutMilo(baron, milo, elapsed);
  render(player, baron, milo, cameraX, elapsed);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
