import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';

const site = process.env.GAME_URL ?? 'http://localhost:8000/';
const debuggerUrl = process.env.CHROME_DEBUG_URL ?? 'http://localhost:9227';
const tabs = await (await fetch(new URL('/json/list', debuggerUrl))).json();
const socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, {once: true});
  socket.addEventListener('error', reject, {once: true});
});

let id = 0;
const pending = new Map();
const errors = [];
socket.addEventListener('message', ({data}) => {
  const message = JSON.parse(data);
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
  if (!message.id) return;
  pending.get(message.id)(message);
  pending.delete(message.id);
});

async function send(method, params = {}) {
  const reply = await new Promise(resolve => {
    pending.set(++id, resolve);
    socket.send(JSON.stringify({id, method, params}));
  });
  assert.equal(reply.error, undefined, JSON.stringify(reply.error));
  return reply.result;
}

async function evaluate(expression, awaitPromise = false) {
  const reply = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise});
  assert.equal(reply.exceptionDetails, undefined, JSON.stringify(reply.exceptionDetails));
  return reply.result.value;
}

async function waitFor(expression) {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  assert.fail('Timed out waiting for ' + expression);
}

async function frames(count) {
  await evaluate(`window.advanceFrames(${count})`);
}

async function key(type, code, label = code) {
  await send('Input.dispatchKeyEvent', {type, code, key: label});
}

async function hold(code, count) {
  await key('keyDown', code);
  await frames(count);
  await key('keyUp', code);
  await frames(1);
}

async function activate(heading, withButton = false) {
  if (withButton) {
    await evaluate('document.getElementById("interact").focus()');
    await key('keyDown', 'Space', ' ');
    await key('keyUp', 'Space', ' ');
  } else {
    await key('keyDown', 'KeyE', 'e');
    await key('keyUp', 'KeyE', 'e');
  }
  assert.equal(await evaluate('document.getElementById("heading").textContent'), heading);
}

async function load(width, height, mobile, name) {
  await send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile});
  await send('Emulation.setTouchEmulationEnabled', {enabled: mobile});
  await send('Page.navigate', {url: site});
  await waitFor('window.hasGameFrame && document.readyState === "complete"');
  const assetCount = await evaluate(`(async () => {
    const assets = new Set(performance.getEntriesByType('resource')
      .map(entry => entry.name)
      .filter(url => url.endsWith('.png')));
    await Promise.all([...assets].map(url => {
      const image = new Image();
      image.src = url;
      return image.decode();
    }));
    return assets.size;
  })()`, true);
  assert.equal(assetCount, 11);
  await frames(1);
  if (process.env.SCREENSHOT_PREFIX) {
    const shot = await send('Page.captureScreenshot', {format: 'png'});
    await writeFile(`${process.env.SCREENSHOT_PREFIX}-${name}.png`, Buffer.from(shot.data, 'base64'));
  }
}

try {
  await send('Page.enable');
  await send('Runtime.enable');
  // Drive the same game loop at 60 Hz without depending on key hold durations.
  await send('Page.addScriptToEvaluateOnNewDocument', {source: `
    let callback;
    let timestamp = 0;
    window.requestAnimationFrame = next => {
      callback = next;
      window.hasGameFrame = true;
      return 1;
    };
    window.advanceFrames = count => {
      for (let i = 0; i < count; i++) callback(timestamp += 1000 / 60);
    };
  `});

  await load(1100, 950, false, 'desktop');
  await activate('The club');
  await key('keyDown', 'ArrowUp');
  await key('keyDown', 'KeyW', 'w');
  await key('keyUp', 'KeyW', 'w');
  await frames(100);
  await key('keyUp', 'ArrowUp');
  await activate('The Milk Baron');
  await activate('The Milk Baron', true);
  assert.match(await evaluate('document.getElementById("info").textContent'), /extremely fair/);
  await hold('ArrowLeft', 96);
  await activate('Card table');
  await hold('ArrowRight', 195);
  await activate('Dice table');

  await load(390, 844, true, 'mobile');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth && document.querySelector(".controls").getBoundingClientRect().bottom <= innerHeight'), true);
  const point = await evaluate(`(() => {
    const rect = document.querySelector('[data-dir=up]').getBoundingClientRect();
    return {x: rect.x + rect.width / 2, y: rect.y + rect.height / 2};
  })()`);
  await send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [point]});
  assert.equal(await evaluate('document.querySelector(".pressed")?.dataset.dir'), 'up');
  await frames(100);
  await send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
  assert.equal(await evaluate('document.querySelector(".pressed") === null'), true);
  await activate('The Milk Baron');

  await load(1100, 950, false, 'cashier');
  await hold('ArrowUp', 62);
  await hold('ArrowLeft', 96);
  await activate('Cashier');
  assert.deepEqual(errors, [], JSON.stringify(errors));
  console.log('Passed desktop and mobile layout, sprite loading, keyboard and touch movement, and all interactions.');
} finally {
  socket.close();
}
