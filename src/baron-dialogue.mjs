import {commissionerDiscussion} from './baron-commissioner-dialogue.mjs';

const say = (text, mood = 'pleased', extras = {}) => ({text, mood, ...extras});
const reply = (label, next, playerMood = 'attentive') => ({label, next, playerMood});
const more = next => [reply('Continue', next)];

const finishCowEncounter = (text, mood) => say(text, mood, {action: 'finishBaronCowEncounter'});
const cowExchange = (text, mood, replies, character) => say(text, mood, {replies, character, mustContinue: true});
const cowGuardEncounters = [
  reply('Why do you have cows for guards?', cowExchange('What do you mean?', 'flustered', [
    reply('The guards are cows.', cowExchange('I have guards.', 'displeased', [
      reply('But the horns?', finishCowEncounter('I have guards.', 'displeased'), 'thinking')
    ]))
  ]), 'thinking'),
  reply('Why are the guards cows?', finishCowEncounter("Pip, we've discussed this already. They are not cows. End of story!", 'displeased')),
  reply('Your guards are carrying guns.', finishCowEncounter('An excellent deterrent against criminal activity.', 'pleased')),
  reply('One of your guards mooed at me.', finishCowEncounter('My guards are multilingual, young Pip.', 'pleased')),
  reply('Have you ever actually looked at your guards?', finishCowEncounter("Of course not. That's what Elias is for.", 'laughing')),
  reply('The cows...', cowExchange('GUARDS!', 'displeased', [
    reply('The guards...', cowExchange('Better.', 'pleased', [
      reply('...are cows.', cowExchange('ELIAS!', 'displeased', more(
        cowExchange('Zat will be a fine of ₥20.', 'current-smile', [
          reply('For asking questions?!', cowExchange('₥2 per question, plus interest, an administration fee and stamp duty.', 'reading-figures', [
            reply('Stamp duty?!', say('Vould you like zat question added to your bill?', 'current-smile', {
              character: 'elias', action: 'finishBaronCowFine'
            }), 'alarmed')
          ], 'elias'), 'alarmed')
        ], 'elias')
      )))
    ]))
  ]), 'worried')
];

export function baronCowGuardReply(completed, seenCowGuard) {
  return seenCowGuard ? cowGuardEncounters[completed] : undefined;
}

const defaults = [
  say('Welcome, welcome to my establishment!'),
  say('Pip! Good to see you!', 'laughing'),
  say('Enjoying your time?'),
  say("A magnificent establishment, wouldn't you agree?"),
  say('Ah, young Pip! Making yourself prosperous, I hope?'),
  say('Have you sampled the milk? Finest in the land!', 'laughing')
];

export function baronGreetings(karma, coins) {
  return [
    ...defaults,
    ...(karma < -5 && coins > 100 ? [
      say("Pip, you're well on your way to becoming a member of the Dairy Aristocracy!"),
      say("Wealth without conscience! You'll fit in splendidly!", 'laughing'),
      say('I see considerable aristocratic potential in you, young Pip!')
    ] : []),
    ...(karma < -5 ? [
      say('A man after my own heart! And stomach!', 'laughing'),
      say('Morality is a terribly expensive habit, young Pip!'),
      say("You've got the makings of a respectable capitalist!")
    ] : []),
    ...(coins > 100 ? [
      say('Getting richer by the minute, young Pip!'),
      say('Ah, the sweet smell of accumulating capital!', 'laughing'),
      say('Capitalism agrees with you, my boy!')
    ] : []),
    ...(coins > 150 ? [
      say('Good heavens! I might have to start taxing you more!', 'laughing'),
      say("You're becoming rather wealthy. Not too wealthy, I hope!", 'displeased'),
      say('Perhaps Elias ought to review your financial arrangements.', 'displeased')
    ] : []),
    ...(karma > 5 ? [
      say('What are you, a COMMUNIST?!', 'displeased'),
      say("Commies don't last long in these halls, young man!", 'displeased'),
      say('All this compassion! Absolutely dreadful for business!', 'displeased'),
      say('Charity? Benevolence? What did they teach you at that blasted university?!', 'displeased'),
      say('I invited you here to accumulate capital, not a conscience!', 'displeased')
    ] : [])
  ];
}

export const DJ_ADMISSION_PRICE = 60;

