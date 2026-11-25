import {createCoinBalance} from '../src/coins.mjs';
import {createProfessorConversation, professorMoods} from '../src/professor-dialogue.mjs';
import {createProfessorSpeech, professor, professorPose} from '../src/professor.mjs';
import {createMilkPool, lifeguard, milkPoolSpeech, poolClothing, remainingClothing, takePoolClothing, updateMilkPool} from '../src/milk-pool.mjs';
import {advanceRopeScene, beginRopeScene, createRopeWarning, ropeWarningSpeech, updateRopeWarning} from '../src/rope-warning.mjs';
import {advanceGuestEscort, beginGuestEscort, guestRopesInView} from '../src/guest-escort.mjs';
import {partyGuests} from '../src/party-guests.mjs';
import {availableReports, poolReports} from '../src/report-dialogue.mjs';
import {createDancerSpeech} from '../src/dancers.mjs';
import {danceLyric} from '../src/dance-floor.mjs';
import {createPartyChatter, partySpeech, updatePartyChatter} from '../src/party-chatter.mjs';
import {bartender, createCreameryGuard} from '../src/creamery.mjs';
import {createMilkService, milkCalls, updateMilkService} from '../src/milk-service.mjs';
import {createStaff, faceStaffMovement, updateStaff, staffFrame} from '../src/staff.mjs';
import {speechBubbleLayout} from '../src/speech-layout.mjs';
import {createGuards, dispatchGuardToMilo, dispatchGuardToPool, summonGuard, updateGuards} from '../src/guards.mjs';
import {createMilo, fleeMilo, updateMilo} from '../src/milo.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {callOutMilo, createBaron, isBaronDancing, speechOpacity, updateBaronIdleSpeech, updateBaronAttention, updateBaronWalk} from '../src/baron.mjs';
import {facingIndex} from '../src/directions.mjs';
import {createPlayer, movePlayer, updatePlayer} from '../src/player.mjs';
import {BARON_DANCE_STOP, cameraLeft, cameraTop, DANCE_FLOOR, guestEnclosure, guestGateOutside, insideGuestEnclosure, HALL_CENTER, MILK_FOUNTAIN, MILK_POOL, professorFeet, isBlocked, nearestInteraction, onDanceFloor, routeAroundBaron, closestRug, NORTH_EDGE, ROOM_HEIGHT, ROOM_WIDTH, RUGS, WEST_EDGE, SIDE_RUGS, SOUTH_EDGE, SOUTH_TRIM_Y} from '../src/room.mjs';

test('both characters use the same eight facing directions', () => {
  const directions = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];
  const baron = createBaron();
  directions.forEach(([dx, dy], index) => {
    assert.equal(facingIndex(dx, dy), index);
    updateBaronAttention(baron, {x: baron.x + dx, y: baron.y + dy}, 0, 0.05);
    assert.equal(baron.facing, index);
  });
});

test('movement normalizes diagonals and stops animating when blocked', () => {
  const player = createPlayer();
  const baron = createBaron();
  const start = {...player};
  updatePlayer(player, baron, {dx: 1, dy: -1}, 0.05);
  assert.ok(Math.abs(Math.hypot(player.x - start.x, player.y - start.y) - 6.2) < 1e-9);
  assert.equal(player.facing, 3);
  assert.equal(player.walking, true);
  assert.ok(player.stride > 0);

  player.y = SOUTH_TRIM_Y - 16;
  movePlayer(player, baron, 0, 1);
  assert.equal(player.y, SOUTH_TRIM_Y - 16);
  assert.equal(player.facing, 0);
  assert.equal(player.walking, false);
  assert.equal(player.stride, 0);
});

test('the closed center door and the Baron block movement while old furniture positions are open', () => {
  const baron = createBaron();
  for (const [x, y] of [[350, NORTH_EDGE + 175], [385, HALL_CENTER.y + 6]]) {
    assert.equal(isBlocked(x, y, 13, baron), true);
  }
  for (const [x, y] of [[-345, 165], [171, 319], [535, 319], [170, 553], [165, 215], [520, 215]]) {
    assert.equal(isBlocked(x, y, 13, baron), false);
  }
  baron.x -= 20;
  assert.equal(isBlocked(385, HALL_CENTER.y + 6, 13, baron), false);
});

test('the empty hall retains character interactions', () => {
  const baron = createBaron();
  assert.equal(nearestInteraction(createPlayer(), baron), undefined);
  assert.equal(nearestInteraction({x: 350, y: HALL_CENTER.y + 54}, baron)?.title, 'The Milk Baron');
  assert.equal(nearestInteraction({x: 171, y: 319}, baron), undefined);
});

test('the camera clamps at the outer walls and the floor is open between the end walls', () => {
  const baron = createBaron();
  assert.equal(cameraLeft(-600), -690);
  assert.equal(cameraLeft(345), 0);
  assert.equal(cameraLeft(1300), 690);
  for (const x of [0, 690]) {
    assert.equal(isBlocked(x, 380, 13, baron), false);
    assert.equal(isBlocked(x, 451, 13, baron), false);
  }
  assert.equal(isBlocked(-653, 451, 13, baron), true);
  assert.equal(isBlocked(1342, 451, 13, baron), true);
});

test('the 3×5 rectangle has fourteen reachable rugs and perimeter walls', () => {
  const baron = createBaron();
  assert.equal(RUGS.length, 14);
  const occupiedSquares = new Set(RUGS.map(({x, y}) =>
    Math.floor(x / ROOM_WIDTH) + ',' + Math.floor((y - NORTH_EDGE) / ROOM_HEIGHT)));
  assert.equal(occupiedSquares.size, 14);
  assert.equal(baron.y, (NORTH_EDGE + SOUTH_EDGE) / 2);
  const spawnRug = closestRug(baron);
  assert.deepEqual(spawnRug, {...HALL_CENTER, horizontal: false});
  for (const rug of RUGS) {
    const column = Math.floor((rug.x - WEST_EDGE) / ROOM_WIDTH);
    const row = (rug.y - NORTH_EDGE) / ROOM_HEIGHT - 0.5;
    assert.ok(Number.isInteger(row));
    assert.equal(rug.x, WEST_EDGE + (column + 0.5) * ROOM_WIDTH - (column === 2 && row === 4 ? 84 : 0));
    assert.equal(rug.horizontal, (row === 0 || row === 4) && (column === 0 || column === 2));
    assert.equal(closestRug(rug), rug);
    assert.equal(isBlocked(rug.x, rug.y, 13, {x: 0, y: 0}), false);
  }
  for (const x of [-345, 345, 1035]) {
    for (const y of [NORTH_EDGE + 200, 618, ROOM_HEIGHT * 2, SOUTH_TRIM_Y - 16]) {
      assert.equal(isBlocked(x, y, 13, {x: 0, y: 0}), false);
    }
    assert.equal(isBlocked(x, NORTH_EDGE + 159, 13, baron), true);
    assert.equal(isBlocked(x, SOUTH_TRIM_Y - 15, 13, baron), true);
  }
  assert.equal(cameraTop(NORTH_EDGE + 160), NORTH_EDGE);
  assert.equal(cameraTop(SOUTH_TRIM_Y - 16), SOUTH_EDGE - ROOM_HEIGHT);
});

test('the Baron can follow the player north and south', () => {
  for (const rug of [RUGS[1], RUGS.at(-2)]) {
    const baron = createBaron();
    const viewY = cameraTop(rug.y);
    updateBaronWalk(baron, rug, 0, 0, 0.05, viewY);
    updateBaronWalk(baron, rug, 0, 5, 0.05, viewY);
    assert.equal(baron.route.at(-1), rug);
  }
});

