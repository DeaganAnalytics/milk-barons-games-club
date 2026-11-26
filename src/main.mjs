import {createMilkMystic, updateMilkMystic} from './milk-mystic.mjs';
import {DJ_ADMISSION_PRICE} from './baron-dialogue.mjs';
import {djTarget} from './dj-dialogue.mjs';
import {dancerTargets} from './dancer-dialogue.mjs';
import {createTally} from './elias-accounting.mjs';
import {WAITER_MILK_PRICE} from './waiter-dialogue.mjs';
import {nearbyPracticeGuard} from './practice-range-dialogue.mjs';
import {practiceRangeHit} from './practice-range.mjs';
import {createPokieProfit} from './pokie-dialogue.mjs';
import {createSleepingGambler} from './sleeping-gambler.mjs';
import {createSlotReactions} from './slot-reactions.mjs';
import {openSlot, sleepingGamblerTarget, slotPlayers} from './slot-machines.mjs';
import {clubSightLines} from './club-sight-lines.mjs';
import {facingIndex} from './directions.mjs';
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
import {advanceBaronApproach, returnBaronToRug, callOutMilo, createBaron, isBaronDancing, isOnscreen, updateBaronIdleSpeech, updateBaronAttention, updateBaronWalk} from './baron.mjs';
import {createDialogue} from './dialogue.mjs';
import {createGuards, dispatchGuardToMilo, dispatchRovingGuardsToPool, summonBaronGuard, summonGuard, summonGuardFromOffscreen, updateGuards} from './guards.mjs';
import {createMilo, fleeMilo, updateMilo} from './milo.mjs';
import {bindControls} from './input.mjs';
import {createPartyChatter, updatePartyChatter} from './party-chatter.mjs';
import {partyGuests} from './party-guests.mjs';
import {createPlayer, movePlayer, takeDanceExit, updatePlayer} from './player.mjs';
import {createRenderer} from './render.mjs';
import {cameraLeft, cameraTop, DANCE_FLOOR, guestEnclosure, insideGuestEnclosure, PRACTICE_RANGE, MILK_FOUNTAIN, MILK_POOL, nearGuestGate, nearestInteraction, onDanceFloor, ROOM_HEIGHT, ROOM_WIDTH} from './room.mjs';
import {createStaff, updateStaff} from './staff.mjs';

const player = createPlayer();
const baron = createBaron();
const milo = createMilo();
const mystic = createMilkMystic();
const guards = createGuards(player, baron, milo);
const creameryGuard = createCreameryGuard();
guards.push(creameryGuard);
const staff = createStaff(player, baron, milo, guards);
const slotReactions = createSlotReactions(staff, guards);
const sleepingGambler = createSleepingGambler();
const guests = [...staff, ...dancerTargets, ...slotPlayers, openSlot, sleepingGamblerTarget, bartender, lifeguard, professor, elias, pilloryAttendant, pilloryCommissioner, ...partyGuests.map(guest => ({
  ...guest, y: guest.y - 19 // Interaction coordinates are above the feet, like Pip's.
}))];
const milkService = createMilkService();
const attendantMilk = createAttendantMilk();
const partyChatter = createPartyChatter();
const milkPool = createMilkPool();
let seenCowGuard = false;
const render = createRenderer(document.getElementById('game'), () => { seenCowGuard = true; }, sleepingGambler, mystic);
let eliasApproaching = true;
let eliasScene = null;
let seenMilo = false;
let reportedMilo = false;
let seenPoolAndClothes = false;
let poolClothesReport = null;
let seenPillory = false;
let seenDjDairy = false;
let boughtCreameryMilk = false;
let seenMilkPool = false;
let seenMilkFountain = false;
let spokeToPilloryAttendant = false;
let reportedPillory = false;
let guestEscort = null;
let seenGuestRopes = false;
let milkBalloon = null;
let playedMilkBalloon = false;
let commissionerSplattered = false;
let completedGuestEscorts = 0;
let gateWarned = false;
let gateGuard;
const ropeWarning = createRopeWarning();
const gameOver = document.getElementById('game-over');
const restart = document.getElementById('restart-game');
restart.addEventListener('click', () => location.reload());
const info = document.getElementById('info');
const coinCount = document.getElementById('coin-count');
const pokieCoinCount = document.getElementById('pokie-coin-count');
const pokieProfit = createPokieProfit();
const coinAnnouncement = document.getElementById('coin-announcement');
coinCount.textContent = pokieCoinCount.textContent = STARTING_COINS;
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