export function baronDanceDialogue(used, canPay = () => false, hasAccess = false) {
  const exhausted = say('Good heavens... that was exhausting. Next time, I ought to just fine you.', 'displeased');
  const breathing = say('', 'winded', {direction: 'Heavy breathing', replies: more(exhausted), mustContinue: true});
  const slap = say('I SAID NO!', 'displeased', {
    playerMood: 'alarmed', enterAction: 'baronSlap', replies: more(breathing), mustContinue: true
  });
  const elias = (text, mood, replies) =>
    say(text, mood, {character: 'elias', replies, mustContinue: Boolean(replies)});
  const success = say('Splendid! I always make time for the arts.', 'pleased', {
    mustContinue: true,
    replies: more(elias('Provided ze arts make money for you, my lord.', 'current-smile',
      more(say('Precisely!', 'pleased', {action: 'payDjAdmission'}))))
  });
  const insufficient = elias('Good heavens, Master Pip. Ve gave you ₥100 upon arrival. Vhat have you been doing?', 'insulted',
    more(say('Financially irresponsible, is he?', 'displeased', {
      mustContinue: true,
      replies: more(elias('Evidently, my lord.', 'current-smile',
        more(elias('I suggest you return vhen you have some actual money.', 'current-smile'))))
    })));
  const price = say('Remarkably affordable!', 'pleased', {replies: [
    reply("Fine. Here's your money.", () => canPay() ? success : insufficient),
    reply("That's ridiculous.", say('Then I suggest you stop wasting valuable dancing time!', 'displeased'))
  ]});
  const admission = reply('How much would it cost to speak to DJ Dairy?',
    say("Elias! What's the going rate for interrupting my recreational activities?", 'displeased', {
      mustContinue: true,
      replies: more(elias(`₥${DJ_ADMISSION_PRICE}, my lord.`, 'thinking', more(price)))
    }), 'thinking');
  const leave = reply('Oh, okay.', null, 'sorry');
  const fanRequest = say('The man is an artist! He has no time for the likes of you!', 'displeased', {replies: [
    leave,
    reply('Please, Baron, sir? Pretty please?', slap, 'worried'),
    reply('Is dancing more important than talking to your guests?',
      say('Of course it is, boy! Now let me dance!', 'displeased')),
    admission
  ]});
  const opening = 'Not now, boy! This is my favourite song!';
  if (hasAccess) return say(opening, 'pleased', {replies: []});
  return say(opening, 'pleased', {
    replies: used ? [leave, admission] : [reply('Can I speak to DJ Dairy?', fanRequest, 'thinking')]
  });
}

