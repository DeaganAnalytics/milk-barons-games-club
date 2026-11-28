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
