import {PRACTICE_RANGE} from './room.mjs';

const practiceGuardTargets = PRACTICE_RANGE.lanes.map(y => ({
  id: 'guard', title: 'Target Practice Guard', practiceGuard: true,
  x: PRACTICE_RANGE.guardX, y
}));

export function nearbyPracticeGuard(player) {
  // Keep the interaction on the side of the guards away from the targets.
  const behind = PRACTICE_RANGE.guardX - player.x;
  if (behind < 0 || behind > 80) return;
  const closest = practiceGuardTargets.reduce((best, guard) =>
    Math.abs(player.y - guard.y) < Math.abs(player.y - best.y) ? guard : best);
  if (Math.abs(player.y - closest.y) <= 42) return closest;
}

const greetings = [
  ['Stay back, taxpayer!', 'angry'],
  ["Oi! You're obstructing my training!", 'angry'],
  ['What do you want, peasant?', 'suspicious'],
  ["Unless you're a target, MOOOVE it!", 'speaking'],
  ["Can't you see we're conducting important security exercises?", 'formal']
];

const topics = [
  {back: true, lines: [
    ['What are you doing?', 'Target practice. What does it bloody look like?', 'suspicious'],
    ['Those targets look like peasants.', 'Well spotted.', 'deadpan'],
    ['Why are you practising shooting peasants?', 'Because practising on aristocrats would be highly inappropriate.', 'formal']
  ]},
  {back: true, lines: [
    ['Is that target holding a protest sign?', 'Yep. Specially commissioned by the Baron.', 'speaking'],
    ["Isn't peaceful protest legal?", 'Of course!', 'speaking'],
    ['Then why would you shoot protesters?', 'Never said it was safe, did I?', 'suspicious']
  ]},
  {back: true, lines: [
    ['What qualifications do you need to become a guard?', 'Loyalty to the Baron, a steady hand and a healthy disregard for peasants.', 'formal'],
    ['Anything else?', 'Four stomachs.', 'deadpan'],
    ['WHAT?!', 'Four... references. I meant four references.', 'suspicious', 'alarmed']
  ]},
  {back: false, lines: [
    ['How can a cow operate a gun?', 'Dunno. Never seen one try.', 'deadpan'],
    ["But you're a cow!", "I'm a highly trained security professional.", 'formal'],
    ['You literally just mooed!', 'I said MOVE!', 'angry'],
    ["You didn't!", 'MOOOOOVE IT!', 'angry', 'alarmed']
  ]},
  {back: true, lines: [
    ['Do you get milk breaks?', "Of course. We're not bloody peasants.", 'speaking'],
    ['How much milk do you get?', 'As much as we can drink.', 'speaking'],
    ['My family barely gets enough to survive.', "Should've become guards, then.", 'deadpan', 'sorry']
  ]},
  {back: false, lines: [
    ['Can I have some money?', 'What do I look like? The welfare department?', 'suspicious'],
    ['Please?', "You're lucky I'm feeling charitable.", 'speaking', 'sorry'],
    ['Really?', "Yep. I'm letting you walk away.", 'deadpan']
  ]}
];

const leave = {
  label: "I'll leave you to it.", playerMood: 'attentive',
  next: {text: "Excellent. I've got another cardboard communist to deal with.", mood: 'speaking'}
};

export function createPracticeGuardConversation() {
  const used = new Set();
  let greeting = 0;

  return function open() {
    const [text, mood] = greetings[greeting++ % greetings.length];

    function menu() {
      const replies = topics.filter(topic => !used.has(topic)).map(topic => ({
        label: topic.lines[0][0], playerMood: topic.lines[0][3] ?? 'thinking',
        next: () => {
          used.add(topic);
          const ending = topic.back ? [{label: 'Continue', next: menu, playerMood: 'attentive'}] : [];
          return topic.lines.reduceRight((replies, [label, text, mood, playerMood = 'thinking']) => [{
            label, playerMood, next: {text, mood, replies, mustContinue: replies.length > 0}
          }], ending)[0].next;
        }
      }));
      return {text, mood, replies: [...replies, leave], mustContinue: true};
    }

    return menu();
  };
}
