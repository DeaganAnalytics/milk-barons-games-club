export const lifeguardMoods = ['deadpan', 'big-excited-smile', 'frown', 'thinking'];

const [deadpan, grin, frown, thinking] = lifeguardMoods;
const say = (text, mood, replies) => ({text, mood, replies});
const reply = (label, playerMood, next) => ({label, playerMood, next});

export const lifeguardDialogue = say('', deadpan, []);
const back = [reply('Continue', 'attentive', lifeguardDialogue)];

const poolSafety = {
  ...say('Oh, you know... pool safety and all that.', deadpan, back),
  direction: 'Turns his gaze back towards the pool.'
};

const plausibleDeniability = say('Now get out of here before you compromise my plausible deniability any further!', frown);
const lookAtPool = say('Furthermore, I shall be looking exclusively at the pool for the foreseeable future.', deadpan, [
  reply('Understood.', 'attentive', plausibleDeniability)
]);
const hypotheticalTheft = say('I am neither encouraging nor discouraging any hypothetical theft of clothing.', deadpan, [
  reply('Right...', 'thinking', lookAtPool)
]);
const implicated = say("There's a considerable difference between hoping for something and being implicated in it!", frown, [
  reply("So you wouldn't stop me?", 'thinking', hypotheticalTheft)
]);

const clothesTheft = reply('What if someone steals their clothes?', 'thinking', say(
  'God, I hope someone does! Just imagine the view! Although, preferably, the gentleman stays in the pool.', grin, [
    reply("Aren't you supposed to be watching their clothes?", 'thinking', say(
      'No, no. I have far more important things to keep an eye on.', deadpan, [
        reply('Such as?', 'thinking', poolSafety)
      ]
    )),
    reply('What if I steal them?', 'thinking', say(
      "Damn it! Don't tell me that! Now I'll be held accountable.", frown, [
        reply('But you just said you hoped someone would.', 'attentive', implicated)
      ]
    ))
  ]
));

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
    ])),
    clothesTheft
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