function baronRewardDialogue(spokeToMilo, askedAboutCowGuards = false) {
  const elias = (text, mood = 'current-smile') => say(text, mood, {character: 'elias'});
  const guard = text => say(text, 'formal', {character: 'guard'});
  const scene = (lines, ending) => lines.reduceRight((next, line) => ({
    ...line, replies: next ? more(next) : ending
  }), null);
  const end = (line, sendGuard = false) => ({...line, action: sendGuard ? 'finishBaronRewardWithGuard' : 'finishBaronReward'});

  const replies = [
    reply('Thank you, Baron!', scene([
      say("You're most welcome, young Pip. Generosity is one of my many admirable qualities."),
      say('Elias, make a note of that.'),
      elias('Verbatim or ad sensum, my lord?'),
      say('Add some sense in, obviously!', 'flustered', {direction: 'Confused'}),
      end(elias('Very good, my lord.'))
    ])),
    reply('How do I qualify for another one?', scene([
      say('Already thinking about your next payment? Excellent!', 'laughing'),
      say('Elias! The boy has ambition!', 'laughing'),
      elias('Yes... unfortunately. An ambitious little meal.', 'devious')
    ], [
      reply('WHAT?!', {...elias('I mean, an ambitious little male.'), replies: [
        reply('...', end(elias('A most admirable quality.')), 'alarmed')
      ]}, 'alarmed')
    ])),
    reply('So this is how corruption works.', end(elias('Ve prefer ze term "professional development".')), 'thinking')
  ];

  if (spokeToMilo) {
    const challenge = reply("You've got to be kidding me. THAT IS A COW!", say(
      'Pip, please. The guard is trying to conduct himself professionally.', 'suspicious', {replies: [
        reply('HE JUST SAID MOO!', {...elias('A perfectly acceptable military expression.'), replies: [
          reply('Since when?!', end(say('Since I started paying their wages. Now, enough of this nonsense!', 'displeased'), true), 'exasperated')
        ]}, 'exasperated')
      ]}
    ), 'alarmed');
    replies.push(reply('I feel like Milo would be disappointed in me.', scene([
      say("You've seen Milo? Elias, get me a guard!", 'flustered'),
      elias('At once, my lord.'),
      guard('Reporting for duty. Ready to MOOVE.'),
      say('Find Milo! The boy is wandering around my establishment spreading economically damaging ideas!', 'displeased'),
      guard('Understood. Mooving out.')
    ], [
      ...(askedAboutCowGuards ? [challenge] : []),
      reply("I didn't mean to get him into trouble...", scene([
        say("Nonsense, young Pip! You've done me a great service."),
        end(elias('Ze Baron appreciates your cooperation.'), true)
      ]), 'sorry')
    ]), 'worried'));
  }

  replies.push(reply('Is that all?', scene([
    say("Good heavens! You're developing a sense of entitlement already! Splendid!", 'laughing'),
    say('You remind me of myself at your age.', 'pleased'),
    end(say('Though I was much fatter!', 'laughing'))
  ])));

  return say("Pip, my boy! You're beginning to impress me. Here I thought you were just another tiresome little activist.", 'pleased', {replies: more(
    say("In recognition of your demonstrated alignment with our corporate values, I'm awarding you a discretionary short-term performance incentive!", 'laughing', {replies: [
      reply('A what?', {...elias('He is giving you money. Honestly, ze financial literacy of ze peasants... Tsk, tsk.', 'insulted'),
        enterAction: 'baronKarmaReward', replies}, 'thinking')
    ]})
  )});
}

function baronPenaltyDialogue(spokeToProfessor) {
  const elias = (text, replies, action) => say(text, 'current-smile', {character: 'elias', replies, action});
  const end = (text, mood = 'displeased') => say(text, mood, {action: 'finishBaronPenalty'});
  const professorResponse = spokeToProfessor
    ? say("I'm not sitting through another economics lecture.", 'suspicious', {
      speaker: 'Pip', playerMood: 'exasperated', action: 'finishBaronPenalty'
    })
    : say("There is absolutely no way that's a real name.", 'flustered', {
      speaker: 'Pip', playerMood: 'alarmed',
      replies: more(elias('Zere vere two before him, Master Pip.', undefined, 'finishBaronPenalty'))
    });

  const responses = [
    reply("Isn't capitalism supposed to reward individual choice?",
      say('My choices, boy! MY CHOICES!', 'displeased', {replies: more(
        elias('Individual choice remains a privilege of ze individual who owns ze establishment.', undefined, 'finishBaronPenalty')
      )})),
    reply('You sound more like a communist than a capitalist.',
      say('HOW DARE YOU!', 'displeased', {replies: [
        reply("You're redistributing wealth.", say("TO ME! THAT'S ENTIRELY DIFFERENT!", 'displeased', {replies: more(
          elias('A distinction of considerable economic importance, as our esteemed guest, Professor Archibald Reginald Montgomery von Butterworth-Smythe the Third, can happily explain.', more(professorResponse))
        )}))
      ]})),
    reply("There's nothing wrong with helping people.",
      say("Of course there isn't! People help me all the time!", 'pleased', {replies: [
        reply("That's not what I meant.", end('Then I suggest you reconsider what you meant.'))
      ]})),
    reply('Did you ever actually study economics?',
      say('Study it? I practically invented it!', 'laughing', {replies: [
        reply('Economics?', say('Milking the market, boy!', 'laughing', {replies: more(
          elias("Ze Baron's qualifications are predominantly financial rather than academic.", undefined, 'finishBaronPenalty')
        )}))
      ]})),
    reply('Fine. Whatever.',
      say("Excellent! You're beginning to understand the importance of fiscal responsibility.", 'pleased', {replies: more(
        elias('Your fiscal responsibility, specifically. Not ours.', undefined, 'finishBaronPenalty')
      )}), 'exasperated')
  ];
  const fine = say("And I'm exceptionally good at making them up!", 'laughing', {
    enterAction: 'baronKarmaFine', replies: responses
  });
  return say("Pip, Pip, Pip. I've been exceedingly generous, and you repay me by subjecting my guests to all this COMMUNISM?!", 'displeased', {replies: more(
    say("I'm afraid your conduct necessitates a punitive fiscal adjustment in the form of an extraordinary behavioural compliance levy!", 'displeased', {replies: [
      reply('Is that another one of your made-up taxes?', elias('All taxes are made up, Master Pip.', more(fine)), 'thinking')
    ]})
  )});
}

