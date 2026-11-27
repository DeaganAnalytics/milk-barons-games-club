import {bartender} from './creamery.mjs';

const say = (text, mood, replies = [], extras = {}) => ({text, mood, replies, ...extras});
const reply = (label, next, playerMood = 'attentive') => ({label, next, playerMood});
const more = next => [reply('Continue', next)];
const serve = (text, action, next) => say(text, 'polite', more(next), {
  character: bartender.id, enterAction: action, mustContinue: true
});

const drinks = say("What'll it be, sir?", 'polite', [
  reply('Whole milk. Premium quality, please.', serve('Coming right up, sir.', 'buyGuardMilk',
    say('Thank you. Dairy I say, I may have misjudged you.', 'speaking', [], {
      direction: 'The guard drinks the milk.', enterAction: 'rewardGuardMilk'
    })
  )),
  reply('Give me your strongest alcoholic drink.', serve('One Double Distilled Dairy Destroyer, coming right up, sir.', 'buyGuardCocktail',
    say("Woah... I don't feel so well.", 'suspicious', [
      reply("I'll leave you to it, then.", {exitAction: 'leaveDrunkGuard'}),
      reply("(Pickpockets the guard.) I'll take that.", {exitAction: 'pickpocketDrunkGuard'})
    ], {direction: 'The guard drinks the cocktail.', mustContinue: true})
  ))
], {character: bartender.id});

const offerDrink = reply('You look parched. Can I buy you a drink?', say('Oi! Wait, for real?', 'suspicious', [
  reply('Yes, you look like you could use one.', say('Thanks, appreciate it. Not bad for a peasant.', 'speaking', more(drinks))),
  reply('Psych! Just kidding!', say('Plough off.', 'angry', [], {
    enterAction: 'guardRifleStrike', playerMood: 'alarmed', direction: 'The guard strikes Pip with the butt of his rifle.'
  }))
]));

const normalDialogue = say('If you have something to report, find one of the roving security officers', 'formal', [
  {...reply('Are you a cow?', say('I am a guard.', 'suspicious', [
    reply('But you have horns.', say('I am a guard.', 'angry'), 'thinking')
  ]), 'thinking'), once: 'guardCowQuestion', consumeOnSelect: true},
  reply('Why do you have an assault rifle?', say('To guard the milk.', 'speaking'), 'thinking'),
  offerDrink
]);

const apologyDialogue = say('Come to apologise?', 'suspicious', [
  reply('Yes.', say("Great. That'll be ₥10 for wasting my time.", 'formal', [], {enterAction: 'payGuardApology'}), 'sorry'),
  reply('Apologise? You hit me!', say('Udderly ridiculous. Now MOOVE it!', 'angry'), 'alarmed'),
  reply('No.', say("Then I'm not talking to you.", 'deadpan'))
]);

const drunkDialogue = say('Why am I seeing double?', 'suspicious', [
  reply("I'll leave you to it.", null)
], {mustContinue: true});

export function creameryGuardDialogue(guard) {
  if (guard.drunk) return drunkDialogue;
  return guard.apologyRequired ? apologyDialogue : normalDialogue;
}
