import {createDialogue} from './dialogue.mjs';
import {createGame, stepGame} from './game.mjs';
import {bindControls} from './input.mjs';
import {movePlayer} from './player.mjs';
import {createRenderer} from './render.mjs';
import {nearestInteraction} from './room.mjs';

const game = createGame();
const render = createRenderer(document.getElementById('game'));
const dialogue = createDialogue(game.baron);
const info = document.getElementById('info');
let lastFrame = 0;

const {readMovement, clearInput} = bindControls({
  isPaused: dialogue.isOpen,
  nudge: (dx, dy) => movePlayer(game.player, game.baron, dx, dy, game.guards),
  interact: () => {
    if (dialogue.isOpen()) return;
    const target = nearestInteraction(game.player, game.baron, game.milo, game.guards);
    if (target) {
      clearInput();
      dialogue.open(target);
    } else info.textContent = 'Nobody is close enough to talk to.';
  }
});

function frame(timestamp) {
  const dt = Math.min((timestamp - lastFrame) / 1000 || 0, 0.05);
  lastFrame = timestamp;
  if (dialogue.isOpen()) {
    requestAnimationFrame(frame);
    return;
  }
  stepGame(game, readMovement(), dt);
  render(game);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
