import assert from 'node:assert/strict';
import test from 'node:test';
import {createWaiterConversation} from '../src/waiter-dialogue.mjs';

const servers = ['lin-waitress', 'blonde-waitress', 'female-waiter', 'male-waiter',
  'handlebar-waiter', 'martini-waiter'];
const topic = menu => menu.replies.find(reply => reply.label === 'Do all guests pay for milk?');

test('each server can consume the shared membership topic for the entire playthrough', () => {
  for (const selected of servers) {
    const open = createWaiterConversation(() => 0);
    for (const id of servers) {
      assert.equal(topic(open(true, id)), undefined, `${id} is busy`);
      assert.ok(topic(open(false, id)), `${id} offers membership information without a purchase`);
    }
    const choice = topic(open(false, selected));
    assert.equal(choice.playerMood, 'thinking');
    let beat = choice.next();
    for (const id of servers) {
      assert.equal(topic(open(false, id)), undefined, `${selected} consumed the topic for ${id}`);
    }
    for (let index = 0; index < 7; index++) {
      assert.equal(beat.speaker, index % 2 ? 'Pip' : undefined);
      assert.equal(beat.enterAction, undefined);
      assert.equal(beat.action, undefined);
      if (index < 6) {
        assert.deepEqual(beat.replies.map(reply => reply.label), ['Continue']);
        beat = beat.replies[0].next;
      }
    }
    assert.equal(beat.replies?.length ?? 0, 0);
  }
});