const tallies = {coins: createTally(STARTING_COINS), karma: createTally(0), health: createTally(MAX_HEARTS)};

export const health = createHealth((hearts, deathMessage) => {
  tallies.health.record(hearts);
  if (!gameOver.hidden) return;
  healthDisplay.src = healthImages[hearts * 2].src;
  healthDisplay.alt = `${hearts} of ${MAX_HEARTS} hearts`;
  if (hearts === 0) endGame('Game Over', deathMessage ?? 'You ran out of health.');
});

const clothingTheftKarma = {all: -2, man: -0.5, women: -1.5};
const pendingBaronKarma = [];
const triggeredBaronKarma = new Set();
let hasChangedKarma = false;
const karmaMeter = document.getElementById('karma-meter');
export const karma = createKarma((score, position) => {
  tallies.karma.record(score);
  hasChangedKarma = true;
  karmaMeter.style.setProperty('--karma-position', `${position * 100}%`);
  karmaMeter.setAttribute('aria-valuenow', score);
  karmaMeter.setAttribute('aria-valuetext', score === 0 ? 'Neutral' : String(score));
  const event = score <= -5 ? 'reward' : score >= 5 ? 'fine' : null;
  if (event && !triggeredBaronKarma.has(event)) {
    triggeredBaronKarma.add(event);
    pendingBaronKarma.push(event);
  }
});

let placingPokieWager = false;
let baronRewardPaid = false;
let baronCompassionFinePaid = false;
function showCoinOutcome(outcome) {
  if (outcome === 'loss') endGame('Game Over', 'You ran out of coins.');
  if (outcome === 'win') endGame('You Win!', 'You reached 200 coins.');
}

export const coinBalance = createCoinBalance((count, outcome, movement) => {
  tallies.coins.record(count, movement);
  if (!gameOver.hidden) return;
  coinCount.textContent = pokieCoinCount.textContent = count;
  coinAnnouncement.textContent = `${count} coins`;
  if (!placingPokieWager) showCoinOutcome(outcome);
});

const firstSightLines = new Map(clubSightLines);
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

const creameryGuardEvents = {
  buyGuardMilk: ['You buy the guard a glass of premium whole milk.', -5, 0],
  rewardGuardMilk: ['The guard raises his glass to you.', 0, 1],
  buyGuardCocktail: ['One Double Distilled Dairy Destroyer. The guard drinks it down.', -20, 0],
  leaveDrunkGuard: ['The guard sways at his post. That drink lives up to its name.', 0, -1],
  pickpocketDrunkGuard: ['You lift the guard’s wallet while he’s seeing double.', 25, -2],
  guardRifleStrike: ['The guard hits Pip with his rifle. Pip loses two hearts.', 0, -1],
  payGuardApology: ['The guard accepts your apology and takes his fine.', -10, 0]
};

const bartenderOrders = {
  whole: ['A glass of whole milk.', -3, 0.5],
  cocktail: ['The Piña Cow-lada lives up to the warning.', -5, -0.5],
  ocean: ['That ocean milk goes down like low tide.', -1, -1]
};

const clothingEvents = {
  all: 'The whole pile is gone. Everyone is still in the pool.',
  man: 'Pip finds ₥10 in the suit pocket.',
  women: 'Two dresses disappear. The suit stays put.'
};

let djGiftPending = false;
const canDeliverDjGift = () => djGiftPending && coinBalance.count >= 60;

