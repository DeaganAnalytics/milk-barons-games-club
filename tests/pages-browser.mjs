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
  // Render the real encounter nodes through the same dialogue controller as gameplay.
  await send('Page.navigate', {url: entry.href});
  await waitFor("document.readyState === 'complete' && document.getElementById('conversation')", 'Game did not load');
  const playerLines = await evaluate(`(async () => {
    const {createDialogue} = await import('./src/dialogue.mjs');
    const {createBaron} = await import('./src/baron.mjs');
    const {elias} = await import('./src/elias.mjs');
    const {milkMysticId} = await import('./src/milk-mystic.mjs');
    const dialogue = createDialogue(createBaron());
    const snapshot = () => [
      document.getElementById('conversation-title').textContent,
      document.getElementById('conversation-line').textContent,
      document.getElementById('conversation-player').dataset.expression.split(':')[0]
    ];
    const click = label => [...document.querySelectorAll('#conversation-replies button, #conversation-advance button')]
      .find(button => button.textContent === label).click();
    dialogue.open({id: milkMysticId, title: 'Milk Mystic'});
    elias.passThroughAt = performance.now();
    dialogue.open(elias);
    click('Did I just... walk through you?');
    const opening = snapshot();
    click('Continue →');
    const eliasResponse = snapshot();
    click("I'm going to ask the Milk Mystic about this!");
    click('She might know what you are!');
    click('Continue →');
    dialogue.open({id: milkMysticId, title: 'Milk Mystic'});
    click('The Great Cow, maybe she can read the future.');
    click('Continue →');
    const apology = snapshot();
    click('Can you explain to me what happened?');
    const mysticResponse = snapshot();
    dialogue.dismiss();
    return {opening, eliasResponse, apology, mysticResponse};
  })()`);
  assert.deepEqual(playerLines.opening, ['Pip', 'Did I just... walk through you?', 'thinking']);
  assert.equal(playerLines.eliasResponse[0], 'Elias');
  assert.equal(playerLines.eliasResponse[1], 'Vhat are you talking about, Master Pip? Zat is physically impossible.');
  assert.deepEqual(playerLines.apology, ['Pip', 'Oh. Sorry.', 'sorry']);
  assert.equal(playerLines.mysticResponse[0], 'Milk Mystic');

  const brieLines = await evaluate(`(async () => {
    const {createDialogue} = await import('./src/dialogue.mjs');
    const {createBaron} = await import('./src/baron.mjs');
    const {elias} = await import('./src/elias.mjs');
    const dialogue = createDialogue(createBaron());
    const brie = {id: 'blonde-waitress', title: 'Waitress Brie'};
    const topic = 'What do you think of Karl Curd?';
    const find = label => [...document.querySelectorAll('#conversation-replies button, #conversation-advance button')]
      .find(button => button.textContent === label);
    const snapshot = () => [
      document.getElementById('conversation-title').textContent,
      document.getElementById('conversation-line').textContent
    ];
    dialogue.open(brie);
    const boyfriendTopic = 'So, do you have a boyfriend?';
    const locked = !find(topic) && !find(boyfriendTopic);
    dialogue.open(brie);
    const unlocked = Boolean(find(boyfriendTopic)) && !find(topic);
    dialogue.open({...elias, welcome: true});
    find('I refuse to recognise the legitimacy of this bourgeois establishment!').click();
    dialogue.open(brie);
    const exclusive = !find(boyfriendTopic);
    find(topic).click();
    const pip = [...snapshot(), document.getElementById('conversation-player').dataset.expression.split(':')[0]];
    find('Continue →').click();
    const portrait = document.getElementById('conversation-npc');
    const brieReply = [...snapshot(), portrait.dataset.portrait, portrait.dataset.expression];
    find('I love him too!').click();
    find('Continue →').click();
    find("No! I don't love him romantically. I just admire him.").click();
    find('Continue →').click();
    find('Continue →').click();
    find("He's my hero!").click();
    find('Continue →').click();
    find('Continue →').click();
    const referralLine = snapshot();
    dialogue.open({id: 'lin-waitress', title: 'Waitress Lin'});
    const referralOpening = snapshot();
    find('Continue →').click();
    const linReply = snapshot();
    dialogue.open(brie);
    const consumed = !find(topic);
    dialogue.dismiss();
    return {locked, unlocked, exclusive, pip, brieReply, consumed, referralLine, referralOpening, linReply};
  })()`);
  assert.deepEqual(brieLines, {
    locked: true, unlocked: true, exclusive: true, pip: ['Pip', 'What do you think of Karl Curd?', 'thinking'],
    brieReply: ['Waitress Brie', 'Oh, I love him!', 'blonde-waitress', 'lovestruck'], consumed: true,
    referralLine: ['Waitress Brie', "Have you spoken to Lin? She's single, you know!"],
    referralOpening: ['Pip', 'Excuse me, are you Lin?'],
    linReply: ['Waitress Lin', 'Yes, sir. Can I help you?']
  });

  const attribution = await evaluate(`(async () => {
    const {createDialogue} = await import('./src/dialogue.mjs');
    const {createBaron} = await import('./src/baron.mjs');
    const {bartender} = await import('./src/creamery.mjs');
    const dialogue = createDialogue(createBaron());
    const snapshot = () => [
      document.getElementById('conversation-title').textContent,
      document.getElementById('conversation-line').textContent,
      document.getElementById('conversation').dataset.speakingSide,
      document.getElementById('conversation-player').nextElementSibling.textContent,
      document.getElementById('conversation-speaker').textContent,
      document.getElementById('conversation-npc').dataset.portrait
    ];
    const click = label => [...document.querySelectorAll('#conversation-replies button, #conversation-advance button')]
      .find(button => button.textContent === label).click();
    const pipe = {id: 'pipe', title: 'Pipe'};
    dialogue.open(pipe);
    click("Sorry! I didn't notice the sign.");
    click('Continue →');
    document.getElementById('conversation-close').click();
    dialogue.open(pipe);
    click("My name's Pip. What's yours?");
    const player = snapshot();
    click('Continue →');
    const other = snapshot();
    dialogue.dismiss();

    dialogue.open(bartender);
    document.getElementById('conversation-close').click();
    click('What?');
    click('Continue →');
    const guest = snapshot();
    dialogue.dismiss();
    return {player, other, guest};
  })()`);
  assert.deepEqual(attribution, {
    player: ['Pip', "My name's Pip. What's yours?", 'player', 'Pip', 'Pipe', 'pipe'],
    other: ['Pipe', "Pip?! That's the stupidest name I've ever heard.", 'npc', 'Pip', 'Pipe', 'pipe'],
    guest: ['Elias', 'He vants a tip.', 'npc', 'Pip', 'Elias', 'elias']
  });

  for (const [choice, expected, mood, pipMood] of [
    ['Even worse!', 'Only to those in debt, Master Pip.', 'self-assured-smirk', 'alarmed'],
    ['Oh, phew.', 'Your relief may be premature.', 'devious', 'happy'],
    ['Why do you dress like that?', 'I find that a suitably ominous appearance encourages prompt repayment of outstanding debts, Master Pip.', 'self-assured-smirk', 'thinking']
  ]) {
    await send('Page.navigate', {url: entry.href});
    await waitFor("!document.getElementById('conversation')?.hidden && document.getElementById('conversation-title')?.textContent === 'Elias'", 'Elias welcome did not open');
    const click = async label => {
      assert.ok(await evaluate(`[...document.querySelectorAll('#conversation-replies button, #conversation-advance button')]
        .some(button => { if (button.textContent !== ${JSON.stringify(label)}) return false; button.click(); return true; })`), 'Missing response ' + label);
    };
    await click('BAH! A VAMPIRE!');
    assert.deepEqual(await evaluate(`[
      document.getElementById('conversation-speaker').textContent,
      document.getElementById('conversation-line').textContent,
      document.getElementById('conversation-npc').dataset.expression,
      document.getElementById('conversation-player').dataset.expression.split(':')[0]
    ]`), ['Elias', 'Accountant, Master Pip. Accountant.', 'insulted', 'alarmed']);
    assert.ok(await evaluate(`[...document.querySelectorAll('#conversation-replies button')].some(button => button.textContent === ${JSON.stringify(choice)})`));
    await click(choice);
    assert.deepEqual(await evaluate(`[
      document.getElementById('conversation-speaker').textContent,
      document.getElementById('conversation-line').textContent,
      document.getElementById('conversation-npc').dataset.expression,
      document.getElementById('conversation-player').dataset.expression.split(':')[0]
    ]`), ['Elias', expected, mood, pipMood]);
    await click('Continue →');
    assert.equal(await evaluate("document.getElementById('conversation-line').textContent"),
      'His Excellency, ze Milk Baron, has taken a most considerable interest in you. Your activism at Milk University has not gone unnoticed.');
  }
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
    assert.equal(await evaluate(`[...document.querySelectorAll('#conversation-replies button')]
      .find(button => button.textContent === 'I have no more questions.')?.classList.contains('conversation-exit')`),
    true, 'The final welcome choice should use the standard conversation exit appearance');
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
