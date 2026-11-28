import assert from 'node:assert/strict';
import {globSync, readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {tokenizer} from 'acorn';

const root = fileURLToPath(new URL('../', import.meta.url));

function findPrefixedPipLines(source) {
  const matches = [];
  const tokens = tokenizer(source, {ecmaVersion: 'latest', sourceType: 'module', locations: true});
  for (const token of tokens) {
    if (!['string', 'template'].includes(token.type.label)) continue;
    if (typeof token.value === 'string' && /(?:^|\n)\s*Pip\s*:/i.test(token.value)) {
      matches.push(token.loc.start.line);
    }
  }
  return matches;
}

test('the Pip dialogue source scan handles strings and template literals, skipping comments', () => {
  assert.deepEqual(findPrefixedPipLines([
    "// 'Pip: this is a comment'",
    "const line = 'Pip: Hello';",
    'const template = `Pip: Hello ${name}`;',
    "const tagged = {speaker: 'Pip', text: 'Hello'};"
  ].join('\n')), [2, 3]);
});

test('game source never embeds Pip speaker labels in dialogue text', () => {
  const files = globSync('src/**/*.{js,mjs}', {cwd: root}).sort();
  assert.ok(files.length, 'No game source files found');
  const violations = files.flatMap(file =>
    findPrefixedPipLines(readFileSync(new URL(file, new URL('../', import.meta.url)), 'utf8'))
      .map(line => file + ':' + line));
  assert.deepEqual(violations, [],
    'Use a response button or tag the scripted line with speaker: Pip so the shared controller can make it a button.');
});

test('new Pip dialogue uses response choices instead of adding speaker-tagged beats', () => {
  // Existing scripted beats are converted to buttons by the shared renderer.
  const existing = {
    'baron-dialogue.mjs': 2, 'brie-curd-dialogue.mjs': 1, 'dialogue.mjs': 2, 'elias.mjs': 1,
    'lin-brie-referral.mjs': 1, 'lin-pool-dialogue.mjs': 1, 'milk-mystic.mjs': 1,
    'mystic-money-dialogue.mjs': 1, 'mystic-single-dialogue.mjs': 1, 'pipe-dialogue.mjs': 1,
    'skim-dialogue.mjs': 1, 'waiter-dialogue.mjs': 3, 'waiter-membership-dialogue.mjs': 1,
    'waiter-name-dialogue.mjs': 5
  };
  const violations = [];
  for (const file of globSync('src/**/*.{js,mjs}', {cwd: root}).sort()) {
    const source = readFileSync(new URL(file, new URL('../', import.meta.url)), 'utf8');
    const tokens = [...tokenizer(source, {ecmaVersion: 'latest', sourceType: 'module', locations: true})];
    const lines = tokens.filter((token, index) =>
      token.value === 'speaker' && tokens[index + 1]?.type.label === ':'
      && tokens[index + 2]?.type.label === 'string' && tokens[index + 2].value === 'Pip')
      .map(token => token.loc.start.line);
    const allowed = existing[file.slice('src/'.length)] ?? 0;
    if (lines.length > allowed) violations.push(
      `${file}: ${lines.length} Pip speaker tags (existing allowance ${allowed}), at lines ${lines.join(', ')}`);
  }
  assert.deepEqual(violations, [], 'Write new Pip lines as selectable responses with the exact spoken text.');
});