export const baronKarmaDialogue = {reward: baronRewardDialogue, fine: baronPenaltyDialogue};

const assessments = [
  [
    ["All the moral qualities of an aristocrat, yet the finances of a peasant. How disappointing.", 'displeased'],
    ["You're going backwards, boy! The dairy awaits those who cannot generate a return on capital.", 'displeased'],
    ['Poor AND compassionate?! Good heavens, the university really did ruin you!', 'displeased']
  ],
  [
    ['Your moral development is most encouraging. Your financial development, somewhat less so.', 'pleased'],
    ['Modest returns, young Pip. I expect considerably more from my investments.', 'displeased'],
    ['Less charity, more prosperity, boy! This is a business establishment, not a communist commune!', 'displeased']
  ],
  [
    ["Ruthless and increasingly wealthy! Pip, my boy, you're practically aristocracy already!", 'laughing'],
    ['Excellent financial progress! Keep this up and I might have to introduce a new tax bracket.', 'pleased'],
    ["Financially impressive, morally concerning. Imagine how much richer you'd be without that dreadful conscience!", 'displeased']
  ]
];

export function baronAssessment(coins, karma) {
  if (coins < 25) return say('Good heavens, Pip! At this rate, I ought to start measuring you for a dairy uniform.', 'displeased');
  if (coins > 195) return say("You're tantalisingly close to meeting your financial obligations, young Pip! Just a few more coins and you'll be a free man!", 'pleased');
  const moneyTier = coins >= 150 ? 2 : coins >= 100 ? 1 : 0;
  const karmaTier = karma < -5 ? 0 : karma > 5 ? 2 : 1;
  return say(...assessments[moneyTier][karmaTier]);
}

function baronConversationSequence(lines, action, ending) {
  return lines.reduceRight((replies, [text, mood, character, direction]) => {
    if (character === 'pip') return [reply(text, replies[0].next, mood)];
    const node = say(text, mood, {
      character, direction, replies, mustContinue: Boolean(replies),
      ...(character === 'security-camera' ? {speaker: 'Security camera'} : {})
    });
    if (!replies) node.action = action;
    return more(node);
  }, ending)[0].next;
}

function politicalConversionReply(spokeToMilo) {
  const sequence = (lines, ending) => baronConversationSequence(lines, 'finishPoliticalConversion', ending);
  const branch = (label, lines) => reply(label, sequence(lines));
  const responses = [
    branch("You haven't changed my mind about anything.", [
      ['Give it time, my boy. Poverty is a terribly exhausting political conviction.', 'pleased'],
      ['Some things are more important than money.', 'stern', 'pip'],
      ['Of course! Milk, for instance.', 'laughing']
    ]),
    branch("I suppose being wealthy wouldn't be so bad.", [
      ["Now you're thinking! Have you considered a milk fountain?", 'pleased'],
      ["I think I'd buy my family some food first.", 'thinking', 'pip'],
      ["Good heavens! You're still thinking like a peasant!", 'displeased']
    ]),
    branch('What if I become wealthier than you?', [
      ['HAHAHAHAHA!', 'laughing'],
      ['Elias, could that happen?', 'flustered'],
      ['Not under ze current taxation arrangements.', 'current-smile', 'elias'],
      ['Splendid!', 'pleased'],
      ["Isn't that a bit unfair?", 'skeptical', 'pip'],
      ["Capitalism isn't about fairness, boy! It's about winning!", 'displeased'],
      ["And you're the only one allowed to win?", 'exasperated', 'pip'],
      ["Now you're getting it!", 'laughing']
    ]),
    ...(spokeToMilo ? [branch('Is this what you tried to do with Milo?', [
      ['Milo was a very poor investment.', 'displeased'],
      ['He was a political opponent.', 'stern', 'pip'],
      ['Yes, yes. Very poor returns.', 'displeased'],
      ['Ze man remains an ongoing operational expense.', 'thinking', 'elias'],
      ["And after everything I've done for him!", 'displeased'],
      ['You make him wear his old campaign banner.', 'exasperated', 'pip'],
      ['At my expense!', 'flustered'],
      ['Actually, my lord, he already owned ze banner.', 'current-smile', 'elias'],
      ['EVEN BETTER!', 'laughing']
    ])] : []),
    branch('And if I refuse to become a capitalist?', [
      ["Then you'll work in my dairy.", 'pleased'],
      ["So I don't really have a choice?", 'worried', 'pip'],
      ['Nonsense! You have two choices!', 'displeased'],
      ['Both of vhich are financially advantageous to ze Baron.', 'self-assured-smirk', 'elias'],
      ["Isn't capitalism marvellous?", 'laughing']
    ])
  ];
  return reply('Why are you so interested in turning me into a capitalist?', sequence([
    ['Because I see potential in you, young Pip!', 'pleased'],
    ['All that ambition, all that energy, wasted on helping OTHER PEOPLE!', 'displeased'],
    ['A most inefficient allocation of human capital.', 'current-smile', 'elias'],
    ['Precisely! Imagine what you could achieve if you only cared about yourself!', 'laughing']
  ], responses), 'thinking');
}

