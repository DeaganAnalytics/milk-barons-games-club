import {bartender, createCreameryGuard} from './creamery.mjs';
import {createMilkService, updateMilkService} from './milk-service.mjs';
import {callOutMilo, createBaron, updateBaronIdleSpeech, updateBaronAttention, updateBaronWalk} from './baron.mjs';
import {createDialogue} from './dialogue.mjs';
import {createGuards, dispatchGuardToMilo, summonGuard, updateGuards} from './guards.mjs';
import {createMilo, fleeMilo, updateMilo} from './milo.mjs';
import {bindControls} from './input.mjs';
import {createPartyChatter, updatePartyChatter} from './party-chatter.mjs';
import {partyGuests} from './party-guests.mjs';
import {createPlayer, movePlayer, updatePlayer} from './player.mjs';
import {createRenderer} from './render.mjs';
import {cameraLeft, cameraTop, nearestInteraction, ROOM_HEIGHT, ROOM_WIDTH} from './room.mjs';
import {createStaff, updateStaff} from './staff.mjs';

const player = createPlayer();
const baron = createBaron();
const milo = createMilo();
const guards = createGuards(player, baron, milo);
guards.push(createCreameryGuard());
const staff = createStaff(player, baron, milo, guards);
const guests = [...staff, bartender, ...partyGuests.map(guest => ({
  ...guest, y: guest.y - 19 // Interaction coordinates are above the feet, like Pip's.
}))];
const milkService = createMilkService();
const partyChatter = createPartyChatter();
const render = createRenderer(document.getElementById('game'));
let seenMilo = false;
const dialogue = createDialogue(baron, {
  canReportMilo: () => ({seen: seenMilo, pending: milo.injuryPending || guards.some(guard => guard.pursuit?.milo)}),
  takeMiloInjury: () => {
    const injured = milo.injuryPending;
    milo.injuryPending = false;
    return injured;
  },
  onAction: (action, target) => {
    if (action === 'callGuard') summonGuard(guards, player);
    if (action === 'reportMilo') dispatchGuardToMilo(target.guard);
    if (action === 'fleeMilo') fleeMilo(milo, player, baron, guards);
  }
});
const info = document.getElementById('info');
let lastFrame = 0;
let elapsed = 0;

const {readMovement, clearInput} = bindControls({
  isPaused: dialogue.isOpen,
  nudge: (dx, dy) => movePlayer(player, baron, dx, dy, guards),
  interact: () => {
    if (dialogue.isOpen()) return;
    const target = nearestInteraction(player, baron, milo, guards, guests);
    if (target) {
      if (target.id === 'milo') seenMilo = true;
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
  const arrivedGuard = updateGuards(guards, player, baron, milo, elapsed, dt);
  seenMilo ||= milo.x >= cameraX && milo.x <= cameraX + ROOM_WIDTH
    && milo.y + 20 >= cameraY && milo.y - 46 <= cameraY + ROOM_HEIGHT;
  if (arrivedGuard) {
    clearInput();
    dialogue.open({id: 'guard', title: 'Bull Guard', summoned: true});
    requestAnimationFrame(frame);
    return;
  }
  updatePartyChatter(partyChatter, {x: cameraX, y: cameraY}, staff, baron, guards, elapsed, dt);
  updateStaff(staff, player, baron, guards, elapsed, dt);
  render(player, baron, milo, guards, cameraX, cameraY, elapsed, staff, milkService.scene, partyChatter);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
