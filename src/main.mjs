import {advanceGuestEscort, beginGuestEscort} from './guest-escort.mjs';
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
import {cameraLeft, cameraTop, guestEnclosure, insideGuestEnclosure, nearGuestGate, nearestInteraction, ROOM_HEIGHT, ROOM_WIDTH} from './room.mjs';
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
let guestEscort = null;
let completedGuestEscorts = 0;
let gateWarned = false;
const dialogue = createDialogue(baron, {
  canReportMilo: () => ({seen: seenMilo, pending: milo.injuryPending || guards.some(guard => guard.pursuit?.milo)}),
  takeMiloInjury: () => {
    const injured = milo.injuryPending;
    milo.injuryPending = false;
    return injured;
  },
  onAction: (action, target) => {
    if (action === 'callGuard') {
      const guard = summonGuard(guards, player);
      const guest = partyGuests.find(guest => guest.id === target.id);
      if (guard && guest) {
        clearInput();
        guestEscort = {guard, guest, phase: 'waiting'};
      }
    }
    if (action === 'escortGuest' && guestEscort) beginGuestEscort(guestEscort, player, baron);
    if (action === 'reportMilo') dispatchGuardToMilo(target.guard);
    if (action === 'fleeMilo') fleeMilo(milo, player, baron, guards);
  }
});
const info = document.getElementById('info');
let lastFrame = 0;
let elapsed = 0;

function warnAtGuestGate() {
  if (gateWarned) return;
  gateWarned = true;
  clearInput();
  dialogue.open({id: 'guard', title: 'Bull Guard', guestGate: true});
}

const {readMovement, clearInput} = bindControls({
  isPaused: () => dialogue.isOpen() || Boolean(guestEscort),
  nudge: (dx, dy) => {
    if (dx < 0 && nearGuestGate(player)) warnAtGuestGate();
    else movePlayer(player, baron, dx, dy, guards);
  },
  interact: () => {
    if (dialogue.isOpen() || guestEscort) return;
    const target = nearestInteraction(player, baron, milo, guards, guestEnclosure.active ? guests.filter(guest => !insideGuestEnclosure(guest)) : guests);
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

  if (guestEscort?.phase === 'walking') {
    if (advanceGuestEscort(guestEscort, player, baron, guards, elapsed, dt)) {
      guestEscort = null;
      completedGuestEscorts++;
      if (completedGuestEscorts === 2) {
        guestEnclosure.active = true;
        guards.push({
          x: guestEnclosure.east + 22, y: guestEnclosure.gateY - 34,
          radius: 14, facing: 0, walking: false, posted: true, guestGate: true
        });
      }
      clearInput();
    }
  } else {
    const movement = guestEscort ? {dx: 0, dy: 0} : readMovement();
    const atGate = nearGuestGate(player);
    if (!atGate) gateWarned = false;
    if (atGate && movement.dx < 0 && !gateWarned) {
      warnAtGuestGate();
      requestAnimationFrame(frame);
      return;
    }
    updatePlayer(player, baron, movement, dt, guards);
  }
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
    if (guestEscort?.guard === arrivedGuard) guestEscort.phase = 'warning';
    clearInput();
    dialogue.open({id: 'guard', title: 'Bull Guard', summoned: true, repeat: completedGuestEscorts > 0});
    requestAnimationFrame(frame);
    return;
  }
  updatePartyChatter(partyChatter, {x: cameraX, y: cameraY}, staff, baron, guards, elapsed, dt);
  updateStaff(staff, player, baron, guards, elapsed, dt);
  render(player, baron, milo, guards, cameraX, cameraY, elapsed, staff, milkService.scene, partyChatter, guestEscort);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