function surveillanceReply(used, seducedExecutive) {
  const stages = [
    'baronReviewIntro', 'baronSurveillance2', 'baronSurveillance3',
    'baronSurveillance4', 'baronSurveillance5', 'baronSurveillance6'
  ];
  const stage = stages.findIndex(key => !used.has(key));
  if (stage < 0 || (stage === 5 && !seducedExecutive)) return null;
  const encounter = (label, lines, choices) =>
    reply(label, baronConversationSequence(lines, stages[stage], choices), 'thinking');
  switch (stage) {
    case 0:
      return encounter("So, you're clearly watching me.", [
        ['Supervising the premises.', 'pleased'],
        ['Yes, yes. Supervising.', 'skeptical', 'pip'],
        ["You're learning, young Pip!", 'laughing']
      ]);
    case 1:
      return encounter('Do you watch all your guests this closely?', [
        ['Only the suspicious ones, and the pretty ones.', 'pleased']
      ], [
        encounter('What makes me suspicious?', [
          ['You keep asking questions.', 'displeased'],
          ['Am I not allowed to ask questions?', 'skeptical', 'pip'],
          ['There you go again!', 'displeased']
        ]),
        encounter('Do you find me pretty?', [
          ['Ze Baron is attracted to three things, in zis order. Milk, money, women.', 'current-smile', 'elias'],
          ['You are none, and possess none.', 'self-assured-smirk', 'elias'],
          ...(seducedExecutive ? [
            ['(Points at face) See these lipstick kisses? I seduced the Executive.', 'pleased', 'pip'],
            ["Ze Executive! Now zat's a woman of ze Baron's taste.", 'current-smile', 'elias'],
            ['You still have no milk or money.', 'self-assured-smirk', 'elias'],
            ['Is anyone thirsty?', 'pleased']
          ] : [])
        ])
      ]);
    case 2:
      return encounter("Don't you have anything better to do?", [
        ['Of course! But I can drink milk and watch you simultaneously.', 'pleased'],
        ['That sounds incredibly boring.', 'deadpan', 'pip'],
        ["Not when you're losing money, young Pip!", 'laughing']
      ]);
    case 3:
      return encounter('Have you ever heard of the right to privacy?', [
        ['Of course! A fundamental right.', 'pleased'],
        ['So you respect it?', 'thinking', 'pip'],
        ['Absolutely! Nobody is permitted to watch me without my permission.', 'pleased'],
        ['What about my privacy?', 'skeptical', 'pip'],
        ['Good heavens, boy! What have you got to hide?', 'displeased'],
        ['', 'still', 'security-camera']
      ], [{label: 'Unbelievable.', playerMood: 'exasperated', next: {exitAction: stages[stage]}}]);
    case 4:
      return encounter('How much did all these security cameras cost?', [
        ['Elias?', 'flustered'],
        ['A considerable sum, my lord.', 'current-smile', 'elias'],
        ['Worth every token!', 'pleased'],
        ["Wouldn't it have been cheaper to just trust people?", 'thinking', 'pip'],
        ['Elias, did you hear that?', 'pleased'],
        ['Yes, my lord. Quite amusing.', 'self-assured-smirk', 'elias'],
        ['HAHAHAHAHA!', 'laughing'],
        ["It wasn't a joke.", 'exasperated', 'pip'],
        ['HAHAHAHAHA!', 'laughing']
      ]);
    case 5:
      return encounter('Just how much can you see through those cameras?', [
        ['Excellent picture quality, young Pip!', 'pleased'],
        ["That's not what I asked.", 'skeptical', 'pip'],
        ['Quite an impressive performance, by the way.', 'laughing'],
        ['Oh MILK!', 'alarmed', 'pip'],
        ['Elias, remind me to congratulate the Executive.', 'pleased'],
        ['Already noted, my lord.', 'self-assured-smirk', 'elias']
      ]);
  }
}

