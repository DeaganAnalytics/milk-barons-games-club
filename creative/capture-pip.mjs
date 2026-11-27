import {setTimeout as delay} from 'node:timers/promises';
import {connectChrome} from '../scripts/chrome-session.mjs';

const [debuggerUrl, page, expected] = process.argv.slice(2);
const browser = await connectChrome(debuggerUrl);
try {
  await browser.send('Page.navigate', {url: page});
  let captures = [];
  for (let attempt = 0; attempt < 80 && captures.length < Number(expected); attempt++) {
    await delay(100);
    captures = await browser.evaluate('Array.from(document.images, image => [image.id, image.src])');
  }
  if (captures.length !== Number(expected)) throw new Error('Could not render every Pip capture');
  process.stdout.write(JSON.stringify(captures));
} finally {
  browser.close();
}
