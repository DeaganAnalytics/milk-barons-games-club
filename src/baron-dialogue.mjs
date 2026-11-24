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
  const breathing = say('', 'displeased', {direction: 'Heavy breathing', replies: more(exhausted), mustContinue: true});
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
