import {advanceEliasRun, elias, routeEliasToPip, updateEliasFollow} from './elias.mjs';
import {createCoinBalance, STARTING_COINS} from './coins.mjs';
import {createHealth, MAX_HEARTS} from './health.mjs';
import {createKarma} from './karma.mjs';
import {createAttendantMilk, updateAttendantMilk} from './attendant-milk.mjs';
import {createAttendantThrow, createMilkBalloon, createPilloryReportScene, updateMilkBalloon} from './milk-balloon.mjs';
import {pilloryAttendant, pilloryCommissioner, pilloryInView} from './pillory.mjs';
import {professor} from './professor.mjs';
import {createMilkPool, lifeguard, poolClothing, takePoolClothing, updateMilkPool} from './milk-pool.mjs';
import {advanceRopeScene, beginRopeScene, createRopeWarning, updateRopeWarning} from './rope-warning.mjs';
import {advanceGuestEscort, beginGuestEscort, guestRopesInView} from './guest-escort.mjs';
import {bartender, createCreameryGuard} from './creamery.mjs';
import {createMilkService, updateMilkService} from './milk-service.mjs';
import {callOutMilo, createBaron, isBaronDancing, isOnscreen, updateBaronIdleSpeech, updateBaronAttention, updateBaronWalk} from './baron.mjs';
import {createDialogue} from './dialogue.mjs';
import {createGuards, dispatchGuardToMilo, dispatchRovingGuardsToPool, summonGuard, updateGuards} from './guards.mjs';
import {createMilo, fleeMilo, updateMilo} from './milo.mjs';
import {bindControls} from './input.mjs';
import {createPartyChatter, updatePartyChatter} from './party-chatter.mjs';
import {partyGuests} from './party-guests.mjs';
import {createPlayer, movePlayer, takeDanceExit, updatePlayer} from './player.mjs';
import {createRenderer} from './render.mjs';
import {cameraLeft, cameraTop, DANCE_FLOOR, guestEnclosure, insideGuestEnclosure, MILK_POOL, nearGuestGate, nearestInteraction, ROOM_HEIGHT, ROOM_WIDTH} from './room.mjs';
import {createStaff, updateStaff} from './staff.mjs';

const player = createPlayer();
const baron = createBaron();
const milo = createMilo();
const guards = createGuards(player, baron, milo);
guards.push(createCreameryGuard());
const staff = createStaff(player, baron, milo, guards);
const guests = [...staff, bartender, lifeguard, professor, elias, pilloryAttendant, pilloryCommissioner, ...partyGuests.map(guest => ({
  ...guest, y: guest.y - 19 // Interaction coordinates are above the feet, like Pip's.
}))];
const milkService = createMilkService();
const attendantMilk = createAttendantMilk();
const partyChatter = createPartyChatter();
const milkPool = createMilkPool();
const render = createRenderer(document.getElementById('game'));
let eliasApproaching = true;
let eliasScene = null;
let seenMilo = false;
let reportedMilo = false;
let seenPoolAndClothes = false;
let poolClothesReport = null;
let seenPillory = false;
let reportedPillory = false;
let guestEscort = null;
let seenGuestRopes = false;
let milkBalloon = null;
let playedMilkBalloon = false;
let completedGuestEscorts = 0;
let gateWarned = false;
let gateGuard;
const ropeWarning = createRopeWarning();
const gameOver = document.getElementById('game-over');
const restart = document.getElementById('restart-game');
restart.addEventListener('click', () => location.reload());
const info = document.getElementById('info');
const coinCount = document.getElementById('coin-count');
const coinAnnouncement = document.getElementById('coin-announcement');
coinCount.textContent = STARTING_COINS;
coinAnnouncement.textContent = `${STARTING_COINS} coins`;

function endGame(title, message) {
  if (!gameOver.hidden) return;
  if (dialogue.isOpen()) dialogue.dismiss();
  clearInput();
  document.getElementById('end-title').textContent = title;
  document.getElementById('end-message').textContent = message;
  gameOver.hidden = false;
  restart.focus();
}

const healthDisplay = document.getElementById('health-display');
const healthImages = Array.from({length: MAX_HEARTS * 2 + 1}, (_, index) => {
  const image = new Image();
  image.src = new URL(`../assets/health/${index}.webp`, import.meta.url);
  return image;
});

