Warning: truncated output (original token count: 40301)
Total output lines: 3319

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

test('server visits Pipe for a replacement glass after delivering milk to the Baron', async () => {
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
  assert.equal(server.emptyServiceGlass, false, 'The Baron keeps the glass until he throws it');
  updateMilkService(service, baron, staff, [], {x: 1000, y: 0}, 25, 0.05, false);
  assert.equal(server.withoutMilk, true, 'Leaving the camera cannot refill a glass');
  const {pipeHatch} = await import('../src/room.mjs');
  for (let frame = 1; frame <= 1800 && server.withoutMilk; frame++) {
    updateStaff([server], createPlayer(), baron, [], frame * 0.05, 0.05, () => 0);
  }
  assert.equal(server.withoutMilk, false);
  assert.equal(server.emptyServiceGlass, false);
  assert.equal(server.y, pipeHatch.y);
  assert.ok(Math.abs(server.x - pipeHatch.x) <= 34);
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
  const servers = [server, {...server, x: server.x + 45}, {...server, x: server.x + 90}];
  const baron = createBaron();
  const greetings = [];
  let lastText;
  let elapsed = 0;
  let refills = 0;
  let currentServer = null;
  const tick = (view = camera) => {
    elapsed += 0.05;
    updatePartyChatter(chatter, view, [busyServer, ...servers], baron, [], elapsed, 0.05, () => 0.5);
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
      currentServer = chatter.refill.server;
      assert.equal(currentServer, servers[refills]);
      assert.equal(currentServer.serviceDuty, true);
      if (chatter.refill.guest === 1) {
        assert.equal(chatter.milk[0], 0.85);
        assert.ok(chatter.milk[1] < 0.85);
      }
    } else if (currentServer) {
      assert.equal(currentServer.serviceDuty, false);
      assert.equal(currentServer.withoutMilk, true);
      assert.equal(currentServer.emptyServiceGlass, true);
      currentServer = null;
      assert.deepEqual(chatter.milk, [0.85, 0.85]);
      refills++;
    }
  }
  assert.equal(refills, 3);
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
  const rolls = [0, 0.99, 0.26, 0, 0.51, 0.99, 0.7, 0.3];
  const speechAt = createDancerSpeech(() => rolls.shift());
  assert.equal(speechAt(14.9), null);
  for (const [time, id, line] of [
    [15, 'mascot', 'Milk my cow! Milk her now!'],
    [30, 'coral', 'I like to PARTAY!'],
    [45, 'jade', 'That cow guard is kind of cute!!'],
    [60, 'guard', 'The Great Cow bless the Baron!']
  ]) {
    const first = speechAt(time + 0.5);
    assert.equal(first.dancer.id, id);
    assert.equal(first.text, line);
    assert.equal(speechAt(time + 4).text, line);
    assert.equal(speechAt(time + 5), null);
  }
  assert.equal(rolls.length, 0);
});

