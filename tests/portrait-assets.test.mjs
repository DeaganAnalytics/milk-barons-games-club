import assert from 'node:assert/strict';
import {statSync} from 'node:fs';
import test from 'node:test';
import {createPortraitRotation, dialoguePortraitInventory} from '../src/dialogue.mjs';

test('portrait catalogue resolves every registered mood and state variant to an asset', () => {
  const {catalogue} = dialoguePortraitInventory();
  const ids = new Set();
  for (const {character, mood, variant, asset, cell} of catalogue) {
    const id = JSON.stringify([character, mood, variant]);
    assert.ok(!ids.has(id), 'Duplicate portrait: ' + id);
    ids.add(id);
    assert.doesNotThrow(() => assert.ok(statSync(new URL(asset)).isFile()), id + ' → ' + asset);
    if (cell) {
      assert.ok(cell.row >= 0 && cell.row < 4, id + ' atlas row');
      assert.ok(cell.column >= 0 && cell.column < 3, id + ' atlas column');
    }
  }
  assert.ok(catalogue.some(entry => entry.character === 'professor' && entry.mood === 'notebook'));
});

test('portrait artwork alternates across consecutive and interleaved turns', () => {
  const rotation = createPortraitRotation();
  const turns = [
    ['pip', 'thinking', true],
    ['professor', 'thinking', true],
    ['professor', 'thinking', true],
    ['pip', 'thinking', true],
    ['professor', 'thinking', false],
    ['professor', 'thinking', true],
    ['pip', 'thinking', false],
    ['pip', 'thinking', true]
  ];
  assert.deepEqual(turns.map(([character, mood, speaking]) => rotation.select(character, mood, true, speaking)),
    [false, false, true, true, true, false, true, false]);
});

test('portrait rotation keeps distinct expressions and state variants separate', () => {
  const rotation = createPortraitRotation();
  assert.equal(rotation.select('pip', 'thinking', true, true), false);
  assert.equal(rotation.select('pip', 'thinking', true, true), true);
  assert.equal(rotation.select('pip', 'thinking:disguise', true, false), false);
  assert.equal(rotation.select('pip', 'thinking:disguise', true, true), false);
  assert.equal(rotation.select('pip', 'thinking:disguise', true, true), true);
  assert.equal(rotation.select('pip', 'worried', true, true), false);
  assert.equal(rotation.select('pip', 'thinking', true, true), false);
  assert.equal(rotation.select('milo', 'injured', false, true), false);
  assert.equal(rotation.select('milo', 'injured', false, true), false);
});
