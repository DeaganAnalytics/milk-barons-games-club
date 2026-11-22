import {createBaron, talkToBaron, updateBaronAttention, updateBaronPatrol} from './baron.mjs';
import {bindControls} from './input.mjs';
import {createPlayer, movePlayer, updatePlayer} from './player.mjs';
import {createRenderer} from './render.mjs';
import {nearestInteraction} from './room.mjs';

const player = createPlayer();
const baron = createBaron();
const render = createRenderer(document.getElementById('game'));
const heading = document.getElementById('heading');
const info = document.getElementById('info');
let lastFrame = 0;
let elapsed = 0;

const readMovement = bindControls({
  nudge: (dx, dy) => movePlayer(player, baron, dx, dy),
  interact: () => {
    const target = nearestInteraction(player, baron);
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

  updateBaronPatrol(baron, elapsed);
  updatePlayer(player, baron, readMovement(), dt);
  updateBaronAttention(baron, player, elapsed, dt);
  render(player, baron, elapsed);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
