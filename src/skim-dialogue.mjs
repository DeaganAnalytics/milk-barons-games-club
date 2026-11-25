export const skimId = 'edmund-vale';

const unknownGreetings = [
  'Just a humble janitor, my lord.', 'Nobody important here, sir.',
  'Please move along. Nothing of political significance here.',
  'Have we met? No. Definitely not.',
  "A magnificent establishment, isn't it? Absolutely magnificent."
];

const confirmedGreetings = [
  "Oh, bloody hell. It's you again.", 'Keep your voice down, kid.',
  'What now? Another question about parliament?', "Please don't use my surname.",
  "I'm working, kid. Some of us don't have wealthy parents.",
  "If anyone asks, we're discussing cleaning products."
];

const reply = (label, next) => ({label, next, playerMood: 'attentive'});
const say = (text, replies = [], extras = {}) => ({
  text, mood: 'attentive', replies, mustContinue: replies.length > 0, ...extras
});
const more = next => [reply('Continue', next)];
const exchange = (lines, ending = []) => lines.reduceRight((replies, [label, text, extras]) =>
  [reply(label, say(text, replies, extras))], ending)[0];

const distressed = {mood: 'distressed'};
const lookingAround = {mood: 'conspiratorial', direction: 'Skim looks around.'};
const whisper = {...distressed, direction: 'Whispers.'};

export function createSkimConversation() {
  let met = false;
  let confirmed = false;
  let unknownIndex = 0;
  let confirmedIndex = 0;

  function menu(text) {
    const back = more(() => menu(text));
    return say(text, [
      exchange([
        ['So your job is to clean up after the Baron?', 'Correct.'],
        ['That must be humiliating.', 'Not at all! It is an extraordinary privilege to serve such a magnificent individual.'],
        ['Really?', 'The fat bastard spills more milk than my entire electorate used to receive.', {...lookingAround, direction: 'Skim looks around and whispers.'}],
        ['What?!', "I SAID HE'S A MAGNIFICENT INDIVIDUAL!", {mood: 'exasperated'}]
      ], back),
      exchange([
        ["Do you think you'll ever return to politics?", 'Politics? Me? Good heavens, no!', distressed],
        ['But you were quite popular.', "Yes. I've since learnt the dangers of popularity.", {mood: 'wistful'}],
        ["My dad said you should've been Prime Minister.", 'Your father sounds like an intelligent man.'],
        ['Should I tell the Baron that?', 'Your father sounds like a dangerously misinformed individual.', distressed]
      ], back),
      exchange([
        ['Do you still believe in democracy?', 'Of course! Our current system is a shining example of democratic governance.'],
        ['But you used to say the Baron had too much influence.', 'Did I?'],
        ['It was your campaign slogan.', 'Was it?'],
        ['My parents still have the poster.', 'Tell them to burn it.', whisper]
      ], back),
      exchange([
        ['Why are all the guards cows?', "Oh, for goodness' sake, they're obviously..."],
        ['Continue', '...exceptionally well-trained security personnel.', lookingAround],
        ['But the horns?', 'Decorative.'],
        ['And the tails?', 'Traditional.'],
        ['And the mooing?', 'Regional accents.'],
        ["You don't actually believe that, do you?", 'I believe in continued employment.']
      ], back),
      exchange([
        ['Could you spare a few coins?', "Kid, I'm a janitor."],
        ['But you used to be a politician!', 'An opposition politician.'],
        ["What's the difference?", 'About twelve million milk tokens and a holiday residence.']
      ], back),
      exchange([
        ["I'll leave you to it.", 'Thank goodness.'],
        ['Continue', 'Ahem. Thank you, my lord.']
      ])
    ]);
  }

  return function open() {
    if (met) {
      const greeting = confirmed ? confirmedGreetings[confirmedIndex++ % confirmedGreetings.length]
        : unknownGreetings[unknownIndex++ % unknownGreetings.length];
      return menu(greeting);
    }

    met = true;
    const recognition = exchange([
      ["You're Edmund Skim!", 'God damn it.', whisper],
      ['Continue', 'I mean, get dem it... Ahem. Get to it. Must get to it.', distressed],
      ['I can call over the Baron.', 'NO!', distressed],
      ['What?', 'No need to disturb such a magnificent gentleman.', distressed],
      ['So you are Edmund Skim?', 'Yes! Now keep your bloody voice down!', whisper],
      ['What happened to you?', 'A career change.'],
      ['From opposition leader to janitor?', 'An involuntary career change.'],
      ['But you nearly won the election!', 'Yes. That was apparently the problem.']
    ], more(() => {
      confirmed = true;
      return menu('Keep your voice down, kid.');
    }));
    const lookalike = exchange([
      ['No, I definitely recognise you.', '...', distressed],
      ['You used to be the opposition leader! My parents voted for you!', 'Me? Must be a lookalike.', distressed]
    ], [recognition, exchange([
      ['Oh yeah, I guess all janitors look alike.', 'Wow. You actually are that stupid, kid.'],
      ['What?', 'Nothing, my lord. A pleasure serving you.']
    ])]);
    return say('Hey, I recognise you!', more(say("No, no. I'm just a janitor.", [
      reply("Maybe I'm mistaken.", say('That you are, my lord.')),
      lookalike
    ])), {speaker: 'Pip'});
  };
}
