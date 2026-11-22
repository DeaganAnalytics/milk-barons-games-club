import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createBaron, talkToBaron, updateBaronAttention, updateBaronPatrol} from '../src/baron.mjs';
import {facingIndex} from '../src/directions.mjs';
import {createPlayer, movePlayer, updatePlayer} from '../src/player.mjs';
import {isBlocked, nearestInteraction} from '../src/room.mjs';

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

test('the doorway, tables, cashier, plants and moving Baron block movement', () => {
  const baron = createBaron();
  for (const [x, y] of [[350, 175], [171, 319], [535, 319], [170, 553], [165, 215], [520, 215]]) {
    assert.equal(isBlocked(x, y, 13, baron), true);
  }
  assert.equal(isBlocked(350, 585, 13, baron), false);
  assert.equal(isBlocked(385, 363, 13, baron), true);
  baron.x -= 20;
  assert.equal(isBlocked(385, 363, 13, baron), false);
});

test('stations and the Baron respond within their existing reach', () => {
  const baron = createBaron();
  assert.equal(nearestInteraction(createPlayer(), baron), undefined);
  for (const [x, y, title] of [
    [350, 411, 'The Milk Baron'],
    [171, 411, 'Card table'],
    [535, 411, 'Dice table'],
    [292, 560, undefined],
    [170, 478, 'Cashier']
  ]) {
    assert.equal(nearestInteraction({x, y}, baron)?.title, title);
  }
});

test('the Baron patrols on schedule and dialogue prompts a grin', () => {
  const baron = createBaron();
  const player = createPlayer();
  updateBaronPatrol(baron, 24);
  assert.equal(baron.walking, true);
  assert.equal(baron.facing, 2);
  updateBaronPatrol(baron, 25);
  assert.ok(baron.stride > 0);
  assert.ok(baron.x > 345);
  updateBaronPatrol(baron, 29);
  assert.deepEqual([baron.x, baron.y, baron.walking, baron.stride], [345, 357, false, 0]);
  assert.match(talkToBaron(baron, 29), /WELCOME/);
  assert.match(talkToBaron(baron, 29), /extremely fair/);
  updateBaronAttention(baron, player, 29.1, 0.05);
  const grin = baron.expression;
  assert.ok(grin > 0);
  updateBaronAttention(baron, player, 31, 0.05);
  assert.ok(baron.expression < grin);
});