test('Off-Duty Bull Guard rotates the new greetings and overhead lines', async () => {
  const {createDancerConversation} = await import('../src/dancer-dialogue.mjs');
  const open = createDancerConversation();
  for (let i = 0; i < 15; i++) open('dancer-guard');
  for (const text of [
    'Look at these moves! Light on my hooves!',
    'Finest specimen on the dance floor!',
    'Not bad for a big fella, eh?',
    "MOOOOOO! That's my singing voice!",
    "Careful, little fella. Don't get trampled!"
  ]) {
    const greeting = open('dancer-guard');
    assert.equal(greeting.text, text);
    assert.ok(['happy', 'excited', 'laughing'].includes(greeting.mood));
  }

  const rolls = [0.7, 0.99];
  const speechAt = createDancerSpeech(() => rolls.shift());
  const speech = speechAt(75.5);
  assert.equal(speech.dancer.id, 'guard');
  assert.equal(speech.text, "Careful, little fella. Don't get trampled!");
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
  assert.equal(guardRemarks.size, 17);
  assert.equal([...guardRemarks][0], 'NO STAMPEDING AROUND THE POOL!');
  assert.ok(guardRemarks.has('Some days I reckon I\'d be better off in a paddock.'));
  assert.ok(guardRemarks.size >= 10, 'the ordinary lifeguard pool continues through its full rotation');
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
    ['women', 'man', 'Merciful milk! Where are my clothes?!'],
    ['man', 'women', "Sir, I'm going to need you to remain in the pool."],
    ['all', null, 'Merciful milk! Where are my clothes?!']
  ]) {
    const pool = createMilkPool();
    assert.equal(takePoolClothing(pool, selection, 10), true);
    assert.equal(takePoolClothing(pool, 'all', 10), false);
    assert.equal(remainingClothing[pool.stolenClothing], left);
    pool.remaining = 0;
    updateMilkPool(pool, 69.99, 0.01, () => 0);
    assert.equal(milkPoolSpeech(pool, 69.99).text, 'NO STAMPEDING AROUND THE POOL!');
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
  assert.ok(professorPose(1.5).lif…15301 tokens truncated…s amount to ₥5.'));
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
  const endings = ['What... are you? A... child?', 'Great Cow help me.', "I'm surrounded by idiots."];
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

test('DJ Dairy admission can be retried until paid, then disappears', async () => {
  const {baronDanceDialogue} = await import('../src/baron-dialogue.mjs');
  let canPay = false;
  const opening = baronDanceDialogue(false, () => canPay);
  assert.equal(opening.replies[0].next.replies.length, 4);
  const quote = baronDanceDialogue(true, () => canPay).replies[1].next;
  const fee = quote.replies[0].next;
  assert.equal(fee.character, 'elias');
  assert.equal(fee.text, '₥60, my lord.');
  const offer = fee.replies[0].next;
  assert.equal(offer.replies[0].next().character, 'elias');
  assert.match(offer.replies[1].next.text, /stop wasting/);
  canPay = true;
  const success = offer.replies[0].next();
  assert.equal(success.action, undefined);
  assert.equal(success.replies[0].next.replies[0].next.action, 'payDjAdmission');
  assert.equal(baronDanceDialogue(true, () => canPay, true).replies.length, 0);
});

test('DJ Dairy remembers finished topics and selects the romantic advice branch', async () => {
  const {createDjConversation} = await import('../src/dj-dialogue.mjs');
  for (const seduced of [false, true]) {
    const open = createDjConversation(() => seduced);
    const follow = option => typeof option.next === 'function' ? option.next() : option.next;
    const opening = open();
    assert.equal(opening.replies.length, 8);
    const advice = follow(opening.replies[4]);
    const response = follow(follow(advice.replies[0]).replies[0]);
    const next = follow(response.replies[0]);
    if (seduced) {
      assert.equal(next.character, 'security-camera');
      assert.equal(next.text, '');
      assert.equal(next.replies[0].label, 'Oh MILK!');
    } else {
      assert.match(response.text, /I AM THE MILK!/);
    }
    let finalReply = next.replies[0];
    if (!seduced) {
      assert.equal(finalReply.label, 'Can I have some then?');
      const deflection = follow(finalReply);
      assert.equal(deflection.text, "Whoa, man. Let's not make this about money.");
      finalReply = deflection.replies[0];
    }
    assert.equal(follow(finalReply).replies.length, 7);
    assert.equal(open().replies.length, 7);
    assert.equal(open().replies.at(-1).label, 'Enjoy your music.');
  }
});

test('the Baron’s free milk topic requires eligibility and can only be selected once', async () => {
  const {additionalBaronReplies} = await import('../src/baron-dialogue.mjs');
  const used = new Set();
  const replies = canAskForFreeMilk => additionalBaronReplies({used, discoveries: {canAskForFreeMilk}});
  assert.equal(replies(false).length, 0);
  const [offer] = replies(true);
  assert.equal(offer.consumeOnSelect, true);
  assert.equal(offer.next.text, 'ELIAS! GET THIS BOY SOME MILK!');
  const handoff = offer.next.replies[0].next;
  assert.equal(handoff.character, 'elias');
  assert.equal(handoff.enterAction, 'baronFreeMilk');
  used.add(offer.once);
  assert.equal(replies(true).length, 0);
});

test('the Baron’s Political Conversion topic unlocks after a karma encounter and offers exclusive branches', async () => {
  const {additionalBaronReplies} = await import('../src/baron-dialogue.mjs');
  const used = new Set();
  const menu = spokeToMilo => additionalBaronReplies({used, discoveries: {}, spokeToMilo});
  assert.equal(menu(true).length, 0);
  used.add('baronKarmaEncounter');
  for (const spokeToMilo of [false, true]) {
    let node = menu(spokeToMilo)[0].next;
    while (node.replies[0].label === 'Continue') node = node.replies[0].next;
    assert.equal(node.replies.length, spokeToMilo ? 5 : 4);
    assert.equal(node.replies.some(option => option.label.includes('Milo')), spokeToMilo);
    for (const option of node.replies) {
      let response = option.next;
      while (response.replies?.length) {
        assert.equal(response.replies.length, 1);
        response = response.replies[0].next;
      }
      assert.equal(response.action, 'finishPoliticalConversion');
    }
  }
  used.add('finishPoliticalConversion');
  assert.equal(menu(true).length, 0);
});

test('the Baron’s surveillance scenes advance in order and wait for the Executive condition', async () => {
  const {additionalBaronReplies} = await import('../src/baron-dialogue.mjs');
  const used = new Set(['baronFollowing', 'baronWatching']);
  const next = seducedExecutive => additionalBaronReplies({used, discoveries: {}, seducedExecutive})
    .find(option => option.label !== "How do you think I'm doing?");
  const finish = node => {
    while (node.replies?.length) node = node.replies[0].next;
    used.add(node.action ?? node.exitAction);
  };
  finish(next(false).next);
  const second = next(false).next;
  assert.equal(second.replies.length, 2);
  assert.equal(second.replies[1].next.replies[0].next.replies, undefined);
  assert.match(next(true).next.replies[1].next.replies[0].next.replies[0].label, /lipstick/);
  finish(second);
  finish(next(false).next);
  let privacy = next(false).next;
  while (privacy.character !== 'security-camera') privacy = privacy.replies[0].next;
  assert.equal(privacy.text, '');
  assert.equal(privacy.replies[0].label, 'Unbelievable.');
  finish(privacy);
  finish(next(false).next);
  assert.equal(next(false), undefined);
  assert.equal(next(true).label, 'Just how much can you see through those cameras?');
  finish(next(true).next);
  assert.equal(next(true), undefined);
});

test('DJ Dairy’s financial assistance and musical appreciation topics are separate and one-time', async () => {
  const {createDjConversation} = await import('../src/dj-dialogue.mjs');
  for (const canTip of [false, true]) {
    const open = createDjConversation(() => false, () => canTip);
    const financial = () => open().replies.find(reply => reply.label.includes('₥200'));
    const appreciation = () => open().replies.find(reply => reply.label === 'I love your music, man.');
    const question = financial().next();
    assert.equal(question.replies[0].next, question.replies[1].next);
    assert.equal(financial(), undefined);
    const thanks = appreciation().next();
    const tip = thanks.replies.find(reply => reply.label.startsWith("Here's a tip"));
    assert.equal(tip?.next.enterAction, canTip ? 'tipDjDairy' : undefined);
    assert.equal(thanks.replies.at(-1).next.enterAction, undefined);
    assert.equal(appreciation(), undefined);
  }
});

test('Sterling and Genevieve unlock name dialogue after completed name conversations', async () => {
  const {createWaiterConversation} = await import('../src/waiter-dialogue.mjs');
  const {waiterNameLines, sterlingResponses} = await import('../src/waiter-name-dialogue.mjs');
  const bull = 'handlebar-waiter';
  const feta = 'male-waiter';
  const brie = 'blonde-waitress';
  const sterling = 'martini-waiter';
  const genevieve = 'female-waiter';
  const lin = 'lin-waitress';

  const nameReply = (menu, id) => menu.replies.find(reply => reply.label === waiterNameLines[id][0]);
  const select = reply => typeof reply.next === 'function' ? reply.next() : reply.next;
  function finishName(menu, id, followUp = 0) {
    const name = nameReply(menu, id);
    assert.ok(name, id + ' should offer the name topic');
    let node = select(name);
    for (let step = 0; step < 20; step++) {
      if (node.replies.some(reply => reply.label === 'Could I have a glass of milk, please?')) return node;
      if (node.replies.length > 1) {
        assert.deepEqual(node.replies.map(reply => reply.label), sterlingResponses.map(lines => lines[0]));
      }
      node = select(node.replies.length > 1 ? node.replies[followUp] : node.replies[0]);
    }
    assert.fail(id + ' did not return to the regular menu');
  }

  for (const [id, complete, unlocked] of [
    [null, false, false], [brie, false, false], [feta, false, false],
    [bull, false, false], [sterling, false, false], [brie, true, true],
    [feta, true, true], [bull, true, true], [lin, true, false]
  ]) {
    const open = createWaiterConversation(() => 100, () => true);
    if (id) {
      const menu = open(false, id);
      if (complete) {
        const firstReply = nameReply(menu, id);
        assert.ok(firstReply, id);
        select(firstReply);
        assert.equal(nameReply(open(false, sterling), sterling), undefined);
        assert.equal(nameReply(open(false, genevieve), genevieve), undefined);
        assert.equal(nameReply(finishName(menu, id), id), undefined);
        assert.equal(nameReply(open(false, id), id), undefined);
      }
    }
    for (const server of [sterling, genevieve]) {
      assert.equal(Boolean(nameReply(open(false, server), server)), unlocked, server + ' after ' + id);
    }
  }

  let askedAboutCows = false;
  const open = createWaiterConversation(() => 100, () => askedAboutCows);
  assert.equal(nameReply(open(false, bull), bull), undefined);
  askedAboutCows = true;
  assert.ok(nameReply(open(false, bull), bull));

  for (const followUp of [0, 1]) {
    const visit = createWaiterConversation(() => 100);
    finishName(visit(false, feta), feta);
    assert.equal(nameReply(finishName(visit(false, sterling), sterling, followUp), sterling), undefined);
    assert.equal(nameReply(visit(false, sterling), sterling), undefined);
    assert.ok(nameReply(visit(false, genevieve), genevieve));
    finishName(visit(false, genevieve), genevieve);
    assert.equal(nameReply(visit(false, genevieve), genevieve), undefined);
  }
});

test('Lin prioritises stolen clothing, preserves flirting progression, and uses pre-penalty karma', async () => {
  const {createWaiterConversation, linWaitressId} = await import('../src/waiter-dialogue.mjs');
  const choose = (node, label) => {
    const option = label ? node.replies.find(reply => reply.label === label) : node.replies[0];
    assert.ok(option, label);
    return typeof option.next === 'function' ? option.next() : option.next;
  };
  const advance = (node, stop) => {
    for (let step = 0; step < 30 && !stop(node); step++) node = choose(node);
    assert.ok(stop(node));
    return node;
  };
  const reachedMenu = node => node.replies[0]?.label === 'Could I have a glass of milk, please?';
  for (const karma of [0, 0.5, 5, 5.5]) {
    const pool = {visited: false, karma, heardBunnies: true};
    const open = createWaiterConversation(() => 100, () => false, () => false, () => pool);
    const visit = () => open(false, linWaitressId);
    for (let stage = 0; stage < 3; stage++) {
      advance(choose(visit(), visitTopic(stage)), reachedMenu);
    }
    pool.visited = true;
    pool.clothing = 'all';
    const choices = advance(visit(), node => node.text === 'This should be good.');
    assert.ok(choices.replies.some(reply => reply.label === "To be fair, I took everyone's clothes."));
    const denial = choose(choose(choices, "[Lie] I didn't steal anyone's clothes."));
    assert.equal(denial.enterAction, 'linClothingLie');
    assert.equal(denial.text.startsWith('Well, you don’t') || denial.text.startsWith("Well, you don't"), karma > 0);
    if (karma >= 5) {
      const slap = choose(choose(choices, 'I wanted to see some aristocratic bunnies.'));
      assert.equal(slap.enterAction, 'linBunniesSlap');
      const apology = choose(slap);
      assert.equal(apology.enterAction, 'linApologyKarma');
      assert.equal(apology.text.startsWith('You know'), karma > 5);
      const departure = advance(choose(slap, "At least they're not prudes like you."), node => node.action === 'linDepart');
      assert.equal(departure.enterAction, 'linThrowMilk');
      assert.equal(departure.replies.length, 0);
    }
    assert.ok(visit().replies.some(reply => reply.label.startsWith("Excuse me, where's the milk fountain")));
    open.endRelationship('alienated');
    assert.equal(open.canOfferKindness(), false);
    assert.equal(open.willConfront(), false);
    assert.equal(visit().replies[0].next.text, '₥2.');
  }

  function visitTopic(stage) {
    return ["Lin. That's a really pretty name.", 'So... is the milk fresh?', "Lovely weather we're having."][stage];
  }
});

test('Lin’s final insult requires a completed Executive confrontation and allows an irreversible departure', async () => {
  const {createWaiterConversation, linWaitressId} = await import('../src/waiter-dialogue.mjs');
  let seduced = false;
  const open = createWaiterConversation(() => 100, () => false, () => seduced);
  const visit = () => open(false, linWaitressId);
  const select = (node, index = 0) => {
    const {next} = node.replies[index];
    return typeof next === 'function' ? next() : next;
  };
  const reach = (node, predicate) => {
    for (let step = 0; step < 35 && !predicate(node); step++) node = select(node);
    assert.ok(predicate(node));
    return node;
  };
  const isMenu = node => node.replies[0]?.label === 'Could I have a glass of milk, please?';
  for (let stage = 0; stage < 3; stage++) reach(select(visit(), 1), isMenu);
  seduced = true;
  const reaction = visit();
  assert.equal(open.relationship(), 'normal');
  const menu = reach(reaction, isMenu);
  assert.equal(open.relationship(), 'alienated');
  const topic = menu.replies.find(reply => reply.label === 'Are you still upset about Lady Penelope?');
  const choices = select(topic.next());
  assert.equal(choices.replies.length, 3);
  const exit = reach(select(choices, 2), node => node.action === 'linDepartWithRegret');
  assert.equal(exit.text, 'I quit.');
  assert.ok(!visit().replies.some(reply => reply.label === topic.label));
  open.endRelationship('departed');
  open.endRelationship('alienated');
  assert.equal(open.relationship(), 'departed');
  assert.deepEqual(visit().replies, []);
});

test('Lin departure reactions are independent and the Executive’s deferred offer is free and single-use', async () => {
  const {createLinDepartureReactions} = await import('../src/lin-departure-dialogue.mjs');
  const {createExecutiveConversation} = await import('../src/executive-dialogue.mjs');
  const regular = {text: 'Regular menu'};
  const option = createLinDepartureReactions();
  const guardOne = {id: 'guard', guard: {}};
  const guardTwo = {id: 'guard', guard: {}};
  option(guardOne, regular).next();
  assert.equal(option(guardOne, regular), null);
  assert.equal(option(guardTwo, regular).label, 'Do you know where the waitress went?');
  assert.equal(option({id: 'milk-mystic'}, regular).next().speaker, 'Oracle');

  let eligible = false;
  const visit = createExecutiveConversation(() => 0, () => eligible);
  assert.doesNotMatch(visit().text, /waitress/);
  eligible = true;
  let node = visit();
  while (node.replies.length === 1) node = node.replies[0].next;
  assert.equal(node.replies.length, 2);
  const decline = node.replies[1].next.replies[0].next.replies[0].next;
  const menu = decline.replies[0].next();
  const offer = menu.replies.find(reply => reply.label.includes('free networking'));
  const result = offer.next().replies[0].next.fadeTo;
  assert.equal(result.text, 'Always a pleasure doing business with you.');
  assert.equal(result.action, undefined);
  assert.ok(!visit().replies.some(reply => reply.label === offer.label));
});

test('Lin can recover from pool jealousy, then confront Pip about theft without skipping a flirting chat', async () => {
  const {createWaiterConversation, linWaitressId} = await import('../src/waiter-dialogue.mjs');
  const pool = {visited: false, karma: 1, heardBunnies: false};
  const open = createWaiterConversation(() => 100, () => false, () => false, () => pool);
  const visit = () => open(false, linWaitressId);
  const choose = (node, index = 0) => {
    const {next} = node.replies[index];
    return typeof next === 'function' ? next() : next;
  };
  const advance = (node, stop) => {
    for (let step = 0; step < 30 && !stop(node); step++) node = choose(node);
    assert.ok(stop(node));
    return node;
  };
  const isMenu = node => node.replies[0]?.label === 'Could I have a glass of milk, please?';
  for (let stage = 0; stage < 3; stage++) advance(choose(visit(), 1), isMenu);
  pool.visited = true;
  const explanation = advance(visit(), node => node.text === "Don't pretend you haven't noticed.");
  assert.equal(explanation.replies.length, 1);
  const reassurance = advance(choose(explanation), node => node.text === "So you weren't there for any other reason?");
  assert.equal(choose(reassurance, 1).enterAction, 'linReassuranceLie');
  const response = advance(choose(reassurance), node => node.text === 'Sorry. I suppose I thought rather poorly of you.');
  advance(choose(response, 1), isMenu);
  assert.equal(open.relationship(), 'normal');
  const nextChat = visit().replies[1].label;
  pool.clothing = 'man';
  const accusation = choose(visit());
  assert.equal(accusation.text, "I hear you've been stealing clothes from the milk pool.");
  const options = advance(accusation, node => node.text === 'This should be good.');
  assert.equal(options.replies.length, 3);
  advance(choose(options), isMenu);
  assert.equal(visit().replies[1].label, nextChat);
});

test('server tipping checks funds and stock, limits tips, and unlocks post-ban dialogue after Elias', async () => {
  const {createWaiterConversation, waiterTippingIntervention, TIPPED_MILK_PRICE} = await import('../src/waiter-dialogue.mjs');
  const ids = ['male-waiter', 'handlebar-waiter', 'martini-waiter', 'female-waiter', 'blonde-waitress', 'lin-waitress'];
  const thanks = ['A gratuity', 'A gentleman', 'How exceptionally', 'Oh! Thank you', 'Awww', 'Oh. Thank you'];
  const tipLabel = 'Yes, please. And a coin for you.';
  const policy = "Apparently I'm not allowed to tip anymore.";
  const choose = ({next}) => typeof next === 'function' ? next() : next;
  const tip = node => node.replies.find(reply => reply.label === tipLabel);
  const order = (open, id) => open(false, id).replies[0].next;
  const finish = node => {
    for (let line = 0; line < 25 && node?.replies?.length; line++) node = choose(node.replies[0]);
    return node;
  };
  for (const [index, id] of ids.entries()) {
    const open = createWaiterConversation(() => 100);
    const result = choose(tip(order(open, id)));
    assert.ok(result.text.startsWith(thanks[index]));
    assert.equal(result.enterAction, 'buyTippedWaiterMilk');
    assert.equal(finish(result), null);
    assert.equal(tip(order(open, id)), undefined);
  }
  let balance = 2;
  const open = createWaiterConversation(() => balance);
  assert.equal(TIPPED_MILK_PRICE, 3);
  assert.equal(tip(order(open, ids[0])), undefined);
  balance = 3;
  assert.equal(open(true, ids[0]).text, 'Not now! Busy, busy, busy!');
  const cancelled = choose(order(open, ids[0]).replies.at(-1));
  assert.equal(cancelled.text, 'Very well, sir.');
  const staleOffer = tip(order(open, ids[0]));
  balance = 2;
  assert.equal(choose(staleOffer).enterAction, undefined);
  balance = 100;
  assert.equal(finish(choose(tip(order(open, ids[0])))), null);
  const second = choose(tip(order(open, ids[5])));
  assert.equal(second.enterAction, 'buyTippedWaiterMilk');
  assert.equal(tip(order(open, ids[2])), undefined);
  assert.deepEqual(finish(second), {exitAction: 'beginWaiterTipBan'});
  assert.ok(!open(false, ids[0]).replies.some(reply => reply.label === policy));
  assert.equal(finish(waiterTippingIntervention()).action, 'finishWaiterTipBan');
  open.finishTipBan();
  for (const id of ids) {
    const topic = open(false, id).replies.find(reply => reply.label === policy);
    assert.ok(topic);
    assert.equal(choose(topic).enterAction, undefined);
    assert.ok(!open(false, id).replies.some(reply => reply.label === policy));
    assert.equal(tip(order(open, id)), undefined);
  }
});

test('Lin tip variants use completed flirting milestones and prioritise relationship state', async () => {
  const {waiterTipLines} = await import('../src/waiter-tipping-dialogue.mjs');
  const first = (state, chats) => {
    const line = waiterTipLines('lin-waitress', state, chats)?.[0];
    return typeof line === 'string' ? line : line?.text;
  };
  for (const [chats, text] of [[0, 'Oh.'], [1, 'Oh.'], [2, 'Pip,'], [4, 'Pip,'], [5, 'Aww,'], [7, 'Aww,'], [8, 'PIP!'], [10, 'PIP!']]) {
    assert.ok(first('normal', chats).startsWith(text));
  }
  assert.equal(first('alienated', 10), 'Thank you, sir.');
  assert.equal(first('departed', 10), undefined);
});

test('Mystic visibility counts only completed unique conversations and unlocks Elias and the free follow-up in order', async () => {
  const {createMysticVisibilityDialogue} = await import('../src/mystic-visibility-dialogue.mjs');
  const mystery = createMysticVisibilityDialogue();
  const menu = {replies: []};
  const option = (id, lin) => mystery.option(id, menu, lin);
  const choose = reply => typeof reply.next === 'function' ? reply.next() : reply.next;
  const finish = (node, branch = 0) => {
    for (let step = 0; step < 30 && node !== menu && node !== null; step++) {
      assert.ok(node.replies.length);
      assert.equal(node.enterAction, undefined);
      node = choose(node.replies[node.replies.length > 1 ? branch : 0]);
    }
    assert.ok(node === null || node === menu);
    return node;
  };
  assert.equal(option('baron'), null);
  mystery.meetMystic();
  assert.equal(option('milk-mystic'), null);
  assert.equal(option('lin-waitress', {linChats: 4}), null);
  assert.equal(option('lin-waitress', {linChats: 5, linRelationship: 'alienated'}), null);
  assert.ok(option('lin-waitress', {linChats: 5}));
  const held = choose(option('baron'));
  assert.equal(option('elias'), null);
  assert.equal(finish(held), null);
  for (const id of ['guard', 'creamery-bartender', 'dj']) {
    assert.equal(option('elias'), null);
    assert.equal(finish(choose(option(id)), id === 'guard' ? 1 : 0), id === 'guard' ? null : menu);
    assert.equal(option(id), null);
  }
  assert.ok(option('elias'));
  assert.equal(option('milk-mystic'), null);
  assert.equal(finish(choose(option('elias')), 2), menu);
  assert.equal(option('elias'), null);
  assert.equal(finish(choose(option('milk-mystic'))), menu);
  assert.equal(option('milk-mystic'), null);
  assert.ok(option('professor'));
});

test('every Mystic visibility branch reaches its declared ending', async () => {
  const {createMysticVisibilityDialogue} = await import('../src/mystic-visibility-dialogue.mjs');
  const ids = ['baron', 'creamery-bartender', 'pillory-attendant', 'pillory-commissioner',
    'lin-waitress', 'male-waiter', 'handlebar-waiter', 'martini-waiter', 'female-waiter',
    'blonde-waitress', 'professor', 'lifeguard', 'dj', 'guard', 'elias', 'milk-mystic'];
  for (let branch = 0; branch < 4; branch++) {
    const mystery = createMysticVisibilityDialogue();
    const menu = {text: 'Regular menu'};
    mystery.meetMystic();
    for (const id of ids) {
      const topic = mystery.option(id, menu, {linChats: 5});
      assert.ok(topic, id);
      let node = topic.next;
      while (node && node !== menu) {
        assert.ok(node.replies.length, id);
        const {next} = node.replies[Math.min(branch, node.replies.length - 1)];
        node = typeof next === 'function' ? next() : next;
      }
      assert.equal(node, id === 'baron' || (id === 'guard' && branch === 1) ? null : menu, id);
    }
  }
});

test('all Elias introduction branches converge and the final questions have independent one-time keys', async () => {
  const {eliasWelcome} = await import('../src/elias.mjs');
  const follow = node => {
    while (node.replies?.length === 1) {
      assert.equal(node.action, undefined);
      node = node.replies[0].next;
    }
    return node;
  };
  let section = eliasWelcome;
  for (let index = 0; index < 6; index++) {
    assert.equal(section.replies.length, 5);
    function nextSections(node) {
      if (node.replies?.length === 5 || node.text === 'Now, Master Pip, do you have any questions?') return [node];
      assert.ok(node.replies?.length, node.text);
      assert.equal(node.action, undefined);
      return node.replies.flatMap(reply => nextSections(reply.next));
    }
    const endings = section.replies.flatMap(option => nextSections(option.next));
    assert.ok(endings.every(node => node === endings[0]));
    section = endings[0];
  }
  assert.equal(section.text, 'Now, Master Pip, do you have any questions?');
  const exits = section.replies.slice(-2);
  const questions = section.replies.slice(0, -2);
  assert.equal(questions.length, 11);
  assert.ok(!questions.some(question => question.label === 'Are you actually a vampire?'));
  assert.equal(new Set(questions.map(question => question.once)).size, questions.length);

  function countPathsToMenu(node) {
    if (node === section) return 1;
    assert.equal(node.action, undefined);
    assert.ok(node.replies?.length);
    return node.replies.reduce((count, option) => count + countPathsToMenu(option.next), 0);
  }
  for (const question of questions) assert.equal(question.consumeOnSelect, true);
  assert.deepEqual(questions.map(question => countPathsToMenu(question.next)),
    [1, 1, 4, 1, 1, 1, 1, 12, 1, 1, 6]);
  for (const exit of exits) {
    const closing = follow(exit.next);
    assert.equal(closing.action, 'finishEliasWelcome');
    assert.ok(!closing.replies?.length);
  }
});

test('Lin uses the lifeguard phrases according to the confrontation and what Pip heard', async () => {
  const {linPoolJealousy, linClothingConfrontation} = await import('../src/lin-pool-dialogue.mjs');
  const phraseOptions = scene => scene.at(-1).options.map(([label]) => label)
    .filter(label => label.includes('aristocratic'));
  const beauties = 'I wanted to see some aristocratic beauties.';
  const bunnies = 'I wanted to see some aristocratic bunnies.';
  for (const heardBeauties of [false, true]) {
    for (const heardBunnies of [false, true]) {
      assert.deepEqual(phraseOptions(linPoolJealousy(heardBeauties)), heardBeauties ? [beauties] : []);
      const clothing = linClothingConfrontation({clothing: 'women', karma: 0, heardBeauties, heardBunnies});
      assert.deepEqual(phraseOptions(clothing), heardBunnies ? [bunnies] : heardBeauties ? [beauties] : []);
    }
  }
});

test('both lifeguard routes unlock beauties when the phrase is spoken', async () => {
  const {lifeguardDialogue} = await import('../src/lifeguard-dialogue.mjs');
  const {createMysticVisibilityDialogue} = await import('../src/mystic-visibility-dialogue.mjs');
  const work = lifeguardDialogue.replies.find(reply => reply.label === "What's it like working here?");
  assert.equal(work.consumeOnSelect, true);
  const phrase = work.next.replies[0].next;
  assert.match(phrase.text, /aristocratic beauties/);
  assert.equal(phrase.enterAction, 'hearLifeguardBeauties');
  assert.equal(phrase.replies[0].next.replies[0].next, lifeguardDialogue);

  const visibility = createMysticVisibilityDialogue();
  visibility.meetMystic();
  let node = visibility.option('lifeguard', lifeguardDialogue).next;
  while (!node.text.includes('aristocratic beauties')) node = node.replies[0].next;
  assert.equal(node.enterAction, 'hearLifeguardBeauties');
});

test('Mystic transaction rolls match the specified weights and preserve exact nonfatal health', async () => {
  const {mysticMoneyOutcome} = await import('../src/mystic-money-dialogue.mjs');
  const {createHealth} = await import('../src/health.mjs');
  const count = results => results.reduce((counts, result) => counts.set(result, (counts.get(result) ?? 0) + 1), new Map());
  const rolls = Array.from({length: 100}, (_, index) => index + 1);
  assert.deepEqual([...count(rolls.map(roll => mysticMoneyOutcome(100, 2.5, 3, roll, 50).coinChange))],
    [[-20, 5], [-10, 10], [-5, 10], [0, 5], [5, 10], [10, 15], [20, 25], [30, 15], [50, 5]]);
  assert.deepEqual([...count(rolls.map(roll => mysticMoneyOutcome(100, 2.5, 3, 50, roll).hearts))],
    [[3, 5], [2.5, 10], [1.875, 20], [1.25, 39], [0.625, 20], [0.5, 5], [0, 1]]);
  for (const coins of [119, 120, 150]) {
    assert.equal(mysticMoneyOutcome(coins, 3, 3, 100, 1).coinChange, coins === 119 ? 50 : 30);
  }
  assert.equal(mysticMoneyOutcome(3, 3, 3, 1, 1).coinChange, -3);
  assert.equal(mysticMoneyOutcome(100, 3, 3, 1, 1).hearts, 3);
  assert.equal(mysticMoneyOutcome(100, 0.125, 3, 1, 99).hearts, 0.125);
  const health = createHealth();
  assert.equal(health.set(0.625), 0.625);
  assert.equal(health.change(0.5), 1.125);
});

test('Mystic money dialogue remains available after refusal and decline and resolves an acceptance once', async () => {
  const {createMilkMysticConversation} = await import('../src/milk-mystic.mjs');
  const menuOption = 'Could you spare some milk tokens?';
  const askAgain = 'Could I have some more milk tokens?';
  const choose = (node, label) => {
    const next = (label ? node.replies.find(reply => reply.label === label) : node.replies[0]).next;
    return typeof next === 'function' ? next() : next;
  };
  function advance(node) {
    const lines = [];
    const actions = [];
    while (node.replies?.length === 1 && !node.linDepartureMenu) {
      assert.equal(node.speaker, 'Milk Mystic');
      if (node.enterAction) actions.push(node.enterAction);
      lines.push(node.text);
      if (node.replies[0].label !== 'Continue') lines.push(node.replies[0].label);
      node = choose(node);
    }
    return {node, lines, actions};
  }
  for (const fatal of [false, true]) {
    let coins = 151;
    let transactions = 0;
    const open = createMilkMysticConversation(() => ({coins}), undefined, () => {
      transactions++;
      return {coinChange: -5, healthChange: -0.75, fatal, broke: false};
    });
    let menu = choose(choose(open()));
    assert.equal(choose(menu, menuOption).text, 'You already have plenty, child.');
    menu = advance(choose(menu, menuOption)).node;
    coins = 150;
    const offer = advance(choose(menu, menuOption)).node;
    assert.equal(offer.text, 'Do you accept, child?');
    menu = advance(choose(offer, "On second thought, I don't like the sound of this.")).node;
    assert.equal(transactions, 0);
    const accepted = advance(choose(advance(choose(menu, menuOption)).node));
    assert.equal(transactions, 1);
    assert.ok(open().replies.some(reply => reply.label === askAgain));
    if (fatal) {
      assert.equal(accepted.node.action, 'mysticMoneyDeath');
      assert.equal(accepted.node.pipCollapsed, true);
      assert.ok(!accepted.lines.includes("WAIT! I'VE LOST MONEY!"));
    } else {
      assert.ok(accepted.lines.indexOf('AARGH! WHAT THE HELL?!') < accepted.lines.indexOf("WAIT! I'VE LOST MONEY!"));
      assert.equal(accepted.node.replies.length, 3);
      const theft = advance(choose(accepted.node, "Fine. I'll take it back myself."));
      assert.ok(theft.lines.includes("I'm beginning to hate milk."));
      assert.deepEqual(theft.actions, ['mysticMoneyTheft']);
      assert.ok(theft.node.replies.some(reply => reply.label === askAgain));
    }
  }
});

test('Elias welcome expansions preserve the authored beats and disposition gate', async () => {
  const {eliasWelcome, eliasPortraits} = await import('../src/elias.mjs');
  function step(node, label, text, mood, playerMood = 'thinking') {
    const reply = node.replies.find(option => option.label === label);
    assert.ok(reply, label);
    assert.equal(reply.playerMood, playerMood, label);
    assert.equal(reply.next.text, text, label);
    assert.equal(reply.next.mood, mood, label);
    assert.ok(eliasPortraits.includes(mood), label);
    return reply.next;
  }
  const accountant = step(eliasWelcome, 'BAH! A VAMPIRE!', 'Accountant, Master Pip. Accountant.', 'insulted', 'alarmed');
  assert.deepEqual(accountant.replies.map(option => option.label), ['Even worse!', 'Oh, phew.', 'Why do you dress like that?']);
  const activism = eliasWelcome.replies[0].next.replies[0].next;
  for (const [label, line, mood, playerMood] of [
    ['Even worse!', 'Only to those in debt, Master Pip.', 'self-assured-smirk', 'alarmed'],
    ['Oh, phew.', 'Your relief may be premature.', 'devious', 'happy']
  ]) {
    const response = step(accountant, label, line, mood, playerMood);
    assert.equal(response.vampireStage, undefined);
    assert.equal(response.replies[0].next, activism);
  }
  const dress = step(accountant, 'Why do you dress like that?',
    'I find that a suitably ominous appearance encourages prompt repayment of outstanding debts, Master Pip.', 'self-assured-smirk');
  assert.equal(dress.vampireStage, undefined);
  assert.equal(dress.replies[0].next, activism);

  let node = activism;
  while (!node.replies.some(reply => reply.label === 'What happens at the dairy?')) node = node.replies[0].next;
  const vork = step(node, 'What happens at the dairy?', 'Vork.', 'current-smile');
  assert.deepEqual(vork.replies.map(reply => reply.label), ['What sort of work?', 'Vork?']);
  const work = step(vork, 'What sort of work?', 'Considerable quantities of it.', 'self-assured-smirk');
  const pronunciation = step(vork, 'Vork?', 'Yes. Vork.', 'current-smile');
  assert.equal(pronunciation.replies.length, 1);
  const clarification = step(pronunciation, 'You mean work?', 'Yes. Dat is what I said.', 'insulted');
  assert.equal(clarification.replies.length, 1);
  const doubleYou = step(clarification, 'No, you said vork. With a V.', 'Yes. Vork. With a double-you.', 'insulted', 'exasperated');
  const professionalDevelopment = work.replies[0].next;
  assert.equal(doubleYou.replies[0].next, professionalDevelopment);
  assert.equal(professionalDevelopment.text, 'Consider it a most generous opportunity for professional development, Master Pip.');

  const menu = professionalDevelopment.replies[0].next;
  const place = step(menu, 'What is this place?', 'Ah! I am delighted you asked.', 'laugh');
  const profitability = place.replies[0].next.replies[0].next;
  assert.deepEqual(profitability.replies.map(reply => reply.requiresDisposition), [undefined, undefined, undefined, 'communist']);
  for (const [label, response, mood, playerMood] of [
    ['I thought the Milk Baron made his money from milk?', 'Da! But he keeps his fortune by selling pleasure and amusement!', 'laugh', 'thinking'],
    ['Pleasure, amusement and an abundance of milk? I like the sound of this place.',
      'Excellent! Ze Baron takes great pride in separating his guests from their financial burdens.', 'devious', 'happy'],
    ['All this extravagance while millions are left with empty milk bottles?',
      'Da! An unfortunate consequence of insufficient purchasing power.', 'current-smile', 'worried']
  ]) {
    assert.equal(step(profitability, label, response, mood, playerMood).replies[0].next, menu);
  }
  assert.ok(profitability.replies.every(reply => !reply.expressesDisposition));
  const communist = step(profitability, 'Pleasure for the bourgeoisie, misery for the working cow!',
    'Ah, a communist! How delightful.', 'laugh', 'exasperated');
  assert.equal(step(communist, 'Continue', 'Ze Baron is always happy to redistribute your wealth into his own pockets.', 'devious')
    .replies[0].next, menu);
});

test('either early Elias answer unlocks the later communist options for the rest of the introduction', async () => {
  const {eliasWelcome} = await import('../src/elias.mjs');
  for (const unlockStage of [-1, 0, 1]) {
    let communist = false;
    let node = eliasWelcome;
    for (let stage = 0; stage < 6; stage++) {
      const choices = node.replies.filter(reply => !reply.requiresDisposition || communist);
      assert.equal(choices.length, stage < 2 || unlockStage >= 0 ? 5 : 4);
      const selected = stage === unlockStage ? choices.find(reply => reply.expressesDisposition === 'communist') : choices[0];
      communist ||= selected.expressesDisposition === 'communist';
      node = selected.next;
      while (node.replies.length === 1) node = node.replies[0].next;
    }
    assert.equal(node.replies.filter(reply => !reply.requiresDisposition || communist).length, communist ? 13 : 8);
  }
});

test('all seven Karl Curd branches conclude once and return to the Baron menu', async () => {
  const {baronCurdReply} = await import('../src/baron-curd-dialogue.mjs');
  const menu = () => ({text: 'Baron menu'});
  const topic = baronCurdReply(menu);
  assert.equal(topic.requiresDisposition, 'communist');
  assert.equal(topic.once, 'baronKarlCurd');
  assert.equal(topic.consumeOnSelect, undefined);
  let node = topic.next;
  let appearances = 0;
  while (node.replies.length === 1) {
    appearances += Number(node.direction === 'Elias appears.');
    node = node.replies[0].next;
  }
  assert.equal(appearances, 1);
  assert.equal(node.replies.length, 7);
  for (const choice of node.replies) {
    let response = choice.next;
    let completions = 0;
    while (response !== menu) {
      completions += Number(response.enterAction === 'finishBaronKarlCurd');
      assert.equal(response.action, undefined);
      assert.equal(response.replies.length, 1);
      response = response.replies[0].next;
    }
    assert.equal(completions, 1);
  }
});

test('future NPCs pause near Pip and block passage, with separate Baron and Elias exceptions', async () => {
  const {shouldPauseNpc} = await import('../src/room.mjs');
  const npc = {id: 'future-npc', x: 500, y: 550};
  const elias = {...npc, id: 'elias'};
  const baron = {...npc, id: 'baron'};
  const distantBaron = {x: 0, y: 0};
  const player = {...createPlayer(), x: 460, y: 550};

  assert.equal(shouldPauseNpc(npc, player), true);
  assert.equal(shouldPauseNpc(elias, player), true);
  assert.equal(shouldPauseNpc(baron, player), false);
  assert.equal(shouldPauseNpc(npc, {...player, x: 459}), false);
  movePlayer(player, distantBaron, 80, 0, [], [npc]);
  assert.equal(player.x, 460, 'a large movement step must still stop at an NPC');
  movePlayer(player, baron, 38, 0);
  assert.equal(player.x, 460, 'the Baron still blocks movement');
  movePlayer(player, distantBaron, 80, 0, [], [elias]);
  assert.equal(player.x, 540, 'Pip can walk through Elias');
});

test('Milk Mystic spawns near the Baron, pauses near Pip and roams through clear space', async () => {
  const {createMilkMystic, updateMilkMystic} = await import('../src/milk-mystic.mjs');
  const {isNpcBlocked} = await import('../src/room.mjs');
  const baron = createBaron();
  const mystic = createMilkMystic(baron);
  const spawn = {x: mystic.x, y: mystic.y};
  assert.ok(Math.hypot(spawn.x - baron.x, spawn.y - baron.y) < 200);
  const near = {x: mystic.x, y: mystic.y + 30};
  updateMilkMystic(mystic, baron, 0.05, near, () => assert.fail('Paused Mystic chose a route'));
  assert.deepEqual({x: mystic.x, y: mystic.y}, spawn);
  assert.equal(mystic.walking, false);

  let seed = 17;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  let furthest = 0;
  for (let frame = 0; frame < 2400; frame++) {
    updateMilkMystic(mystic, baron, 0.05, undefined, random);
    assert.equal(isNpcBlocked(mystic.x, mystic.y, mystic.radius, baron), false);
    furthest = Math.max(furthest, Math.hypot(mystic.x - spawn.x, mystic.y - spawn.y));
  }
  assert.ok(furthest > ROOM_WIDTH, 'Mystic should roam beyond the spawn square');
});

test('walking through Elias refreshes the ten-second menu window until selected', async () => {
  const {startEliasPassThrough, eliasPassThroughAvailable} = await import('../src/elias.mjs');
  const actor = {x: 10, y: 10};
  assert.equal(startEliasPassThrough(actor, {x: 0, y: 10}, {x: 9, y: 10}), false);
  assert.equal(startEliasPassThrough(actor, {x: 9, y: 10}, {x: 9, y: 10}), false);
  assert.equal(startEliasPassThrough(actor, {x: 0, y: 22}, {x: 20, y: 22}), false);
  assert.equal(eliasPassThroughAvailable(actor, 0), false);
  assert.equal(startEliasPassThrough(actor, {x: 9, y: 10}, {x: 11, y: 10}, 100), true);
  assert.equal(eliasPassThroughAvailable(actor, 10_099), true);
  assert.equal(eliasPassThroughAvailable(actor, 10_100), false);
  assert.equal(startEliasPassThrough(actor, {x: 11, y: 10}, {x: 9, y: 10}, 11_000), true);
  assert.equal(eliasPassThroughAvailable(actor, 11_001), true);
  actor.passThroughStarted = true;
  assert.equal(eliasPassThroughAvailable(actor, 11_002), false);
  assert.equal(startEliasPassThrough(actor, {x: 9, y: 10}, {x: 11, y: 10}, 12_000), false);
});

test('Elias pass-through dialogue gates the Mystic reply and rolls the arm outcome once', async () => {
  const {eliasPassThroughDialogue, eliasPortraits} = await import('../src/elias.mjs');
  for (const [metMystic, roll, expected, final, action] of [
    [false, 0.499, 'An optical illusion, Master Pip.', 'A particularly convincing optical illusion.', 'finishEliasPassThrough'],
    [true, 0.5, 'I did varn you.', 'A chartered accountant, Master Pip.', 'finishEliasPassThroughCold']
  ]) {
    let rolls = 0;
    const start = eliasPassThroughDialogue(metMystic, () => { rolls++; return roll; });
    assert.equal(start.speaker, 'Pip');
    assert.equal(start.playerMood, 'thinking');
    const denial = start.replies[0].next;
    assert.equal(denial.mood, 'insulted');
    assert.equal(denial.replies.length, metMystic ? 3 : 2);
    const warning = denial.replies[1].next();
    assert.equal(rolls, 1);
    assert.equal(warning.mood, 'devious');
    const narration = warning.replies[0].next;
    assert.match(narration.direction, /passes straight through him/);
    const first = narration.replies[0].next;
    const ending = first.replies[0].next;
    assert.equal(first.text, expected);
    assert.equal(ending.text, final);
    assert.ok(eliasPortraits.includes(ending.mood));
    assert.equal(ending.replies[0].next.exitAction, action);
    assert.equal(rolls, 1);
    for (const reply of denial.replies.filter((_, i) => i !== 1)) {
      assert.equal(reply.next.replies[0].next.replies[0].next.exitAction, 'finishEliasPassThrough');
    }
  }
});

test('Elias pass-through damage deducts two hearts and reports either survival or death', async () => {
  const {resolveEliasPassThroughAction} = await import('../src/elias.mjs');
  const {createHealth} = await import('../src/health.mjs');
  for (const start of [3, 2.5, 2, 1.5, 1, 0.5]) {
    const actor = {};
    let death;
    const health = createHealth((hearts, message) => { if (!hearts) death = message; });
    health.set(start);
    const messages = [];
    const announce = message => messages.push(message);
    resolveEliasPassThroughAction('eliasPassThroughDamage', actor, health, announce);
    assert.equal(health.hearts, Math.max(0, start - 2));
    assert.deepEqual(messages, []);
    if (start > 2) {
      resolveEliasPassThroughAction('finishEliasPassThroughCold', actor, health, announce);
      assert.deepEqual(messages, ['Your arm is cold. Unnaturally cold. (−2 hearts)']);
      assert.equal(health.hearts, start - 2);
    } else {
      assert.equal(death, 'You should have kept your hands to yourself.');
    }
    resolveEliasPassThroughAction('eliasPassThroughDamage', actor, health, announce);
    resolveEliasPassThroughAction('finishEliasPassThroughCold', actor, health, announce);
    assert.equal(health.hearts, Math.max(0, start - 2));
    assert.equal(messages.length, start > 2 ? 1 : 0);
    assert.equal(actor.passThroughCompleted, true);
  }
});

test('only the Elias consultation queues the one-time Mystic scene and all paths close it', async () => {
  const {eliasPassThroughDialogue} = await import('../src/elias.mjs');
  const {createMysticEliasFollowup, milkMysticMoods} = await import('../src/milk-mystic.mjs');
  const replies = eliasPassThroughDialogue(true).replies[0].next.replies;
  assert.equal(replies[0].next.enterAction, undefined);
  assert.equal(replies[1].next().enterAction, undefined);
  assert.equal(replies[2].next.enterAction, 'queueMysticEliasFollowup');
  const paths = [[0, 0], [1, 0], [1, 1, 0]];
  for (const path of paths) {
    const followup = createMysticEliasFollowup();
    assert.equal(followup.open(), null);
    followup.queue();
    const opening = followup.open();
    assert.equal(opening.text, "I've been expecting you, child.");
    assert.equal(followup.open(), null, 'opening consumes the pending interaction');
    let node = opening;
    for (const index of path) {
      assert.equal(node.mustContinue, true);
      assert.ok(milkMysticMoods.includes(node.mood));
      node = node.replies[index].next;
    }
    const conclusion = opening.replies[0].next.replies[0].next.replies[0];
    assert.equal(node.replies[0], conclusion);
    assert.equal(conclusion.label, 'Can you explain to me what happened?');
    assert.equal(conclusion.next.replies[0].next.text, 'Meditate upon it, child.');
    assert.deepEqual(conclusion.next.replies[0].next.replies[0].next, {exitAction: 'finishMysticEliasFollowup'});
    followup.complete();
    followup.queue();
    assert.equal(followup.open(), null);
  }
});
