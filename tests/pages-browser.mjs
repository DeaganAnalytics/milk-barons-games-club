import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {connectChrome} from '../scripts/chrome-session.mjs';

const browser = await connectChrome(process.env.CHROME_DEBUG_URL);
const {send, evaluate, events} = browser;
const entry = new URL(process.env.GAME_URL);
async function waitFor(expression, message) {
  for (let attempt = 0; attempt < 150; attempt++) {
    if (await evaluate(expression)) return;
    await delay(50);
  }
  assert.fail(message);
}
try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  for (const development of [false, true]) {
    const url = new URL(development ? 'dev/' : './', entry);
    events.length = 0;
    await send('Emulation.setDeviceMetricsOverride', development
      ? {width: 390, height: 844, deviceScaleFactor: 1, mobile: true}
      : {width: 1100, height: 900, deviceScaleFactor: 1, mobile: false});
    await send('Emulation.setTouchEmulationEnabled', {enabled: development});
    await send('Page.navigate', {url: url.href});
    await waitFor(`location.href === ${JSON.stringify(url.href)} && !document.getElementById('conversation')?.hidden
      && document.getElementById('conversation-title')?.textContent === 'Elias'`, 'Elias did not open at ' + url);
    assert.equal(await evaluate('document.querySelector("h1").textContent.includes("DEV BUILD")'), development);
    assert.match(await evaluate('document.querySelector("h1 small").title'), /^[\da-f]{40}$/);
    const choices = await evaluate('[...document.querySelectorAll("#conversation-replies button")].map(button => button.textContent)');
    assert.ok(choices.includes('I refuse to recognise the legitimacy of this bourgeois establishment!'));
    const [x, y] = await evaluate(`(() => {
      const button = [...document.querySelectorAll('#conversation-replies button')].find(button => button.textContent === 'Where am I?');
      button.scrollIntoView({block: 'nearest'});
      button.focus();
      const rect = button.getBoundingClientRect();
      return [rect.x + rect.width / 2, rect.y + rect.height / 2];
    })()`);
    if (development) {
      await send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y}]});
      await send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    } else {
      await send('Input.dispatchKeyEvent', {type: 'keyDown', code: 'Space', key: ' ', text: ' ', windowsVirtualKeyCode: 32});
      await send('Input.dispatchKeyEvent', {type: 'keyUp', code: 'Space', key: ' ', windowsVirtualKeyCode: 32});
    }
    await waitFor("document.getElementById('conversation-line').textContent.includes('I believe I just established zis.')",
      'Opening choice did not respond to ' + (development ? 'touch' : 'keyboard'));
    const clickChoice = async label => {
      const clicked = await evaluate(`[...document.querySelectorAll('#conversation-replies button, #conversation-advance button')]
        .some(button => { if (button.textContent !== ${JSON.stringify(label)}) return false; button.click(); return true; })`);
      assert.ok(clicked, 'Missing choice ' + label + ' at ' + url);
    };
    const activism = development ? 'The means of milk production belong to the workers!' : 'Someone has to stand up for the working class!';
    for (const label of [activism, 'A HUNDRED MILK TOKENS?!',
      'What sort of game?', "Wait. You're giving me money because I owe you money?", "THAT'S SLAVERY!", "I didn't do it!"]) {
      for (let step = 0; step < 4 && await evaluate('Boolean(document.querySelector("#conversation-advance button"))'); step++) {
        await clickChoice('Continue →');
      }
      await clickChoice(label);
    }
    await clickChoice('Continue →');
    assert.ok(await evaluate(`[...document.querySelectorAll('#conversation-replies button')]
      .every(button => button.textContent !== "I didn't do it!")`), 'The one-time question should disappear');
    await clickChoice('What is this place?');
    await clickChoice('Continue →');
    await clickChoice('Continue →');
    const profitabilityChoices = [
      'I thought the Milk Baron made his money from milk?',
      'Pleasure, amusement and an abundance of milk? I like the sound of this place.',
      'All this extravagance while millions are left with empty milk bottles?'
    ];
    const communistCriticism = 'Pleasure for the bourgeoisie, misery for the working cow!';
    if (development) profitabilityChoices.push(communistCriticism);
    assert.deepEqual(await evaluate('[...document.querySelectorAll("#conversation-replies button")].map(button => button.textContent)'),
      profitabilityChoices, 'Profitability choices should reflect the active disposition');
    await clickChoice(development ? communistCriticism : profitabilityChoices[2]);
    if (development) await clickChoice('Continue →');
    await clickChoice('Continue →');
    assert.deepEqual(await evaluate(`[
      [...document.querySelectorAll('#conversation-replies button')].some(button => button.textContent === 'What is this place?'),
      [...document.querySelectorAll('#conversation-replies button')].some(button => button.textContent === 'LONG LIVE THE REVOLUTION!')
    ]`), [false, development], 'The question should be consumed and the disposition should be preserved');
    await clickChoice('I have no more questions.');
    await evaluate('document.getElementById("conversation-close").click()');
    assert.ok(await evaluate(`document.getElementById('conversation').hidden
      && !document.getElementById('coin-counter').hidden
      && document.activeElement.id === 'interact'`), 'Ending dialogue should restore the game and interaction focus');
    const failures = events.filter(({method, params}) => method === 'Runtime.exceptionThrown'
      || (method === 'Network.responseReceived' && /\/(assets|src)\//.test(params.response.url) && params.response.status >= 400));
    assert.deepEqual(failures, [], 'Runtime or asset errors for ' + url);
    console.log('Passed packaged game startup and dialogue input at ' + url);
  }
} finally {
  browser.close();
}
