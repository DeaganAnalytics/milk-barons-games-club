import {waiterIds} from '../src/waiters.mjs';
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
  const assets = await evaluate(`(async () => {
    const assets = new Set(performance.getEntriesByType('resource')
      .map(entry => entry.name)
      .filter(url => /[.](png|webp)$/.test(url)));
    await Promise.all([...assets].map(url => {
      const image = new Image();
      image.src = url;
      return image.decode();
    }));
    return [...assets];
  })()`, true);
  for (const id of waiterIds) {
    assert.ok(assets.some(url => url.endsWith('/waiters/' + id + '-walk.webp')));
  }
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
    // Place guards near the player so the dialogue trip is reproducible.
    const spawnRolls = [(443 + 615) / 1920, (582.5 + 1140) / 3101,
      (247 + 615) / 1920, (582.5 + 1140) / 3101];
    // On the waiter interaction route, place the first waiter just north of Pip.
    if (new URLSearchParams(location.search).has('waiter-test')) spawnRolls.push(0.5);
    let randomState = 42;
    Math.random = () => {
      if (spawnRolls.length) return spawnRolls.shift();
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
    window.waiterFrames = new Set();
    CanvasRenderingContext2D.prototype.drawImage = function (source, ...args) {
      if (source instanceof HTMLCanvasElement && source.width === 2070 && source.height === 3425) {
        [window.mapScrollX, window.mapScrollY] = args;
        window.guardDraws = 0;
        window.mapFrames = (window.mapFrames ?? 0) + 1;
        window.guardSteps = [];
      }
      if (source.src?.endsWith('-walk.webp') && source.src.includes('/waiters/')) {
        window.waiterFrames.add(source.src + ':' + args[1] + ':' + args[0]);
      }
      if (source.src?.endsWith('/guards/concealed.webp')) {
        if (args[1] === 0) window.guardDraws++;
        if (args[1] === 142) window.guardSteps.push([this.getTransform().c, args[7]]);
      }
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
  assert.equal(await evaluate(`(() => {
    const reply = document.activeElement;
    const event = new KeyboardEvent('keydown', {code: 'ArrowDown', bubbles: true, cancelable: true});
    reply.dispatchEvent(event);
    return reply.matches('#conversation-replies button') && !event.defaultPrevented
      && reply.getBoundingClientRect().bottom <= innerHeight;
  })()`), true);
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

  await load(1100, 950, false, 'guard-walk');
  assert.equal(await evaluate('window.guardSteps.length'), 0);
  await frames(180);
  const steps = await evaluate('window.guardSteps');
  assert.equal(steps.length, 4);
  for (let i = 0; i < steps.length; i += 2) assert.ok(steps[i][0] * steps[i + 1][0] < 0);
  await frames(9);
  assert.notDeepEqual(await evaluate('window.guardSteps'), steps);

  await load(1100, 950, false, 'guards-start');
  assert.equal(await evaluate('window.guardDraws'), 2);
  await hold('ArrowRight', 85);
  assert.equal(await evaluate('window.guardSteps.length'), 0);
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

  await load(390, 844, true, 'conditional-baron-dialogue');
  const choices = () => evaluate('Array.from(document.querySelectorAll("#conversation-replies button"), button => button.textContent)');
  await evaluate(`(async () => {
    const [{createDialogue}, {createBaron}] = await Promise.all(
      ['./src/dialogue.mjs', './src/baron.mjs'].map(path => import(path)));
    const baron = createBaron();
    window.testBaron = baron;
    window.openTestBaronDialogue = () => createDialogue(baron).open({id: 'baron', title: 'The Milk Baron'});
    baron.completedRugTrips = 2;
    baron.watchedDirections = new Set([0, 1, 2, 3, 4]);
    window.openTestBaronDialogue();
    return true;
  })()`, true);
  assert.ok(!(await choices()).includes('Are you following me?'));
  assert.ok(!(await choices()).includes('Why do you keep watching me?'));
  await closeConversation();
  await evaluate('window.testBaron.completedRugTrips++; window.openTestBaronDialogue()');
  assert.ok(!(await choices()).includes('Why do you keep watching me?'));
  await reply('Are you following me?', 'Following you? Never! I am merely managing my institution.');
  await closeConversation();
  await evaluate('window.testBaron.watchedDirections.add(5); window.openTestBaronDialogue()');
  await reply('Why do you keep watching me?', 'What are you talking about young Pip?');
  await reply('Your eyes never leave me.', 'Pip my boy, I am merely supervising the business.');
  await closeConversation();

  await load(1100, 950, false, 'waiter-roster');
  await frames(480);
  for (const id of waiterIds) {
    for (const row of [0, 160]) {
      assert.ok(await evaluate(`[...window.waiterFrames].filter(frame =>
        frame.includes('/${id}-walk.webp:${row}:')).length >= 2`), id + ' animation row ' + row);
    }
    assert.ok(await evaluate(`(async () => {
      const image = new Image();
      image.src = new URL('./assets/waiters/${id}-portrait.webp', location.href);
      await image.decode();
      return image.naturalWidth > 0;
    })()`, true), id);
  }

  const waiterUrl = new URL(site);
  waiterUrl.searchParams.set('waiter-test', '1');
  await load(1100, 950, false, 'waiter-interaction', waiterUrl.href);
  await hold('ArrowUp', 20);
  await activate('Waiter');
  assert.equal(await evaluate('document.getElementById("conversation-line").textContent'), 'Not now, busy busy busy');
  assert.ok(await evaluate(`getComputedStyle(document.getElementById('conversation-npc'), '::before')
    .backgroundImage.includes('/waiters/male-waiter-portrait.webp')`));
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