export const health = createHealth((hearts, deathMessage) => {
  if (!gameOver.hidden) return;
  healthDisplay.src = healthImages[hearts * 2].src;
  healthDisplay.alt = `${hearts} of ${MAX_HEARTS} hearts`;
  if (hearts === 0) endGame('Game Over', deathMessage ?? 'You ran out of health.');
});

const clothingTheftKarma = {all: -2, man: -0.5, women: -1.5};
const karmaMeter = document.getElementById('karma-meter');
export const karma = createKarma((score, position) => {
  karmaMeter.style.setProperty('--karma-position', `${position * 100}%`);
  karmaMeter.setAttribute('aria-valuenow', score);
  karmaMeter.setAttribute('aria-valuetext', score === 0 ? 'Neutral' : String(score));
});

export const coinBalance = createCoinBalance((count, outcome) => {
  if (!gameOver.hidden) return;
  coinCount.textContent = count;
  coinAnnouncement.textContent = `${count} coins`;
  if (outcome === 'loss') endGame('Game Over', 'You ran out of coins.');
  if (outcome === 'win') endGame('You Win!', 'You reached 200 coins.');
});

const firstSightLines = new Map([
  ['baronDance', 'Is the Baron... dancing? Good heavens. So much jiggling.'],
  ['milo', "A man dressed in rags scurries along the wall. Doesn't he look familiar?"],
  ['ladies', "Two exceptionally wealthy, beautiful and sophisticated ladies gossip in the corner. They're well out of your league. Perhaps you should introduce yourself?"],
  ['pool', "An entire swimming pool filled with pure milk. Such extravagance! Wait... where are those young ladies' clothes?!"],
  ['pillory', 'A plainly dressed woman is trapped in a pillory, and a ridiculous-looking man in a top hat is enthusiastically waving at you. Perhaps you should investigate?'],
  ['danceFloor', 'Two young women, a drunken guard and a man dressed as a giant milk bottle are dancing away. Perhaps you should join in?']
]);
const sightNotices = [];
let nextSightNoticeAt = 0;

function noteSight(key, visible) {
  if (!visible || !firstSightLines.has(key)) return;
  sightNotices.push(firstSightLines.get(key));
  firstSightLines.delete(key);
}

function clubEvent(text, change) {
  const previousCoins = coinBalance.count;
  const previousKarma = karma.score;
  change?.();
  const coins = coinBalance.count - previousCoins;
  const karmaPoints = karma.score - previousKarma;
  const signed = value => value > 0 ? '+' : '−';
  const details = [
    coins && `Coins: ${signed(coins)}₥${Math.abs(coins)}.`,
    karmaPoints && (karmaPoints > 0 ? 'Karma gained.' : 'Karma lost.')
  ].filter(Boolean);
  info.textContent = [text, ...details].join(' ');
  nextSightNoticeAt = elapsed + 4;
}

const coinEvents = {
  awardPilloryTip: ['The guard tips you for the entertainment.', 5],
  baronMoneyGift: ['The Baron finds some loose change.', 5],
  awardPoolClothesTip: ['The guards call it a tip for services rendered.', 5],
  baronMoneyPenalty: ['The Baron charges you for asking him for money.', -25],
  finePoolLie: ['The guard bills you for a wasted radio call.', -10],
  chargeProfessorFee: ['Your first lesson in political economy was a paid one.', -5],
  lifeguardMoneyPenalty: ['The lifeguard charges you for interrupting his view.', -5],
  lifeguardMoneyGift: ['The lifeguard pays you to get out of his way.', 3],
  chargeDanceFee: ['It turns out dancing was on the bill.', -3]
};

const clothingEvents = {
  all: 'The whole pile is gone. Everyone is still in the pool.',
  man: 'Pip finds ₥10 in the suit pocket.',
  women: 'Two dresses disappear. The suit stays put.'
};

