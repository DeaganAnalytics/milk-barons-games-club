export const bartenderMoods = ['deadpan', 'polite', 'skeptical', 'thinking'];
const [deadpan, polite, skeptical, thinking] = bartenderMoods;
const say = (text, mood = deadpan, replies = [], extras = {}) => ({text, mood, replies, ...extras});
const reply = (label, next, playerMood = 'thinking') => ({label, next, playerMood});
const next = node => [reply('Continue', node, 'attentive')];
const menu = say('');
const back = next(menu);

const greetings = [
  ["What'll it be? Milk?", polite],
  ['A glass of milk, sir?', polite],
  ['Let me guess... milk?', skeptical],
  ["The usual? It's milk, by the way.", deadpan],
  ["What's your poison? Whole milk or skim?", polite],
  ['Something to take the edge off? A nice cold milk?', polite],
  ['Milk on the rocks, perhaps?', thinking],
  ["I'd recommend the milk.", deadpan],
  ["Double milk? You look like you've had a rough day.", skeptical],
  ["We've got milk on tap, if you're interested.", polite]
];
export const bartenderOpening = index => ({...menu, text: greetings[index % greetings.length][0], mood: greetings[index % greetings.length][1]});

const sequence = (lines, finish = back) => lines.reduceRight((replies, [text, mood]) => next(say(text, mood, replies)), finish)[0].next;
const elias = (text, replies) => say(text, 'insulted', replies, {character: 'elias'});
const guard = (text, replies) => say(text, 'angry', replies, {character: 'guard'});

const otherMilks = say('Dolphin milk, cat milk, dog milk, stickwoman milk. That last one is something of a delicacy.', polite, [
  reply('I can order stickwoman milk?', say('', skeptical, next(
    say("I suspect it's a little beyond your budget, sir.", deadpan, back)
  ), {direction: 'Looks Pip up and down.'})),
  reply('What about non-animal milk?', sequence([
    ['Ah, one of those, are we, sir?', skeptical],
    ['Almond milk, oat milk, rice milk, nut milk.', deadpan],
    ['Soy milk, coconut milk, pea milk, hemp milk.', deadpan],
    ['Grass milk, potato milk, lawn clipping milk and ocean milk.', polite]
  ], [reply('Ocean milk?', sequence([
    ['Algae-derived milk, sir. Puts that otherwise useless ocean to good use.', thinking],
    ['The algae covers approximately three-quarters of it now. A remarkably economical way to feed the peasants.', polite]
  ]))]))
]);

const drink = (text, direction, order) => say(text, polite, back, {direction, enterAction: 'bartenderDrink', order});
const orderDrink = say('Certainly, sir. What will it be?', polite, [
  reply('A glass of whole milk, please.', drink('An excellent choice, sir. A timeless classic.', 'Pip drinks the milk.', 'whole')),
  reply("I'll try a Piña Cow-lada.", drink('A splendid choice, sir. Rather potent, I must warn you.', 'Pip drinks the cocktail.', 'cocktail')),
  reply("I'll have a glass of ocean milk.", say('An economical choice, sir. Particularly popular among the financially disadvantaged.', polite, next(
    say('', skeptical, [reply("Good heavens! That's disgusting!", say('An acquired taste, sir.', deadpan, back,
      {enterAction: 'bartenderDrink', order: 'ocean'}), 'alarmed')], {direction: 'Pip drinks the milk.', mustContinue: true})
  ), {mustContinue: true}))
]);

menu.replies.push(
  reply('What kind of milk?', say("Whole milk, skim milk, cow's milk, goat's milk.", deadpan, next(
    say('Sheep milk, pig milk, camel milk, elephant milk.', polite, [
      ...next(otherMilks),
      reply('Elephant milk?', say('Indeed, sir. Rather difficult to procure.', thinking, next(otherMilks)))
    ])
  ))),
  reply('Do you have any garlic-flavoured milk?', say('Garlic-flavoured milk, sir?', skeptical, [
    reply('Or perhaps it was milk-flavoured garlic?', say('Sir, whatever are you on about?', skeptical, [
      reply("(Whispers) It's for vampires.", say("Vampires? Don't be silly, sir. Vampires don't exist.", deadpan, next(
        say('Though, if they did exist... an entirely untapped market for a new line of milk products. Potentially quite profitable.', thinking, next(
          elias('Pip, time is money, and you are in rather desperate need of money.', next(
            say("I'd listen to your friend, young man. He seems eminently sensible.", polite, back)
          ))
        ))
      )))
    ]))
  ])),
  reply('Do you have anything... alcoholic?', sequence([
    ['Of course, sir. Milk beer, milk wine, milk cider and milk champagne.', polite],
    ['Milk whisky, milk vodka, milk gin and aged milk rum.', deadpan],
    ['We also serve cocktails. Milk Martinis, Dairy Daiquiris, Piña Cow-ladas and White Russians.', polite],
    ["Whatever a Russian is. I'm not Russian to find out.", deadpan]
  ])),
  reply('Do you have anything non-milk-related?', say('Non-milk, you say, sir? Surely you jest.', 'offended', back)),
  reply("I'll have a milk, please.", orderDrink),
  reply('Why is there an armed guard?', say('To protect the milk, of course, sir.', deadpan, [
    reply('But an assault rifle?', say('Bullets are cheaper than milk, sir.', deadpan, back)),
    reply('Why is the guard a cow?', say("I'm afraid I don't understand the question, sir.", skeptical, [
      reply('The guard. Is a cow. Or a bull, or whatever.', say('The guard is a guard, sir.', deadpan, [
        reply("You can't be serious. How could you give a cow a gun?", guard('Oi! Buy some milk or MOOVE it!', [
          reply('See?!', say('See what, sir?', skeptical, [
            reply('He said MOOVE it!', say("Sounds like perfectly good English to me, sir. A cow couldn't talk.", deadpan, back))
          ]), 'alarmed')
        ]))
      ]))
    ])),
    reply("Isn't that a bit... extreme?", say('Milk is an extremely serious matter, sir.', deadpan, [
      reply('But who are you guarding the milk from?', say("Peasants. Dastardly creatures, sir, as I'm sure you're aware.", skeptical, back, {direction: 'Whispers'})),
      reply('So if I tried to steal some milk, he would shoot me?', guard('With pleasure.', [
        reply('Wow...', say('Seems entirely reasonable to me, sir.', deadpan, back), 'alarmed')
      ]))
    ]))
  ])),
  {...reply('Can I have some money?', say('Absolutely not, sir. I am not a communist.', skeptical, back)), once: 'bartenderMoneyRequest'}
);

export const bartenderExit = say('Ahem.', deadpan, [
  reply('What?', say('AHEM!', skeptical, next(elias('He vants a tip.', [
    reply("A tip? He didn't do anything!", guard("He spoke to a peasant, didn't he? Pay up or I'll shoot.", [
      reply('Okay, fine.', say('Much appreciated, sir.', polite, [], {action: 'bartenderTip'}), 'sorry'),
      reply('Can I buy a drink instead?', say('Of course, sir.', polite, next(orderDrink))),
      reply('I refuse to pay just to talk to someone.', guard('Final warning.', [
        reply('No, this is stupid.', {exitAction: 'bartenderRefusal'}),
        reply('Okay, okay! Jeez!', guard('And a tip for me too, for not shooting you.', next(
          say('Thank you for your patronage, sir.', polite, [], {action: 'bartenderDoubleTip'})
        )), 'alarmed')
      ]))
    ]), 'alarmed')
  ]))))
]);
