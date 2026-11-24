export const lifeguardMoods = ['deadpan', 'big-excited-smile', 'frown', 'thinking'];

const [deadpan, grin, frown, thinking] = lifeguardMoods;
const say = (text, mood, replies) => ({text, mood, replies});
const reply = (label, playerMood, next) => ({label, playerMood, next});

export const lifeguardDialogue = say('', deadpan, []);
const back = [reply('Continue', 'attentive', lifeguardDialogue)];

lifeguardDialogue.replies.push(
  reply('Can I go in?', 'thinking', say('Are you a beautiful woman or a wealthy man?', thinking, [
    reply('[Lie] Yes.', 'attentive', say("And I'm a qualified lifeguard. Get out of here!", frown)),
    reply('Well... no.', 'sorry', say("Well, there's your answer.", deadpan, back))
  ])),
  reply('Can you swim?', 'thinking', say('Nope.', deadpan, [
    reply('Then what are you doing up there?', 'thinking', say('Enjoying the view!', grin, back))
  ])),
  reply('I see piles of clothes everywhere.', 'attentive', say('And?', deadpan, [
    reply('Are they skinny dipping?', 'thinking', say("No, they're skimmy dipping. It's skim milk, you see!", grin, [
      reply('Oh... okay.', 'attentive', lifeguardDialogue),
      reply('Is that allowed in here?', 'thinking', say(
        "Don't question the Dairy Aristocracy. Their customs may seem profligate to your peasant mind, but it's all perfectly above board... almost.",
        frown, [reply('Almost?', 'worried', say("As long as you don't go in.", deadpan, back))]
      ))
    ]))
  ])),
  reply("I'd like to report something.", 'attentive', say(
    'Bother someone else. I need to keep a VERY close eye on this lot. Oh yes. Very important work.', frown
  )),
  reply('What happens if someone starts drowning?', 'worried', say(
    'In this economy? Do you have any idea how much that milk costs?', frown, [
      reply('What about the person?', 'worried', say('I suppose we could fish them out eventually.', thinking, back))
    ]
  )),
  reply('Is the milk fresh?', 'thinking', say('Fresh every morning. The Baron insists upon it.', deadpan, [
    reply("What happens to yesterday's milk?", 'thinking', say(
      "I wouldn't order the complimentary milkshake if I were you.", thinking, back
    ))
  ])),
  reply("I'll leave you to it.", 'attentive', say("Excellent. You're obstructing my view.", deadpan))
);
