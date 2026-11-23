import {createMilo, updateMilo} from '../src/milo.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {callOutMilo, createBaron, speechOpacity, talkToBaron, updateBaronAttention, updateBaronWalk} from '../src/baron.mjs';
import {facingIndex} from '../src/directions.mjs';
import {createPlayer, movePlayer, updatePlayer} from '../src/player.mjs';
import {cameraLeft, CENTER_RUG, isBlocked, nearestInteraction, CLEAR_AISLE_Y, SIDE_RUGS} from '../src/room.mjs';

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
  updatePlayer(player, baron, {dx: 1, dy: -1}, 0.05);
  assert.ok(Math.abs(Math.hypot(player.x - 350, player.y - 585) - 5.6) < 1e-9);
  assert.equal(player.facing, 3);
  assert.equal(player.walking, true);
  assert.ok(player.stride > 0);

  player.y = 617;
  movePlayer(player, baron, 0, 1);
  assert.equal(player.y, 617);
  assert.equal(player.facing, 0);
  assert.equal(player.walking, false);
  assert.equal(player.stride, 0);
});

test('the closed center door and the Baron block movement while old furniture positions are open', () => {
  const baron = createBaron();
  for (const [x, y] of [[350, 175], [385, 363]]) {
    assert.equal(isBlocked(x, y, 13, baron), true);
  }
  for (const [x, y] of [[-345, 165], [171, 319], [535, 319], [170, 553], [165, 215], [520, 215]]) {
    assert.equal(isBlocked(x, y, 13, baron), false);
  }
  baron.x -= 20;
  assert.equal(isBlocked(385, 363, 13, baron), false);
});

test('the empty hall retains character interactions', () => {
  const baron = createBaron();
  assert.equal(nearestInteraction(createPlayer(), baron), undefined);
  assert.equal(nearestInteraction({x: 350, y: 411}, baron)?.title, 'The Milk Baron');
  assert.equal(nearestInteraction({x: 171, y: 319}, baron), undefined);
});

test('the camera clamps at the outer walls and the floor is open between the end walls', () => {
  const baron = createBaron();
  assert.equal(cameraLeft(-600), -690);
  assert.equal(cameraLeft(345), 0);
  assert.equal(cameraLeft(1300), 690);
  for (const x of [0, 690]) {
    assert.equal(isBlocked(x, 380, 13, baron), false);
    assert.equal(isBlocked(x, CLEAR_AISLE_Y, 13, baron), false);
  }
  assert.equal(isBlocked(-653, CLEAR_AISLE_Y, 13, baron), true);
  assert.equal(isBlocked(1342, CLEAR_AISLE_Y, 13, baron), true);
});

test('the Baron waits five continuous seconds off-screen then walks to the closest side rug', () => {
  const baron = createBaron();
  const player = createPlayer();
  const update = (x, time, dt = 0.05) => {
    player.x = x;
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
  const player = {...createPlayer(), x: CENTER_RUG.x};
  for (const rug of SIDE_RUGS) {
    const baron = {...createBaron(), ...rug};
    for (let frame = 0; frame <= 14 * 20; frame++) {
      updateBaronWalk(baron, player, cameraLeft(player.x), frame / 20, 0.05);
      assert.equal(isBlocked(baron.x, baron.y, 13, {x: 0, y: 0}), false);
    }
    assert.deepEqual([baron.x, baron.y, baron.walking], [CENTER_RUG.x, CENTER_RUG.y, false]);
  }
});

test('the player can step away if the Baron walks onto an occupied rug', () => {
  const baron = {...createBaron(), ...SIDE_RUGS[0]};
  const player = {...createPlayer(), ...SIDE_RUGS[0]};
  movePlayer(player, baron, 5, 0);
  assert.equal(player.x, SIDE_RUGS[0].x + 5);
});

test('talking to the Baron cycles his dialogue and prompts a grin', () => {
  const baron = createBaron();
  const player = createPlayer();
  assert.match(talkToBaron(baron, 29), /WELCOME/);
  assert.match(talkToBaron(baron, 29), /extremely fair/);
  updateBaronAttention(baron, player, 29.1, 0.05);
  const grin = baron.expression;
  assert.ok(grin > 0);
  updateBaronAttention(baron, player, 31, 0.05);
  assert.ok(baron.expression < grin);
});

test('Milo rotates between corners and moves early if the Baron approaches', () => {
  const milo = createMilo();
  const baron = createBaron();
  updateMilo(milo, baron, 11, 0.05);
  assert.equal(milo.route.length, 0);
  for (let frame = 240; frame < 320; frame++) updateMilo(milo, baron, frame / 20, 0.05);
  assert.equal(milo.y, 550);
  assert.equal(milo.route.length, 0);
  assert.equal(nearestInteraction(milo, baron, milo)?.title, 'Milo Milksworth');

  // Stay in a different room to exercise the existing proximity avoidance.
  milo.x = -60;
  baron.x = 70;
  baron.y = milo.y;
  updateMilo(milo, baron, 16, 0.05);
  assert.ok(milo.route.length);
  assert.equal(milo.fleeing, false);
});

test('the Baron spots Milo once on entering the same room and Milo runs to the opposite wing', () => {
  for (const x of [-574, 1264]) {
    const milo = {...createMilo(), x};
    const baron = createBaron();
    assert.equal(updateMilo(milo, baron, 1, 0.05), false);

    baron.x = x < 0 ? -345 : 1035;
    assert.equal(updateMilo(milo, baron, 2, 0.05), true);
    callOutMilo(baron, milo, 2);
    assert.equal(baron.speech.text, 'Milo, I see you!');
    assert.equal(speechOpacity(baron, cameraLeft(baron.x), 5.5), 0.5);
    assert.equal(milo.fleeing, true);

    for (let frame = 41; frame < 280; frame++) {
      assert.equal(updateMilo(milo, baron, frame / 20, 0.05), false);
      assert.equal(isBlocked(milo.x, milo.y, 13, {x: 0, y: 0}), false);
    }
    assert.equal(milo.x, x < 0 ? 1264 : -574);
    assert.equal(milo.fleeing, false);
  }
});
