import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createWaiterConversation, linWaitressId} from '../src/waiter-dialogue.mjs';

const name = "Lin. That's a really pretty name.";
const flirt = 'So... is the milk fresh?';
const shared = 'Um... Brie suggested I come and talk to you.';
const visit = (waiters, hasMilk = true) => waiters(!hasMilk, linWaitressId);
const pick = (node, label = node.replies[0]?.label) => {
  const choice = node.replies.find(reply => reply.label === label);
  assert.ok(choice, `Missing "${label}" after "${node.text}"`);
  return typeof choice.next === 'function' ? choice.next() : choice.next;
};
function advanceUntil(node, stop) {
  for (let step = 0; step < 30 && !stop(node); step++) node = pick(node);
  assert.ok(stop(node));
  return node;
}

test('all three Lin referral endings satisfy the introduction without completing a flirt', () => {
  for (const alreadyNamed of [false, true]) {
    for (const label of ['Should I go away?', 'Do you mind that she sent me?', 'Has Brie mentioned me before?']) {
      const waiters = createWaiterConversation(() => 100);
      if (alreadyNamed) advanceUntil(pick(visit(waiters), name),
        node => node.replies?.some(reply => reply.label === 'Could I have a glass of milk, please?'));
      assert.ok(!visit(waiters).linBrieReferral);
      waiters.queueBrieReferral();
      const intro = visit(waiters);
      assert.equal(intro.speaker, 'Pip');
      assert.equal(intro.text, alreadyNamed ? shared : 'Excuse me, are you Lin?');
      const choices = advanceUntil(intro, node => node.replies?.length === 3);
      const ending = advanceUntil(pick(choices, label), node => node.action === 'finishLinBrieReferral');
      assert.equal(ending.replies, undefined);
      waiters.finishBrieReferral();
      waiters.queueBrieReferral();
      const menu = visit(waiters);
      assert.ok(!menu.linBrieReferral);
      assert.ok(menu.replies.some(reply => reply.label === flirt));
      assert.ok(!menu.replies.some(reply => reply.label === name));
      assert.equal(waiters.completedLinChats(), 0);
      assert.equal(waiters.relationship(), 'normal');
    }
  }
});

test('Lin referral checks relationship, Executive and flirt progress at unlock and rechecks at interaction', () => {
  for (const relationship of ['alienated', 'departed']) {
    for (const queueFirst of [false, true]) {
      const waiters = createWaiterConversation(() => 100);
      if (queueFirst) waiters.queueBrieReferral();
      waiters.endRelationship(relationship);
      if (!queueFirst) waiters.queueBrieReferral();
      assert.ok(!visit(waiters).linBrieReferral);
    }
  }
  let seduced = false;
  const waiters = createWaiterConversation(() => 100, () => false, () => seduced);
  waiters.queueBrieReferral();
  seduced = true;
  assert.ok(!visit(waiters).linBrieReferral);

  const flirted = createWaiterConversation(() => 100);
  advanceUntil(pick(visit(flirted), name), node => node.replies?.some(reply => reply.label === 'Could I have a glass of milk, please?'));
  advanceUntil(pick(visit(flirted), flirt), node => node.replies?.some(reply => reply.label === 'Could I have a glass of milk, please?'));
  assert.equal(flirted.completedLinChats(), 1);
  flirted.queueBrieReferral();
  assert.ok(!visit(flirted).linBrieReferral);
});