test('the Baron waits five continuous seconds off-screen then walks to the closest side rug', () => {
  const baron = createBaron();
  const player = createPlayer();
  const update = (x, time, dt = 0.05) => {
    player.x = x;
    player.y = SIDE_RUGS[0].y;
    updateBaronWalk(baron, player, cameraLeft(x), time, dt);
  };
  update(-500, 0);
  update(-500, 4.9);
  assert.equal(baron.walking, false);
  update(350, 5);
  update(-500, 6);
  update(-500, 10.9);
  assert.equal(baron.walking, false);
  update(-500, 11);
  assert.equal(baron.walking, true);
  assert.ok(Math.abs(baron.x - (HALL_CENTER.x - 146 * 0.05)) < 1e-9);
  assert.equal(baron.route.at(-1), SIDE_RUGS[0]);
  assert.match(baron.speech.text, /What's going on/);
  assert.equal(speechOpacity(baron, cameraLeft(-500), 11), 0);

  let time = 11;
  while (baron.route.length && time < 22) {
    time += 0.05;
    update(-500, time);
    assert.equal(isBlocked(baron.x, baron.y, 13, {x: 0, y: 0}), false);
  }
  assert.deepEqual([baron.x, baron.y], [SIDE_RUGS[0].x, SIDE_RUGS[0].y]);
  assert.notEqual(baron.speech.visibleSince, null);
  assert.equal(speechOpacity(baron, cameraLeft(-500), baron.speech.visibleSince + 3.5), 0.5);
  update(-500, time + 4);
  assert.equal(baron.walking, false);
  assert.equal(baron.speech, null);

  update(1200, time + 5);
  update(1200, time + 10);
  assert.equal(baron.route.at(-1), SIDE_RUGS[1]);
  assert.match(baron.speech.text, /drink more milk/);
});

test('the Baron can return to the center from either wing', () => {
  const player = {...HALL_CENTER};
  for (const rug of SIDE_RUGS) {
    const baron = {...createBaron(), ...rug};
    for (let frame = 0; frame <= 16 * 20; frame++) {
      updateBaronWalk(baron, player, cameraLeft(player.x), frame / 20, 0.05);
      assert.equal(isBlocked(baron.x, baron.y, 13, {x: 0, y: 0}), false);
    }
    const target = closestRug(player);
    assert.deepEqual([baron.x, baron.y, baron.walking], [target.x, target.y, false]);
  }
});

test('the player can step away if the Baron walks onto an occupied rug', () => {
  const baron = {...createBaron(), ...SIDE_RUGS[0]};
  const player = {...createPlayer(), ...SIDE_RUGS[0]};
  movePlayer(player, baron, 5, 0);
  assert.equal(player.x, SIDE_RUGS[0].x + 5);
});

test('the Baron says an idle remark about every 30 seconds and fades it out', () => {
  const baron = createBaron();
  const player = createPlayer();
  const cameraY = cameraTop(player.y);
  updateBaronIdleSpeech(baron, 0, cameraY, 29);
  assert.equal(baron.speech, null);
  updateBaronIdleSpeech(baron, 0, cameraY, 30);
  assert.match(baron.speech.text, /WELCOME|extremely fair|carpet|oversee every game/);
  assert.ok(baron.nextIdleSpeech >= 57 && baron.nextIdleSpeech < 63);
  assert.equal(speechOpacity(baron, 0, 33.5, cameraY), 0.5);
  updateBaronAttention(baron, player, 30.1, 0.05);
  assert.ok(baron.expression > 0);
  updateBaronWalk(baron, player, 0, 34, 0.05, cameraY);
  assert.equal(baron.speech, null);
});

test('Milo callouts and rug-walk lines take priority over idle remarks', () => {
  const baron = createBaron();
  const cameraY = cameraTop(baron.y);
  callOutMilo(baron, createMilo(), 29);
  const callout = baron.speech;
  updateBaronIdleSpeech(baron, 0, cameraY, 30);
  assert.equal(baron.speech, callout);

  const rugLine = {text: "What's going on over here?", visibleSince: null};
  baron.speech = rugLine;
  baron.route = [RUGS[0]];
  updateBaronIdleSpeech(baron, 0, cameraY, 32);
  assert.equal(baron.speech, rugLine);
  baron.route = [];
  baron.speech = null;
  updateBaronIdleSpeech(baron, 0, cameraY + 1000, 34);
  assert.equal(baron.speech, null);
  updateBaronIdleSpeech(baron, 0, cameraY, 35);
  assert.equal(baron.speech.visibleSince, 35);
  callOutMilo(baron, createMilo(), 35);
  assert.ok(miloCallouts.includes(baron.speech.text));
});

test('Milo rotates through all four far corners and can still be approached', () => {
  const milo = createMilo();
  const baron = createBaron();
  updateMilo(milo, baron, 11, 0.05);
  assert.equal(milo.route.length, 0);
  const corners = new Set();
  for (let frame = 240; frame < 155 * 20; frame++) {
    updateMilo(milo, baron, frame / 20, 0.05);
    if (!milo.route.length) corners.add(milo.x + ',' + milo.y);
  }
  assert.deepEqual(corners, new Set([
    '-574,' + (NORTH_EDGE + 224), '-574,' + (SOUTH_TRIM_Y - 83),
    '1264,' + (SOUTH_TRIM_Y - 83), '1264,' + (NORTH_EDGE + 224)
  ]));
  assert.equal(nearestInteraction(milo, baron, milo)?.title, 'Milo Milksworth');
});

const miloCallouts = [
  'Milo, I see you!',
  'Milo, Milo, Milo. Always causing trouble.',
  'Milo my good friend. Why do you always run away?',
  'MILO! Have you been drinking my milk again?!',
  'Come here, Milo! I merely wish to discuss your behaviour!',
  'Milo! You cannot hide from the dairy aristocracy!',
  'That boy is going to curdle my milk!'
];

test('the Baron spots Milo in the same square and Milo runs to the other side', () => {
  for (const x of [-574, 1264]) {
    for (const y of [NORTH_EDGE + 224, SOUTH_TRIM_Y - 83]) {
      const milo = {...createMilo(), x, y};
      const baron = {...createBaron(), x: x < 0 ? -345 : 1035};
      assert.equal(updateMilo(milo, baron, 1, 0.05), false);

      baron.y = y;
      assert.equal(updateMilo(milo, baron, 2, 0.05), true);
      callOutMilo(baron, milo, 2);
      assert.ok(miloCallouts.includes(baron.speech.text));
      assert.equal(speechOpacity(baron, cameraLeft(baron.x), 5.5, cameraTop(baron.y)), 0.5);
      assert.equal(milo.fleeing, true);

      for (let frame = 41; frame < 280; frame++) {
        assert.equal(updateMilo(milo, baron, frame / 20, 0.05), false);
        assert.equal(isBlocked(milo.x, milo.y, 13, {x: 0, y: 0}), false);
      }
      assert.equal(milo.x, x < 0 ? 1264 : -574);
      assert.equal(milo.y, y);
      assert.equal(milo.fleeing, false);
    }
  }
});

function guardsNearPlayer() {
  const guards = createGuards(createPlayer(), createBaron(), createMilo());
  for (const guard of guards) {
    guard.x = HALL_CENTER.x + guard.side * 98;
    guard.y = HALL_CENTER.y + 240;
  }
  return guards;
}

test('both guards spawn at random walkable positions with room around other actors', () => {
  const player = createPlayer();
  const baron = createBaron();
  const milo = createMilo();
  const positions = [];
  for (const random of [() => 0.2, () => 0.8]) {
    const guards = createGuards(player, baron, milo, random);
    assert.equal(guards.length, 2);
    for (const guard of guards) {
      assert.equal(isBlocked(guard.x, guard.y, guard.radius, baron), false);
      for (const actor of [player, baron, milo, ...guards.filter(other => other !== guard)]) {
        assert.ok(Math.hypot(guard.x - actor.x, guard.y - actor.y) >= 80);
      }
    }
    positions.push(guards.map(({x, y}) => [x, y]));
  }
  assert.notDeepEqual(positions[0], positions[1]);
});

test('the player can approach a guard and the guard holds position', () => {
  const guards = guardsNearPlayer();
  const player = createPlayer();
  const baron = createBaron();
  const milo = createMilo();
  const [guard, patrollingGuard] = guards;
  const patrolStart = patrollingGuard.x;
  patrollingGuard.target = {x: patrolStart - 300, y: patrollingGuard.y};
  for (let i = 0; i < 100; i++) movePlayer(player, baron, 2, 0, guards);
  const separation = Math.hypot(player.x - guard.x, player.y - guard.y);
  assert.ok(separation >= 27 && separation < 30);

  const start = {x: guard.x, y: guard.y};
  for (let frame = 0; frame < 120; frame++) {
    updateGuards(guards, player, baron, milo, 3 + frame / 60, 1 / 60);
  }
  assert.deepEqual({x: guard.x, y: guard.y}, start);
  assert.ok(patrollingGuard.x < patrolStart);
  movePlayer(player, baron, -5, 0, guards);
  assert.ok(Math.hypot(player.x - guard.x, player.y - guard.y) > separation);
});

test('two guards with crossing patrols steer around one another', () => {
  const guards = guardsNearPlayer();
  const [first, second] = guards;
  const player = {...createPlayer(), x: 1000};
  const baron = createBaron();
  const milo = createMilo();
  first.target = {x: second.x, y: second.y};
  second.target = {x: first.x, y: first.y};
  for (let frame = 0; frame < 250; frame++) {
    updateGuards(guards, player, baron, milo, 3 + frame / 60, 1 / 60);
    assert.ok(Math.hypot(first.x - second.x, first.y - second.y) >= 28);
    assert.equal(isBlocked(first.x, first.y, first.radius, baron), false);
    assert.equal(isBlocked(second.x, second.y, second.radius, baron), false);
  }
  assert.ok(first.x < second.x);
});

test('either guard triggers an escape in Milo’s square without triggering Baron dialogue', () => {
  for (const guardIndex of [0, 1]) {
    const milo = createMilo();
    const baron = createBaron();
    const guards = guardsNearPlayer();
    const guard = guards[guardIndex];
    guard.x = milo.x + 100;
    guard.y = milo.y + ROOM_HEIGHT;
    assert.equal(updateMilo(milo, baron, 1, 0.05, guards), false);
    assert.equal(milo.fleeing, false);

    guard.x = milo.x - 50;
    guard.y = milo.y;
    const startX = milo.x;
    assert.equal(updateMilo(milo, baron, 2, 0.05, guards), false);
    assert.equal(milo.fleeing, true);
    assert.ok(milo.x > startX);
    assert.ok(milo.route[0].x > HALL_CENTER.x);
    assert.equal(baron.speech, null);
  }
});

test('Baron callouts use all phrases per round without consecutive repeats', () => {
  const baron = createBaron();
  const milo = createMilo();
  const spoken = [];
  for (let i = 0; i < miloCallouts.length * 4; i++) {
    callOutMilo(baron, milo, i);
    assert.notEqual(baron.speech.text, spoken.at(-1));
    spoken.push(baron.speech.text);
  }
  for (let i = 0; i < spoken.length; i += miloCallouts.length) {
    assert.deepEqual(new Set(spoken.slice(i, i + miloCallouts.length)), new Set(miloCallouts));
  }
});

test('the Baron records only completed rug trips and distinct looks toward the player', () => {
  const baron = createBaron();
  const player = createPlayer();
  baron.route = [{x: baron.x + 8, y: baron.y}];
  updateBaronWalk(baron, player, 0, 1, 0.025);
  assert.equal(baron.completedRugTrips, 0);
  updateBaronAttention(baron, player, 1, 0.025);
  assert.equal(baron.watchedDirections.size, 0);
  updateBaronWalk(baron, player, 0, 2, 0.05);
  assert.equal(baron.completedRugTrips, 1);
  updateBaronWalk(baron, player, 0, 2.1, 0.05);
  assert.equal(baron.completedRugTrips, 1);

  for (const [dx, dy] of [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [0, 1]]) {
    updateBaronAttention(baron, {x: baron.x + dx, y: baron.y + dy}, 3, 0.05);
  }
  assert.equal(baron.watchedDirections.size, 6);
});

test('speech bubbles stay in the camera and point to the speaker near the edges', () => {
  assert.deepEqual(speechBubbleLayout(14, 342, 437, 260, 90, 0, 330), {
    left: 8, top: 449, tailX: 23, tailTipX: 14, tailTipY: 437, above: false
  });
  assert.deepEqual(speechBubbleLayout(687, 514, 609, 260, 90, 0, 330), {
    left: 422, top: 412, tailX: 667, tailTipX: 682, tailTipY: 514, above: true
  });
});

test('each staff member spawns in a separate spot and roams the hall', () => {
  const baron = createBaron();
  const player = createPlayer();
  const milo = createMilo();
  const guards = createGuards(player, baron, milo, () => 0.35);
  const waiters = createStaff(player, baron, milo, guards, () => 0);
  const otherSpawns = createStaff(player, baron, milo, guards, () => 0.9);
  assert.equal(waiters.length, 7);
  assert.equal(new Set(waiters.map(server => server.id)).size, 7);
  assert.equal(new Set(waiters.map(server => `${server.x},${server.y}`)).size, 7);
  assert.notDeepEqual(waiters.map(server => [server.x, server.y]), otherSpawns.map(server => [server.x, server.y]));
  for (const server of waiters) {
    const interaction = nearestInteraction(server, baron, null, [], waiters);
    assert.equal(interaction.id, server.id);
    assert.equal(interaction.message, 'Not now, busy busy busy');
    assert.equal(isBlocked(server.x, server.y, server.radius, baron), false);
    assert.ok([player, baron, milo, ...guards].every(actor => Math.hypot(server.x - actor.x, server.y - actor.y) >= 56));
  }

  const cleaner = waiters.find(server => server.id === 'edmund-vale');
  assert.equal(cleaner.title, 'Edmund Skim');
  assert.deepEqual(staffFrame(cleaner, 0.25), {column: 2, row: 1});
  assert.deepEqual(staffFrame(cleaner, 0.5), {column: 4, row: 1});

  const [waiter] = waiters;
  const start = {x: waiter.x, y: waiter.y};
  for (let frame = 0; frame < 160; frame++) {
    updateStaff(waiters, player, baron, guards, 3 + frame * 0.05, 0.05, () => 0.8);
  }
  assert.notEqual(waiter.x, start.x);
  assert.notEqual(waiter.y, start.y);
  assert.equal(staffFrame(waiter, 11).row, 0);
  const x = waiter.x;
  const guest = {x, y: waiter.y + 30};
  updateStaff(waiters, guest, baron, guards, 11, 0.05, () => 0.2);
  assert.equal(waiter.x, x);
  assert.equal(staffFrame(waiter, 11).row, 1);
});

test('milk service waits for eligible time and calls the closest server with milk', () => {
  const baron = createBaron();
  const service = createMilkService();
  const staff = [
    {x: baron.x + 15, y: baron.y, withoutMilk: true, radius: 14},
    {x: baron.x + 100, y: baron.y, radius: 14},
    {x: baron.x + 200, y: baron.y, radius: 14},
    {x: baron.x + 5, y: baron.y, sweeps: true, radius: 14}
  ];
  const camera = {x: 0, y: 0};
  updateMilkService(service, baron, staff, [], camera, 44, 44, false);
  updateMilkService(service, baron, staff, [], camera, 64, 20, true);
  assert.equal(service.remaining, 1);
  baron.route.push({x: 600, y: 500});
  updateMilkService(service, baron, staff, [], camera, 65, 1, false);
  assert.equal(service.remaining, 1);
  baron.route.length = 0;
  baron.facing = 7;
  updateMilkService(service, baron, staff, [], camera, 66, 1, false, () => 0.99);
  assert.equal(service.scene.server, staff[1]);
  assert.equal(baron.facing, 0);
  assert.equal(baron.speech.text, milkCalls.at(-1));
});

test('server delivers and refills offscreen, then Skim clears the glass and restarts the clock', () => {
  const baron = createBaron();
  const service = createMilkService();
  const server = {x: baron.x + 160, y: baron.y + 8, radius: 14, walkTime: 0};
  const cleaner = {x: baron.x - 145, y: baron.y - 45, radius: 14, walkTime: 0, sweeps: true};
  const staff = [server, cleaner];
  const camera = {x: 0, y: 0};
  service.remaining = 0.05;
  const seen = new Set();
  for (let frame = 1; frame < 500; frame++) {
    updateMilkService(service, baron, staff, [], camera, frame * 0.05, 0.05, false, () => 0);
    if (!service.scene) break;
    seen.add(service.scene.phase);
    if (service.scene.phase === 'drink') assert.equal(server.serviceDuty, false);
    if (service.scene.phase === 'sweep') assert.equal(cleaner.serviceDuty, true);
  }
  assert.deepEqual([...seen], ['delivery', 'handoff', 'drink', 'windup', 'toss', 'cleanup-run', 'sweep']);
  assert.equal(service.scene, null);
  assert.equal(service.remaining, 45);
  assert.equal(cleaner.serviceDuty, false);
  assert.equal(server.withoutMilk, true);
  updateMilkService(service, baron, staff, [], {x: 1000, y: 0}, 25, 0.05, false);
  assert.equal(server.withoutMilk, false);
});


test('Skim uses front and back walking rows for vertical movement', () => {
  const cleaner = {sweeps: true, walking: true, walkTime: 0.22, facing: 1};
  faceStaffMovement(cleaner, 0.15, -2);
  assert.deepEqual(staffFrame(cleaner, 0), {column: 2, row: 1, vertical: true});
  faceStaffMovement(cleaner, 0.15, 2);
  assert.deepEqual(staffFrame(cleaner, 0), {column: 2, row: 0, vertical: true});
  faceStaffMovement(cleaner, -2, 0.15);
  assert.deepEqual(staffFrame(cleaner, 0), {column: 2, row: 0});
  assert.equal(cleaner.facing, -1);
  cleaner.walking = false;
  assert.deepEqual(staffFrame(cleaner, 0.25), {column: 2, row: 1});
});


test('the creamery bartender is reachable from the floor and the guard stays posted', () => {
  const baron = createBaron();
  const player = {...createPlayer(), x: bartender.x, y: bartender.y + 12};
  const guard = createCreameryGuard();
  const initialPost = {...guard};
  assert.ok(guard.x > bartender.x);
  assert.equal(isBlocked(player.x, player.y, player.radius, baron), false);
  assert.equal(nearestInteraction(player, baron, null, [guard], [bartender]).id, bartender.id);
  updateGuards([guard], player, baron, createMilo(), 90, 0.05);
  assert.deepEqual(guard, initialPost);
});


test('Milo keeps his normal route near the posted guard and walks around a blocked path', () => {
  const milo = createMilo();
  const baron = createBaron();
  const posted = createCreameryGuard();
  const start = {x: milo.x, y: milo.y};
  updateMilo(milo, baron, 1, 0.05, [posted]);
  assert.equal(milo.fleeing, false);
  assert.equal(milo.y, start.y);
  // Exercise a straight path crossing a stationary guard with no other exit pressure.
  posted.x = start.x + 70;
  posted.y = start.y;
  const destination = {x: start.x + 190, y: start.y};
  milo.route = [destination];
  for (let frame = 0; frame < 100 && milo.route.length; frame++) {
    updateMilo(milo, baron, 2 + frame * 0.05, 0.05, [posted]);
    assert.ok(Math.hypot(milo.x - posted.x, milo.y - posted.y) >= 26 - 1e-9);
  }
  assert.deepEqual({x: milo.x, y: milo.y}, destination);
});

test('party guests shuffle whole conversations and refill both glasses after every four exchanges', () => {
  const chatter = createPartyChatter();
  const camera = {x: WEST_EDGE, y: SOUTH_EDGE - ROOM_HEIGHT};
  const busyServer = {x: WEST_EDGE + 111, y: SOUTH_TRIM_Y - 79, serviceDuty: true};
  const server = {x: WEST_EDGE + 200, y: SOUTH_TRIM_Y - 100, radius: 14, walkTime: 0};
  const baron = createBaron();
  const greetings = [];
  let lastText;
  let elapsed = 0;
  let refills = 0;
  let sawSecondGlass = false;
  const tick = (view = camera) => {
    elapsed += 0.05;
    updatePartyChatter(chatter, view, [busyServer, server], baron, [], elapsed, 0.05, () => 0.5);
  };

  for (let i = 0; i < 40; i++) tick({x: 0, y: 0});
  assert.equal(chatter.remaining, 0.8);
  while (elapsed < 160 && greetings.length < 13) {
    tick();
    const speech = partySpeech(chatter, camera);
    if (speech?.text !== lastText && speech && chatter.line === 0) greetings.push(speech.text);
    lastText = speech?.text;
    if (chatter.refill) {
      assert.equal(chatter.completed, 4);
      assert.equal(speech, null);
      assert.equal(chatter.refill.server, server);
      assert.equal(server.serviceDuty, true);
      if (chatter.refill.guest === 1) {
        assert.equal(chatter.milk[0], 0.85);
        assert.ok(chatter.milk[1] < 0.85);
        sawSecondGlass = true;
      }
    } else if (sawSecondGlass && !refills) {
      assert.equal(server.serviceDuty, false);
      assert.deepEqual(chatter.milk, [0.85, 0.85]);
      refills++;
    }
  }
  assert.equal(refills, 1);
  assert.equal(new Set(greetings.slice(0, 12)).size, 12);
  assert.equal(greetings.length, 13);
  assert.notEqual(greetings[11], greetings[12]);
});

test('the nearest roving guard runs to Pip and reports one arrival', () => {
  const baron = createBaron();
  const pip = {x: baron.x + 90, y: baron.y, radius: 13};
  const [guard, distantGuard] = createGuards(pip, baron, {x: 0, y: 0}, () => 0.5);
  Object.assign(guard, {x: baron.x - 100, y: baron.y});
  Object.assign(distantGuard, {x: baron.x - 700, y: baron.y, pauseUntil: Infinity});
  const posted = {x: pip.x, y: pip.y + 30, posted: true, radius: 14};
  const guards = [guard, distantGuard, posted];
  summonGuard(guards, pip);
  assert.ok(guard.pursuit);
  assert.equal(posted.pursuit, undefined);
  const milo = {x: 0, y: 0};
  let result;
  let elapsed = 0;
  for (; !result && elapsed < 5; elapsed += 0.05) {
    result = updateGuards(guards, pip, baron, milo, elapsed, 0.05);
  }
  assert.equal(result, guard);
  assert.equal(guard.pursuit, null);
  assert.equal(updateGuards(guards, pip, baron, milo, elapsed, 0.05), null);
});

test('the dance floor replaces the southern centre rug and its lyrics repeat in order', () => {
  assert.ok(!RUGS.some(rug => rug.x === DANCE_FLOOR.x && Math.abs(rug.y - DANCE_FLOOR.y) < ROOM_HEIGHT / 2));
  assert.equal(isBlocked(DANCE_FLOOR.x, DANCE_FLOOR.y, 13, createBaron()), false);
  assert.equal(isBlocked(DANCE_FLOOR.x, DANCE_FLOOR.y - 246, 13, createBaron()), true);
  const verse = ["Where's my milk mama?", "Where's my milk dada?", "Where's my milk nana?", "Where's my milk papa?"];
  const expected = [...Array.from({length: 4}, () => ['Milk milk milk my cow', 'Milk milk milk her now']).flat(),
    ...verse, ...verse, 'Milk milk milk my cow'];
  for (const [index, line] of expected.entries()) {
    const lyric = danceLyric(index * 2 + 0.5);
    assert.equal(lyric.text, `♪ ${line} ♪`);
    assert.equal(Math.sign(lyric.x - DANCE_FLOOR.x), index % 2 ? 1 : -1);
    assert.equal(lyric.opacity, 1);
  }
});

test('the Baron follows Pip to the dance stop and only dances after arrival', () => {
  const baron = createBaron();
  const cameraX = cameraLeft(DANCE_FLOOR.x);
  const cameraY = cameraTop(DANCE_FLOOR.y);
  updateBaronWalk(baron, DANCE_FLOOR, cameraX, 0, 0.05, cameraY);
  updateBaronWalk(baron, DANCE_FLOOR, cameraX, 5, 0.05, cameraY);
  assert.equal(baron.route.at(-1), BARON_DANCE_STOP);
  assert.equal(isBaronDancing(baron), false);
  let time = 5;
  while (baron.route.length && time < 25) {
    time += 0.05;
    updateBaronWalk(baron, DANCE_FLOOR, cameraX, time, 0.05, cameraY);
    assert.equal(isBlocked(baron.x, baron.y, 24, {x: 0, y: 0}), false);
  }
  updateBaronWalk(baron, DANCE_FLOOR, cameraX, time + 0.05, 0.05, cameraY);
  assert.equal(isBaronDancing(baron), true);
  assert.equal(isBaronDancing(createBaron()), false);
  const nextY = cameraTop(HALL_CENTER.y);
  updateBaronWalk(baron, HALL_CENTER, cameraX, time + 1, 0.05, nextY);
  updateBaronWalk(baron, HALL_CENTER, cameraX, time + 6, 0.05, nextY);
  assert.equal(baron.route.at(-1), closestRug(HALL_CENTER));
  assert.equal(isBaronDancing(baron), false);
});

test('one randomly chosen dance-floor character says one line every 15 seconds', () => {
  const rolls = [0, 0.99, 0.26, 0, 0.51, 0.99, 0.7, 0.99];
  const speechAt = createDancerSpeech(() => rolls.shift());
  assert.equal(speechAt(14.9), null);
  for (const [time, id, line] of [
    [15, 'mascot', 'Milk my cow! Milk her now!'],
    [30, 'coral', 'I like to PARTAY!'],
    [45, 'jade', 'That cow guard is kind of cute!!'],
    [60, 'guard', 'God bless the Baron!']
  ]) {
    const first = speechAt(time + 0.5);
    assert.equal(first.dancer.id, id);
    assert.equal(first.text, line);
    assert.equal(speechAt(time + 4).text, line);
    assert.equal(speechAt(time + 5), null);
  }
  assert.equal(rolls.length, 0);
});

test('the Baron pauses his milk countdown and joins the remarks while dancing', () => {
  const baron = {...createBaron(), ...BARON_DANCE_STOP};
  const service = createMilkService();
  const camera = {x: cameraLeft(baron.x), y: cameraTop(baron.y)};
  updateMilkService(service, baron, [], [], camera, 25, 25, false);
  assert.equal(service.remaining, 45);
  updateBaronIdleSpeech(baron, camera.x, camera.y, 40);
  callOutMilo(baron, createMilo(), 40);
  assert.equal(baron.speech, null);
  const rolls = [0.99, 0.3];
  const speechAt = createDancerSpeech(() => rolls.shift());
  assert.equal(speechAt(45.5, baron).text, 'Shake that belly, shake that belly');
  baron.x -= 1;
  assert.equal(speechAt(46, baron), null);
  updateMilkService(service, baron, [], [], camera, 42, 1, false);
  assert.equal(service.remaining, 44);
});

test('Pip can enter the dance floor and only dances after three seconds without movement', () => {
  const pip = {...createPlayer(), ...DANCE_FLOOR};
  const baron = createBaron();
  for (let i = 0; i < 60; i++) updatePlayer(pip, baron, {dx: 0, dy: 0}, 0.05);
  assert.ok(pip.danceIdle <= 3);
  updatePlayer(pip, baron, {dx: 0, dy: 0}, 0.05);
  assert.ok(pip.danceIdle > 3);
  movePlayer(pip, baron, 3, 0);
  assert.equal(pip.danceIdle, 0);
  pip.x += 200;
  updatePlayer(pip, baron, {dx: 0, dy: 0}, 0.05);
  assert.equal(pip.danceIdle, 0);
});

test('NPC routes skirt the dance floor with room for the walker', () => {
  const start = {x: DANCE_FLOOR.x - 260, y: DANCE_FLOOR.y, radius: 14};
  const end = {x: DANCE_FLOOR.x + 260, y: DANCE_FLOOR.y};
  const route = routeAroundBaron(start, end, createBaron());
  assert.ok(route.length > 1);
  assert.equal(route.at(-1), end);
  let previous = start;
  for (const waypoint of route) {
    for (let i = 0; i <= 100; i++) {
      assert.equal(onDanceFloor(previous.x + (waypoint.x - previous.x) * i / 100,
        previous.y + (waypoint.y - previous.y) * i / 100, start.radius), false);
    }
    previous = waypoint;
  }
});

test('reports unlock after two Baron trips or seeing Milo, and a Milo report cannot be repeated while pending', () => {
  assert.equal(availableReports(1, false, false).length, 0);
  assert.equal(availableReports(2, false, false)[0].label, 'The Baron keeps following me.');
  assert.equal(availableReports(0, true, false)[0].label, "There's a man in rags wandering around the walls.");
  assert.equal(availableReports(2, true, false).length, 2);
  assert.equal(availableReports(2, true, true).length, 1);
  assert.equal(availableReports(10, true, true, true).length, 0);
  const [following, milo] = availableReports(2, true, false);
  assert.equal(following.next.replies[0].next.replies[0].next.action, 'reportBaronFollowing');
  assert.match(milo.next.replies[0].next.text, /Here's a performance bonus/);
  assert.equal(milo.next.replies[0].next.action, 'reportMilo');
});

test('the reporting guard runs to Milo, then Milo can flee from Pip after a confession', () => {
  const baron = createBaron();
  const milo = createMilo();
  const pip = createPlayer();
  const guard = {...createGuards(pip, baron, milo)[0], x: milo.x + 160, y: milo.y};
  dispatchGuardToMilo(guard);
  for (let i = 0; i < 40 && guard.pursuit; i++) {
    assert.equal(updateGuards([guard], pip, baron, milo, i * 0.05, 0.05), null);
  }
  assert.ok(Math.hypot(guard.x - milo.x, guard.y - milo.y) <= 30);
  assert.equal(guard.pursuit, null);
  assert.equal(milo.injuryPending, true);
  fleeMilo(milo, {...pip, x: milo.x + 30, y: milo.y}, baron, [guard]);
  assert.equal(milo.fleeing, true);
  assert.ok(milo.route.length > 0);
});

test('the DJ can call out the Baron only when he is visible', () => {
  const rolls = [0.99, 0.99, 0.99, 0.99];
  const speechAt = createDancerSpeech(() => rolls.shift());
  const baron = createBaron();
  const withoutBaron = speechAt(15.5, baron, false);
  assert.equal(withoutBaron.text, 'Get that guard a drink! Of Milkkkk!');
  assert.equal(withoutBaron.x, DANCE_FLOOR.x);
  assert.ok(withoutBaron.headY < DANCE_FLOOR.y);
  assert.equal(speechAt(30.5, baron, true).text, 'Shake those milk makers ladies. And you too Baron!');
});

test('the corner guest escort walks Pip beyond both guests before releasing him', () => {
  const baron = createBaron();
  const [guest, otherGuest] = partyGuests;
  const pip = {...createPlayer(), x: guest.x + 6, y: guest.y - 19};
  const guard = {x: pip.x - 20, y: pip.y - 30, facing: 0, radius: 14, stride: 0};
  const escort = {guest, guard, phase: 'warning'};
  beginGuestEscort(escort, pip, baron);
  assert.equal(guard.escorting, true);
  let ended = false;
  for (let time = 0; time < 8 && !ended; time += 0.05) {
    ended = advanceGuestEscort(escort, pip, baron, [guard], time, 0.05);
  }
  assert.equal(ended, true);
  assert.ok(cameraLeft(pip.x) > otherGuest.x + 25);
  assert.ok(Math.hypot(guard.x - pip.x, guard.y - pip.y) < 38);
  assert.equal(guard.escorting, false);
});

test('the enclosure blocks Pip and milk staff enter and exit through the east gate', () => {
  const baron = createBaron();
  const pip = {...createPlayer(), ...guestGateOutside};
  const camera = {x: WEST_EDGE, y: SOUTH_EDGE - ROOM_HEIGHT};
  const server = {x: guestGateOutside.x + 60, y: guestGateOutside.y + 25, radius: 14, walkTime: 0};
  const guard = {x: guestEnclosure.east + 22, y: guestEnclosure.gateY - 34, radius: 14};
  const chatter = createPartyChatter();
  chatter.completed = 4;
  guestEnclosure.active = true;
  try {
    for (let i = 0; i < 20; i++) movePlayer(pip, baron, -5, 0, [guard]);
    assert.ok(pip.x >= guestEnclosure.east + pip.radius);
    let cameInside = false;
    let movedOut = false;
    for (let i = 0; i < 460 && chatter.completed; i++) {
      const wasInside = insideGuestEnclosure(server);
      updatePartyChatter(chatter, camera, [server], baron, [guard], i * 0.05, 0.05);
      const inside = insideGuestEnclosure(server);
      if (wasInside !== inside) {
        assert.ok(Math.abs(server.x - guestEnclosure.east) < 12);
        assert.ok(Math.abs(server.y - guestEnclosure.gateY) < 12);
        cameInside ||= inside;
        movedOut ||= !inside;
      }
    }
    assert.ok(cameInside && movedOut);
    assert.equal(server.guestAccess, false);
    assert.equal(chatter.completed, 0);
  } finally {
    guestEnclosure.active = false;
  }
});

test('the five rope exchanges play in order before the combined shuffle', () => {
  const chatter = createPartyChatter();
  const camera = {x: WEST_EDGE, y: SOUTH_EDGE - ROOM_HEIGHT};
  const baron = createBaron();
  const next = () => {
    chatter.exchange = null;
    chatter.remaining = 0;
    updatePartyChatter(chatter, camera, [], baron, [], 1, 0.05, () => 0.5);
    return chatter.exchange;
  };

  next();
  assert.equal(chatter.order.length, 11);
  assert.ok(chatter.order.every(exchange => !exchange[0][1].includes('velvet ropes')));
  guestEnclosure.active = true;
  try {
    updatePartyChatter(chatter, {x: 0, y: 0}, [], baron, [], 1, 0.05);
    assert.equal(chatter.exchange, null);
    const ropeRotation = Array.from({length: 5}, next);
    assert.deepEqual(ropeRotation.map(exchange => exchange[0]), [
      [0, 'The Baron is simply marvellous. These security arrangements are impeccable!'],
      [0, "Aren't these velvet ropes simply beautiful?"],
      [1, 'Finally, something to keep the riff-raff away!'],
      [1, 'That peasant was positively revolting. I bet he bathes in water, not milk.'],
      [0, 'I feel considerably safer with an armed guard protecting us.']
    ]);
    const fullRotation = Array.from({length: 17}, next);
    assert.equal(new Set(fullRotation).size, 17);
    assert.ok(ropeRotation.every(exchange => fullRotation.includes(exchange)));
  } finally {
    guestEnclosure.active = false;
  }
});

test('the second escort leads Pip two map squares east with the guard in tow', () => {
  const baron = createBaron();
  const guest = partyGuests[0];
  const pip = {...createPlayer(), x: guest.x + 6, y: guest.y - 48};
  const startX = pip.x;
  const guard = {x: pip.x - 30, y: pip.y - 15, facing: 0, radius: 14, stride: 0};
  const escort = {guest, guard, phase: 'warning'};
  beginGuestEscort(escort, pip, baron, true);
  assert.equal(escort.destination.x, startX + 2 * ROOM_WIDTH);
  let ended = false;
  for (let time = 0; time < 20 && !ended; time += 0.05) {
    ended = advanceGuestEscort(escort, pip, baron, [guard], time, 0.05);
  }
  assert.equal(ended, true);
  assert.ok(Math.abs(pip.x - (startX + 2 * ROOM_WIDTH)) <= 1);
  assert.ok(Math.hypot(guard.x - pip.x, guard.y - pip.y) < 38);
});

test('the gate guard warns after two conversations, cancels when Pip leaves, and acts on the fourth return', () => {
  const state = createRopeWarning();
  const near = {...guestGateOutside};
  const away = {...near, x: guestEnclosure.east + 70};
  guestEnclosure.active = true;
  try {
    state.talks = 1;
    assert.equal(updateRopeWarning(state, near, 4), false);
    assert.equal(ropeWarningSpeech(state), null);
    state.talks = 2;
    assert.equal(updateRopeWarning(state, near, 3), false);
    assert.equal(ropeWarningSpeech(state), null);
    updateRopeWarning(state, near, 0.01);
    assert.match(ropeWarningSpeech(state).text, /at least 5 steps/);
    for (const [dt, number] of [[3, '5'], [1, '4'], [1, '3'], [1, '2'], [1, '1']]) {
      assert.equal(updateRopeWarning(state, near, dt), false);
      assert.equal(ropeWarningSpeech(state).text, number);
    }
    assert.equal(updateRopeWarning(state, away, 1), false);
    assert.equal(ropeWarningSpeech(state), null);
    for (const reaction of ["Oh maybe we'll get a live show!", 'Darling get ready for some entertainment']) {
      assert.equal(updateRopeWarning(state, near, 3.01), false);
      assert.equal(ropeWarningSpeech(state).guest, reaction);
      updateRopeWarning(state, away, 1);
    }
    assert.equal(updateRopeWarning(state, near, 0.01), true);
  } finally {
    guestEnclosure.active = false;
  }
});

test('ignoring the countdown triggers an approach, aim, fall, and game over', () => {
  const state = createRopeWarning();
  state.talks = 2;
  guestEnclosure.active = true;
  try {
    const pip = {...createPlayer(), ...guestGateOutside};
    updateRopeWarning(state, pip, 3.1);
    assert.equal(updateRopeWarning(state, pip, 8), true);
    const guard = {x: guestEnclosure.east + 22, y: guestEnclosure.gateY - 48, radius: 14, stride: 0};
    beginRopeScene(state, guard, pip, createBaron());
    const phases = new Set([state.scene.phase]);
    for (let i = 0; i < 160 && state.scene.phase !== 'over'; i++) {
      advanceRopeScene(state.scene, pip, 0.05);
      phases.add(state.scene.phase);
    }
    assert.deepEqual([...phases], ['approach', 'aim', 'fall', 'over']);
    assert.equal(Math.hypot(guard.x - pip.x, guard.y - pip.y), 60);
  } finally {
    guestEnclosure.active = false;
  }
});

test('the milk pool sits between four rugs and NPC routes go around it', () => {
  const surrounding = RUGS.filter(rug => Math.abs(rug.x - MILK_POOL.x) === ROOM_WIDTH / 2
    && Math.abs(rug.y - MILK_POOL.y) === ROOM_HEIGHT / 2);
  assert.equal(surrounding.length, 4);
  assert.equal(MILK_POOL.x, HALL_CENTER.x + ROOM_WIDTH / 2);
  assert.equal(MILK_POOL.y, HALL_CENTER.y + ROOM_HEIGHT / 2 - 2 * ROOM_HEIGHT);
  const baron = createBaron();
  assert.equal(isBlocked(MILK_POOL.x, MILK_POOL.y, 13, baron), true);

  const start = {x: MILK_POOL.x, y: MILK_POOL.y - 210, radius: 14};
  const end = {x: MILK_POOL.x, y: MILK_POOL.y + 135};
  const route = routeAroundBaron(start, end, baron);
  assert.equal(route.at(-1), end);
  assert.ok(route.length > 1);
  let from = start;
  for (const waypoint of route) {
    for (let step = 0; step <= 100; step++) {
      const x = from.x + (waypoint.x - from.x) * step / 100;
      const y = from.y + (waypoint.y - from.y) * step / 100;
      assert.equal(isBlocked(x, y, start.radius, baron), false);
    }
    from = waypoint;
  }
});

test('the snorkel touches alternate swimmers and reaches an edge between touches', () => {
  const pool = createMilkPool();
  const hits = [];
  const edges = [];
  const heard = new Set();
  const guardRemarks = new Set();
  let firstHit;
  for (let frame = 1; frame <= 12000; frame++) {
    const previous = pool.snorkel.returning;
    updateMilkPool(pool, frame * 0.05, 0.05, () => 0.25);
    if (!previous && pool.snorkel.returning) {
      firstHit ??= frame * 0.05;
      hits.push(pool.snorkel.swimmer);
    }
    if (previous && !pool.snorkel.returning) edges.push(Math.round(pool.snorkel.x));
    const speech = milkPoolSpeech(pool, frame * 0.05);
    assert.ok(!pool.reaction || !pool.lines.length, 'touch reactions must wait for ambient lines');
    if (!speech) continue;
    heard.add(speech.text);
    if (speech.x === lifeguard.x && speech.y === lifeguard.y) guardRemarks.add(speech.text);
  }
  assert.ok(firstHit > 1, 'the first pursuit should take longer');
  assert.equal(guardRemarks.size, 10);
  assert.equal([...guardRemarks][0], 'God, I love this job.');
  assert.equal([...guardRemarks].at(-1), 'What happens in the milk pool stays in the milk pool.');
  assert.deepEqual(hits.slice(0, 4), [0, 1, 0, 1]);
  assert.deepEqual(edges.slice(0, 4), [-204, 204, -204, 204]);
  assert.ok(heard.has("You're certainly an enthusiastic swimmer!"));
  assert.ok(heard.has('Imagine bathing in something that comes out of a tap!'));
});

test('a random swimmer exchange plays both lines in order before a pending reaction', () => {
  const pool = createMilkPool();
  pool.guardNext = false;
  pool.remaining = 0;
  updateMilkPool(pool, 0.05, 0.05, () => 8 / 14);
  assert.equal(milkPoolSpeech(pool, 0.05).text, 'Milko!');

  pool.pendingReaction = {speaker: 0, text: 'Hey! That tickles!'};
  updateMilkPool(pool, 1.55, 1.5);
  assert.equal(milkPoolSpeech(pool, 1.55), null);
  updateMilkPool(pool, 1.8, 0.25);
  assert.equal(milkPoolSpeech(pool, 1.8), null);
  updateMilkPool(pool, 2.05, 0.25);
  assert.equal(milkPoolSpeech(pool, 2.05).text, 'Polo!');
  updateMilkPool(pool, 3.55, 1.5);
  updateMilkPool(pool, 3.6, 0.05);
  assert.equal(milkPoolSpeech(pool, 3.6).text, 'Hey! That tickles!');
});

test('pool clothing is reachable, and each theft changes the pile and starts the corresponding chatter', async () => {
  const {clothingReports, poolClothingDialogue} = await import('../src/lifeguard-dialogue.mjs');
  const baron = createBaron();
  for (const [dx, dy] of [[68, 0], [-63, -28]]) {
    const player = {x: poolClothing.x + dx, y: poolClothing.y + dy, radius: 13};
    assert.equal(isBlocked(player.x, player.y, player.radius, baron), false);
    assert.equal(nearestInteraction(player, baron, null, [], [lifeguard, poolClothing]).id, poolClothing.id);
  }
  assert.deepEqual(poolClothingDialogue.replies.map(choice => choice.next?.selection ?? null), ['women', 'man', 'all', null]);
  for (const [selection, left, line] of [
    ['women', 'man', 'Good heavens! Where are my clothes?!'],
    ['man', 'women', "Sir, I'm going to need you to remain in the pool."],
    ['all', null, 'Good heavens! Where are my clothes?!']
  ]) {
    const pool = createMilkPool();
    assert.equal(takePoolClothing(pool, selection, 10), true);
    assert.equal(takePoolClothing(pool, 'all', 10), false);
    assert.equal(remainingClothing[pool.stolenClothing], left);
    pool.remaining = 0;
    updateMilkPool(pool, 69.99, 0.01, () => 0);
    assert.equal(milkPoolSpeech(pool, 69.99).text, 'God, I love this job.');
    updateMilkPool(pool, 70, 0.01, () => 0);
    assert.equal(milkPoolSpeech(pool, 70).text, line);
  }
  const reportedPool = createMilkPool();
  takePoolClothing(reportedPool, 'man', 10);
  reportedPool.clothingAmbientAt = 15; // Pip reports the theft to the lifeguard.
  updateMilkPool(reportedPool, 15, 0.01);
  assert.equal(milkPoolSpeech(reportedPool, 15).text, "Sir, I'm going to need you to remain in the pool.");
  assert.equal(clothingReports.women.next.enterAction, 'tellLifeguardAboutClothing');
  assert.equal(clothingReports.man.next.enterAction, 'tellLifeguardAboutClothing');
  assert.equal(clothingReports.all, clothingReports.women);
  assert.equal(clothingReports.women.next.replies[0].next.enterAction, 'rewardMissingDresses');
  assert.deepEqual(clothingReports.man.next.replies.map(choice => choice.next.action), ['fineMissingSuit', 'dismissMissingSuit']);
});

test('only the two pool investigations dispatch a guard', () => {
  const [manInPool, clothing] = poolReports;
  const findings = [];
  function visit(node) {
    if (node.action) findings.push([node.text, node.action]);
    for (const response of node.replies ?? []) visit(response.next);
  }
  for (const report of poolReports) visit(report.next);
  assert.deepEqual(findings, [
    ['Get out of here, you liar! Wasting valuable security resources! ₥10 fine. Pay up!', 'finePoolLie'],
    ["No, no. I wouldn't want to burden him with additional responsibilities. I'll handle this personally.", 'inspectPool'],
    ["Hopefully he's submerged.", 'inspectPool']
  ]);
  assert.equal(manInPool.next.replies[1].next.replies[0].next.mood, 'radio');
  assert.equal(clothing.next.replies.length, 2);
});

test('a guard routes around the pool, watches for 15 seconds, then resumes patrolling', () => {
  const baron = createBaron();
  const player = createPlayer();
  const milo = createMilo();
  const guard = {...createGuards(player, baron, milo)[0], x: MILK_POOL.x, y: MILK_POOL.y + 110};
  dispatchGuardToPool(guard);
  for (let frame = 1; frame <= 500 && !guard.poolWatch; frame++) {
    assert.equal(updateGuards([guard], player, baron, milo, frame * 0.05, 0.05), null);
    assert.equal(isBlocked(guard.x, guard.y, guard.radius, baron), false);
  }
  assert.ok(guard.poolWatch);
  const {start, until} = guard.poolWatch;
  assert.equal(until, start + 15);
  assert.equal(guard.facing, 0);
  assert.ok(guard.y < MILK_POOL.y);
  const {x, y} = guard;
  updateGuards([guard], player, baron, milo, until - 0.05, 0.05);
  assert.deepEqual({x: guard.x, y: guard.y}, {x, y});
  updateGuards([guard], player, baron, milo, until, 0.05);
  assert.equal(guard.poolWatch, null);
  assert.equal(guard.pursuit, null);
});

test('the fountain occupies the former pool site and NPCs can route around it', () => {
  assert.deepEqual(MILK_FOUNTAIN, {x: MILK_POOL.x, y: MILK_POOL.y + 2 * ROOM_HEIGHT});
  const baron = createBaron();
  assert.ok(isBlocked(MILK_FOUNTAIN.x, MILK_FOUNTAIN.y, 13, baron));
  const start = {x: MILK_FOUNTAIN.x, y: MILK_FOUNTAIN.y - 110, radius: 14};
  const end = {x: MILK_FOUNTAIN.x, y: MILK_FOUNTAIN.y + 110};
  const route = routeAroundBaron(start, end, baron);
  assert.equal(route.at(-1), end);
  assert.ok(route.length > 1);
  let from = start;
  for (const to of route) {
    for (let step = 0; step <= 20; step++) {
      assert.equal(isBlocked(from.x + (to.x - from.x) * step / 20,
        from.y + (to.y - from.y) * step / 20, start.radius, baron), false);
    }
    from = to;
  }
});

test('the professor rocks while he raises, holds, and lowers the straw', () => {
  assert.equal(professorPose(0).lift, 0);
  assert.ok(professorPose(1.5).lift > 0 && professorPose(1.5).lift < 1);
  assert.equal(professorPose(2).lift, 1);
  assert.equal(professorPose(5).lift, 1);
  assert.ok(professorPose(5.5).lift > 0 && professorPose(5.5).lift < 1);
  assert.equal(professorPose(6.1).lift, 0);
  assert.equal(professorPose(8.32).lift, 0);
  assert.notEqual(professorPose(2).rock, professorPose(3).rock);
  assert.equal(isBlocked(professorFeet.x, professorFeet.y, 13, createBaron()), true);
});

test('the professor gives a random remark every 20 seconds without repeats', () => {
  const speech = createProfessorSpeech(() => 0);
  assert.equal(speech(19.9, true), null);
  assert.equal(speech(20, false), null);
  assert.equal(speech(21, true).text, 'The milk must flow.');
  assert.equal(speech(24, true), null);
  assert.equal(speech(40.9, true), null);
  assert.equal(speech(41, true).text, 'One man, one vote. Such a barbaric concept.');
});

test('Pip can meet the professor once and revisit all four topics', () => {
  const baron = createBaron();
  const player = {x: professor.x - 44, y: professor.y, radius: 13};
  assert.equal(isBlocked(player.x, player.y, player.radius, baron), false);
  assert.equal(nearestInteraction(player, baron, null, [], [professor]).id, professor.id);

  const open = createProfessorConversation();
  const first = open();
  const menu = open();
  assert.match(first.text, /what is your name/);
  assert.deepEqual(menu.replies.map(reply => reply.label), [
    'What are you doing here?', 'What do you think of the Baron?',
    'What do you think about democracy?', 'You seem like a smart man. Why are the guards cows?',
    'Can I have some money?'
  ]);

  const seen = new Set();
  const moods = new Set();
  const endings = [];
  function visit(node) {
    if (seen.has(node)) return;
    seen.add(node);
    moods.add(node.mood);
    if (!node.replies.length) endings.push(node.text);
    for (const reply of node.replies) {
      if (typeof reply.next !== 'function') visit(reply.next);
    }
  }
  visit(first);
  assert.ok(seen.has(menu), 'the introduction should lead to the topic menu');
  assert.deepEqual([...moods].sort(), [...professorMoods].sort());
  assert.deepEqual(endings, ['Guards!']);
  assert.equal(open(), menu);
});

test('the Professor’s money lecture charges at the end and returns to the topic menu', () => {
  const open = createProfessorConversation();
  open();
  const menu = open();
  const request = menu.replies.find(reply => reply.label === 'Can I have some money?');
  assert.equal(request.once, 'chargeProfessorFee');
  let node = request.next;
  for (const label of ['Continue', 'Continue', 'Continue', 'I suppose that makes sense.', 'Well, yes.', 'I guess so.', 'Wait, what?!']) {
    assert.equal(node.action, undefined);
    assert.equal(node.replies[0].label, label);
    node = node.replies[0].next;
  }
  assert.equal(node.action, request.once);
  assert.match(node.text, /investment in human capital/);
  assert.equal(node.replies[0].next, menu);
});

test('the one-time lifeguard request splits at 50% and 75% with the correct coin actions', async () => {
  const {lifeguardDialogue} = await import('../src/lifeguard-dialogue.mjs');
  const request = lifeguardDialogue.replies.find(reply => reply.label === 'Can I have some money?');
  assert.equal(request.once, 'lifeguardMoneyRequest');
  assert.equal(request.next.text, 'What? Why?');
  const chooseOutcome = request.next.replies[0].next;
  assert.equal(chooseOutcome(0).action, 'lifeguardMoneyGift');
  assert.equal(chooseOutcome(0.499).action, 'lifeguardMoneyGift');
  assert.equal(chooseOutcome(0.5).action, undefined);
  assert.match(chooseOutcome(0.749).text, /charity/);
  assert.equal(chooseOutcome(0.75).replies[0].next.action, 'lifeguardMoneyPenalty');
  assert.equal(chooseOutcome(0.999).replies[0].next.text, 'Pay up, scrawny.');
});

test('the attendant introduces the stall once before offering the milk balloon game', async () => {
  const {createAttendantConversation, attendantMoods} = await import('../src/attendant-dialogue.mjs');
  const open = createAttendantConversation();
  assert.match(open().text, /^Welcome, welcome/);
  const menu = open();
  assert.equal(open(), menu);
  assert.equal(menu.replies.length, 4);
  let node = menu.replies.find(reply => reply.label === 'Can I play?').next;
  while (node.replies.length) {
    assert.ok(attendantMoods.includes(node.mood));
    node = node.replies[0].next;
  }
  assert.equal(node.action, 'startMilkBalloon');
  const replay = open(true).replies.find(reply => reply.label === 'Can I play?').next;
  assert.equal(replay.text, 'Please, yes, please do. All the more fun for me and you!');
  assert.equal(replay.action, 'startMilkBalloon');
  assert.equal(replay.replies.length, 0);
  const complaint = 'Hey! You said not a penny, not a dime. Yet you took a coin. What gives?';
  assert.equal(menu.replies.some(reply => reply.label === complaint), false);
  const replayMenu = open(true);
  const response = replayMenu.replies.find(reply => reply.label === complaint).next;
  assert.equal(response.text, 'The game is free, just as I said! The fee is for the milk you shed!');
  assert.equal(response.replies[0].next, replayMenu);
});

test('Pip picks up and automatically throws a milk balloon, then finishes the round', async () => {
  const {createMilkBalloon, createAttendantThrow, updateMilkBalloon, milkBalloonHand} = await import('../src/milk-balloon.mjs');
  const {pilloryAttendant} = await import('../src/pillory.mjs');
  const player = {...createPlayer(), x: pilloryAttendant.x + 36, y: pilloryAttendant.y};
  const scene = createMilkBalloon(player, createBaron());
  assert.equal(scene.phase, 'approach');
  for (let i = 0; i < 240 && scene.phase !== 'throw'; i++) updateMilkBalloon(scene, player, 1 / 60);
  assert.equal(scene.phase, 'throw');
  assert.ok(milkBalloonHand(scene, player));
  assert.equal(updateMilkBalloon(scene, player, 1), false);
  assert.equal(updateMilkBalloon(scene, player, 1), true);

  const position = {x: player.x, y: player.y};
  const attendant = createAttendantThrow();
  const phases = new Set();
  let finished = false;
  for (let frame = 0; frame < 300 && !finished; frame++) {
    phases.add(attendant.phase);
    finished = updateMilkBalloon(attendant, player, 1 / 60);
    if (attendant.phase === 'pickup') assert.notEqual(attendant.attendant.x, pilloryAttendant.x);
  }
  assert.equal(finished, true);
  assert.deepEqual([...phases], ['approach', 'pickup', 'throw', 'return']);
  assert.equal(attendant.attendant.x, pilloryAttendant.x);
  assert.equal(attendant.attendant.y, pilloryAttendant.y);
  assert.deepEqual({x: player.x, y: player.y}, position);
});

test('the Commissioner is reachable, greets Pip once, and has three ways to end the game conversation', async () => {
  const {createCommissionerConversation, commissionerMoods} = await import('../src/commissioner-dialogue.mjs');
  const {pilloryAttendant, pilloryCommissioner} = await import('../src/pillory.mjs');
  const baron = createBaron();
  const player = {...createPlayer(), x: pilloryCommissioner.x, y: pilloryCommissioner.y + 33};
  assert.equal(isBlocked(player.x, player.y, player.radius, baron), false);
  assert.equal(nearestInteraction(player, baron, null, [], [pilloryAttendant, pilloryCommissioner]).id, pilloryCommissioner.id);
  for (const side of [-1, 1]) {
    const besidePillory = {...player, x: pilloryCommissioner.x + side * 60, y: pilloryCommissioner.y};
    assert.equal(isBlocked(besidePillory.x, besidePillory.y, besidePillory.radius, baron), false);
    assert.equal(nearestInteraction(besidePillory, baron, null, [], [pilloryAttendant, pilloryCommissioner]).id, pilloryCommissioner.id);
  }
  const open = createCommissionerConversation();
  const first = open();
  const menu = open();
  assert.equal(first.text, 'Please... help me.');
  const openingAfterThrow = "Oh... it's you. You're just like all the rest.";
  assert.equal(open(true).text, openingAfterThrow);
  for (const [played, splattered, opening, closing] of [
    [false, false, 'Please... help me.', "I don't know anymore. You're the first person who's stopped to speak to me without throwing something."],
    [false, true, 'Please... not another one.', "Just... please don't be like the others."],
    [true, false, "Oh... it's you. Come to throw another balloon?", "Haven't you done enough?"],
    [true, true, "Oh... it's you. Come to throw another balloon?", "Haven't you done enough?"]
  ]) {
    const open = createCommissionerConversation();
    let node = open(played, splattered);
    assert.equal(node.text, opening);
    const lines = [];
    while (node.replies[0].label !== 'Continue') {
      node = node.replies[0].next;
      assert.equal(node.action, undefined);
      lines.push(node.text);
    }
    assert.equal(lines.includes('Some even come back for another turn.'), splattered && !played);
    assert.equal(lines.includes("Yes. You've already participated."), played);
    assert.equal(lines.at(-1), closing);
    assert.equal(open(played, splattered).text, played ? openingAfterThrow : '');
  }
  assert.equal(open(), menu);
  assert.equal(menu.replies.length, 3);
  assert.equal(menu.replies[0].once, 'thankCommissioner');
  assert.equal(menu.replies[0].consumeOnSelect, true);
  const branch = menu.replies[1].next();
  assert.equal(branch.replies[0].next, null);
  assert.equal(branch.replies[2].next.action, undefined);
  for (const [choice, expectedAction] of ['commissionerGift', undefined, 'commissionerBetrayal'].entries()) {
    const open = createCommissionerConversation();
    open();
    const options = open().replies;
    const offer = options[1].next().replies[1].next;
    assert.equal(offer.replies[choice].next().action, expectedAction);
    assert.equal(options.length, 3, 'the current conversation does not gain a pickpocket option');
    assert.equal(options[1].next().replies.length, 2, 'only the offer is removed');
    const theft = open().replies.find(reply => reply.once === 'pickpocketCommissioner');
    assert.equal(Boolean(theft), choice === 1);
    if (theft) {
      assert.equal(theft.consumeOnSelect, true);
      assert.equal(theft.next.replies[0].next.replies[0].next.action, 'commissionerTheft');
    }
  }
  const admission = menu.replies[2].next.replies[0].next;
  assert.equal(admission.text, 'Yes.');
  const warning = admission.replies[0].next;
  assert.equal(warning.character, pilloryAttendant.id);
  assert.equal(warning.replies[0].next.action, 'attendantMilkBalloon');
  const visited = new Set();
  const moods = new Set();
  function visit(node) {
    if (!node || visited.has(node)) return;
    visited.add(node);
    if (!node.character) moods.add(node.mood);
    for (const reply of node.replies) {
      if (typeof reply.next !== 'function') visit(reply.next);
    }
  }
  visit(first);
  assert.ok(visited.has(menu));
  assert.deepEqual([...moods].sort(), [...commissionerMoods].sort());
});

test('the attendant drinks once a minute from a free server who refills offscreen', async () => {
  const {createAttendantMilk, updateAttendantMilk} = await import('../src/attendant-milk.mjs');
  const {serviceStaffOnscreen} = await import('../src/milk-service.mjs');
  const {pilloryAttendant} = await import('../src/pillory.mjs');
  const baron = createBaron();
  const camera = {x: cameraLeft(pilloryAttendant.x), y: cameraTop(pilloryAttendant.y)};
  const makeServer = (offset, extra) => ({
    x: pilloryAttendant.x + offset, y: pilloryAttendant.y + 10,
    radius: 12, walkTime: 0, facing: 1, ...extra
  });
  const baronServer = makeServer(24, {serviceDuty: true});
  const ladiesServer = makeServer(32, {serviceDuty: true});
  const server = makeServer(80);
  const farther = makeServer(200);
  const staff = [baronServer, ladiesServer, server, farther];
  const service = createAttendantMilk();
  updateAttendantMilk(service, baron, staff, [], camera, 59.9);
  assert.equal(service.scene, null);
  updateAttendantMilk(service, baron, staff, [], camera, 0.1);
  assert.equal(service.scene.server, server);
  assert.ok(server.serviceDuty);

  const phases = new Set();
  for (let frame = 0; frame < 900 && service.scene; frame++) {
    phases.add(service.scene.phase);
    updateAttendantMilk(service, baron, staff, [], camera, 1 / 60);
    if (service.scene?.phase === 'leave') {
      assert.ok(server.emptyServiceGlass && server.withoutMilk && server.serviceDuty);
    }
  }
  assert.deepEqual([...phases], ['delivery', 'handoff', 'drink', 'returnGlass', 'leave']);
  assert.equal(service.scene, null);
  assert.equal(serviceStaffOnscreen(server, camera), false);
  assert.equal(server.withoutMilk, false);
  assert.equal(server.emptyServiceGlass, false);
  assert.equal(server.serviceDuty, false);
  assert.equal(baronServer.serviceDuty, true);
  assert.equal(ladiesServer.serviceDuty, true);
});

test('Pip leads a roving guard to the pillory and the guard returns after throwing', async () => {
  const {createPilloryReportScene, updateMilkBalloon} = await import('../src/milk-balloon.mjs');
  const {pilloryInView, pilloryCommissioner} = await import('../src/pillory.mjs');
  const baron = createBaron();
  const player = createPlayer();
  const guard = {x: player.x + 32, y: player.y, radius: 14, stride: 0};
  assert.equal(pilloryInView(cameraLeft(player.x), cameraTop(player.y)), false);
  assert.equal(pilloryInView(cameraLeft(pilloryCommissioner.x), cameraTop(pilloryCommissioner.y)), true);
  const scene = createPilloryReportScene(player, guard, baron);
  const phases = new Set();
  let done = false;
  for (let frame = 0; frame < 1400 && !done; frame++) {
    phases.add(scene.phase);
    done = updateMilkBalloon(scene, player, 1 / 60);
    assert.equal(isBlocked(player.x, player.y, player.radius, baron), false);
    assert.equal(isBlocked(guard.x, guard.y, guard.radius, baron), false);
  }
  assert.ok(done);
  assert.deepEqual([...phases], ['lead', 'approach', 'pickup', 'throw', 'return']);
  assert.ok(Math.hypot(guard.x - player.x, guard.y - player.y) < 35);
  assert.equal(guard.walking, false);
});

test('coin balance starts at 100 and locks on reaching either game outcome', async () => {
  const {createCoinBalance} = await import('../src/coins.mjs');
  const changes = [];
  const coins = createCoinBalance((count, outcome) => changes.push({count, outcome}));
  assert.equal(coins.count, 100);
  assert.equal(coins.change(20), 120);
  assert.equal(coins.change(85), 200);
  assert.equal(coins.change(-1), 200);
  assert.deepEqual(changes, [{count: 120, outcome: null}, {count: 200, outcome: 'win'}]);
  const otherRun = createCoinBalance();
  assert.throws(() => otherRun.change(0.5), TypeError);
  assert.equal(otherRun.change(-100), 0);
  assert.equal(otherRun.outcome, 'loss');
  assert.equal(otherRun.change(200), 0);
});

test('tax counts five positive transactions, rounds up, and starts a fresh streak after collection', async () => {
  const {createCoinBalance} = await import('../src/coins.mjs');
  const {eliasTaxConversation} = await import('../src/elias.mjs');
  const coins = createCoinBalance();
  for (const delta of [3, 3, 3, 3, -1, 1, 2, 0, 3, 4]) coins.change(delta);
  assert.equal(coins.pendingTax, null);
  coins.change(5);
  assert.deepEqual(coins.pendingTax, {earnings: 15, due: 5});

  const opening = eliasTaxConversation(coins.pendingTax);
  assert.match(opening.text, /earned you ₥15/);
  const demand = opening.replies[0].next.replies[0].next.replies[0].next;
  assert.match(demand.text, /hand over ₥5/);
  assert.equal(demand.action, 'collectTax');
  assert.equal(coins.collectTax(), 121);
  assert.equal(coins.pendingTax, null);
  assert.equal(coins.collectTax(), 121);
  for (let i = 0; i < 5; i++) coins.change(2);
  assert.deepEqual(coins.pendingTax, {earnings: 10, due: 3});
});

test('Elias’s regular dialogue pairs the cow and garlic reactions with the intended portraits', async () => {
  const {eliasConversation, eliasPortraits} = await import('../src/elias.mjs');
  const [cows, accountant, vampire] = eliasConversation.replies;
  const walk = reply => {
    const lines = [];
    let node = reply.next;
    while (node !== eliasConversation) {
      assert.ok(eliasPortraits.includes(node.mood));
      lines.push(node);
      node = node.replies[0].next;
    }
    return lines;
  };
  assert.deepEqual([cows.label, accountant.label, vampire.label], [
    'Why are the guards cows?', 'Who are you?', 'Are you a vampire?'
  ]);
  assert.equal(walk(cows).at(-1).mood, 'demonic-angry');
  assert.equal(walk(accountant)[1].text, 'I am his accountant.');
  const garlic = walk(vampire);
  assert.equal(garlic[0].mood, 'worried');
  assert.deepEqual([garlic[2].text, garlic[2].mood], ['VHO HAS GARLIC?!', 'worried']);
});

test('Elias trails the camera edge and stays put while Pip approaches', async () => {
  const {eliasConversation, eliasFollowingConversation, updateEliasFollow} = await import('../src/elias.mjs');
  const actor = {x: 666, y: 500, stride: 0};
  const baron = {x: 0, y: 0};
  updateEliasFollow(actor, {x: 350, y: 500}, baron, 0, 200, 0.1);
  assert.equal(actor.x, 666);
  updateEliasFollow(actor, {x: 625, y: 500}, baron, 280, 200, 0.1);
  assert.equal(actor.x, 666);
  assert.equal(actor.running, false);
  assert.equal(actor.hasFollowedPip, undefined);
  updateEliasFollow(actor, {x: 300, y: 500}, baron, -45, 200, 0.1);
  assert.ok(actor.x < 666);
  assert.equal(actor.running, true);
  assert.equal(actor.hasFollowedPip, true);
  assert.ok(!eliasConversation.replies.some(reply => reply.label === 'Are you following me?'));
  const reply = eliasFollowingConversation.replies.find(reply => reply.label === 'Are you following me?');
  assert.equal(reply.next.text, 'Da.');
  assert.equal(reply.next.replies[0].label, 'Wait, what?!');
  const explanation = reply.next.replies[0].next;
  assert.match(explanation.text, /every single coin you earn or lose/);
  assert.equal(explanation.replies[0].next, eliasFollowingConversation);
});

test('the pool report sends both roving guards to separate cheering spots and leaves posted guards alone', async () => {
  const {dispatchRovingGuardsToPool} = await import('../src/guards.mjs');
  const player = createPlayer();
  const baron = createBaron();
  const milo = createMilo();
  const roving = createGuards(player, baron, milo);
  roving.forEach((guard, i) => {
    guard.x = MILK_POOL.x + (i ? -100 : 100);
    guard.y = MILK_POOL.y + 135;
  });
  const posted = {...roving[0], x: MILK_POOL.x + 250, posted: true};
  const guards = [...roving, posted];
  assert.deepEqual(dispatchRovingGuardsToPool(guards), roving);
  assert.ok(roving.every(guard => guard.pursuit?.pool));
  const cheering = new Map();
  for (let frame = 1; frame <= 1000; frame++) {
    updateGuards(guards, player, baron, milo, frame / 20, 0.05);
    for (const guard of roving) if (guard.poolWatch) cheering.set(guard, guard.x);
    if (roving.every(guard => !guard.poolReportPending)) break;
  }
  assert.equal(cheering.size, 2);
  assert.ok(Math.abs(cheering.get(roving[0]) - cheering.get(roving[1])) > 40);
  assert.ok(roving.every(guard => !guard.poolReportPending));
  assert.equal(posted.pursuit, undefined);
});

test('Elias charges only on Pip’s first exit after dancing, with either reply', async () => {
  const {takeDanceExit} = await import('../src/player.mjs');
  const {eliasDanceConversation, routeEliasToPip} = await import('../src/elias.mjs');
  const player = {...createPlayer(), ...DANCE_FLOOR};
  assert.equal(takeDanceExit(player), false);
  player.x -= 190;
  assert.equal(takeDanceExit(player), false);
  player.x = DANCE_FLOOR.x;
  player.danceIdle = 3.1;
  assert.equal(takeDanceExit(player), false);
  player.x -= 190;
  player.danceIdle = 0;
  assert.equal(takeDanceExit(player), true);
  assert.equal(takeDanceExit(player), false);
  player.x = DANCE_FLOOR.x;
  player.danceIdle = 3.1;
  assert.equal(takeDanceExit(player), false);
  player.x -= 190;
  player.danceIdle = 0;
  assert.equal(takeDanceExit(player), false);
  const actor = {x: DANCE_FLOOR.x + 240, y: DANCE_FLOOR.y};
  const route = routeEliasToPip(actor, player, createBaron());
  assert.ok(route.length > 1);
  assert.ok(Math.hypot(route.at(-1).x - player.x, route.at(-1).y - player.y) <= 38);
  for (const reply of eliasDanceConversation.replies) {
    const fee = reply.next.replies[0];
    assert.equal(fee.label, 'Dancing fee?! What dancing fee?');
    assert.equal(fee.next.action, 'chargeDanceFee');
  }
});

test('health starts full, changes in half hearts, and stays at zero after death', async () => {
  const {createHealth, MAX_HEARTS} = await import('../src/health.mjs');
  const changes = [];
  const health = createHealth((hearts, message) => changes.push([hearts, message]));
  assert.equal(health.hearts, MAX_HEARTS);
  assert.equal(health.change(1), 3);
  assert.throws(() => health.change(-0.25), TypeError);
  for (const hearts of [2.5, 2, 1.5, 1, 0.5]) assert.equal(health.change(-0.5), hearts);
  assert.equal(health.change(-3, 'Game over test'), 0);
  assert.equal(health.change(1), 0);
  assert.deepEqual(changes.map(([hearts]) => hearts), [2.5, 2, 1.5, 1, 0.5, 0]);
  assert.deepEqual(changes.at(-1), [0, 'Game over test']);
});

test('karma starts neutral and moves proportionally between its capped endpoints', async () => {
  const {createKarma} = await import('../src/karma.mjs');
  const changes = [];
  const karma = createKarma((score, position) => changes.push([score, position]));
  assert.equal(karma.score, 0);
  assert.equal(karma.change(-5), -5);
  assert.equal(karma.change(-100), -10);
  assert.equal(karma.change(-1), -10);
  assert.equal(karma.change(10), 0);
  assert.equal(karma.change(5), 5);
  assert.equal(karma.change(100), 10);
  assert.deepEqual(changes, [[-5, 0.25], [-10, 0], [0, 0.5], [5, 0.75], [10, 1]]);
  assert.equal(karma.change(-0.5), 9.5);
  assert.equal(karma.change(-1.5), 8);
  assert.equal(karma.change(-0.25), 7.75);
  assert.deepEqual(changes.at(-1), [7.75, 0.8875]);
  assert.throws(() => karma.change(0.1), TypeError);
});

test('guest ropes only enter sight while active and intersecting the camera', () => {
  const cameraX = guestEnclosure.west;
  const cameraY = guestEnclosure.north;
  assert.equal(guestRopesInView({...guestEnclosure, active: false}, cameraX, cameraY), false);
  const enclosure = {...guestEnclosure, active: true};
  assert.equal(guestRopesInView(enclosure, cameraX, cameraY), true);
  assert.equal(guestRopesInView(enclosure, enclosure.east + 20, cameraY), false);
  assert.equal(guestRopesInView(enclosure, cameraX, enclosure.south + 20), false);
});

test('Baron greetings keep the six defaults and add only eligible groups', async () => {
  const {baronGreetings} = await import('../src/baron-dialogue.mjs');
  const defaults = baronGreetings(0, 100);
  assert.equal(defaults.length, 6);
  assert.equal(baronGreetings(-5, 100).length, 6);
  assert.equal(baronGreetings(5, 100).length, 6);
  assert.deepEqual(baronGreetings(-6, 150).slice(0, 6), defaults);
  assert.equal(baronGreetings(-6, 150).length, 15);
  assert.equal(baronGreetings(-6, 151).length, 18);
  assert.equal(baronGreetings(6, 100).length, 11);
});

test('the dancing Baron offers one DJ request and the karma encounters switch to Elias', async () => {
  const {baronDanceDialogue, baronKarmaDialogue} = await import('../src/baron-dialogue.mjs');
  const baron = {...createBaron(), ...BARON_DANCE_STOP};
  assert.equal(nearestInteraction({x: baron.x + 42, y: baron.y}, baron, null).id, 'baron');
  assert.equal(baronDanceDialogue(true).replies.length, 0);
  const fan = baronDanceDialogue(false).replies[0].next;
  assert.equal(fan.replies[0].next, null);
  const slap = fan.replies[1].next;
  assert.equal(slap.enterAction, 'baronSlap');
  assert.equal(slap.playerMood, 'alarmed');
  assert.equal(slap.replies[0].next.direction, 'Heavy breathing');
  const fine = baronKarmaDialogue.fine.replies[0].next.replies[0].next;
  assert.equal(fine.character, 'elias');
  assert.equal(fine.replies[0].next.action, 'baronKarmaFine');
  for (const [spokeToMilo, askedAboutCowGuards] of [[false, false], [false, true], [true, false], [true, true]]) {
    const reward = baronKarmaDialogue.reward(spokeToMilo, askedAboutCowGuards).replies[0].next.replies[0].next;
    assert.equal(reward.character, 'elias');
    assert.equal(reward.enterAction, 'baronKarmaReward');
    assert.equal(reward.replies.length, spokeToMilo ? 5 : 4);
    const endings = [];
    function verify(node) {
      if (node.action) endings.push(node.action);
      for (const reply of node.replies ?? []) verify(reply.next);
    }
    verify(reward);
    assert.equal(endings.filter(action => action === 'finishBaronReward').length, 4);
    assert.equal(endings.filter(action => action === 'finishBaronRewardWithGuard').length, spokeToMilo ? 1 + Number(askedAboutCowGuards) : 0);
  }
});

test('bartender cycles ten greetings and offers drinks, tips, and the refusal scene', async () => {
  const {bartenderExit, bartenderMoods, bartenderOpening} = await import('../src/bartender-dialogue.mjs');
  const greetings = Array.from({length: 10}, (_, i) => bartenderOpening(i));
  assert.equal(new Set(greetings.map(greeting => greeting.text)).size, 10);
  assert.equal(bartenderOpening(10).text, greetings[0].text);
  assert.ok(greetings.every(greeting => bartenderMoods.includes(greeting.mood)));
  const order = greetings[0].replies.find(reply => reply.label === "I'll have a milk, please.").next;
  assert.deepEqual(order.replies.slice(0, 2).map(reply => reply.next.order), ['whole', 'cocktail']);
  assert.equal(order.replies[2].next.replies[0].next.replies[0].next.order, 'ocean');
  const tipOptions = bartenderExit.replies[0].next.replies[0].next.replies[0].next.replies;
  assert.equal(tipOptions[0].next.action, 'bartenderTip');
  assert.equal(tipOptions[1].next.replies[0].next, order);
  assert.equal(tipOptions[2].next.replies[0].next.exitAction, 'bartenderRefusal');
  assert.equal(tipOptions[2].next.replies[1].next.replies[0].next.action, 'bartenderDoubleTip');
});

test('the Creamery refusal uses the same animated guard phases without the ladies celebrating', async () => {
  const {createCreameryGuard} = await import('../src/creamery.mjs');
  const guard = createCreameryGuard();
  const player = {...createPlayer(), x: guard.x - 90, y: guard.y + 32};
  const state = createRopeWarning();
  beginRopeScene(state, guard, player, createBaron(), {deathMessage: 'Creamery refusal', celebrate: false});
  const {scene} = state;
  const phases = new Set([scene.phase]);
  const oldX = guard.x;
  const oldY = guard.y;
  advanceRopeScene(scene, player, 0.05);
  const firstStep = Math.hypot(guard.x - oldX, guard.y - oldY);
  assert.ok(firstStep > 0 && firstStep < 12);
  for (let i = 0; i < 180 && scene.phase !== 'over'; i++) {
    advanceRopeScene(scene, player, 0.05);
    phases.add(scene.phase);
  }
  assert.deepEqual([...phases], ['approach', 'aim', 'fall', 'over']);
  assert.equal(guard.walking, false);
  assert.equal(scene.celebrate, false);
  assert.equal(scene.deathMessage, 'Creamery refusal');
});

test('the Creamery guard offers both drinks and gates his regular replies behind the apology fine', async () => {
  const {creameryGuardDialogue} = await import('../src/creamery-guard-dialogue.mjs');
  const {bartender, createCreameryGuard} = await import('../src/creamery.mjs');
  const guard = createCreameryGuard();
  const opening = creameryGuardDialogue(guard);
  assert.equal(guard.creamery, true);
  const [cow, weapon, drink] = opening.replies;
  assert.notEqual(opening.mood, weapon.next.mood);
  assert.notEqual(cow.next.mood, cow.next.replies[0].next.mood);
  const [buy, joke] = drink.next.replies;
  assert.equal(joke.next.enterAction, 'guardRifleStrike');
  const order = buy.next.replies[0].next;
  assert.equal(order.character, bartender.id);
  const [milk, cocktail] = order.replies;
  assert.equal(milk.next.enterAction, 'buyGuardMilk');
  assert.equal(milk.next.replies[0].next.enterAction, 'rewardGuardMilk');
  assert.equal(cocktail.next.enterAction, 'buyGuardCocktail');
  assert.deepEqual(cocktail.next.replies[0].next.replies.map(reply => reply.next.exitAction),
    ['leaveDrunkGuard', 'pickpocketDrunkGuard']);
  guard.apologyRequired = true;
  const apology = creameryGuardDialogue(guard);
  assert.equal(apology.text, 'Come to apologise?');
  assert.deepEqual(apology.replies.map(reply => reply.next.enterAction), ['payGuardApology', undefined, undefined]);
  assert.equal(creameryGuardDialogue(guard), apology);
  guard.apologyRequired = false;
  assert.equal(creameryGuardDialogue(guard), opening);
});

test('the drunk Creamery guard starts after 20 seconds and wraps through all 18 remarks', async () => {
  const {createCreameryGuard, drunkGuardSpeech} = await import('../src/creamery.mjs');
  const guard = createCreameryGuard();
  assert.equal(drunkGuardSpeech(guard, 200), null);
  Object.assign(guard, {drunk: true, drunkSince: 50});
  assert.equal(drunkGuardSpeech(guard, 69.9), null);
  assert.equal(drunkGuardSpeech(guard, 70).text, 'Moooooo... I mean, move.');
  assert.equal(drunkGuardSpeech(guard, 74), null);
  assert.equal(drunkGuardSpeech(guard, 90).text, "Who's guarding the milk? Oh. That's me.");
  const lines = Array.from({length: 18}, (_, i) => drunkGuardSpeech(guard, 70 + i * 20).text);
  assert.equal(new Set(lines).size, 18);
  assert.equal(drunkGuardSpeech(guard, 430).text, lines[0]);
});

test('lifeguard entry and theft dialogue reflect what Pip has already said and stolen', async () => {
  const {clothingReports, lifeguardDialogue, lifeguardReplies} = await import('../src/lifeguard-dialogue.mjs');
  const entry = lifeguardReplies(lifeguardDialogue, {}).find(reply => reply.label === 'Can I go in?');
  assert.equal(entry.next.remembersPoolEntry, true);
  assert.equal(entry.next.replies[0].next.enterAction, 'lifeguardEntryLie');
  const repeat = lifeguardReplies(lifeguardDialogue, {askedPoolEntry: true})[0];
  assert.equal(repeat.next.text, "We've already discussed this. No!");
  assert.equal(repeat.next.replies[0].next, lifeguardDialogue);

  const clothes = lifeguardDialogue.replies.find(reply => reply.label === 'I see piles of clothes everywhere.');
  const askAboutTheft = state => lifeguardReplies(clothes.next, state)
    .find(reply => reply.label === 'What if someone steals their clothes?').next;
  assert.match(askAboutTheft({}).text, /God, I hope someone does/);
  assert.match(askAboutTheft({stolenClothing: 'women'}).text, /Somebody already did/);
  assert.equal(askAboutTheft({stolenClothing: 'women', admittedClothingTheft: true}).text, 'You already did, you bloody legend!');
  assert.match(askAboutTheft({stolenClothing: 'man'}).text, /someone stole the man's clothing/);
  assert.equal(askAboutTheft({stolenClothing: 'man', admittedClothingTheft: true}).replies, undefined);
  assert.ok(!lifeguardReplies(lifeguardDialogue, {stolenClothing: 'all', admittedClothingTheft: true}).includes(clothes));
  assert.equal(clothingReports.women.next.replies[0].next.replies[1].next.admitsClothingTheft, true);
  assert.equal(clothingReports.man.next.replies[0].next.admitsClothingTheft, true);
  for (const label of ['Can you swim?', "I'd like to report something.", 'What happens if someone starts drowning?', 'Is the milk fresh?']) {
    assert.equal(lifeguardDialogue.replies.find(reply => reply.label === label).consumeOnSelect, true);
  }
});

test('the Baron’s performance review handles all nine bands and both override boundaries', async () => {
  const {baronAssessment, additionalBaronReplies} = await import('../src/baron-dialogue.mjs');
  const used = new Set();
  const state = {coins: 100, karma: 0};
  const options = {used, standing: () => state, discoveries: {}, returnToMenu: () => null};
  assert.equal(additionalBaronReplies(options).length, 0);
  used.add('baronFollowing');
  assert.equal(additionalBaronReplies(options).length, 0);
  used.add('baronWatching');
  assert.equal(additionalBaronReplies(options)[0].label, "So, you're clearly watching me.");
  used.add('baronReviewIntro');
  const review = additionalBaronReplies(options)[0];
  assert.match(review.next().text, /Modest returns/);
  state.coins = 196;
  assert.match(review.next().text, /tantalisingly close/);
  assert.match(baronAssessment(24, 9).text, /dairy uniform/);
  assert.match(baronAssessment(25, 5).text, /going backwards/);
  assert.match(baronAssessment(195, -5).text, /Excellent financial progress/);
  assert.equal(new Set([99, 100, 150].flatMap(coins => [-6, 0, 6].map(karma => baronAssessment(coins, karma).text))).size, 9);
  assert.ok(!additionalBaronReplies({...options, discoveries: {pillory: true}}).some(reply => reply.once === 'baronCommissioner'));
  assert.ok(additionalBaronReplies({...options, discoveries: {pillory: true, attendant: true}}).some(reply => reply.once === 'baronCommissioner'));
});

test('Elias’s vampire topic progresses from its original exchange to a repeatable fine', async () => {
  const {eliasConversation, eliasFollowingConversation, vampireFollowup} = await import('../src/elias.mjs');
  assert.equal(vampireFollowup(eliasConversation, 0), null);
  const vampire = eliasConversation.replies.find(reply => reply.label === 'Are you a vampire?');
  assert.ok(vampire.consumeOnSelect);
  let node = vampire.next;
  for (let i = 0; i < 3; i++) {
    assert.equal(node.mustContinue, true);
    node = node.replies[0].next;
  }
  const second = vampireFollowup(eliasFollowingConversation, node.vampireStage);
  assert.equal(second.label, 'So, about vampires...');
  const repeat = vampireFollowup(eliasConversation, second.next.vampireStage);
  assert.equal(repeat.next.enterAction, 'eliasVampireFine');
  assert.equal(repeat.next.replies, undefined);
  assert.ok(eliasFollowingConversation.replies.every(reply => reply.consumeOnSelect));
});

test('Milo skips the southwest corner and reroutes if the ropes go up mid-walk', () => {
  const baron = {...createBaron(), x: HALL_CENTER.x, y: HALL_CENTER.y};
  const milo = createMilo();
  updateMilo(milo, baron, 12, 0);
  assert.equal(milo.corner, 1);
  guestEnclosure.active = true;
  try {
    updateMilo(milo, baron, 12.05, 0.05);
    assert.notEqual(milo.corner, 1);
    assert.ok(milo.route.length);
    milo.y = HALL_CENTER.y + 200;
    fleeMilo(milo, {x: HALL_CENTER.x + 300}, baron, []);
    assert.equal(milo.corner, 0);
  } finally {
    guestEnclosure.active = false;
  }
});

test('Elias’s karma topic requires a change and both token branches return to his menu', async () => {
  const {eliasConversation, eliasFollowingConversation} = await import('../src/elias.mjs');
  for (const menu of [eliasConversation, eliasFollowingConversation]) {
    const karmaQuestion = menu.replies.find(reply => reply.label === 'Are you tracking my... karma?');
    assert.equal(karmaQuestion.requiresKarmaChange, true);
    const tokens = menu.replies.find(reply => reply.label === 'What are these coins?');
    assert.equal(tokens.consumeOnSelect, true);
    const [valuation, future] = tokens.next.replies[0].next.replies;
    assert.match(valuation.next.replies[0].next.text, /Ze Baron, naturally/);
    assert.equal(valuation.next.replies[0].next.replies[0].next, menu);
    assert.match(future.next.text, /currency of ze future/);
    assert.equal(future.next.replies[0].next, menu);
  }
});

test('post-seduction reactions follow arrival order and release each NPC after one line', async () => {
  const {createSlotReactions} = await import('../src/slot-reactions.mjs');
  const staff = [
    {id: 'male-waiter', x: -320, y: 85},
    {id: 'handlebar-waiter', x: -380, y: 225},
    {id: 'martini-waiter', x: -230, y: 375},
    {id: 'female-waiter', x: -480, y: 250}
  ].map(actor => ({...actor, title: 'Waiter', radius: 14, walkTime: 0}));
  const guards = [{x: -479, y: 250}, {x: -360, y: 430}, {x: -481, y: 250, posted: true}]
    .map(actor => ({...actor, radius: 14, stride: 0}));
  const reactions = createSlotReactions(staff, guards);
  const executive = {x: -620, y: 250};
  const player = {x: -620, y: 250, walking: true};
  const baron = {x: 345, y: 345};
  reactions.queue(player, executive);
  player.x += 139;
  assert.equal(reactions.update(player, baron, 0.05), undefined);
  player.x += 1;
  const arrivals = [reactions.update(player, baron, 0.05)];
  for (let tick = 0; tick < 200 && arrivals.length < 5; tick++) {
    const arrival = reactions.update(player, baron, 0.05);
    if (arrival) arrivals.push(arrival);
  }
  assert.equal(arrivals[0]?.id, 'guard');
  assert.deepEqual(arrivals.map(arrival => arrival?.slotReaction.text), [
    'Nice!', 'You absolute legend!', 'A man of exceptional talent, I see!',
    'Respect, brother. Respect.', 'Not bad for a peasant!'
  ]);
  assert.deepEqual(arrivals.map(arrival => arrival.slotReaction.response), [
    'Thanks... I think.', 'Wait, how do you know?', 'It was mostly a financial transaction.',
    'Does everyone in this place know?!', 'Can everyone please stop congratulating me?!'
  ]);
  assert.deepEqual(arrivals.map(arrival => arrival.slotReaction.playerMood), [
    'thinking', 'sorry', 'worried', 'alarmed', 'exasperated'
  ]);
  assert.deepEqual(arrivals.map(arrival => arrival.id).sort(), [
    'guard', 'guard', 'handlebar-waiter', 'male-waiter', 'martini-waiter'
  ]);
  assert.ok(staff.every(actor => !actor.serviceDuty));
  assert.ok(guards.every(actor => !actor.slotReaction));
  assert.equal(reactions.update(player, baron, 0.05), undefined);
});

test('pokie rolls cover all 100 values and return 75 percent across every stake', async () => {
  const {createPokieConversation} = await import('../src/pokie-dialogue.mjs');
  for (const stake of [1, 5, 10]) {
    let total = 0;
    const outcomes = {};
    for (let roll = 1; roll <= 100; roll++) {
      const coins = createCoinBalance();
      const random = () => (roll - 0.5) / 100;
      const open = createPokieConversation(coins.wager.bind(coins), random);
      const menu = open();
      assert.equal(menu.mood, 'default');
      const result = menu.replies.find(reply => reply.label === 'Bet ₥' + stake).next();
      const payout = coins.count - 100 + stake;
      total += payout;
      outcomes[result.mood] = (outcomes[result.mood] ?? 0) + 1;
      assert.equal(payout, stake * (roll <= 65 ? 0 : roll <= 80 ? 1 : roll <= 95 ? 2 : roll <= 99 ? 5 : 10));
      assert.equal(open().mood, 'default');
    }
    assert.deepEqual(outcomes, {loss: 65, 'break-even': 15, 'small-win': 15, 'big-win': 4, jackpot: 1});
    assert.equal(total, stake * 75);
  }
});

test('pokie wagers settle all-in balances, preserve portraits on rejected bets, and show terminal outcomes', async () => {
  const {createPokieConversation} = await import('../src/pokie-dialogue.mjs');
  const coins = createCoinBalance();
  coins.change(-95);
  const rolls = [0.70, 0, 0.01, 0];
  const open = createPokieConversation(coins.wager.bind(coins), () => rolls.shift());
  const menu = open();
  const even = menu.replies[1].next();
  assert.equal(even.mood, 'break-even');
  assert.equal(coins.count, 5);
  const rejected = even.replies[2].next();
  assert.equal(rejected.text, 'No money, no honey!');
  assert.equal(rejected.mood, 'break-even');
  const loss = rejected.replies[1].next();
  assert.equal(loss.action, 'finishPokieGame');
  assert.equal(coins.outcome, 'loss');
  assert.deepEqual(loss.replies.map(reply => reply.label), ['Walk away']);

  const allIn = createCoinBalance();
  allIn.change(-90);
  assert.deepEqual(allIn.wager(10, () => {
    assert.equal(allIn.count, 0); // Debit is applied before the draw.
    return 10;
  }), {payout: 100, outcome: null});
  assert.equal(allIn.count, 100);
  allIn.change(95);
  assert.deepEqual(allIn.wager(10, () => 10), {payout: 100, outcome: 'win'});
  assert.equal(allIn.count, 200);
});

test('the sleeping gambler allows exactly one token choice and only waking plays the scripted loss', async () => {
  const {createSleepingGambler, sleepingGamblerDialogue} = await import('../src/sleeping-gambler.mjs');
  for (const wake of [true, false]) {
    const man = createSleepingGambler();
    const opening = sleepingGamblerDialogue(man);
    assert.equal(opening.mood, 'asleep');
    assert.equal(opening.replies[2].next, null);
    assert.equal(sleepingGamblerDialogue(man).replies.length, 3);
    assert.equal(opening.replies[0].next.mood, 'awake');
    assert.equal(opening.replies[1].next.exitAction, 'stealSleepingGamblerTokens');
    assert.equal(man.takeTokens(wake, 10), true);
    assert.equal(man.takeTokens(!wake, 11), false);
    assert.equal(man.pose(10.3).tokens, wake);
    assert.equal(man.pose(11.4).pull > 0, wake);
    assert.equal(man.pose(12.2).remark, wake ? 'Damn it! There goes breakfast.' : null);
    assert.equal(man.pose(16).awake, false);
    assert.equal(man.pose(16).tokens, false);
    assert.equal(sleepingGamblerDialogue(man).text, 'The man is fast asleep.');
  }
});

test('the pokie ban counts net winnings and stops betting at exactly ₥95', async () => {
  const {createPokieProfit, createPokieConversation} = await import('../src/pokie-dialogue.mjs');
  const profit = createPokieProfit();
  assert.equal(profit.record(10, 100), false);
  assert.equal(profit.record(5, 0), false);
  assert.equal(profit.record(1, 10), false);
  const open = createPokieConversation((stake, roll) => {
    const payout = stake * roll();
    return {payout, banned: profit.record(stake, payout)};
  }, () => 0.8);
  const result = open().replies[0].next();
  assert.equal(profit.banned, true);
  assert.deepEqual(result.replies, []);
  assert.equal(result.action, 'summonEliasForPokieBan');
});

test('the Baron walks to his nearest rug after a karma audience without counting a follow trip', async () => {
  const {returnBaronToRug} = await import('../src/baron.mjs');
  const baron = createBaron();
  baron.x += 110;
  baron.y += 80;
  const rug = closestRug(baron);
  returnBaronToRug(baron);
  assert.equal(baron.route.at(-1), rug);
  for (let tick = 0; tick < 600 && baron.returningToRug; tick++) {
    updateBaronWalk(baron, rug, 0, tick * 0.05, 0.05);
  }
  assert.deepEqual([baron.x, baron.y], [rug.x, rug.y]);
  assert.equal(baron.returningToRug, false);
  assert.equal(baron.completedRugTrips, 0);
});

test('a jackpot pays only the remaining pokie profit before the ban', async () => {
  const {createPokieProfit, createPokieConversation} = await import('../src/pokie-dialogue.mjs');
  const profit = createPokieProfit();
  const coins = createCoinBalance();
  const open = createPokieConversation((stake, roll) => {
    const result = coins.wager(stake, roll, profit.maxPayout(stake));
    return {...result, banned: profit.record(stake, result.payout)};
  }, () => 0.999);
  const first = open().replies[2].next();
  assert.equal(coins.count, 190);
  const second = first.replies[2].next();
  assert.equal(coins.count, 195);
  assert.equal(coins.outcome, null);
  assert.equal(second.mood, 'jackpot');
  assert.match(second.text, /Payout: ₥15\./);
  assert.equal(second.action, 'summonEliasForPokieBan');
  assert.equal(profit.banned, true);
});

test('Elias collects a one-time rounded tax on actual pokie profit before checking victory', async () => {
  const {createPokieProfit} = await import('../src/pokie-dialogue.mjs');
  const {eliasPokieBan} = await import('../src/elias.mjs');
  const uncapped = createPokieProfit();
  assert.equal(uncapped.collectTax(), 0);
  uncapped.record(10, 107);
  assert.equal(uncapped.collectTax(), 49);
  assert.equal(uncapped.collectTax(), 0);

  const profit = createPokieProfit();
  const coins = createCoinBalance();
  coins.change(20);
  for (const multiplier of [5, 10]) {
    const stake = 10;
    const result = coins.wager(stake, () => multiplier, profit.maxPayout(stake), true);
    assert.equal(result.outcome, null);
    profit.record(stake, result.payout);
  }
  assert.equal(coins.count, 215);
  const due = profit.collectTax();
  assert.equal(due, 48);
  coins.change(-due);
  assert.equal(coins.count, 167);
  assert.equal(coins.outcome, null);
  assert.equal(profit.collectTax(), 0);
  let line = eliasPokieBan;
  while (line.replies.length) line = line.replies[0].next;
  assert.equal(line.action, 'collectPokieTax');
});

test('the range lets Pip enter the danger zone but NPC routes go around it', async () => {
  const {PRACTICE_RANGE, insidePracticeRange, isNpcBlocked, crossesScenery} = await import('../src/room.mjs');
  const baron = {x: 0, y: 0};
  const {guardX, lanes, north, south, targetX} = PRACTICE_RANGE;
  assert.equal(lanes.length, 3);
  assert.ok(targetX - guardX >= 260);
  for (const y of lanes) {
    assert.equal(insidePracticeRange(guardX + 50, y), true);
    assert.equal(isBlocked(guardX + 50, y, 14, baron), false);
    assert.equal(isNpcBlocked(guardX + 50, y, 14, baron), true);
  }
  const start = {x: guardX + 110, y: north - 62, radius: 14};
  const end = {x: start.x, y: south + 45};
  assert.equal(crossesScenery(start, end), true);
  const route = routeAroundBaron(start, end, baron);
  assert.ok(route.length > 1);
  let from = start;
  for (const to of route) {
    for (let part = 1; part <= 50; part++) {
      assert.equal(insidePracticeRange(from.x + (to.x - from.x) * part / 50,
        from.y + (to.y - from.y) * part / 50, start.radius), false);
    }
    from = to;
  }
});

test('practice range remarks run every 15 seconds and rotate across all three guards', async () => {
  const {createRangeSpeech} = await import('../src/practice-range-speech.mjs');
  const speech = createRangeSpeech(() => 0);
  assert.equal(speech(14.9, true), undefined);
  const remarks = [];
  for (let index = 0; index < 30; index++) {
    const time = (index + 1) * 15;
    const remark = speech(time, true);
    assert.equal(remark.lane, index % 3);
    assert.equal(speech(time + 4, true), undefined);
    remarks.push(remark.text);
  }
  assert.equal(new Set(remarks).size, 30);
});

test('only a live projectile intersecting Pip triggers a range hit', async () => {
  const {rangeBullet, practiceRangeHit} = await import('../src/practice-range.mjs');
  const bullet = rangeBullet(1.49, 0);
  const pip = {x: bullet.x, y: bullet.y + 12, radius: 13};
  assert.equal(practiceRangeHit(pip, pip, 1.44, 1.54), true);
  assert.equal(practiceRangeHit(pip, pip, 1.70, 1.75), false);
  const above = {...pip, y: pip.y - 35};
  const below = {...pip, y: pip.y + 35};
  assert.equal(practiceRangeHit(above, above, 1.44, 1.54), false);
  assert.equal(practiceRangeHit(above, below, 1.49, 1.49), true);
  assert.equal(practiceRangeHit({...pip, x: 900}, {...pip, x: 900}, 1.44, 1.54), false);
});

test('all three practice guards can be reached from either side of the safe boundary line', async () => {
  const {PRACTICE_RANGE} = await import('../src/room.mjs');
  const {nearbyPracticeGuard} = await import('../src/practice-range-dialogue.mjs');
  for (const y of PRACTICE_RANGE.lanes) {
    assert.equal(nearbyPracticeGuard({x: PRACTICE_RANGE.west - 40, y}).y, y);
    assert.equal(nearbyPracticeGuard({x: PRACTICE_RANGE.west + 12, y}).y, y);
    assert.equal(nearbyPracticeGuard({x: PRACTICE_RANGE.guardX + 1, y}), undefined);
  }
});

test('milk service dialogue cycles across staff and checks funds on every repeat order', async () => {
  const {createWaiterConversation, WAITER_MILK_PRICE} = await import('../src/waiter-dialogue.mjs');
  let balance = WAITER_MILK_PRICE;
  const open = createWaiterConversation(() => balance);
  const first = open(false);
  const order = first.replies[0].next;
  assert.equal(order.replies[1].next.text, 'Very well, sir.');
  assert.equal(order.replies[1].next.replies[0].next(), first);
  const served = order.replies[0].next();
  assert.equal(served.enterAction, 'buyWaiterMilk');
  assert.deepEqual(served.replies, []);
  assert.ok(served.autoCloseMs > 0);
  balance -= WAITER_MILK_PRICE;
  const refused = order.replies[0].next();
  assert.match(refused.text, /insufficient funds/);
  assert.equal(refused.enterAction, undefined);
  const empty = open(true);
  assert.equal(empty.text, 'Not now! Busy, busy, busy!');
  assert.deepEqual(empty.replies, []);
  const second = open(false);
  assert.equal(second.text, 'Would you care for a glass of milk?');
  assert.equal(second.replies[1].next.text, 'Enjoy your evening, sir.');
  const later = Array.from({length: 9}, () => open(false).text);
  assert.equal(later.at(-1), first.text);
});

test('Skim remembers whether Pip confirmed his identity on the first meeting', async () => {
  const {createSkimConversation} = await import('../src/skim-dialogue.mjs');
  const unknown = createSkimConversation();
  assert.equal(unknown().replies[0].next.replies[0].next.text, 'That you are, my lord.');
  assert.equal(unknown().text, 'Just a humble janitor, my lord.');
  const recognised = createSkimConversation();
  const uncertain = recognised().replies[0].next.replies[1].next;
  assert.equal(uncertain.mood, 'distressed');
  const lookalike = uncertain.replies[0].next;
  assert.equal(lookalike.replies[1].next.replies[0].next.text, 'Nothing, my lord. A pleasure serving you.');
  let line = lookalike.replies[0].next;
  while (typeof line.replies[0].next !== 'function') line = line.replies[0].next;
  assert.match(line.text, /apparently the problem/);
  assert.equal(line.replies[0].next().replies.length, 6);
  assert.equal(recognised().text, "Oh, bloody hell. It's you again.");
});

test('Elias accounts for cumulative actual changes and unlocks each tally independently', async () => {
  const {accountingReplies, createTally} = await import('../src/elias-accounting.mjs');
  const tallies = {coins: createTally(100), karma: createTally(0), health: createTally(3)};
  const menu = {text: 'Elias'};
  const replies = () => accountingReplies(tallies, menu);
  assert.deepEqual(replies(), []);

  const coins = createCoinBalance((count, _outcome, movement) => tallies.coins.record(count, movement));
  coins.wager(5, () => 1);
  assert.equal(coins.count, 100);
  assert.deepEqual(replies().map(reply => reply.label), ['How am I doing financially?']);
  const begin = replies()[0].next;
  const heard = [];
  let line = begin();
  while (line !== menu) {
    heard.push(line.text);
    const next = line.replies[0].next;
    line = typeof next === 'function' ? next() : next;
  }
  assert.ok(heard.includes('Your total earnings amount to ₥5.'));
  assert.ok(heard.includes('Your total expenditure and losses amount to ₥5.'));
  assert.ok(heard.includes('You have achieved absolutely nothing, financially speaking.'));
  assert.deepEqual(replies(), []);

  coins.change(-1);
  tallies.karma.record(-5);
  tallies.karma.record(0);
  tallies.health.record(3);
  assert.deepEqual(replies().map(reply => reply.label), ['How am I doing financially?', "How's my karma looking?"]);
  assert.deepEqual(tallies.coins.snapshot(), {value: 99, gained: 5, lost: 6, revision: 2});
  assert.deepEqual(tallies.karma.snapshot(), {value: 0, gained: 5, lost: 5, revision: 2});
  tallies.health.record(2);
  const health = replies()[2].next();
  assert.equal(health.replies[0].label, 'My what?');
});

test('the browser dialogue module loads', async () => {
  const {createDialogue} = await import('../src/dialogue.mjs');
  assert.equal(typeof createDialogue, 'function');
});

test('the Commissioner only discusses the milk on her face while splattered and only once', async () => {
  const {createCommissionerConversation} = await import('../src/commissioner-dialogue.mjs');
  const question = node => node.replies.find(reply => reply.label === "What's that on your face?");
  for (const [played, answer] of [[false, 'Milk. It drips off eventually.'], [true, 'Milk. You put it there...']]) {
    const open = createCommissionerConversation();
    open();
    assert.equal(question(open(played)), undefined);
    assert.equal(question(open(played, true)).next.text, answer);
    assert.equal(question(open(played, false)), undefined);
    const response = question(open(played, true)).next;
    assert.equal(response.text, answer);
    assert.equal(response.action, undefined);
    assert.equal(question(response.replies[0].next()), undefined);
    assert.equal(question(open(played, true)), undefined);
  }
});

test('balloons from Pip, the attendant, and the guard all mark the Commissioner on impact', async () => {
  const {updateMilkBalloon} = await import('../src/milk-balloon.mjs');
  for (const actor of [{}, {attendant: {}}, {guard: {}}]) {
    const scene = {phase: 'throw', time: 0, ...actor};
    updateMilkBalloon(scene, {}, 0.89);
    assert.equal(scene.hitCommissioner, undefined);
    updateMilkBalloon(scene, {}, 0.02);
    assert.equal(scene.hitCommissioner, true);
  }
});

test('the Commissioner’s milk pool topic unlocks on sight and each branch exhausts it', async () => {
  const {createCommissionerConversation} = await import('../src/commissioner-dialogue.mjs');
  const open = createCommissionerConversation();
  open();
  const topic = 'commissionerMilkPool';
  assert.ok(!open().replies.some(reply => reply.once === topic));
  const question = open(false, false, true).replies.find(reply => reply.once === topic);
  assert.ok(question);
  assert.equal(question.consumeOnSelect, undefined);
  const branches = question.next.replies;
  assert.equal(branches.length, 3);
  const endings = ['What... are you? A... child?', 'God help me.', "I'm surrounded by idiots."];
  for (const [index, branch] of branches.entries()) {
    assert.equal(branch.once, topic);
    assert.equal(branch.consumeOnSelect, true);
    let node = branch.next;
    while (node.replies[0].label !== 'Continue') {
      assert.equal(node.action, undefined);
      node = node.replies[0].next;
    }
    assert.equal(node.text, endings[index]);
    assert.equal(node.action, undefined);
  }
});

test('the Baron’s pillory branches are single-use with two ways out of the figures', async () => {
  const {commissionerDiscussion} = await import('../src/baron-commissioner-dialogue.mjs');
  const choose = (node, label) => {
    const choice = node.replies.find(reply => reply.label === label);
    assert.ok(choice, label);
    return typeof choice.next === 'function' ? choice.next() : choice.next;
  };
  const skip = (node) => {
    while (node.replies?.length === 1 && node.replies[0].label === 'Continue') node = choose(node, 'Continue');
    return node;
  };

  for (const vampire of [false, true]) {
    let node = skip(commissionerDiscussion(vampire));
    assert.equal(node.replies.length, 4);
    node = skip(choose(node, 'How much money do you make from the pillory?'));
    assert.equal(node.replies.some(reply => reply.label === 'Garlic.'), vampire);
    if (vampire) node = skip(choose(node, 'Garlic.'));
    else {
      node = skip(choose(node, 'Check watch'));
      for (let i = 0; i < 3; i++) node = choose(node, 'Wait');
      assert.equal(node.replies.length, 1);
      node = skip(choose(node, 'Elias, have you heard of a calculator?'));
      assert.equal(node.mood, 'milk-drool');
      node = choose(node, "Never mind. I'm no longer interested.");
    }
    assert.equal(node.replies.length, 3);
    assert.ok(!node.replies.some(reply => reply.label === 'How much money do you make from the pillory?'));
    node = skip(choose(node, "Surely you can't imprison someone for criticising you?"));
    node = skip(choose(node, 'Who gave you the authority to do that?'));
    node = choose(node, 'Could you let her go?');
    node = skip(choose(node, 'When do business hours end?'));
    assert.equal(node.text, 'One could say you are ze real victim, my lord.');
    assert.ok(node.autoCloseMs > 0);
    assert.equal(node.replies, undefined);
  }
});
