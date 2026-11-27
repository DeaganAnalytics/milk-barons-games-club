import {cpSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

export function stageSite(source, destination, environment, revision) {
  if (!['production', 'development'].includes(environment) || !/^[a-f0-9]{7,40}$/.test(revision ?? '')) {
    throw new Error('Expected a production or development environment and a Git commit identifier');
  }
  mkdirSync(destination, {recursive: true});
  for (const file of ['index.html', 'style.css', 'src', 'assets', '.nojekyll']) {
    cpSync(join(source, file), join(destination, file), {recursive: true});
  }
  const file = join(destination, 'index.html');
  const html = readFileSync(file, 'utf8');
  if (!html.includes('</h1>')) throw new Error('Cannot attach the revision to the game title');
  const label = (environment === 'development' ? 'DEV BUILD · ' : '') + revision.slice(0, 10);
  writeFileSync(file, html.replace('</h1>', ` <small class="game-version" title="${revision}">${label}</small></h1>`));
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  stageSite(...process.argv.slice(2));
}
