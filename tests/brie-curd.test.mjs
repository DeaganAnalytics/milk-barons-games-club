import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createBrieCurdActions} from '../src/brie-curd-actions.mjs';
import {createKarma} from '../src/karma.mjs';
import {createBrieCurdTopic} from '../src/brie-curd-dialogue.mjs';
import {createBaron} from '../src/baron.mjs';
import {createPlayer} from '../src/player.mjs';
import {updateStaff} from '../src/staff.mjs';

const menu = {text: 'Milk service'};
const normal = {seduced: false, relationship: 'normal', flirts: 0};
const pick = (node, label) => {
  const reply = node.replies.find(option => option.label === label);
  assert.ok(reply, `Expected "${label}" after "${node.text}"`);
  return typeof reply.next === 'function' ? reply.next() : reply.next;
};
const advance = node => pick(node, 'Continue');
function read(node, stop = () => false) {
  const beats = [];
  while (!stop(node) && node.replies?.length === 1 && node.replies[0].label === 'Continue') {
    beats.push(node);
    node = advance(node);
  }
  return {node, beats};
}

test('Brie offers Karl Curd only to communist Pip, consumes it on selection and attributes the opening', () => {
  const topic = createBrieCurdTopic();
  assert.equal(topic(false, menu, normal), null);
  const option = topic(true, menu, normal);
  const opening = option.next();
  assert.equal(opening.speaker, 'Pip');
  assert.equal(opening.playerMood, 'thinking');
  const response = advance(opening);
  assert.equal(response.text, 'Oh, I love him!');
  assert.equal(response.mood, 'pleased');
  assert.deepEqual(response.replies.map(reply => reply.label), [
    'YOU DO?!', 'I love him too!', 'The means of milk production belong to the workers!'
  ]);
  assert.equal(topic(true, menu, normal), null);
  assert.equal(option.next(), menu);
});

const opening = state => advance(createBrieCurdTopic()(true, menu, state ?? normal).next());
const historical = node => read(pick(pick(node, 'YOU DO?!'), "But he's been dead for over 300 years!")).node;
const admiration = node => read(pick(read(pick(node, 'I love him too!')).node,
  "No! I don't love him romantically. I just admire him.")).node;

test('Brie chooses exactly one romantic history response in priority order', () => {
  for (const [state, text, returns] of [
    [{seduced: true, relationship: 'departed', flirts: 8}, "I wouldn't say that.", true],
    [{seduced: false, relationship: 'alienated', flirts: 8}, 'Well, there was this one girl...', true],
    [{...normal, flirts: 4}, "Well, there's this one girl...", false],
    [{...normal, flirts: 3}, 'No, not really.', false]
  ]) {
    const {node, beats} = read(pick(admiration(opening(state)), "He's my hero!"));
    assert.equal(beats[1].text, text);
    assert.equal(beats[1].speaker, 'Pip');
    assert.equal(node === menu, returns);
  }
});

test('both Brie departure paths reach the same exit action and only the prank lie slaps Pip', () => {
  const a = read(pick(historical(opening()), 'Too much history?')).node;
  const b = read(pick(opening(), 'I love him too!')).node;
  for (const departure of [
    pick(a, 'You know, like boyfriend and girlfriend... without the girlfriend.'),
    pick(b, 'Well, there is some literature and a number of recovered letters suggesting that he may have been...')
  ]) {
    const {node, beats} = read(departure);
    assert.deepEqual(beats.map(beat => beat.text), ['WHAT?! MY KARL?!', "Oh, I'm going to give him a piece of my mind!"]);
    assert.equal(node.exitAction, 'brieDepart');
  }
  assert.equal(read(pick(a, '[Lie] Drinking buddies! Yes, those.')).node, menu);
  const prank = pick(historical(opening()), "Too much history? He's a legend! My hero!");
  const {node, beats} = read(pick(prank, '[Lie] Yes.'));
  assert.equal(beats.filter(beat => beat.enterAction === 'brieCurdSlap').length, 1);
  assert.deepEqual(node.replies, []);
});

test('both explanations converge, and only the abrupt farewell sends Brie to the Baron', () => {
  const boyfriend = pick(pick(opening(), 'YOU DO?!'), 'Your... boyfriend?');
  const direct = read(pick(boyfriend, "I don't understand.")).node;
  const indirect = read(pick(boyfriend, "That's impossible!")).node;
  assert.equal(direct, indirect);
  assert.equal(read(pick(direct, 'I KNOW WHAT A BOYFRIEND IS!')).node.exitAction, 'brieRunToBaron');
  assert.equal(read(pick(direct, 'How long have you been together?')).node, menu);
  const book = read(pick(opening(), 'The means of milk production belong to the workers!')).node;
  assert.equal(book.replies.length, 4);
  for (const {label} of book.replies) {
    const {node, beats} = read(pick(book, label));
    assert.equal(node, menu);
    assert.equal(beats.at(-2).text, "I don't think we're talking about the same man.");
  }
});

function game() {
  const player = createPlayer();
  const brie = {...player, x: player.x + 45, radius: 14, walkTime: 0, pauseUntil: 0};
  const baron = createBaron();
  const staff = [brie];
  const guests = [brie];
  const karma = createKarma();
  const notices = [];
  const actions = createBrieCurdActions(brie, staff, guests, baron, player, [], (text, effect) => {
    notices.push(text);
    effect();
  }, karma);
  return {player, brie, baron, staff, guests, karma, notices, actions};
}

test('Brie leaves both interaction and staff lists, even if Pip follows, and the karma penalty is applied once', () => {
  const {player, brie, baron, staff, guests, karma, notices, actions} = game();
  actions.handle('brieCurdSlap', 0);
  assert.equal(karma.score, -0.5);
  actions.handle('brieDepart', 0);
  assert.equal(actions.isUnavailable(), true);
  assert.equal(brie.departureSpeech, 'KARL!! HOW COULD YOU?!');
  assert.equal(karma.score, -0.5);
  for (let elapsed = 0; elapsed < 15; elapsed += 0.05) {
    if (elapsed > 0) Object.assign(player, {x: brie.x, y: brie.y});
    updateStaff(staff, player, baron, [], elapsed, 0.05, () => 0);
    actions.update(elapsed, 0.05);
  }
  assert.deepEqual(staff, []);
  assert.deepEqual(guests, []);
  assert.equal(karma.score, -1.5);
  assert.deepEqual(notices, ['Brie slaps Pip.', 'Your knowledge of political history has ruined an entirely unrelated relationship.']);
});

test('the Baron run follows his current position and releases Brie back to staff duties', () => {
  const {brie, baron, staff, guests, karma, actions} = game();
  actions.handle('brieRunToBaron', 0);
  for (let elapsed = 0; elapsed < 15 && actions.isUnavailable(); elapsed += 0.05) {
    if (elapsed < 0.5) baron.x += 10;
    actions.update(elapsed, 0.05);
  }
  assert.ok(Math.hypot(brie.x - baron.x, brie.y - baron.y) <= 56);
  assert.equal(brie.serviceDuty, false);
  assert.equal(actions.isUnavailable(), false);
  assert.deepEqual(staff, [brie]);
  assert.deepEqual(guests, [brie]);
  assert.equal(karma.score, 0);
});
