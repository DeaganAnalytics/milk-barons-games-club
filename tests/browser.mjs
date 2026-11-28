import {installPipDialogueCheck} from './pip-dialogue-check.mjs';
import {clubSightLines} from '../src/club-sight-lines.mjs';
import {milkCalls} from '../src/milk-service.mjs';
import {staffIds} from '../src/staff.mjs';
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
  if (heading === null) {
    assert.equal(await evaluate("document.getElementById('conversation').hidden"), true);
    assert.equal(await evaluate("document.getElementById('heading')"), null);
  } else {
    assert.equal(await evaluate("document.getElementById('conversation').hidden"), false,
      `Expected ${heading} dialogue to open`);
    assert.equal(await evaluate("document.getElementById('conversation-title').textContent"), heading);
  }
}

async function reply(label, expected) {
  const quoted = JSON.stringify(label);
  assert.equal(await evaluate(`[...document.querySelectorAll('#conversation-replies button, #conversation-advance button')]
    .some(button => { if (button.textContent !== (${quoted} === 'Continue' ? 'Continue →' : ${quoted})) return false; button.click(); return true; })`), true, 'Missing dialogue choice: ' + label);
  assert.equal(await evaluate('document.getElementById("conversation-line").textContent'), expected);
}

async function expressions(player, npc) {
  const values = await evaluate(`['player', 'npc'].map(id =>
    document.getElementById('conversation-' + id).dataset.expression)`);
  assert.deepEqual([values[0].split(':')[0], values[1]], [player, npc]);
  assert.ok(await evaluate(`(() => {
    const canvas = document.querySelector('#conversation-player canvas');
    const ctx = canvas.getContext('2d');
    return canvas.width === 512 && canvas.height === 512
      && ctx.getImageData(256, 175, 1, 1).data[3] === 255;
  })()`));
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
  await frames(65);
  assert.equal(await evaluate('document.querySelector("#conversation-title").textContent'), 'Elias');
  assert.equal(await evaluate('document.querySelector("#coin-counter").hidden'), true);
  const introductoryChoices = ['Where am I?', 'Someone has to stand up for the working class!', 'A HUNDRED MILK TOKENS?!',
    'What sort of game?', "Wait. You're giving me money because I owe you money?", "THAT'S SLAVERY!"];
  assert.equal(await evaluate('document.querySelector("#conversation-player").dataset.expression.split(":")[0]'), 'attentive');
  for (const label of introductoryChoices) {
    for (let count = 0; count < 4 && await evaluate('Boolean(document.querySelector("#conversation-advance button"))'); count++) {
      await evaluate('document.querySelector("#conversation-advance button").click()');
    }
    assert.ok(await evaluate(`[...document.querySelectorAll('#conversation-replies button')].some(button => {
      if (button.textContent !== ${JSON.stringify(label)}) return false;
      button.click();
      return true;
    })`), 'Missing introductory choice: ' + label);
  }
  for (let count = 0; count < 4 && await evaluate('Boolean(document.querySelector("#conversation-advance button"))'); count++) {
    await evaluate('document.querySelector("#conversation-advance button").click()');
  }
  assert.equal(await evaluate('document.querySelector("#conversation-line").textContent'), 'Now, Master Pip, do you have any questions?');
  if (name === 'desktop') {
    await reply("I didn't do it!", 'Zat is not a question.');
    await reply('Continue', 'Now, Master Pip, do you have any questions?');
    await reply('How did I get here?', 'Ah... one of ze great secrets of ze universe.');
    await reply('Continue', 'Now, Master Pip, do you have any questions?');
    await reply('What is this place?', 'Ah! I am delighted you asked.');
    await reply('Continue', "It is ze Baron's pride and joy. A place vere ze finest members of ze Milk Aristocracy come to mingle, to vheel and deal.");
    await reply('Continue', 'A house of amusement, of profligate pleasure, of economic efficiency and, above all... profitability.');
    await reply('I thought the Milk Baron made his money from milk?', 'Da! But he keeps his fortune by selling pleasure and amusement!');
    await reply('Continue', 'Now, Master Pip, do you have any questions?');
    await reply('How do I double my money?', 'As an aspiring capitalist, I am sure you vill figure it out. Zis establishment offers many delightful games through vich you may multiply your fortune.');
    await reply('Continue', 'Now, Master Pip, do you have any questions?');
    const remaining = await evaluate('Array.from(document.querySelectorAll("#conversation-replies button"), button => button.textContent)');
    assert.deepEqual(remaining, ['Are those guards cows?', 'Can I just leave?', 'Does my family know where I am?', 'I have no more questions.']);
  }
  await reply('I have no more questions.', 'Vonderful. I vish you a most profitable evening, Master Pip.');
  assert.equal(await evaluate('document.querySelector("#coin-counter").hidden'), true);
  await closeConversation();
  assert.equal(await evaluate('document.querySelector("#coin-counter").hidden'), false);

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
  for (const id of staffIds) {
    assert.ok(assets.some(url => url.endsWith('/waiters/' + id + '-walk.webp')));
  }
  await frames(1);
  // The Baron routes need the roaming Mystic to clear the path.
  if (name === 'desktop' || name === 'mobile') await frames(240);
  const departing = `(async () => Boolean((await import(
    new URL('./src/elias.mjs', document.baseURI))).elias.departureSpeech))()`;
  for (let attempt = 0; attempt < 60 && await evaluate(departing, true); attempt++) {
    await frames(6);
  }
  assert.equal(await evaluate(departing, true), false, "Elias's departure should finish before movement");
  // Later assertions measure ambient speech after the opening cutscene.
  await evaluate("window.spokenLines.length = 0");
  if (process.env.SCREENSHOT_PREFIX) {
    const shot = await send('Page.captureScreenshot', {format: 'png'});
    await writeFile(`${process.env.SCREENSHOT_PREFIX}-${name}.png`, Buffer.from(shot.data, 'base64'));
  }
}

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await installPipDialogueCheck(send);
  // Drive the same game loop at 60 Hz without depending on key hold durations.
  await send('Page.addScriptToEvaluateOnNewDocument', {source: `
    // The complete asset roster now exceeds Chromium’s default 250-entry buffer.
    performance.setResourceTimingBufferSize(2000);
    // Place guards near the player so the dialogue trip is reproducible.
    const spawnRolls = [(443 + 615) / 1920, (582.5 + 1140) / 3101,
      (247 + 615) / 1920, (582.5 + 1140) / 3101];
    // On the waiter interaction route, place the first waiter just north of Pip.
    const scenario = new URLSearchParams(location.search);
    if (scenario.has('waiter-test')) spawnRolls.push(0.5);
    if (scenario.has('cleaner-test')) spawnRolls.push(0, 0, 0, 0, 0, 0, 0.15);
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
    window.staffFrames = new Set();
    window.creameryDraws = new Set();
    window.creameryIdle = {};
    window.milkTrace = {baron: null, empty: new Set(), shards: false, glass: false, armPose: false, duplicatePose: false, poseFrame: -1};
    CanvasRenderingContext2D.prototype.drawImage = function (source, ...args) {
      if (source.src?.endsWith('/guards/rifle.webp') || source.src?.includes('/hall/creamery-')) {
        window.creameryDraws.add(source.src);
      }
      if (source.src?.endsWith('/hall/creamery-bartender-idle.webp')) {
        window.creameryIdle.bartender = [args[3], args[1] + args[3]];
      }
      if (source.src?.endsWith('/guards/rifle.webp')) {
        const {c, d, e, f} = this.getTransform();
        window.creameryIdle.guard = [c, d, e + 2 * c, f + 2 * d];
      }
      if (source instanceof HTMLCanvasElement && source.width === 2070 && source.height === 3425) {
        [window.mapScrollX, window.mapScrollY] = args;
        window.guardDraws = 0;
        window.mapFrames = (window.mapFrames ?? 0) + 1;
        window.guardSteps = [];
      }
      if (source.src?.includes('/assets/baron-milk-') && args.length === 4) {
        window.milkTrace.duplicatePose ||= window.milkTrace.poseFrame === timestamp;
        window.milkTrace.poseFrame = timestamp;
        window.milkTrace.armPose = true;
      }
      if (source.src?.includes('/assets/baron-') && source.src?.endsWith('.png') && args.length === 4) {
        window.milkTrace.duplicatePose ||= window.milkTrace.poseFrame === timestamp;
        window.milkTrace.poseFrame = timestamp;
        window.milkTrace.baron = [source.src.split('/').pop(), args[0], args[1] + args[3]];
      }
      if (source.src?.endsWith('-empty.webp')) window.milkTrace.empty.add(source.src);
      if (source.src?.endsWith('-walk.webp') && source.src.includes('/waiters/')) {
        window.staffFrames.add(source.src + ':' + args[1] / args[3] + ':' + args[0] / args[2]);
      }
      if (source.src?.endsWith('/guards/concealed.webp')) {
        if (args[1] === 0) window.guardDraws++;
        if (args[1] === 142) window.guardSteps.push([this.getTransform().c, args[7]]);
      }
      return drawImage.call(this, source, ...args);
    };
    const fill = CanvasRenderingContext2D.prototype.fill;
    CanvasRenderingContext2D.prototype.fill = function (...args) {
      if (this.fillStyle === '#a7c1c5') window.milkTrace.shards = true;
      if (this.fillStyle === '#c4d0cf') window.milkTrace.glass = true;
      return fill.call(this, ...args);
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
  await activate(null);
  await key('keyDown', 'ArrowUp');
  await key('keyDown', 'KeyW', 'w');
  await key('keyUp', 'KeyW', 'w');
  await frames(100);
  await key('keyUp', 'ArrowUp');
  const mapSize = await evaluate(`(() => {
    const canvas = document.getElementById('game');
    const hud = canvas.previousElementSibling.getBoundingClientRect();
    const map = canvas.parentElement.getBoundingClientRect();
    return {width: map.width, playHeight: map.height - hud.height, canvasTop: canvas.getBoundingClientRect().top, hudBottom: hud.bottom};
  })()`);
  assert.ok(Math.abs(mapSize.canvasTop - mapSize.hudBottom) < 1);
  const drawnFrames = await evaluate('window.mapFrames');
  await activate('The Milk Baron');
  assert.equal(await evaluate('document.getElementById("conversation-line").textContent'), 'Welcome, welcome to my establishment!');
  const portraitSize = await evaluate(`(() => {
    const portraits = document.querySelector('.conversation-portraits').getBoundingClientRect();
    return {width: portraits.width, height: portraits.height};
  })()`);
  assert.equal(portraitSize.width, mapSize.width);
  assert.ok(Math.abs(portraitSize.height - mapSize.playHeight) < 1);
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
  assert.ok(await evaluate(`Math.abs(document.querySelector('.game-hud').getBoundingClientRect().bottom
    - document.getElementById('game').getBoundingClientRect().top) < 1`));
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

  await load(412, 915, true, 'pixel-8a-club-text');
  assert.ok(await evaluate(`(() => {
    const canvas = document.getElementById('game');
    const playfield = canvas.parentElement.getBoundingClientRect();
    const available = document.querySelector('.shell').getBoundingClientRect().width;
    return playfield.width <= available * 0.96 + 1
      && Math.abs(canvas.clientHeight - canvas.clientWidth * 1370 / 1380) < 1;
  })()`));
  const wrapping = await evaluate(`(() => {
    const info = document.getElementById('info');
    const sample = info.cloneNode();
    sample.removeAttribute('id');
    sample.style.visibility = 'hidden';
    info.after(sample);
    try {
      const range = document.createRange();
      return ${JSON.stringify(clubSightLines)}.map(([key, text]) => {
        sample.textContent = text;
        range.selectNodeContents(sample);
        const lines = new Set(Array.from(range.getClientRects(), rect => rect.top));
        return [key, lines.size];
      });
    } finally {
      sample.remove();
    }
  })()`);
  for (const [key, lines] of wrapping) {
    assert.ok(lines > 0 && lines <= 3, `Club notice "${key}" wraps to ${lines} lines at 412px`);
  }

  const karmaPositions = await evaluate(`(async () => {
    const {karma} = await import('./src/main.mjs');
    const meter = document.getElementById('karma-meter');
    const marker = meter.querySelector('.karma-marker');
    return [0, -10, -5, -0.5, -0.25, 0, 2.5, 5, 10].map(score => {
      karma.change(score - karma.score);
      const bar = meter.getBoundingClientRect();
      const dot = marker.getBoundingClientRect();
      return {
        score, accessibleScore: Number(meter.getAttribute('aria-valuenow')),
        left: (dot.left + dot.width / 2 - bar.left) / bar.width
      };
    });
  })()`, true);
  for (const {score, accessibleScore, left} of karmaPositions) {
    assert.equal(accessibleScore, score);
    // These are the positions of the first and last ticks in the artwork.
    const expected = 0.237 + 0.526 * (score + 10) / 20;
    assert.ok(Math.abs(left - expected) < 0.005, `Karma marker at ${score}: ${left}`);
  }

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
    'Do you have a problem to report? Otherwise, get out of my way.');
  if (process.env.SCREENSHOT_PREFIX) {
    await evaluate(`(() => { const image = new Image(); image.src = './assets/dialogue/portraits.webp'; return image.decode(); })()`, true);
    const shot = await send('Page.captureScreenshot', {format: 'png'});
    await writeFile(`${process.env.SCREENSHOT_PREFIX}-guard-dialogue.png`, Buffer.from(shot.data, 'base64'));
  }
  await reply('Are you a cow?', 'I am a guard.');
  await reply('But you have horns.', 'I am a guard.');
  // The greeting and first reply are deadpan. The third consecutive beat rotates to speaking.
  await expressions('thinking', 'speaking');
  await closeConversation();
  await activate('Bull Guard');
  await reply("No, I don't have anything to report.", 'Then get out of my way!');
  await expressions('attentive', 'speaking');
  await closeConversation();
  await activate('Bull Guard');
  assert.equal(await evaluate("[...document.querySelectorAll('#conversation-replies button')].some(button => button.textContent === 'Yes I do.')"), false);
  await closeConversation();

  await load(1100, 950, false, 'expanded-center');
  await hold('ArrowDown', 50);
  await hold('ArrowLeft', 600);
  await hold('ArrowUp', 1200);
  assert.deepEqual(await evaluate('[window.mapScrollX, window.mapScrollY]'), [0, 0]);
  assert.ok(await evaluate(`['creamery-hatch.webp', 'creamery-sign.webp', 'rifle.webp'].every(name =>
    [...window.creameryDraws].some(url => url.endsWith('/' + name)))`));
  const firstIdle = await evaluate('window.creameryIdle');
  await frames(31);
  const secondIdle = await evaluate('window.creameryIdle');
  assert.notEqual(firstIdle.bartender[0], secondIdle.bartender[0]);
  assert.ok(Math.abs(firstIdle.bartender[1] - secondIdle.bartender[1]) < 1e-8);
  assert.notDeepEqual(firstIdle.guard.slice(0, 2), secondIdle.guard.slice(0, 2));
  for (const index of [2, 3]) assert.ok(Math.abs(firstIdle.guard[index] - secondIdle.guard[index]) < 1e-8);
  await hold('ArrowRight', 73);
  if (process.env.SCREENSHOT_PREFIX) {
    const shot = await send('Page.captureScreenshot', {format: 'png'});
    await writeFile(`${process.env.SCREENSHOT_PREFIX}-creamery.png`, Buffer.from(shot.data, 'base64'));
  }
  await activate('The Bartender');
  assert.equal(await evaluate("document.querySelectorAll('#conversation-replies button').length"), 6);
  assert.equal(await evaluate('document.getElementById("conversation-line").textContent'), "What'll it be? Milk?");
  assert.ok(await evaluate(`getComputedStyle(document.getElementById('conversation-npc'),'::before')
    .backgroundImage.includes('/dialogue/bartender/polite.webp')`));
  if (process.env.SCREENSHOT_PREFIX) {
    const shot = await send('Page.captureScreenshot', {format: 'png'});
    await writeFile(`${process.env.SCREENSHOT_PREFIX}-bartender.png`, Buffer.from(shot.data, 'base64'));
  }
  await evaluate('document.getElementById("conversation-close").click()');
  await reply('What?', 'AHEM!');
  await reply('Continue', 'He vants a tip.');
  await expressions('attentive', 'insulted');
  await reply("A tip? He didn't do anything!", "He spoke to a peasant, didn't he? Pay up or I'll shoot.");
  await reply('Can I buy a drink instead?', 'Of course, sir.');
  await reply('Continue', 'Certainly, sir. What will it be?');
  const beforeDrink = Number(await evaluate('document.getElementById("coin-count").textContent'));
  await reply('A glass of whole milk, please.', '(Pip drinks the milk.) An excellent choice, sir. A timeless classic.');
  assert.equal(Number(await evaluate('document.getElementById("coin-count").textContent')), beforeDrink - 3);
  await closeConversation();
  // Step below the bartender's collider before crossing to the posted guard.
  await hold('ArrowDown', 14);
  await hold('ArrowRight', 36);
  await activate('Bull Guard');
  const postedGreeting = 'If you have something to report, find one of the roving security officers';
  assert.equal(await evaluate('document.getElementById("conversation-line").textContent'), postedGreeting);
  await expressions('attentive', 'formal');
  await reply('Why do you have an assault rifle?', 'To guard the milk.');
  await expressions('thinking', 'speaking');
  await closeConversation();
  await activate('Bull Guard');
  await reply('Are you a cow?', 'I am a guard.');
  await expressions('thinking', 'suspicious');
  await reply('But you have horns.', 'I am a guard.');
  await expressions('thinking', 'angry');
  await closeConversation();
  await activate('Bull Guard');
  await reply('You look parched. Can I buy you a drink?', 'Oi! Wait, for real?');
  await reply('Psych! Just kidding!', '(The guard strikes Pip with the butt of his rifle.) Plough off.');
  await closeConversation();
  await activate('Bull Guard');
  assert.equal(await evaluate('document.getElementById("conversation-line").textContent'), 'Come to apologise?');
  const beforeApology = Number(await evaluate('document.getElementById("coin-count").textContent'));
  await reply('Yes.', "Great. That'll be ₥10 for wasting my time.");
  assert.equal(Number(await evaluate('document.getElementById("coin-count").textContent')), beforeApology - 10);
  await closeConversation();
  assert.equal(Number(await evaluate('document.getElementById("coin-count").textContent')), beforeApology - 10);
  await activate('Bull Guard');
  assert.equal(await evaluate('document.getElementById("conversation-line").textContent'), postedGreeting);
  await closeConversation();
  await hold('ArrowLeft', 170);
  await hold('ArrowDown', 1900);
  // Back up before crossing the approach to the occupied slot seats.
  await hold('ArrowUp', 30);
  await hold('ArrowRight', 65);
  await hold('ArrowDown', 510);
  await hold('ArrowLeft', 65);
  assert.deepEqual(await evaluate('[window.mapScrollX, window.mapScrollY]'), [0, 2740]);
  assert.deepEqual(await evaluate(`(() => {
    const original = CanvasRenderingContext2D.prototype.drawImage;
    const guests = [];
    CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
      if (image.src?.includes('/assets/guests/')) {
        const {e, f} = this.getTransform();
        guests.push([image.src.split('/').pop(), args[3], e, f]);
      }
      return original.call(this, image, ...args);
    };
    try { window.advanceFrames(1); }
    finally { CanvasRenderingContext2D.prototype.drawImage = original; }
    return guests.map(([file, height, x, y]) => [file, height, Math.round(x / 2), Math.round(y / 2)]);
  })()`), [['plum.webp', 66, 147, 603], ['emerald.webp', 66, 206, 603]]);
  if (process.env.SCREENSHOT_PREFIX) {
    const shot = await send('Page.captureScreenshot', {format: 'png'});
    await writeFile(`${process.env.SCREENSHOT_PREFIX}-southwest.png`, Buffer.from(shot.data, 'base64'));
  }
  await hold('ArrowRight', 1200);
  assert.deepEqual(await evaluate('[window.mapScrollX, window.mapScrollY]'), [1380, 2740]);
  if (process.env.SCREENSHOT_PREFIX) {
    const shot = await send('Page.captureScreenshot', {format: 'png'});
    await writeFile(`${process.env.SCREENSHOT_PREFIX}-southeast.png`, Buffer.from(shot.data, 'base64'));
  }
  // Go around the live firing lanes before following the east wall north.
  await hold('ArrowLeft', 175);
  await hold('ArrowUp', 180);
  await hold('ArrowRight', 175);
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
    "Shh! I'm trying to stay out of the Baron's way.");
  await reply("Hey, don't I know you?", "No. Don't talk to me.");
  await reply('Are you Milo, the milk activist?', 'Please leave me alone. Please go away. Your presence attracts the Baron.');
  await expressions('thinking', 'sad');
  await reply('You ARE Milo!', '...');
  await reply('Continue', 'Okay, okay. Keep your voice down.');
  await reply("You're the reason I became an activist.", 'I apologise.');
  await reply("Apologise? Why? You're my hero!", "And now I'm nobody.");
  await expressions('sorry', 'sad');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await closeConversation();

  await load(390, 844, true, 'cow-guard-dialogue-unlock');
  const cowGuardOptions = await evaluate(`(async () => {
    const [{createDialogue}, {createBaron}] = await Promise.all(
      ['./src/dialogue.mjs', './src/baron.mjs'].map(path => import(path)));
    let seen = false;
    const dialogue = createDialogue(createBaron(), {hasSeenCowGuard: () => seen});
    const results = [];
    for (const [id, posted, question] of [
      ['baron', false, 'Why do you have cows for guards?'],
      ['elias', false, 'Why are the guards cows?'],
      ['professor', false, 'You seem like a smart man. Why are the guards cows?'],
      ['pillory-attendant', false, 'Why are the guards cows?'],
      ['pillory-commissioner', false, 'Am I crazy, or are the guards cows?'],
      ['guard', false, 'Are you a cow?'],
      ['guard', true, 'Are you a cow?']
    ]) {
      const target = {id, title: id, posted};
      dialogue.open(target);
      dialogue.dismiss(); // Skip any first-meeting introduction.
      for (const visible of [false, true]) {
        seen = visible;
        dialogue.open(target);
        const offered = Array.from(document.querySelectorAll('#conversation-replies button'))
          .some(button => button.textContent === question);
        results.push({id, posted, visible, offered});
        dialogue.dismiss();
      }
    }
    return results;
  })()`, true);
  for (const {id, posted, visible, offered} of cowGuardOptions) {
    assert.equal(offered, visible, `Cow guard question for ${id} (posted: ${posted})`);
  }

  const garlicUnlock = await evaluate(`(async () => {
    const {createDialogue} = await import('./src/dialogue.mjs');
    const dialogue = createDialogue();
    const bartender = {id: 'creamery-bartender', title: 'The Bartender'};
    const buttons = () => Array.from(document.querySelectorAll('#conversation-replies button'));
    const offered = () => buttons().some(button => button.textContent === 'Do you have any garlic-flavoured milk?');
    dialogue.open(bartender);
    const before = offered();
    dialogue.dismiss();
    dialogue.open({id: 'elias', title: 'Elias'});
    buttons().find(button => button.textContent === 'Are you a vampire?').click();
    dialogue.dismiss();
    dialogue.open(bartender);
    const after = offered();
    dialogue.dismiss();
    return [before, after];
  })()`, true);
  assert.deepEqual(garlicUnlock, [false, true]);

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
  const portraits = ['assets/dialogue/portraits.webp', ...staffIds.flatMap(id => {
    const stem = 'assets/waiters/' + id;
    return id === 'edmund-vale'
      ? [stem + '-portrait.webp']
      : [stem + '-portrait.webp', stem + '-empty-portrait.webp'];
  })];
  await waitFor(`${JSON.stringify(portraits)}.every(path =>
    performance.getEntriesByName(new URL(path, location.href).href).length > 0)`);

  await frames(480);
  for (const id of staffIds) {
    for (const row of [0, 1]) {
      assert.ok(await evaluate(`[...window.staffFrames].filter(frame =>
        frame.includes('/${id}-walk.webp:${row}:')
        || ('${id}' === 'edmund-vale' && ${row} === 0
          && frame.includes('/edmund-vale-vertical-walk.webp:'))).length >= 2`), id + ' animation row ' + row);
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
  await activate('Waiter Feta');
  assert.equal(await evaluate('document.getElementById("conversation-line").textContent'), 'Good evening. How may I assist you?');
  assert.ok(await evaluate(`getComputedStyle(document.getElementById('conversation-npc'), '::before')
    .backgroundImage.includes('/dialogue/expressions/male-waiter-welcoming.webp')`));
  const coinsBeforeMilk = Number(await evaluate('document.getElementById("coin-count").textContent'));
  await reply('Could I have a glass of milk, please?', "Certainly, sir. That'll be ₥2.");
  await reply('Yes, please.', 'Here you are, sir. Enjoy!');
  assert.equal(Number(await evaluate('document.getElementById("coin-count").textContent')), coinsBeforeMilk - 2);
  await closeConversation();
  await activate('Waiter Feta');
  assert.equal(await evaluate('document.getElementById("conversation-line").textContent'), 'Not now! Busy, busy, busy!');
  assert.equal(await evaluate('document.querySelectorAll("#conversation-replies button").length'), 0);
  await closeConversation();

  const cleanerUrl = new URL(site);
  cleanerUrl.searchParams.set('cleaner-test', '1');
  await load(1100, 950, false, 'cleaner', cleanerUrl.href);
  await hold('ArrowUp', 20);
  await activate('Edmund Skim');
  assert.ok(await evaluate(`[...document.querySelectorAll('#conversation-replies button')].some(button => button.textContent === 'Hey, I recognise you!')`));
  assert.ok(await evaluate(`getComputedStyle(document.getElementById('conversation-npc'), '::before')
    .backgroundImage.includes('/waiters/edmund-vale-portrait.webp')`));
  if (process.env.SCREENSHOT_PREFIX) {
    const shot = await send('Page.captureScreenshot', {format: 'png'});
    await writeFile(`${process.env.SCREENSHOT_PREFIX}-cleaner-dialogue.png`, Buffer.from(shot.data, 'base64'));
  }
  await closeConversation();

  await load(1100, 950, false, 'milk-service');
  const callCount = () => evaluate(`(() => {
    const byFrame = new Map();
    for (const {text, timestamp} of window.spokenLines) {
      byFrame.set(timestamp, [...(byFrame.get(timestamp) ?? []), text]);
    }
    return [...byFrame.values()].filter(lines => ${JSON.stringify(milkCalls)}.includes(lines.join(' '))).length;
  })()`);
  await frames(2600);
  assert.equal(await callCount(), 0);
  await frames(110);
  assert.ok(await callCount() > 0);
  const lockedPose = await evaluate('window.milkTrace.baron');
  assert.equal(lockedPose[0], 'baron-0.png');
  await hold('ArrowUp', 84);
  const pose = await evaluate('window.milkTrace.baron');
  assert.deepEqual(pose.map(value => typeof value === 'number' ? Math.round(value) : value),
    lockedPose.map(value => typeof value === 'number' ? Math.round(value) : value));
  await key('keyDown', 'KeyE', 'e');
  await key('keyUp', 'KeyE', 'e');
  assert.equal(await evaluate("document.getElementById('conversation').hidden"), false);
  const pausedAt = await evaluate('window.mapFrames');
  await frames(180);
  assert.equal(await evaluate('window.mapFrames'), pausedAt);
  await closeConversation();
  if (process.env.SCREENSHOT_PREFIX) {
    for (const [flag, label] of [['armPose', 'drinking'], ['shards', 'broken-glass']]) {
      for (let i = 0; i < 60 && !(await evaluate('window.milkTrace.' + flag)); i++) await frames(24);
      if (flag === 'armPose') await frames(55);
      const shot = await send('Page.captureScreenshot', {format: 'png'});
      await writeFile(`${process.env.SCREENSHOT_PREFIX}-${label}.png`, Buffer.from(shot.data, 'base64'));
    }
  }
  await frames(1800);
  assert.ok(await evaluate('window.milkTrace.glass && window.milkTrace.shards && window.milkTrace.empty.size > 0'));
  assert.equal(await evaluate('window.milkTrace.armPose && !window.milkTrace.duplicatePose'), true);
  await hold('ArrowRight', 55);
  assert.notEqual(await evaluate('window.milkTrace.baron[0]'), 'baron-0.png');

  await evaluate(`(async () => {
    const [{createDialogue}, {lifeguard}, {nearestInteraction}] = await Promise.all(
      ['dialogue', 'milk-pool', 'room'].map(name => import('./src/' + name + '.mjs'))
    );
    const player = {x: lifeguard.x - 43, y: lifeguard.y};
    const target = nearestInteraction(player, {x: 0, y: 0}, null, [], [lifeguard]);
    createDialogue().open(target);
  })()`, true);
  assert.equal(await evaluate('document.getElementById("conversation-title").textContent'), 'Bull Lifeguard');
  assert.deepEqual(await choices(), [
    'Can I go in?', 'Can you swim?', 'I see piles of clothes everywhere.', "I'd like to report something.",
    'What happens if someone starts drowning?', 'Is the milk fresh?', "What's it like working here?",
    'Can I have some money?', "I'll leave you to it."
  ]);
  assert.equal(await evaluate('document.getElementById("conversation-close").hidden'), true);
  await reply('Can I go in?', 'Are you a beautiful woman or a wealthy man?');
  await expressions('thinking', 'thinking');
  await reply('Well... no.', "Well, there's your answer.");
  await reply('Continue', '');
  await reply('Can I go in?', "We've already discussed this. No!");
  await reply('Continue', '');
  await reply('Can you swim?', 'Nope.');
  await expressions('thinking', 'deadpan');
  await reply('Then what are you doing up there?', 'Enjoying the view!');
  await expressions('thinking', 'big-excited-smile');
  await reply('Continue', '');
  assert.ok(!(await choices()).includes('Can you swim?'));
  await reply('I see piles of clothes everywhere.', 'And?');
  await reply('Are they skinny dipping?', "No, they're skimmy dipping. It's skim milk, you see!");
  await reply('Is that allowed in here?', "Don't question the Dairy Aristocracy. Their customs may seem profligate to your peasant mind, but it's all perfectly above board... almost.");
  await expressions('thinking', 'frown');
  await reply('Almost?', "As long as you don't go in.");
  await reply('Continue', '');
  await reply('What happens if someone starts drowning?', 'In this economy? Do you have any idea how much that milk costs?');
  await reply('What about the person?', 'I suppose we could fish them out eventually.');
  await reply('Continue', '');
  await reply('Is the milk fresh?', 'Fresh every morning. The Baron insists upon it.');
  await reply("What happens to yesterday's milk?", "I wouldn't order the complimentary milkshake if I were you.");
  await reply('Continue', '');
  await reply("I'll leave you to it.", "Excellent. You're obstructing my view.");
  assert.equal(await evaluate('document.querySelectorAll("#conversation-replies button").length'), 0);
  await closeConversation();

  const plankUrl = new URL(site);
  plankUrl.searchParams.set('floor', 'planks');
  await load(1100, 950, false, 'wide-plank', plankUrl.href);
  assert.equal(await evaluate('performance.getEntriesByType("resource").some(entry => entry.name.endsWith("/wide-plank.webp"))'), true);
  assert.deepEqual(errors, [], JSON.stringify(errors));
  console.log('Passed desktop and mobile layout, sprite loading, keyboard and touch movement, Baron interaction, movement to all four map corners, fading Baron speech, and the milk service scene.');
} finally {
  socket.close();
}