const dialogue = createDialogue(baron, {
  tallies,
  placePokieWager(stake, rollMultiplier) {
    if (pokieProfit.banned) return null;
    placingPokieWager = true;
    try {
      const result = coinBalance.wager(stake, rollMultiplier, pokieProfit.maxPayout(stake), true);
      if (result) result.banned = pokieProfit.record(stake, result.payout);
      return result;
    } finally {
      placingPokieWager = false;
    }
  },
  sleepingGambler,
  hasSeenCowGuard: () => seenCowGuard,
  hasKarmaChanged: () => hasChangedKarma,
  baronDiscoveries: () => ({
    pillory: seenPillory, attendant: spokeToPilloryAttendant, pool: seenMilkPool, fountain: seenMilkFountain,
    canAskForFreeMilk: boughtCreameryMilk && MAX_HEARTS - health.hearts >= 1
  }),
  canDeliverDjGift,
  hasSeenDjDairy: () => seenDjDairy,
  hasDjAccess: () => player.djAccess,
  hasSeducedExecutive: () => player.lipstick,
  baronStanding: () => ({karma: karma.score, coins: coinBalance.count}),
  getStolenClothing: () => milkPool.stolenClothing,
  hasPlayedMilkBalloon: () => playedMilkBalloon,
  isCommissionerSplattered: () => commissionerSplattered,
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
    if (action === 'buyWaiterMilk') {
      const healed = health.hearts < MAX_HEARTS;
      clubEvent(healed ? 'Pip drinks a glass of milk and regains half a heart.' : 'Pip drinks a glass of milk.', () => {
        health.change(0.5);
        coinBalance.change(-WAITER_MILK_PRICE);
      });
    }
    if (action === 'summonEliasForPokieBan') startEliasScene({pokieBan: true});
    if (action === 'collectPokieTax') {
      const tax = pokieProfit.collectTax();
      if (tax) clubEvent('Elias collects the extraordinary profits tax.', () => coinBalance.change(-tax));
    }
    if (action === 'finishPokieGame') showCoinOutcome(coinBalance.outcome);
    if (action === 'wakeSleepingGambler' && sleepingGambler.takeTokens(true, elapsed)) {
      clubEvent('Pip wakes the gambler and points out his tokens.', () => karma.change(2));
    }
    if (action === 'stealSleepingGamblerTokens' && sleepingGambler.takeTokens(false, elapsed)) {
      clubEvent('Pip pockets the sleeping gambler’s tokens.', () => {
        karma.change(-2);
        coinBalance.change(10);
      });
    }
    if (action === 'blackmailPolitician') {
      clubEvent('Pip threatens to expose the politician.', () => karma.change(-1));
    }
    if (action === 'politicianHit') {
      health.change(-0.5, 'The politician knocked you out.');
      clubEvent('The politician hits Pip. Health lost.');
    }
    if (action === 'politicianBribe') {
      clubEvent('The politician pays Pip to keep quiet.', () => coinBalance.change(10));
    }
    const coinEvent = coinEvents[action];
    if (coinEvent) {
      const [text, amount] = coinEvent;
      clubEvent(text, () => coinBalance.change(amount));
    }
    const guardEvent = creameryGuardEvents[action];
    if (guardEvent && target.guard === creameryGuard) {
      const [text, coins, karmaPoints] = guardEvent;
      clubEvent(text, () => {
        if (action === 'leaveDrunkGuard' || action === 'pickpocketDrunkGuard') {
          creameryGuard.drunk = true;
          creameryGuard.drunkSince ??= elapsed;
        }
        if (action === 'guardRifleStrike') {
          creameryGuard.apologyRequired = true;
          health.change(-2, 'The Creamery guard knocked you out.');
        }
        if (coins) coinBalance.change(coins);
        if (action === 'payGuardApology') creameryGuard.apologyRequired = false;
        if (karmaPoints) karma.change(karmaPoints);
      });
    }
    if (action === 'bartenderDrink') {
      const [text, cost, hearts] = bartenderOrders[target.order];
      clubEvent(text, () => {
        if ((target.order === 'whole' || target.order === 'ocean') && coinBalance.count >= -cost) boughtCreameryMilk = true;
        coinBalance.change(cost);
        health.change(hearts, 'The Backroom Creamery has served you your last drink.');
      });
    }
    if (action === 'bartenderTip') clubEvent('The bartender collects his tip.', () => coinBalance.change(-2));
    if (action === 'bartenderDoubleTip') clubEvent('The bartender and the guard collect their tips.', () => coinBalance.change(-5));
    if (action === 'bartenderRefusal') {
      clearInput();
      beginRopeScene(ropeWarning, creameryGuard, player, baron, {
        deathMessage: 'You refused to pay the bartender.', celebrate: false
      });
    }
    if (action === 'stealPoolClothing' && takePoolClothing(milkPool, target.selection, elapsed)) {
      clubEvent(clothingEvents[target.selection], () => {
        karma.change(clothingTheftKarma[target.selection]);
        if (target.selection === 'man') coinBalance.change(10);
      });
    }
    if (action === 'lifeguardEntryLie') clubEvent('The lifeguard sees through your story.', () => karma.change(-0.5));
    if (action === 'tellLifeguardAboutClothing') milkPool.clothingAmbientAt = Math.min(milkPool.clothingAmbientAt, elapsed);
    if (!milkPool.clothingReported && ['rewardMissingDresses', 'fineMissingSuit', 'dismissMissingSuit'].includes(action)) {
      milkPool.clothingReported = true;
      target.missingClothing = null;
      if (action === 'rewardMissingDresses') clubEvent('The lifeguard pays you for the good news.', () => coinBalance.change(15));
      if (action === 'fineMissingSuit') clubEvent('The lifeguard takes a dim view of the missing suit.', () => coinBalance.change(-10));
    }
    if (action === 'threatenMilo') clubEvent('Pip threatens Milo.', () => karma.change(-1));
    if (action === 'comfortMilo') clubEvent('Pip apologises to Milo.', () => karma.change(0.5));
    if (action === 'payDjAdmission' && !player.djAccess && coinBalance.count >= DJ_ADMISSION_PRICE) {
      player.djAccess = true;
      clubEvent('The Baron charges you ₥60 to speak to DJ Dairy.', () => coinBalance.change(-DJ_ADMISSION_PRICE));
    }
    if (action === 'awardDjDairyGift') {
      djGiftPending = true;
      clubEvent('Elias gives Pip ₥60 to tip DJ Dairy.', () => coinBalance.change(60));
    }
    if (action === 'deliverDjDairyGift' && canDeliverDjGift()) {
      djGiftPending = false;
      clubEvent('Pip passes the Baron’s gift to DJ Dairy.', () => {
        karma.change(2);
        coinBalance.change(-60);
      });
    }
    if (action === 'skimFalseSpill') {
      const skim = staff.find(member => member.sweeps);
      skim.rushingOffscreen = true;
      skim.target = null;
      skim.route = [];
      skim.pauseUntil = elapsed;
      clubEvent('Pip sends Skim after an imaginary milk spill.', () => karma.change(-1));
    }
    if (action === 'skimSpillApology') clubEvent('Pip apologises to Skim.', () => karma.change(0.5));
    if (action === 'skimSpillLaughter') clubEvent('Pip laughs at Skim.', () => karma.change(-0.5));
    if (action === 'skimSpillInsult') clubEvent('Pip mocks Skim for falling for the lie.', () => karma.change(-1));
    if (action === 'skimSpillCompensation') clubEvent('Pip gives Skim ₥10 for his trouble.', () => {
      karma.change(1);
      coinBalance.change(-10);
    });
    if (action === 'tipSkim') clubEvent('Pip tips Skim ₥3.', () => coinBalance.change(-3));
    if (action === 'buyOracleHint') clubEvent('Pip buys a fragment of the Oracle’s wisdom.', () => coinBalance.change(-1));
    if (action === 'tipDjDairy' && coinBalance.count >= 5) clubEvent('Pip tips DJ Dairy.', () => {
      karma.change(0.5);
      coinBalance.change(-5);
    });
    if (action === 'baronFreeMilk') clubEvent('The Baron gives Pip a glass of milk. One heart restored.', () => health.change(1));
    if (action === 'baronSlap') health.change(-0.5, 'You have displeased the Baron!');
    if (action === 'finishBaronPenalty') returnBaronToRug(baron);
    if (action === 'baronKarmaReward' && !baronRewardPaid) {
      baronRewardPaid = true;
      clubEvent('The Baron awards a performance incentive.', () => coinBalance.change(15, true));
    }
    if (action === 'finishBaronReward' || action === 'finishBaronRewardWithGuard') {
      if (action === 'finishBaronRewardWithGuard') summonBaronGuard(guards, player, baron, milo);
      returnBaronToRug(baron);
      coinBalance.finishDeferredWin();
    }
    if (action === 'baronCowFine') {
      if (coinBalance.count < 20) endGame('Game Over', 'Pip asked too many questions for his level of wealth.');
      else clubEvent('Elias fines Pip ₥20 for asking about the guards.', () => coinBalance.change(-20));
    }
    if (action === 'baronKarmaFine' && !baronCompassionFinePaid) {
      baronCompassionFinePaid = true;
      clubEvent('The Baron charges a behavioural compliance levy.', () => coinBalance.change(-15));
    }
    if (action === 'eliasVampireFine') clubEvent('Elias charges you for bringing up vampires again.', () => coinBalance.change(-1));
    if (action === 'collectTax') clubEvent('Elias takes the Baron’s cut.', () => coinBalance.collectTax());
    if (action === 'finishEliasWelcome') {
      document.getElementById('coin-counter').hidden = false;
      elias.findingEdge = true;
      clubEvent('Elias opens your account. The Baron expects you to double it.');
    }
    if (action === 'executivePrivateNetworking') {
      player.lipstick = true;
      clubEvent('Private networking costs Pip ₥100. Health restored.', () => {
        health.change(MAX_HEARTS);
        coinBalance.change(-100);
      });
      slotReactions.queue(player, target);
    }
    if (action === 'executiveRedundancy1' || action === 'executiveRedundancy2' || action === 'executiveRedundancy3') {
      const stage = Number(action.at(-1));
      clubEvent('The executive pays Pip redundancy compensation.', () => {
        coinBalance.change(stage === 3 ? 20 : 5);
        karma.change(-stage);
      });
    }
    if (action === 'executiveFraudFine') {
      clubEvent('The guard takes back ₥30 in compensation and charges a ₥20 fine.', () => coinBalance.change(-50));
    }
    if (action === 'executiveSummonEscort' || action === 'executiveSummonFraud') {
      clearInput();
      guestEscort = {
        guard: summonGuardFromOffscreen(guards, player, baron),
        phase: 'waiting', executive: action === 'executiveSummonFraud' ? 'fraud' : 'escort'
      };
      clubEvent('The executive has called for a guard.');
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
    if (action === 'escortGuest' && guestEscort) {
      const destination = guestEscort.executive ? {x: player.x + ROOM_WIDTH / 2 + 34, y: player.y} : null;
      beginGuestEscort(guestEscort, player, baron, completedGuestEscorts > 0, destination);
    }
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
    if (action === 'commissionerGift' || action === 'commissionerBetrayal' || action === 'commissionerTheft') {
      const theft = action === 'commissionerTheft';
      clubEvent(theft ? "Pip takes the Commissioner's coins." : 'The Commissioner gives Pip ₥5.', () => {
        if (theft) karma.change(-3);
        if (action === 'commissionerBetrayal') karma.change(-2);
        coinBalance.change(5);
      });
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
let rangeFall = null;

function warnAtGuestGate() {
  if (gateWarned) return;
  gateWarned = true;
  clearInput();
  ropeWarning.talks++;
  dialogue.open({id: 'guard', title: 'Bull Guard', guestGate: true});
}

const {readMovement, clearInput} = bindControls({
  isPaused: () => eliasApproaching || Boolean(eliasScene) || !gameOver.hidden || dialogue.isOpen() || Boolean(guestEscort || ropeWarning.scene || rangeFall),
  nudge: (dx, dy) => {
    if (eliasApproaching || eliasScene || !gameOver.hidden || milkBalloon || rangeFall) return;
    if (dx < 0 && nearGuestGate(player) && ropeWarning.talks < 2) warnAtGuestGate();
    else {
      const previous = {x: player.x, y: player.y};
      movePlayer(player, baron, dx, dy, guards);
      checkPracticeRange(previous, elapsed);
    }
  },
  interact: () => {
    if (dialogue.isOpen() || guestEscort || ropeWarning.scene) return;
    if (eliasApproaching || eliasScene || !gameOver.hidden || milkBalloon || rangeFall) return;
    const nearbyGuests = guests.filter(guest => !(elias.findingEdge && guest === elias)
      && !(guestEnclosure.active && insideGuestEnclosure(guest))
      && !(guest === sleepingGamblerTarget && sleepingGambler.pose(elapsed).awake));
    nearbyGuests.push(mystic);
    if (player.djAccess) nearbyGuests.push(djTarget);
    if (!milkPool.stolenClothing) nearbyGuests.push(poolClothing);
    const target = nearbyPracticeGuard(player) ?? nearestInteraction(player, baron, milo, guards, nearbyGuests);
    if (target) {
      if (target.id === pilloryAttendant.id) spokeToPilloryAttendant = true;
      if (target.id === 'milo') seenMilo = true;
      if (target.practiceGuard) seenCowGuard = true;
      if (target.id === lifeguard.id && !milkPool.clothingReported) target.missingClothing = milkPool.stolenClothing;
      if (target.guestGate) ropeWarning.talks++;
      if (target.guard && poolClothesReport?.guards.includes(target.guard) && !poolClothesReport.thanked
          && poolClothesReport.guards.every(guard => !guard.poolReportPending)) {
        poolClothesReport.thanked = true;
        target.poolClothesThanks = true;
      }
      clearInput();
      dialogue.open(target.id === openSlot.id && pokieProfit.banned ? {...elias, pokieRefusal: true} : target);
    } else info.textContent = 'Nobody is close enough to talk to.';
  }
});

function checkPracticeRange(previous, previousTime) {
  if (!practiceRangeHit(previous, player, previousTime, elapsed)) return false;
  clearInput();
  player.walking = false;
  rangeFall = {time: 0, guard: {x: PRACTICE_RANGE.guardX}, blood: false};
  return true;
}

function startEliasScene(conversation) {
  clearInput();
  player.walking = false;
  eliasScene = {route: routeEliasToPip(elias, player, baron), conversation};
}

function frame(timestamp) {
  const dt = Math.min((timestamp - lastFrame) / 1000 || 0, 0.05);
  lastFrame = timestamp;
  if (!gameOver.hidden) return;
  if (rangeFall) {
    rangeFall.time += dt;
    render(player, baron, milo, guards, cameraLeft(player.x), cameraTop(player.y), elapsed,
      staff, milkService.scene, partyChatter, guestEscort, ropeWarning, gateGuard, milkPool, null, attendantMilk.scene, rangeFall);
    if (rangeFall.time >= 0.7) health.change(-MAX_HEARTS, 'You walked into live fire.');
    else requestAnimationFrame(frame);
    return;
  }
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
  if (!eliasScene && !guestEscort && !ropeWarning.scene && !milkBalloon) {
    if (pendingBaronKarma.length && !baron.returningToRug && !milkService.scene && !onDanceFloor(player.x, player.y)) {
      clearInput();
      player.walking = false;
      baron.walking = false;
      baron.route = [];
      baron.speech = null;
      const route = routeEliasToPip({...baron, radius: 24}, player, {x: Infinity, y: Infinity}, 70);
      eliasScene = {route: null, baronRoute: route, conversation: {baronKarma: pendingBaronKarma.shift()}};
    } else if (coinBalance.pendingTax) startEliasScene({tax: coinBalance.pendingTax});
  }
  if (eliasScene) {
    const {route, baronRoute, conversation} = eliasScene;
    if (baronRoute?.length) {
      if (advanceBaronApproach(baron, baronRoute[0], dt)) baronRoute.shift();
      if (!baronRoute.length) {
        baron.walking = false;
        baron.facing = facingIndex(player.x - baron.x, player.y - baron.y);
        eliasScene.route = routeEliasToPip(elias, player, baron);
      }
    } else if (route?.length && advanceEliasRun(elias, route[0], dt, 0, conversation.baronKarma ? 165 : 230)) {
      route.shift();
    }
    render(player, baron, milo, guards, cameraLeft(player.x), cameraTop(player.y), elapsed,
      staff, milkService.scene, partyChatter, null, ropeWarning, gateGuard, milkPool, null, attendantMilk.scene);
    if (route?.length === 0) {
      eliasScene = null;
      const speaker = conversation.baronKarma ? {id: 'baron', title: 'The Milk Baron'} : elias;
      dialogue.open({...speaker, ...conversation});
    }
    requestAnimationFrame(frame);
    return;
  }
  const previousTime = elapsed;
  elapsed += dt;

  if (ropeWarning.scene) {
    const ended = advanceRopeScene(ropeWarning.scene, player, dt);
    render(player, baron, milo, guards, cameraLeft(player.x), cameraTop(player.y), elapsed,
      staff, null, partyChatter, null, ropeWarning, gateGuard, milkPool, null, attendantMilk.scene);
    if (ended) {
      health.change(-MAX_HEARTS, ropeWarning.scene.deathMessage ?? 'You have bothered women for the last time!');
    } else requestAnimationFrame(frame);
    return;
  }

  if (milkBalloon) {
    const done = updateMilkBalloon(milkBalloon, player, dt);
    commissionerSplattered ||= Boolean(milkBalloon.hitCommissioner);
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

  const previousPosition = {x: player.x, y: player.y};
  if (guestEscort?.phase === 'walking') {
    if (advanceGuestEscort(guestEscort, player, baron, guards, elapsed, dt)) {
      const executiveEscort = guestEscort.executive;
      guestEscort = null;
      if (!executiveEscort) completedGuestEscorts++;
      clearInput();
      if (!executiveEscort && completedGuestEscorts === 2) {
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
  if (checkPracticeRange(previousPosition, previousTime)) {
    requestAnimationFrame(frame);
    return;
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
  seenDjDairy ||= inView(djTarget);
  const pilloryVisible = pilloryInView(cameraX, cameraY);
  seenPillory ||= pilloryVisible;
  seenPoolAndClothes ||= inView(MILK_POOL) && inView(poolClothing);
  noteSight('ladies', partyGuests.every(guest => inView({x: guest.x, y: guest.y - 33})));
  seenMilkPool ||= inView(MILK_POOL);
  seenMilkFountain ||= inView(MILK_FOUNTAIN);
  noteSight('pool', seenMilkPool);
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
  updateMilkMystic(mystic, baron, dt);
  if (updateMilo(milo, baron, elapsed, dt, guards) && !baronLocked) callOutMilo(baron, milo, elapsed);
  if (!baronLocked) updateBaronIdleSpeech(baron, cameraX, cameraY, elapsed);
  if (guestEscort?.executive && !guestEscort.guard) {
    guestEscort.guard = summonGuardFromOffscreen(guards, player, baron);
  }
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
    const executive = guestEscort?.executive;
    if (executive === 'fraud') guestEscort = null;
    clearInput();
    dialogue.open({
      id: 'guard', title: 'Bull Guard', summoned: true,
      executiveFraud: executive === 'fraud', repeat: !executive && completedGuestEscorts > 0
    });
    requestAnimationFrame(frame);
    return;
  }
  const reaction = !guestEscort && slotReactions.update(player, baron, dt);
  if (reaction) {
    clearInput();
    dialogue.open(reaction);
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
