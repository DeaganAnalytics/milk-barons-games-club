import {createDancerSpeech} from '../src/dancers.mjs';
import {danceLyric} from '../src/dance-floor.mjs';
import {createPartyChatter, partySpeech, updatePartyChatter} from '../src/party-chatter.mjs';
import {bartender, createCreameryGuard} from '../src/creamery.mjs';
import {createMilkService, milkCalls, updateMilkService} from '../src/milk-service.mjs';
import {createStaff, faceStaffMovement, updateStaff, staffFrame} from '../src/staff.mjs';
import {speechBubbleLayout} from '../src/speech-layout.mjs';
import {createGuards, summonGuard, updateGuards} from '../src/guards.mjs';
import {createMilo, updateMilo} from '../src/milo.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {callOutMilo, createBaron, isBaronDancing, speechOpacity, updateBaronIdleSpeech, updateBaronAttention, updateBaronWalk} from '../src/baron.mjs';
import {facingIndex} from '../src/directions.mjs';
import {createPlayer, movePlayer, updatePlayer} from '../src/player.mjs';
import {BARON_DANCE_STOP, cameraLeft, cameraTop, DANCE_FLOOR, HALL_CENTER, isBlocked, nearestInteraction, closestRug, NORTH_EDGE, ROOM_HEIGHT, ROOM_WIDTH, RUGS, WEST_EDGE, SIDE_RUGS, SOUTH_EDGE, SOUTH_TRIM_Y} from '../src/room.mjs';

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
    const column = (rug.x - WEST_EDGE) / ROOM_WIDTH - 0.5;
    const row = (rug.y - NORTH_EDGE) / ROOM_HEIGHT - 0.5;
    assert.ok(Number.isInteger(column) && Number.isInteger(row));
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

test('one randomly chosen dancer says one line every 20 seconds', () => {
  const rolls = [0, 0.99, 0.26, 0, 0.51, 0.99, 0.99, 0.99];
  const speechAt = createDancerSpeech(() => rolls.shift());
  assert.equal(speechAt(19.9), null);
  for (const [time, id, line] of [
    [20, 'mascot', 'Milk my cow! Milk her now!'],
    [40, 'coral', 'I like to PARTAY!'],
    [60, 'jade', 'That cow guard is kind of cute!!'],
    [80, 'guard', 'God bless the Baron!']
  ]) {
    const first = speechAt(time + 0.5);
    assert.equal(first.dancer.id, id);
    assert.equal(first.text, line);
    assert.equal(speechAt(time + 4).text, line);
    assert.equal(speechAt(time + 5), null);
  }
  assert.equal(rolls.length, 0);
});