function djDairyFollowup() {
  const singing = [
    reply('Milk, milk, milk her now!', baronConversationSequence([
      ['Hey! You know it too?', 'pleased'],
      ['Even ze peasants know it. I cannot escape zis song.', 'insulted', 'elias', 'Mumbling']
    ])),
    reply("Isn't that a child's song?", baronConversationSequence([
      ['Child? Zat is a song fit for a magnificent man!', 'insulted', 'elias'],
      ['He means me!', 'laughing']
    ])),
    reply("I'll leave you to it.", say('Milk, milk, milk her now!', 'pleased', {direction: 'Singing'}))
  ];
  const gift = baronConversationSequence([
    ['Oh my MILK!', 'laughing'],
    ['Here, give him this gift.', 'pleased'],
    ['Elias!', 'displeased'],
    ['My lord?', 'current-smile', 'elias'],
    ['Give young Pip here ₥60 to tip the DJ.', 'pleased'],
    ['Baron, I really must protes—', 'insulted', 'elias'],
    ['Nonsense, nonsense. The man is an artist! A man of culture.', 'displeased'],
    ['Second only to myself.', 'pleased'],
    ['I guess ve can spare the expense. Damned peasant.', 'thinking', 'elias', 'Checking notebook']
  ], 'awardDjDairyGift');
  return reply('I spoke to DJ Dairy.', say('Did he mention me?!', 'pleased', {mustContinue: true, replies: [
    reply("[Lie] Yes, he wouldn't stop raving about you.", gift),
    reply('Not really. He spoke poetically about milk.', say('My favourite subject. Hmmm. Milk.', 'pleased')),
    reply("I can't remember. I was overwhelmed by his musical might.",
      say('Milk, milk, milk my cow!', 'laughing', {direction: 'Singing', mustContinue: true, replies: singing}))
  ]}));
}