const dialogue = createDialogue(baron, {
  hasPlayedMilkBalloon: () => playedMilkBalloon,
  canReportPillory: guard => seenPillory && !reportedPillory && guard && !guard.pursuit
    && !guard.poolWatch && !pilloryInView(cameraLeft(player.x), cameraTop(player.y)),
  canReportPool: () => seenPoolAndClothes,
  canReportPoolClothes: () => poolClothesReport === null,
  canReportMilo: () => ({seen: seenMilo, unavailable: reportedMilo || milo.injuryPending || guards.some(guard => guard.pursuit?.milo)}),
  takeMiloInjury: () => {
    const injured = milo.injuryPending;
    milo.injuryPending = false;
    return injured;
  },
  onAction: (action, target) => {
    const coinEvent = coinEvents[action];
    if (coinEvent) {
      const [text, amount] = coinEvent;
      clubEvent(text, () => coinBalance.change(amount));
    }
    if (action === 'stealPoolClothing' && takePoolClothing(milkPool, target.selection, elapsed)) {
      clubEvent(clothingEvents[target.selection], () => {
        karma.change(clothingTheftKarma[target.selection]);
        if (target.selection === 'man') coinBalance.change(10);
      });
    }
    if (action === 'tellLifeguardAboutClothing') milkPool.clothingAmbientAt = Math.min(milkPool.clothingAmbientAt, elapsed);
    if (!milkPool.clothingReported && ['rewardMissingDresses', 'fineMissingSuit', 'dismissMissingSuit'].includes(action)) {
      milkPool.clothingReported = true;
      target.missingClothing = null;
      if (action === 'rewardMissingDresses') clubEvent('The lifeguard pays you for the good news.', () => coinBalance.change(15));
      if (action === 'fineMissingSuit') clubEvent('The lifeguard takes a dim view of the missing suit.', () => coinBalance.change(-10));
    }
    if (action === 'collectTax') clubEvent('Elias takes the Baron’s cut.', () => coinBalance.collectTax());
    if (action === 'finishEliasWelcome') {
      document.getElementById('coin-counter').hidden = false;
      elias.findingEdge = true;
      clubEvent('Elias opens your account. The Baron expects you to double it.');
    }
    if (action === 'callGuard') {
      const guard = summonGuard(guards, player);
      const guest = partyGuests.find(guest => guest.id === target.id);
      if (guard && guest) {
        clearInput();
        guestEscort = {guard, guest, phase: 'waiting'};
        clubEvent('A guard is on his way. The ladies are expecting a prompt response.');
      }
    }
    if (action === 'escortGuest' && guestEscort) beginGuestEscort(guestEscort, player, baron, completedGuestEscorts > 0);
    if ((action === 'secureGuests' || action === 'fineAndSecureGuests') && !guestEnclosure.active) {
      guestEnclosure.active = true;
      gateGuard = {
        x: guestEnclosure.east + 22, y: guestEnclosure.gateY - 48,
        radius: 14, facing: 0, walking: false, posted: true, guestGate: true
      };
      guards.push(gateGuard);
    }
    if (action === 'fineAndSecureGuests') clubEvent('The guard escorts you out and helps himself to your wallet.', () => coinBalance.change(-20));
    if (action === 'startMilkBalloon') {
      clearInput();
      milkBalloon = createMilkBalloon(player, baron);
      info.textContent = 'Pip is picking up a milk balloon.';
    }
    if (action === 'attendantMilkBalloon') {
      clearInput();
      player.walking = false;
      milkBalloon = createAttendantThrow();
      info.textContent = 'The attendant throws a milk balloon.';
    }
    if (action === 'reportPillory' && !reportedPillory) {
      reportedPillory = true;
      clubEvent('Pip leads the guard to the pillory.', () => karma.change(2));
      clearInput();
      milkBalloon = createPilloryReportScene(player, target.guard, baron);
    }
    if (action === 'inspectPool' && !poolClothesReport) {
      poolClothesReport = {guards: dispatchRovingGuardsToPool(guards), thanked: false};
      clubEvent('The roving guards rush to the pool for a thorough visual inspection.');
    }
    if (action === 'reportMilo' && !reportedMilo) {
      reportedMilo = true;
      dispatchGuardToMilo(target.guard);
      clubEvent('Code 9. The guard goes after Milo and pays Pip for the tip.', () => {
        karma.change(-2);
        coinBalance.change(10);
      });
    }
    if (action === 'fleeMilo') {
      fleeMilo(milo, player, baron, guards);
      clubEvent('Milo ducks out of sight. He’s had enough attention for one day.');
    }
  }
});
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
  isPaused: () => eliasApproaching || Boolean(eliasScene) || !gameOver.hidden || dialogue.isOpen() || Boolean(guestEscort || ropeWarning.scene),
  nudge: (dx, dy) => {
    if (eliasApproaching || eliasScene || !gameOver.hidden || milkBalloon) return;
    if (dx < 0 && nearGuestGate(player) && ropeWarning.talks < 2) warnAtGuestGate();
    else movePlayer(player, baron, dx, dy, guards);
  },
  interact: () => {
    if (dialogue.isOpen() || guestEscort || ropeWarning.scene) return;
    if (eliasApproaching || eliasScene || !gameOver.hidden || milkBalloon) return;
    const nearbyGuests = guests.filter(guest => !(elias.findingEdge && guest === elias)
      && !(guestEnclosure.active && insideGuestEnclosure(guest)));
    if (!milkPool.stolenClothing) nearbyGuests.push(poolClothing);
    const target = nearestInteraction(player, baron, milo, guards, nearbyGuests);
    if (target) {
      if (target.id === 'milo') seenMilo = true;
      if (target.id === lifeguard.id && !milkPool.clothingReported) target.missingClothing = milkPool.stolenClothing;
      if (target.guestGate) ropeWarning.talks++;
      if (target.guard && poolClothesReport?.guards.includes(target.guard) && !poolClothesReport.thanked
          && poolClothesReport.guards.every(guard => !guard.poolReportPending)) {
        poolClothesReport.thanked = true;
        target.poolClothesThanks = true;
      }
      clearInput();
      dialogue.open(target);
    } else info.textContent = 'Nobody is close enough to talk to.';
  }
});

