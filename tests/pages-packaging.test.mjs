import assert from 'node:assert/strict';
import {mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';

import {stageSite} from '../scripts/stage-site.mjs';

test('Pages packaging keeps production and /dev independent and excludes authoring and test files', t => {
  const dir = mkdtempSync(join(tmpdir(), 'milk-pages-'));
  t.after(() => rmSync(dir, {recursive: true, force: true}));
  const out = join(dir, 'site');
  const source = join(dir, 'source');
  for (const folder of ['src', 'assets', 'creative', 'tests']) mkdirSync(join(source, folder), {recursive: true});
  for (const file of ['style.css', '.nojekyll', 'AGENTS.md']) writeFileSync(join(source, file), '');
  const html = title => `<h1>${title}</h1><script src="./src/main.mjs"></script>`;
  writeFileSync(join(source, 'index.html'), html('Production'));
  stageSite(source, out, 'production', '123456789abc');
  writeFileSync(join(source, 'index.html'), html('Development'));
  stageSite(source, join(out, 'dev'), 'development', 'abcdef123456');
  assert.deepEqual(readdirSync(out).sort(), ['.nojekyll', 'assets', 'dev', 'index.html', 'src', 'style.css']);
  const production = readFileSync(join(out, 'index.html'), 'utf8');
  const development = readFileSync(join(out, 'dev', 'index.html'), 'utf8');
  assert.match(production, /Production.*123456789a/);
  assert.doesNotMatch(production, /DEV BUILD/);
  assert.match(development, /Development.*DEV BUILD · abcdef1234/);
  for (const page of [production, development]) assert.match(page, /src="\.\/src\/main\.mjs"/);
});
