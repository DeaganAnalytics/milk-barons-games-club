import {createMilkService, updateMilkService} from './milk-service.mjs';
import {callOutMilo, createBaron, updateBaronIdleSpeech, updateBaronAttention, updateBaronWalk} from './baron.mjs';
import {createDialogue} from './dialogue.mjs';
import {createGuards, updateGuards} from './guards.mjs';
import {createMilo, updateMilo} from './milo.mjs';
import {bindControls} from './input.mjs';
import {createPlayer, movePlayer, updatePlayer} from './player.mjs';
import {createRenderer} from './render.mjs';
import {cameraLeft, cameraTop, nearestInteraction} from './room.mjs';
import {createStaff, updateStaff} from './staff.mjs';

const player = createPlayer();
const baron = createBaron();
const milo = createMilo();
const guards = createGuards(player, baron, milo);
const staff = createStaff(player, baron, milo, guards);
const milkService = createMilkService();
const render = createRenderer(document.getElementById('game'));
const dialogue = createDialogue(baron);
const info = document.getElementById('info');
let lastFrame = 0;
let elapsed = 0;

const {readMovement, clearInput} = bindControls({
  isPaused: dialogue.isOpen,
  nudge: (dx, dy) => movePlayer(player, baron, dx, dy, guards),
  interact: () => {
    if (dialogue.isOpen()) return;
    const target = nearestInteraction(player, baron, milo, guards, staff);
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
  elapsed += dt;

  updatePlayer(player, baron, readMovement(), dt, guards);
  const cameraY = cameraTop(player.y);
  const cameraX = cameraLeft(player.x);
  const wasTraveling = baron.route.length > 0;
  const serviceWasActive = Boolean(milkService.scene);
  if (!serviceWasActive) updateBaronWalk(baron, player, cameraX, elapsed, dt, cameraY, guards);
  updateMilkService(milkService, baron, staff, guards, {x: cameraX, y: cameraY}, elapsed, dt, wasTraveling);
  const baronLocked = serviceWasActive || Boolean(milkService.scene);
  if (!baronLocked) updateBaronAttention(baron, player, elapsed, dt);
  if (updateMilo(milo, baron, elapsed, dt, guards) && !baronLocked) callOutMilo(baron, milo, elapsed);
  if (!baronLocked) updateBaronIdleSpeech(baron, cameraX, cameraY, elapsed);
  updateGuards(guards, player, baron, milo, elapsed, dt);
  updateStaff(staff, player, baron, guards, elapsed, dt);
  render(player, baron, milo, guards, cameraX, cameraY, elapsed, staff, milkService.scene);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
