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
  const visibleHeading = heading === 'The club' ? 'heading' : 'conversation-title';
  assert.equal(await evaluate(`document.getElementById('${visibleHeading}').textContent`), heading);
}

async function reply(label, expected) {
  const quoted = JSON.stringify(label);
  assert.equal(await evaluate(`[...document.querySelectorAll('#conversation-replies button')]
    .some(button => { if (button.textContent !== ${quoted}) return false; button.click(); return true; })`), true);
  assert.equal(await evaluate('document.getElementById("conversation-line").textContent'), expected);
}

async function expressions(player, npc) {
  const values = await evaluate(`['player', 'npc'].map(id =>
    document.getElementById('conversation-' + id).dataset.expression)`);
  assert.deepEqual(values, [player, npc]);
}

async function closeConversation() {
  await evaluate('document.getElementById("conversation-close").click()');
  assert.equal(await evaluate('document.getElementById("conversation").hidden'), true);
}

async function load(width, height, mobile, name, url = site) {
  await send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile});
  await send('Emulation.setTouchEmulationEnabled', {enabled: mobile});
  await send('Page.navigate', {url});
  await waitFor('window.hasGameFrame && document.readyState === "complete"');
  const assetCount = await evaluate(`(async () => {
    const assets = new Set(performance.getEntriesByType('resource')
      .map(entry => entry.name)
      .filter(url => /[.](png|webp)$/.test(url)));
    await Promise.all([...assets].map(url => {
      const image = new Image();
      image.src = url;
      return image.decode();
    }));
    return assets.size;
  })()`, true);
  assert.equal(assetCount, 22);
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
    let randomState = 42;
    Math.random = () => {
      randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
      return randomState / 4294967296;
    };
    let callback;
    let timestamp = 0;
    window.requestAnimationFrame = next => {
      callback = next;
      window.hasGameFrame = true;
      return 1;
    };
    const drawImage = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (source, ...args) {
      if (source instanceof HTMLCanvasElement && source.width === 2070 && source.height === 3425) {
        [window.mapScrollX, window.mapScrollY] = args;
        window.guardDraws = 0;
        window.mapFrames = (window.mapFrames ?? 0) + 1;
      }
      if (source.src?.endsWith('/guards/concealed.webp')) window.guardDraws++;
      return drawImage.call(this, source, ...args);
    };
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    window.spokenLines = [];
    CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
      window.spokenLines.push({text, opacity: this.globalAlpha, timestamp});
      return fillText.call(this, text, ...args);
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
  const mapSize = await evaluate(`(() => {
    const map = document.getElementById('game').parentElement.getBoundingClientRect();
    return [map.width, map.height];
  })()`);
  const drawnFrames = await evaluate('window.mapFrames');
  await activate('The Milk Baron');
  assert.equal(await evaluate('document.getElementById("conversation-line").textContent'), 'Welcome, welcome to my establishment!');
  assert.deepEqual(await evaluate(`(() => {
    const portraits = document.querySelector('.conversation-portraits').getBoundingClientRect();
    return [portraits.width, portraits.height];
  })()`), mapSize);
  await hold('ArrowDown', 1800);
  assert.equal(await evaluate('window.mapFrames'), drawnFrames);
  assert.equal(await evaluate('window.spokenLines.length'), 0);
  await reply('Do you own this place?', 'Of course, I own nearly every place.');
  await expressions('thinking', 'laughing');
  await closeConversation();
  await activate('The Milk Baron', true);
  assert.equal(await evaluate('document.getElementById("conversation-line").textContent'), 'Pip! Good to see you!');
  await reply('Why do you have cows for guards?', 'What do you mean?');
  await reply('The guards are cows.', 'I have guards.');
  await expressions('attentive', 'displeased');
  await reply('But the horns?', 'I have guards.');
  await closeConversation();
  await activate('The Milk Baron');
  assert.equal(await evaluate('document.getElementById("conversation-line").textContent'), 'Enjoying your time?');
  await closeConversation();
  assert.equal(await evaluate('window.spokenLines.length'), 0);
  await frames(1800);
  assert.equal(await evaluate('window.spokenLines.some(line => /WELCOME|extremely fair|carpet|oversee every game/.test(line.text))'), true);
  await frames(180);
  assert.equal(await evaluate('window.spokenLines.some(line => line.opacity > 0 && line.opacity < 1)'), true);
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
  await closeConversation();

  await load(1100, 950, false, 'guards-start');
  assert.equal(await evaluate('window.guardDraws'), 2);
  await hold('ArrowRight', 85);
  const approachedGuard = await evaluate('window.mapScrollX - 345');
  assert.ok(approachedGuard >= 415 && approachedGuard <= 420);
  await frames(150);
  assert.equal(await evaluate('window.mapScrollX - 345'), approachedGuard);
  assert.equal(await evaluate('window.guardDraws'), 2);
  if (process.env.SCREENSHOT_PREFIX) {
    const shot = await send('Page.captureScreenshot', {format: 'png'});
    await writeFile(`${process.env.SCREENSHOT_PREFIX}-guard-approach.png`, Buffer.from(shot.data, 'base64'));
  }

  await activate('Bull Guard');
  assert.equal(await evaluate('document.getElementById("conversation-line").textContent'),
    'Do you have a problem to report? Otherwise get out of my way.');
  if (process.env.SCREENSHOT_PREFIX) {
    await evaluate(`(() => { const image = new Image(); image.src = './assets/dialogue/portraits.webp'; return image.decode(); })()`, true);
    const shot = await send('Page.captureScreenshot', {format: 'png'});
    await writeFile(`${process.env.SCREENSHOT_PREFIX}-guard-dialogue.png`, Buffer.from(shot.data, 'base64'));
  }
  await reply('Are you a cow?', 'I am a guard.');
  await reply('But you have horns.', 'I am a guard.');
  await expressions('thinking', 'deadpan');
  await closeConversation();
  await activate('Bull Guard');
  await reply("No I don't have anything to report.", 'Then get out of my way!');
  await expressions('attentive', 'speaking');
  await closeConversation();
  await activate('Bull Guard');
  await reply('Ah yes, I do.', 'What is the problem.');
  await expressions('happy', 'suspicious');
  await reply('Actually nevermind.', '...');
  await expressions('thinking', 'deadpan');
  await closeConversation();

  await load(1100, 950, false, 'expanded-center');
  await hold('ArrowDown', 50);
  await hold('ArrowLeft', 600);
  await hold('ArrowUp', 1200);
  assert.deepEqual(await evaluate('[window.mapScrollX, window.mapScrollY]'), [0, 0]);
  await hold('ArrowDown', 1900);
  assert.deepEqual(await evaluate('[window.mapScrollX, window.mapScrollY]'), [0, 2740]);
  await hold('ArrowRight', 1200);
  assert.deepEqual(await evaluate('[window.mapScrollX, window.mapScrollY]'), [1380, 2740]);
  if (process.env.SCREENSHOT_PREFIX) {
    const shot = await send('Page.captureScreenshot', {format: 'png'});
    await writeFile(`${process.env.SCREENSHOT_PREFIX}-southeast.png`, Buffer.from(shot.data, 'base64'));
  }
  await hold('ArrowUp', 1900);
  assert.deepEqual(await evaluate('[window.mapScrollX, window.mapScrollY]'), [1380, 0]);
  if (process.env.SCREENSHOT_PREFIX) {
    const shot = await send('Page.captureScreenshot', {format: 'png'});
    await writeFile(`${process.env.SCREENSHOT_PREFIX}-northeast.png`, Buffer.from(shot.data, 'base64'));
  }

  await load(390, 844, true, 'milo-dialogue');
  await evaluate(`(async () => {
    const [{createDialogue}, {createMilo}, {createBaron}, {nearestInteraction}] = await Promise.all(
      ['./src/dialogue.mjs', './src/milo.mjs', './src/baron.mjs', './src/room.mjs'].map(path => import(path)));
    const milo = createMilo();
    createDialogue().open(nearestInteraction(milo, createBaron(), milo));
    return true;
  })()`, true);
  assert.equal(await evaluate('document.getElementById("conversation-line").textContent'),
    'Shh! I’m trying to stay out of the Baron’s way.');
  await reply("Hey, don't I know you?", "No. Don't talk to me.");
  await reply('Are you Milo, the milk activist.', 'Please leave me alone. Please go away, your presence attracts the Baron.');
  await expressions('thinking', 'sad');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await closeConversation();

  const plankUrl = new URL(site);
  plankUrl.searchParams.set('floor', 'planks');
  await load(1100, 950, false, 'wide-plank', plankUrl.href);
  assert.equal(await evaluate('performance.getEntriesByType("resource").some(entry => entry.name.endsWith("/wide-plank.webp"))'), true);
  assert.deepEqual(errors, [], JSON.stringify(errors));
  console.log('Passed desktop and mobile layout, sprite loading, keyboard and touch movement, Baron interaction, movement to all four map corners, and fading Baron speech.');
} finally {
  socket.close();
}