export function additionalBaronReplies({used, standing, discoveries, discussedVampires, askedEliasAboutVampires = discussedVampires, spokeToMilo, seducedExecutive, spokeToDjDairy, returnToMenu}) {
  const back = more(returnToMenu);
  const once = (key, option) => ({...option, once: key, consumeOnSelect: true});
  const elias = (text, replies, direction) => say(text, 'self-assured-smirk', {character: 'elias', replies, direction});
  const replies = [];
  if (spokeToDjDairy && !used.has('baronDjDairyFollowup')) {
    replies.push(once('baronDjDairyFollowup', djDairyFollowup()));
  }
  if (used.has('baronKarmaEncounter') && !used.has('finishPoliticalConversion')) {
    replies.push(politicalConversionReply(spokeToMilo));
  }
  if (discoveries.canAskForFreeMilk && !used.has('baronFreeMilk')) {
    const milk = say('Master Pip, I know precisely vhat you are doing.', 'thinking', {
      character: 'elias', enterAction: 'baronFreeMilk', replies: back
    });
    replies.push(once('baronFreeMilk', reply('You know, Baron, I heard communists are opposed to giving their guests free milk.',
      say('ELIAS! GET THIS BOY SOME MILK!', 'displeased', {replies: more(milk), mustContinue: true}))));
  }
  if (used.has('baronFollowing') && used.has('baronWatching')) {
    const assess = () => {
      const {coins = 100, karma = 0} = standing?.() ?? {};
      return {...baronAssessment(coins, karma), replies: back};
    };
    const review = reply("How do you think I'm doing?", assess, 'thinking');
    if (used.has('baronReviewIntro')) replies.push(review);
    const surveillance = surveillanceReply(used, seducedExecutive);
    if (surveillance) replies.push(surveillance);
  }
  if (discussedVampires) {
    const education = elias('Ze Baron is exceptionally well endowed in terms of wealth and body mass. Less so in terms of vhat ve might politely call higher education.', more(
      elias('Or secondary education.', more(elias('Or primary education, for zat matter.', more(
        say('Is it time for milk?', 'pleased', {replies: back})
      ))))
    ), 'Whispers');
    const thanks = say('Thank you, Master Pip.', 'insulted', {character: 'elias', replies: more(education)});
    const demand = say("ELIAS! WHY AREN'T YOU DRINKING MILK?!", 'displeased', {replies: more(thanks)});
    replies.push(once('baronVampire', reply('Is Elias a vampire?',
      say("Vam-pire? If it isn't milk-related, I don't want to know!", 'displeased', {replies: [
        reply('Does he drink milk?', say("Come to think of it, I've never seen him drink milk.", 'pleased', {replies: more(demand)}), 'thinking')
      ]}))));
  }
  if (discoveries.pool) {
    const afterReply = more(() => poolMenu());
    const options = [
      once('baronPoolInnovation', reply('So you filled an existing invention with milk?',
        say('Precisely! You have an excellent grasp of innovation, young Pip!', 'laughing', {replies: afterReply}))),
      once('baronPoolInventions', reply('What else have you invented?',
        say('The milk fountain, the milk balloon, the milk swimming pool...', 'pleased', {replies: [
          reply("Have you invented anything that didn't already exist?",
            say('What a peculiar question.', 'flustered', {replies: afterReply}), 'thinking')
        ]}))),
      once('baronPoolMilkChange', reply('How often do you change the milk?',
        say('Change it?', 'flustered', {replies: afterReply}), 'thinking'))
    ];
    const remaining = () => options.filter(option => !used.has(option.once));
    const poolMenu = () => {
      const choices = remaining();
      return choices.length ? elias('Our lord is a genius.', choices) : returnToMenu();
    };
    if (remaining().length) {
      replies.push(reply('Is that a pool... of milk?',
        say('Yes! One of my greatest inventions! I do love a good cannonball. A very expensive splash!', 'laughing', {replies: [
          reply('You invented the swimming pool?', say('I invented the MILK swimming pool!', 'pleased', {replies: more(poolMenu)}), 'alarmed')
        ]})));
    }
  }
  if (discoveries.pillory && discoveries.attendant && !used.has('baronCommissioner')) {
    replies.push(once('baronCommissioner', reply('You put the Stickman Rights Commissioner in a pillory?',
      () => commissionerDiscussion(askedEliasAboutVampires), 'worried')));
  }
  if (discoveries.fountain) {
    const options = [
      ['baronFountainPoverty', "We can't afford milk, let alone a fountain!", 'Good heavens! Not even a small fountain?', 'flustered', 'alarmed'],
      ['baronFountainInsult', 'How have you survived this long without a brain?', 'Generational wealth, my boy!', 'laughing', 'exasperated'],
      ['baronFountainRequest', 'Perhaps you could buy my family a fountain?', 'And create a competitor? Absolutely not!', 'displeased', 'thinking'],
      ['baronFountainLeave', 'Never mind.']
    ];
    const remaining = () => options.filter(([key]) => !used.has(key));
    const fountainMenu = () => say('Then you must simply buy a milk fountain. What seems to be the problem?', 'displeased', {
      replies: remaining().map(([key, label, text, mood, playerMood]) => once(key, reply(label,
        text ? say(text, mood, {replies: more(() => remaining().length ? fountainMenu() : returnToMenu())}) : null,
        playerMood)))
    });
    if (remaining().length) {
      replies.push(reply('You have a fountain of milk?', say('Do you not?', 'pleased', {
        replies: [reply('People are starving! My family is starving!', fountainMenu(), 'alarmed')]
      })));
    }
  }
  return replies;
}
