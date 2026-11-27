import assert from 'node:assert/strict';
import {statSync} from 'node:fs';
import test from 'node:test';
import {dialoguePortraitInventory} from '../src/dialogue.mjs';

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
