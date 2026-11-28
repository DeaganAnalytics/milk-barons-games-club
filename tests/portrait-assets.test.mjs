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
  assert.deepEqual(turns.map(([character, mood, speaking]) => rotation.select(character, mood, 2, speaking)),
    [0, 0, 1, 1, 1, 0, 1, 0]);
});

test('three portrait variants cycle through other expressions without advancing on passive beats', () => {
  const rotation = createPortraitRotation();
  const turn = (key, advance = true) => rotation.select('professor', key, 3, advance);
  assert.equal(turn('thinking'), 0);
  assert.equal(turn('skeptical'), 0);
  assert.equal(turn('thinking', false), 0);
  assert.equal(turn('thinking'), 1);
  assert.equal(turn('notebook'), 0);
  assert.equal(turn('thinking', false), 1);
  assert.equal(turn('thinking'), 2);
  assert.equal(turn('thinking'), 0);
  assert.equal(turn('notebook'), 1);
});

test('Professor artwork covers every expression including notebook directions', () => {
  const {catalogue} = dialoguePortraitInventory();
  const portraits = catalogue.filter(entry => entry.character === 'professor');
  const counts = Object.groupBy(portraits, entry => entry.mood);
  assert.deepEqual(Object.fromEntries(Object.entries(counts).map(([mood, entries]) => [mood, entries.length])), {
    'self-assured-smirk': 2, skeptical: 2, thinking: 3, condescending: 2, deadpan: 2, notebook: 2
  });
});
