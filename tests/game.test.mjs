import {createGuards, updateGuards} from '../src/guards.mjs';
import {createMilo, updateMilo} from '../src/milo.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {callOutMilo, createBaron, speechOpacity, updateBaronIdleSpeech, updateBaronAttention, updateBaronWalk} from '../src/baron.mjs';
import {facingIndex} from '../src/directions.mjs';
import {createPlayer, movePlayer, updatePlayer} from '../src/player.mjs';
import {cameraLeft, cameraTop, HALL_CENTER, isBlocked, nearestInteraction, closestRug, NORTH_EDGE, ROOM_HEIGHT, ROOM_WIDTH, RUGS, WEST_EDGE, SIDE_RUGS, SOUTH_EDGE, SOUTH_TRIM_Y} from '../src/room.mjs';

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

test('the 3×5 rectangle has fifteen reachable rugs and only perimeter walls', () => {
  const baron = createBaron();
  assert.equal(RUGS.length, 15);
  const occupiedSquares = new Set(RUGS.map(({x, y}) =>
    Math.floor(x / ROOM_WIDTH) + ',' + Math.floor((y - NORTH_EDGE) / ROOM_HEIGHT)));
  assert.equal(occupiedSquares.size, 15);
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
    updateBaronWalk(baron, rug, 0, 10, 0.05, viewY);
    assert.equal(baron.route.at(-1), rug);
  }
});

test('the Baron waits ten continuous seconds off-screen then walks to the closest side rug', () => {
  const baron = createBaron();
  const player = createPlayer();
  const update = (x, time, dt = 0.05) => {
    player.x = x;
    player.y = SIDE_RUGS[0].y;
    updateBaronWalk(baron, player, cameraLeft(x), time, dt);
  };
  update(-500, 0);
  update(-500, 9.9);
  assert.equal(baron.walking, false);
  update(350, 10);
  update(-500, 11);
  update(-500, 20.9);
  assert.equal(baron.walking, false);
  update(-500, 21);
  assert.equal(baron.walking, true);
  assert.equal(baron.route.at(-1), SIDE_RUGS[0]);
  assert.match(baron.speech.text, /What's going on/);
  assert.equal(speechOpacity(baron, cameraLeft(-500), 21), 0);

  let time = 21;
  while (baron.route.length && time < 32) {
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
  update(1200, time + 15);
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
  assert.match(baron.speech.text, /^Milo/);
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
  'Milo my good friend. Why do you always run away?'
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
  const [guard] = guards;
  for (let i = 0; i < 100; i++) movePlayer(player, baron, 2, 0, guards);
  const separation = Math.hypot(player.x - guard.x, player.y - guard.y);
  assert.ok(separation >= 27 && separation < 30);

  const start = {x: guard.x, y: guard.y};
  for (let frame = 0; frame < 120; frame++) {
    updateGuards(guards, player, baron, milo, 3 + frame / 60, 1 / 60);
  }
  assert.deepEqual({x: guard.x, y: guard.y}, start);
  assert.ok(guards[1].target);
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

test('Baron callouts use all three phrases per round without consecutive repeats', () => {
  const baron = createBaron();
  const milo = createMilo();
  const spoken = [];
  for (let i = 0; i < 12; i++) {
    callOutMilo(baron, milo, i);
    assert.notEqual(baron.speech.text, spoken.at(-1));
    spoken.push(baron.speech.text);
  }
  for (let i = 0; i < spoken.length; i += 3) {
    assert.deepEqual(new Set(spoken.slice(i, i + 3)), new Set(miloCallouts));
  }
});
