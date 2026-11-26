export const executiveId = 'slot-executive';
export const executiveMoods = ['stern', 'impressed', 'angry', 'tousled', 'skeptical', 'smug', 'exasperated'];

const greetings = [
  'Time is money, and you’re wasting mine.',
  'Unless you’re a shareholder, I’m not interested.',
  'Make it quick. I’m in the middle of a strategic investment.',
  'Oh, a peasant. Who let you in?',
  'If you’re here about the redundancies, speak to HR.',
  'I’m conducting a very important liquidity assessment.',
  'Can’t you see I’m generating shareholder value?',
  'If you’re selling something, I’m not buying. Unless it’s another milk monopoly.',
  'Good heavens. Do I look like customer service?',
  'You have thirty seconds. Consider yourself fortunate.'
];

const greetingMoods = ['stern', 'skeptical', 'stern', 'skeptical', 'exasperated',
  'smug', 'smug', 'skeptical', 'exasperated', 'stern'];

const reply = (label, next, playerMood = 'attentive') => ({label, next, playerMood});
const say = (text, mood = 'stern', replies = [], extras = {}) => ({
  text, mood, replies, mustContinue: replies.length > 0, ...extras
});
const more = next => [reply('Continue', next)];

export function createExecutiveConversation(getCoins, canOfferFreeNetworking = () => false) {
  let greetingIndex = 0;
  let careerComplete = false;
  let fundsComplete = false;
  let seductionComplete = false;
  let redundancyStage = 0;
  let departureReactionSeen = false;
  let freeNetworkingUnlocked = false;
  let freeNetworkingRedeemed = false;

  function freeNetworking(text, afterward, finalReply) {
    freeNetworkingRedeemed = true;
    const goodbye = finalReply ? [reply(finalReply, null)] : [];
    return say(text, 'smug', more(say('', 'smug', [], {
      mustContinue: true,
      fadeTo: say(afterward, 'tousled', goodbye)
    })));
  }

  function wealthOutcome() {
    seductionComplete = true;
    const coins = getCoins();
    const direction = 'Pip displays his coins.';
    if (coins > 175) {
      return say('Oh... wow.', 'impressed', more(say('', 'impressed', [], {
        mustContinue: true, fadeTo: say("Well, that was fun. I didn't realise you were slumming it.", 'tousled', [], {
          pipLipstick: true, action: 'executivePrivateNetworking'
        })
      })), {direction});
    }
    if (coins >= 100) return say("Come back when you're a real man.", 'smug', [], {direction});
    return say('Get away from me! GUARDS!', 'angry', [], {direction, action: 'executiveSummonEscort'});
  }

  const redundancy = [
    ['<Lie>', null, say('Another one?! Here, take it and leave.', 'exasperated', [], {action: 'executiveRedundancy1'})],
    ['<Takes out fake moustache> <Lie>', 'moustache', say('How many of you have they let in?! Here, take it and leave.', 'angry', [], {
      action: 'executiveRedundancy2'
    })],
    ['<Puts on fake moustache and eye patch> <Lie>', 'eyePatch', say('For real?! How many of you are there?!', 'impressed', more(
      say('Good heavens. Here, take ₥20.', 'exasperated', [
        reply('Thank you!', say("Congratulations. I've just hired you as my personal security officer.", 'smug', [
          reply('What?!', say('Your first responsibility is to keep all these redundant employees away from me.', 'stern', [], {
            action: 'executiveRedundancy3'
          }), 'alarmed')
        ]))
      ])
    ))],
    ['<Dresses as a woman> <Lie>', 'woman', say('Oh, for goodness’ sake! Wait a minute...', 'skeptical', more(
      say("It's YOU! You've been swindling me!", 'angry', more(
        say('GUARDS!', 'angry', [], {action: 'executiveSummonFraud'})
      ))
    ))]
  ];

  return function open() {
    const index = greetingIndex++ % greetings.length;
    const stage = redundancyStage;

    function returnToMenu(complete) {
      return () => {
        complete();
        return menu();
      };
    }

    function identity() {
      const choices = [];
      if (!careerComplete) {
        choices.push(reply('Are you an executive?', say('I am the Chief Strategic Dairy Optimisation and Shareholder Prosperity Officer. Stop bothering me.', 'stern', [
          reply("This doesn't seem very appropriate for an executive.", say('This is entirely appropriate. I came here to network, and now I am making strategic investments.', 'smug', more(
            say('Did you have an actual question?', 'exasperated', more(returnToMenu(() => { careerComplete = true; })))
          )))
        ])));
      }
      choices.push(seductionComplete
        ? reply('<Seduce> Interested in a little private networking?', say("Let's see your liquidity position.", 'skeptical', more(wealthOutcome)))
        : reply('<Seduce> I thought a girl like you seemed lonely.', say("Are you hitting on me? I'm married, and you're not wealthy enough to cheat with.", 'skeptical', [
          reply('Perhaps I should show you my coins.', wealthOutcome)
        ])));
      choices.push(reply("I'll leave you to it.", null));
      return say('I am Lady Penelope Victoria Kensington-Frothingham, MBA, FAICD. Why are you talking to me?', 'skeptical', choices);
    }

    function departureReaction() {
      const responses = [
        reply("Well, I suppose a little networking couldn't hurt.", () =>
          freeNetworking("That's the spirit, darling.", 'Much better. Nothing like a productive networking session.', 'I suppose not.')),
        reply("I don't really feel like networking right now.", say("Good heavens. You're not still thinking about that waitress, are you?", 'skeptical', [
          reply('Maybe.', say('How dreadfully sentimental.', 'exasperated', more(
            say('Well, the offer stands, darling.', 'smug', more(() => {
              freeNetworkingUnlocked = true;
              return menu();
            }))
          )))
        ]))
      ];
      const lines = [
        ['Lin?', 'Whatever her name was.'],
        ['You knew about her?', 'Of course. The little hussy was practically undressing you with her eyes.'],
        ['She was?!', 'Oh, darling. You really are quite hopeless.'],
        ['I feel terrible about what happened.', 'Nonsense. She was becoming an unnecessary distraction.'],
        ["That's a bit harsh.", 'Tell you what, darling. Our next private networking event is on the house.'],
        ['Really?', 'Consider it a celebration of your renewed professional focus.']
      ];
      const exchange = lines.reduceRight((replies, [label, text]) => [reply(label, say(text, 'smug', replies))], responses);
      return say('Darling! I hear that little waitress has finally gone.', 'smug', exchange);
    }

    function menu() {
      const choices = [reply('Who are you?', identity)];
      if (!fundsComplete) {
        choices.push(reply('Are you gambling with your own money?', say("Technically, these funds are drawn from the company's discretionary capital allocation reserve.", 'stern', [
          reply("So, you're gambling with the company's money?", say("No, I'm undertaking a high-risk liquidity optimisation exercise. Any losses are classified as operational expenditure, while any gains are attributable to executive performance.", 'smug', [
            reply('So if you win, you keep the money, and if you lose, the company pays?', say("Precisely. It's a perfectly sound remuneration framework.", 'smug', more(returnToMenu(() => { fundsComplete = true; }))))
          ]))
        ])));
      }
      if (stage < redundancy.length) {
        const [label, disguise, opening] = redundancy[stage];
        choices.push(reply(label + " I was made redundant. I didn't get paid.", () => {
          redundancyStage = stage + 1;
          return {...opening, disguise};
        }));
      }
      if (freeNetworkingUnlocked && !freeNetworkingRedeemed) {
        choices.push(reply('Is that free networking event still available?', () =>
          freeNetworking('For you, darling? Absolutely.', 'Always a pleasure doing business with you.')));
      }
      choices.push(reply("I'll leave you to it.", null));
      return say(greetings[index], greetingMoods[index], choices);
    }

    if (!departureReactionSeen && canOfferFreeNetworking()) {
      departureReactionSeen = true;
      return departureReaction();
    }
    return menu();
  };
}

export const executiveFraudWarning = say('Right, you little troublemaker. Hand over everything you’ve taken from this lady.', 'formal', more(
  say('And another ₥20 for wasting my time.', 'speaking', [
    reply('Fine.', say('Now MOOOVE it!', 'angry')),
    reply("₥20?! That's ridiculous!", say("Would've been ₥50 if you weren't so bloody funny.", 'speaking', more(
      say('The moustache was particularly good.', 'speaking', more(say('Now MOOOVE it!', 'angry')))
    )))
  ], {enterAction: 'executiveFraudFine'})
));