function startEliasScene(conversation) {
  clearInput();
  player.walking = false;
  eliasScene = {route: routeEliasToPip(elias, player, baron), conversation};
}

function frame(timestamp) {
  const dt = Math.min((timestamp - lastFrame) / 1000 || 0, 0.05);
  lastFrame = timestamp;
  if (!gameOver.hidden) return;
  if (dialogue.isOpen()) {
    requestAnimationFrame(frame);
    return;
  }
  if (eliasApproaching) {
    const arrived = advanceEliasRun(elias, player, dt, 36);
    render(player, baron, milo, guards, cameraLeft(player.x), cameraTop(player.y), elapsed);
    if (arrived) {
      eliasApproaching = false;
      clearInput();
      dialogue.open({...elias, welcome: true});
    }
    requestAnimationFrame(frame);
    return;
  }
  if (!eliasScene && coinBalance.pendingTax && !guestEscort && !ropeWarning.scene && !milkBalloon) {
    startEliasScene({tax: coinBalance.pendingTax});
  }
  if (eliasScene) {
    const {route, conversation} = eliasScene;
    if (route.length && advanceEliasRun(elias, route[0], dt, 0)) route.shift();
    render(player, baron, milo, guards, cameraLeft(player.x), cameraTop(player.y), elapsed,
      staff, milkService.scene, partyChatter, null, ropeWarning, gateGuard, milkPool, null, attendantMilk.scene);
    if (!route.length) {
      eliasScene = null;
      dialogue.open({...elias, ...conversation});
    }
    requestAnimationFrame(frame);
    return;
  }
  elapsed += dt;

  if (ropeWarning.scene) {
    const ended = advanceRopeScene(ropeWarning.scene, player, dt);
    render(player, baron, milo, guards, cameraLeft(player.x), cameraTop(player.y), elapsed,
      staff, null, partyChatter, null, ropeWarning, gateGuard, milkPool, null, attendantMilk.scene);
    if (ended) {
      health.change(-MAX_HEARTS, 'You have displeased the Baron!');
    } else requestAnimationFrame(frame);
    return;
  }

  if (milkBalloon) {
    const done = updateMilkBalloon(milkBalloon, player, dt);
    if (done) {
      const {attendant, guard} = milkBalloon;
      milkBalloon = null;
      clearInput();
      if (guard) {
        guard.pauseUntil = elapsed + 1;
        dialogue.open({id: 'guard', title: 'Bull Guard', pilloryThanks: true});
        requestAnimationFrame(frame);
        return;
      }
      if (!attendant) {
        clubEvent('Splat! You hit the Commissioner. Milk fee: ₥1.', () => {
          karma.change(playedMilkBalloon ? -0.25 : -1);
          playedMilkBalloon = true;
        });
        coinBalance.change(-1);
      } else clubEvent('Splat! The attendant hit the Commissioner.');
    }
    render(player, baron, milo, guards, cameraLeft(player.x), cameraTop(player.y), elapsed,
      staff, milkService.scene, partyChatter, null, ropeWarning, gateGuard, milkPool, milkBalloon, attendantMilk.scene);
    requestAnimationFrame(frame);
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
  if (!guestEscort && takeDanceExit(player)) {
    startEliasScene({danceFee: true});
    requestAnimationFrame(frame);
    return;
  }
  if (gateGuard && updateRopeWarning(ropeWarning, player, dt)) {
    clearInput();
    beginRopeScene(ropeWarning, gateGuard, player, baron);
    requestAnimationFrame(frame);
    return;
  }
  const cameraY = cameraTop(player.y);
  const cameraX = cameraLeft(player.x);
  updateEliasFollow(elias, player, baron, cameraX, cameraY, dt);
  const inView = ({x, y}) => x >= cameraX && x <= cameraX + ROOM_WIDTH
    && y >= cameraY && y <= cameraY + ROOM_HEIGHT;
  const pilloryVisible = pilloryInView(cameraX, cameraY);
  seenPillory ||= pilloryVisible;
  seenPoolAndClothes ||= inView(MILK_POOL) && inView(poolClothing);
  noteSight('ladies', partyGuests.every(guest => inView({x: guest.x, y: guest.y - 33})));
  noteSight('pool', inView(MILK_POOL));
  noteSight('pillory', pilloryVisible);
  noteSight('danceFloor', inView(DANCE_FLOOR));
  const wasTraveling = baron.route.length > 0;
  const serviceWasActive = Boolean(milkService.scene);
  if (!serviceWasActive) updateBaronWalk(baron, player, cameraX, elapsed, dt, cameraY, guards);
  const serviceEvent = updateMilkService(milkService, baron, staff, guards, {x: cameraX, y: cameraY}, elapsed, dt, wasTraveling);
  if (serviceEvent === 'milk-served') clubEvent('The Baron’s glass is full. The club can breathe again.');
  if (serviceEvent === 'glass-cleaned') clubEvent('Skim sweeps up the evidence. The Baron is already thirsty again.');
  if (!seenGuestRopes && guestRopesInView(guestEnclosure, cameraX, cameraY)) {
    seenGuestRopes = true;
    clubEvent('Velvet ropes go up. The ladies’ milk is now a security matter.');
  }
  const baronLocked = serviceWasActive || Boolean(milkService.scene);
  if (!baronLocked) updateBaronAttention(baron, player, elapsed, dt);
  if (updateMilo(milo, baron, elapsed, dt, guards) && !baronLocked) callOutMilo(baron, milo, elapsed);
  if (!baronLocked) updateBaronIdleSpeech(baron, cameraX, cameraY, elapsed);
  const arrivedGuard = updateGuards(guards, player, baron, milo, elapsed, dt);
  const miloVisible = milo.x >= cameraX && milo.x <= cameraX + ROOM_WIDTH
    && milo.y + 20 >= cameraY && milo.y - 46 <= cameraY + ROOM_HEIGHT;
  seenMilo ||= miloVisible;
  noteSight('milo', miloVisible);
  noteSight('baronDance', isBaronDancing(baron) && isOnscreen(baron, cameraX, cameraY));
  // Stagger discoveries that happen together so each line can be read.
  if (sightNotices.length && elapsed >= nextSightNoticeAt) clubEvent(sightNotices.shift());
  if (arrivedGuard) {
    if (guestEscort?.guard === arrivedGuard) guestEscort.phase = 'warning';
    clearInput();
    dialogue.open({id: 'guard', title: 'Bull Guard', summoned: true, repeat: completedGuestEscorts > 0});
    requestAnimationFrame(frame);
    return;
  }
  updatePartyChatter(partyChatter, {x: cameraX, y: cameraY}, staff, baron, guards, elapsed, dt);
  updateAttendantMilk(attendantMilk, baron, staff, guards, {x: cameraX, y: cameraY}, dt);
  updateMilkPool(milkPool, elapsed, dt);
  updateStaff(staff, player, baron, guards, elapsed, dt);
  render(player, baron, milo, guards, cameraX, cameraY, elapsed, staff, milkService.scene, partyChatter, guestEscort, ropeWarning, gateGuard, milkPool, null, attendantMilk.scene);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
