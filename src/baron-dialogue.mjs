const say = (text, mood = 'pleased', extras = {}) => ({text, mood, ...extras});
const reply = (label, next, playerMood = 'attentive') => ({label, next, playerMood});
const more = next => [reply('Continue', next)];

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

export function baronDanceDialogue(used) {
  const exhausted = say('Good heavens... that was exhausting. Next time, I ought to just fine you.', 'displeased');
  const breathing = say('', 'winded', {direction: 'Heavy breathing', replies: more(exhausted), mustContinue: true});
  const slap = say('I SAID NO!', 'displeased', {
    playerMood: 'alarmed', enterAction: 'baronSlap', replies: more(breathing), mustContinue: true
  });
  const fanRequest = say('The man is an artist! He has no time for the likes of you!', 'displeased', {replies: [
    reply('Oh, okay.', null, 'sorry'),
    reply('Please, Baron, sir? Pretty please?', slap, 'worried')
  ]});
  return say('Not now, boy! This is my favourite song!', 'pleased', {
    replies: used ? [] : [reply('Can I speak to DJ Dairy?', fanRequest, 'thinking')]
  });
}

export const baronKarmaDialogue = {
  reward: say("Pip, my boy! You're beginning to impress me. Here I thought you were just another tiresome little activist.", 'pleased', {replies: more(
    say("In recognition of your demonstrated alignment with our corporate values, I'm awarding you a discretionary short-term performance incentive!", 'laughing', {replies: [
      reply('A what?', say('He is giving you money. Honestly, ze financial literacy of ze peasants... Tsk, tsk.', 'insulted', {character: 'elias', replies: [
        reply('Thanks, I guess.', say('Thanks, I guess.', 'pleased', {speaker: 'Pip', action: 'baronKarmaReward'}), 'sorry')
      ]}), 'thinking')
    ]})
  )}),
  fine: say("Pip, Pip, Pip. I've been exceedingly generous, and you repay me by subjecting my guests to all this COMMUNISM?!", 'displeased', {replies: more(
    say("I'm afraid your conduct necessitates a punitive fiscal adjustment in the form of an extraordinary behavioural compliance levy!", 'displeased', {replies: [
      reply('Sorry, what?', say('Ve are taking your money. Consider it a tax on your unfortunate moral convictions.', 'self-assured-smirk', {
        character: 'elias', replies: more(say('CAPITALISM, BOY! LEARN IT!', 'displeased', {action: 'baronKarmaFine'}))
      }), 'alarmed')
    ]})
  )})
};

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

export function additionalBaronReplies({used, standing, discoveries, discussedVampires, returnToMenu}) {
  const back = more(returnToMenu);
  const once = (key, option) => ({...option, once: key, consumeOnSelect: true});
  const elias = (text, replies, direction) => say(text, 'self-assured-smirk', {character: 'elias', replies, direction});
  const replies = [];
  if (used.has('baronCowFirst')) replies.push(once('baronCowSecond', reply('Why are the guards cows?',
    say("Pip, we've discussed this already. They are not cows. End of story!", 'displeased', {replies: back}))));
  if (used.has('baronFollowing') && used.has('baronWatching')) {
    const assess = () => {
      const {coins = 100, karma = 0} = standing?.() ?? {};
      return {...baronAssessment(coins, karma), replies: back};
    };
    const review = reply("How do you think I'm doing?", assess, 'thinking');
    replies.push(used.has('baronReviewIntro') ? review : once('baronReviewIntro', reply("So, you're clearly watching me.",
      say('Supervising the premises.', 'pleased', {replies: [
        reply('Yes, yes. Supervising.', say("You're learning, young Pip!", 'laughing', {replies: [review]}))
      ]}), 'thinking')));
  }
  if (discussedVampires) replies.push(once('baronVampire', reply('Is Elias a vampire?',
    say("Vam-pire? If it isn't milk-related, I don't want to know!", 'displeased', {replies: [
      reply('But look at him!', elias('Ze Baron is exceptionally well endowed in terms of wealth and body mass. Less so in terms of vhat ve might politely call higher education.', more(
        elias('Or secondary education.', more(elias('Or primary education, for zat matter.', more(
          say('Is it time for milk?', 'pleased', {replies: back})
        ))))
      ), 'Whispers'), 'alarmed')
    ]}))));
  if (discoveries.pool) replies.push(once('baronMilkPool', reply('Is that a pool... of milk?',
    say('Yes! One of my greatest inventions! I do love a good cannonball. A very expensive splash!', 'laughing', {replies: [
      reply('You invented the swimming pool?', say('I invented the MILK swimming pool!', 'pleased', {replies: more(
        elias('Our lord is a genius.', back)
      )}), 'alarmed')
    ]}))));
  if (discoveries.pillory && discoveries.attendant) replies.push(once('baronCommissioner', reply('You put the Stickman Rights Commissioner in a pillory?',
    say('Did I? I delegate so many of these things.', 'pleased', {replies: more(
      elias('Ze Baron is a very busy man. He has considerable quantities of money to count.', back)
    )}), 'worried')));
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
