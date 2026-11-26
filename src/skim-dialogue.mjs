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

const returnTopics = [
  ['janitor', [
    ['Are you any good at being a janitor?', 'Under my leadership, this establishment has experienced a thirty-seven per cent reduction in visible milk spillage.'],
    ["So you're good at mopping?", 'I prefer to describe it as delivering measurable outcomes in sanitation.'],
    ['Right.', 'I had a press secretary who used to make these things sound impressive.', {mood: 'wistful'}]
  ]],
  ['election', [
    ['How close were you to winning the election?', 'We were ahead in every major poll.'],
    ['What happened?', 'The polls were abolished.', distressed],
    ['And the election?', 'Postponed.'],
    ['Until when?', 'The restoration of favourable polling conditions.', {mood: 'exasperated'}]
  ]],
  ['party', [
    ['What happened to the rest of your party?', 'Some retired. Some emigrated. Some discovered a profound admiration for the Milk Baron.', {mood: 'conspiratorial'}],
    ['What about you?', 'I discovered a profound admiration for cleaning products.', {mood: 'exasperated'}]
  ]],
  ['salary', [
    ['Do you get paid much?', 'I receive a competitive salary.'],
    ['Competitive with what?', 'Starvation.', {mood: 'exasperated'}],
    ["Can't you resign?", 'I have been informed that I am extremely passionate about my work.', distressed]
  ]],
  ['milo', [
    ['I met Milo.', 'Oh, that bloody idiot.', {mood: 'exasperated'}],
    ['You know him?', 'Of course I know him. He was shouting “Where\'s my milk?” outside parliament for six months.'],
    ["Didn't you agree with him?", 'Broadly, yes. But we had a comprehensive, costed milk distribution policy.', {mood: 'wistful'}],
    ['His slogan was catchier.', 'Yes, thank you. My electoral strategist said much the same thing.', {mood: 'exasperated'}]
  ]],
  ['elias', [
    ['What do you think of Elias?', 'An extraordinarily capable administrator.'],
    ['Really?', 'The man dismantled my entire political career and processed my employment paperwork in the same afternoon.', distressed],
    ['Efficient.', 'Frighteningly so.', {mood: 'conspiratorial'}]
  ]],
  ['regret', [
    ['Do you regret opposing the Baron?', 'Every morning when I pick up this bloody mop.', {mood: 'exasperated'}],
    ["So you'd do things differently?", '...', {mood: 'wistful'}],
    ['Continue', "No, kid. I don't think I would.", {mood: 'wistful'}]
  ]]
];

export function createSkimConversation(hasSpokenToMilo = () => false, standing = () => ({})) {
  let met = false;
  let confirmed = false;
  let unknownIndex = 0;
  let confirmedIndex = 0;

  const usedTopics = new Set();
  function menu(text, returning = false) {
    const back = more(() => menu(text, returning));
    const followups = returning ? returnTopics
      .filter(([id]) => !usedTopics.has(id) && (id !== 'party' || usedTopics.has('election'))
        && (id !== 'milo' || hasSpokenToMilo()))
      .map(([id, lines]) => {
        const option = exchange(lines, back);
        return {...option, next: () => {
          usedTopics.add(id);
          return option.next;
        }};
      }) : [];
    const {coins, karma} = standing();
    const oneTime = (id, label, next) => reply(label, () => {
      usedTopics.add(id);
      return next;
    });
    if (returning && !usedTopics.has('falseSpill')) {
      followups.push(oneTime('falseSpill', "[Lie] Thank God you're here! There's been a milk spillage over there.",
        say('How much milk?!', [
          reply('Quite a lot.', say('Bloody hell. Out of my way, kid!', [], {mood: 'exasperated', action: 'skimFalseSpill'}))
        ], distressed)));
    }
    if (returning && coins > 100 && karma < 0 && !usedTopics.has('patronisingTip')) {
      followups.push(oneTime('patronisingTip', 'Keep up the good work, janitor.',
        say("I see you're fitting in nicely.", [], {mood: 'exasperated', enterAction: 'tipSkim'})));
    }
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
      ...followups,
      exchange([
        ["I'll leave you to it.", 'Thank goodness.'],
        ['Continue', 'Ahem. Thank you, my lord.']
      ])
    ]);
  }

  function spillFollowup() {
    const {coins, karma} = standing();
    const back = more(() => menu("If anyone asks, we're discussing cleaning products.", true));
    return say('Thanks a lot, kid. Almost got me fired.', [
      exchange([
        ["I'm genuinely sorry. I didn't think you'd get in trouble.", 'Yes, well, thinking before acting is a skill that appears to be in short supply around here.', {mood: 'exasperated'}],
        ["It won't happen again.", 'I appreciate that, kid.', {enterAction: 'skimSpillApology'}]
      ], back),
      exchange([
        ["Hahahaha! You should've seen how fast you ran!", 'Yes, hilarious. The former opposition leader running around with a bloody mop.', {mood: 'exasperated'}],
        ['Hahahaha!', "I'm beginning to understand why your parents' generation had such concerns about the future.", {mood: 'exasperated', enterAction: 'skimSpillLaughter'}]
      ], back),
      ...(karma < 0 ? [exchange([
        ["Perhaps if you were a better janitor, you wouldn't have to worry about being fired.", 'I used to represent hundreds of thousands of people.', {mood: 'distressed'}],
        ['And now you represent a bucket and mop.', "You'd make an excellent member of the Baron's cabinet.", {mood: 'exasperated', enterAction: 'skimSpillInsult'}]
      ], back)] : []),
      exchange([
        ['Sounds like a you problem.', 'Spoken like a true government minister.', {mood: 'exasperated'}],
        ['Anyway...', "Yes, let's move on. Apparently my concerns aren't worthy of parliamentary time."]
      ], back),
      ...(coins >= 10 && karma > -2 ? [exchange([
        ["Look, I'm sorry. Here, take this for your troubles.", "You're compensating someone for the consequences of your own actions?", {mood: 'distressed'}],
        ['Yes?', "Good heavens. You'd never survive in politics.", {mood: 'wistful'}],
        ['Do you want the money or not?', "Of course I bloody do. I'm a janitor.", {enterAction: 'skimSpillCompensation'}]
      ], back)] : [])
    ], {mood: 'exasperated'});
  }

  return function open(followUpOnSpill = false) {
    if (followUpOnSpill) return spillFollowup();
    if (confirmed) return menu(confirmedGreetings[confirmedIndex++ % confirmedGreetings.length], true);

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
    const denial = say("No, no. I'm just a janitor.", [
      reply("Maybe I'm mistaken.", say('That you are, my lord.')),
      lookalike
    ]);
    if (met) {
      const greeting = unknownGreetings[unknownIndex++ % unknownGreetings.length];
      return say(greeting, [reply('Hey, I recognise you!', denial)], {mustContinue: false});
    }

    met = true;
    return say('Hey, I recognise you!', more(denial), {speaker: 'Pip'});
  };
}
