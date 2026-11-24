import {createMilkPool, lifeguard, updateMilkPool} from './milk-pool.mjs';
import {advanceRopeScene, beginRopeScene, createRopeWarning, updateRopeWarning} from './rope-warning.mjs';
import {advanceGuestEscort, beginGuestEscort} from './guest-escort.mjs';
import {bartender, createCreameryGuard} from './creamery.mjs';
import {createMilkService, updateMilkService} from './milk-service.mjs';
import {callOutMilo, createBaron, updateBaronIdleSpeech, updateBaronAttention, updateBaronWalk} from './baron.mjs';
import {createDialogue} from './dialogue.mjs';
import {createGuards, dispatchGuardToMilo, dispatchGuardToPool, summonGuard, updateGuards} from './guards.mjs';
import {createMilo, fleeMilo, updateMilo} from './milo.mjs';
import {bindControls} from './input.mjs';
import {createPartyChatter, updatePartyChatter} from './party-chatter.mjs';
import {partyGuests} from './party-guests.mjs';
import {createPlayer, movePlayer, updatePlayer} from './player.mjs';
import {createRenderer} from './render.mjs';
import {cameraLeft, cameraTop, guestEnclosure, insideGuestEnclosure, MILK_POOL, nearGuestGate, nearestInteraction, ROOM_HEIGHT, ROOM_WIDTH} from './room.mjs';
import {createStaff, updateStaff} from './staff.mjs';

const player = createPlayer();
const baron = createBaron();
const milo = createMilo();
const guards = createGuards(player, baron, milo);
guards.push(createCreameryGuard());
const staff = createStaff(player, baron, milo, guards);
const guests = [...staff, bartender, lifeguard, ...partyGuests.map(guest => ({
  ...guest, y: guest.y - 19 // Interaction coordinates are above the feet, like Pip's.
}))];
const milkService = createMilkService();
const partyChatter = createPartyChatter();
const milkPool = createMilkPool();
const render = createRenderer(document.getElementById('game'));
let seenMilo = false;
let seenPoolAndClothes = false;
let guestEscort = null;
let completedGuestEscorts = 0;
let gateWarned = false;
let gateGuard;
const ropeWarning = createRopeWarning();
const gameOver = document.getElementById('game-over');
const restart = document.getElementById('restart-game');
restart.addEventListener('click', () => location.reload());
const dialogue = createDialogue(baron, {
  canReportPool: () => seenPoolAndClothes,
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
    if (action === 'escortGuest' && guestEscort) beginGuestEscort(guestEscort, player, baron, completedGuestEscorts > 0);
    if (action === 'secureGuests' && !guestEnclosure.active) {
      guestEnclosure.active = true;
      gateGuard = {
        x: guestEnclosure.east + 22, y: guestEnclosure.gateY - 48,
        radius: 14, facing: 0, walking: false, posted: true, guestGate: true
      };
      guards.push(gateGuard);
    }
    if (action === 'inspectPool') dispatchGuardToPool(target.guard);
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
  ropeWarning.talks++;
  dialogue.open({id: 'guard', title: 'Bull Guard', guestGate: true});
}

const {readMovement, clearInput} = bindControls({
  isPaused: () => dialogue.isOpen() || Boolean(guestEscort || ropeWarning.scene),
  nudge: (dx, dy) => {
    if (dx < 0 && nearGuestGate(player) && ropeWarning.talks < 2) warnAtGuestGate();
    else movePlayer(player, baron, dx, dy, guards);
  },
  interact: () => {
    if (dialogue.isOpen() || guestEscort || ropeWarning.scene) return;
    const target = nearestInteraction(player, baron, milo, guards, guestEnclosure.active ? guests.filter(guest => !insideGuestEnclosure(guest)) : guests);
    if (target) {
      if (target.id === 'milo') seenMilo = true;
      if (target.guestGate) ropeWarning.talks++;
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

  if (ropeWarning.scene) {
    const ended = advanceRopeScene(ropeWarning.scene, player, dt);
    render(player, baron, milo, guards, cameraLeft(player.x), cameraTop(player.y), elapsed,
      staff, null, partyChatter, null, ropeWarning, gateGuard, milkPool);
    if (ended) {
      gameOver.hidden = false;
      restart.focus();
    } else requestAnimationFrame(frame);
    return;
  }

  if (guestEscort?.phase === 'walking') {
    if (advanceGuestEscort(guestEscort, player, baron, guards, elapsed, dt)) {
      guestEscort = null;
      completedGuestEscorts++;
      clearInput();
      if (completedGuestEscorts === 2) {
        dialogue.open({id: 'guard', title: 'Bull Guard', postEscort: true});
        requestAnimationFrame(frame);
        return;
      }
    }
  } else {
    const movement = guestEscort ? {dx: 0, dy: 0} : readMovement();
    const atGate = nearGuestGate(player);
    if (!atGate) gateWarned = false;
    if (atGate && movement.dx < 0 && !gateWarned && ropeWarning.talks < 2) {
      warnAtGuestGate();
      requestAnimationFrame(frame);
      return;
    }
    updatePlayer(player, baron, movement, dt, guards);
  }
  if (gateGuard && updateRopeWarning(ropeWarning, player, dt)) {
    clearInput();
    beginRopeScene(ropeWarning, gateGuard, player, baron);
    requestAnimationFrame(frame);
    return;
  }
  const cameraY = cameraTop(player.y);
  const cameraX = cameraLeft(player.x);
  seenPoolAndClothes ||= [
    MILK_POOL,
    {x: MILK_POOL.x + 58, y: MILK_POOL.y - 109}
  ].every(({x, y}) => x >= cameraX && x <= cameraX + ROOM_WIDTH
    && y >= cameraY && y <= cameraY + ROOM_HEIGHT);
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
  updateMilkPool(milkPool, elapsed, dt);
  updateStaff(staff, player, baron, guards, elapsed, dt);
  render(player, baron, milo, guards, cameraX, cameraY, elapsed, staff, milkService.scene, partyChatter, guestEscort, ropeWarning, gateGuard, milkPool);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
