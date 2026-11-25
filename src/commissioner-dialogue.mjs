export const commissionerMoods = ['sad', 'despondent', 'frowning', 'stressed', 'deadpan'];
const [sad, despondent, frowning, stressed, deadpan] = commissionerMoods;
const guardWarning = {
  text: "No, no, no! What a ridiculous claim! Spreading such rumours is a dangerous game!",
  character: 'pillory-attendant',
  mood: 'self-assured',
  replies: [{
    label: 'But she just said—', playerMood: 'alarmed', next: {
      text: "I... um... I'd rather not talk about it. I don't want to attract any more attention.",
      mood: stressed, replies: [], action: 'attendantMilkBalloon'
    }
  }]
};
export function createCommissionerConversation() {
  const menu = {text: '', mood: sad, replies: []};
  const back = [{label: 'Continue', playerMood: 'attentive', next: menu}];

  function exchange(steps, replies = back) {
    return steps.reduceRight((next, [label, text, mood, playerMood = 'thinking']) => ({
      label, playerMood, next: {text, mood, replies: next ? [next] : replies}
    }), null);
  }

  const introduction = {
    text: 'Please... help me.',
    mood: stressed,
    replies: [exchange([
      ['Who are you?', "I'm the Stickman Rights Commissioner. Or at least, I was.", sad],
      ['What happened?', 'I asked the Baron to increase milk rations for the poor. I thought if I presented enough evidence, he might listen.', sad],
      ['And he put you here?', 'He called it a public consultation exercise.', deadpan, 'alarmed'],
      ['A public consultation?', 'Apparently, the public is invited to express its opinion of my work through milk balloons.', frowning],
      ['How long have you been here?', "I've lost track of the days. Nobody will tell me when I'm being released.", despondent, 'worried'],
      ['Is there anything I can do?', "I don't know anymore. You're the first person who's stopped to speak to me without throwing something.", sad, 'worried']
    ])]
  };


  const thankHer = {
    ...exchange([['My family is struggling. Thank you for standing up for us.', "I'm not sure it was worth it.", despondent, 'attentive']]),
    once: 'thankCommissioner',
    consumeOnSelect: true
  };

  const play = exchange([["I'm going to play the game.", "Why...? Please don't.", stressed, 'attentive']], []);
  const reconsider = {label: "Maybe I won't.", next: null};
  const dismiss = exchange([["Screw you and your stickman rights. I'm going to be wealthy!", '...Why did I even bother?', despondent, 'attentive']], []);
  let offerUsed = false;
  let canPickpocket = false;
  let met = false;

  const moneyOutcome = (label, text, mood, action) => ({
    label,
    next: () => {
      offerUsed = true;
      if (!action) canPickpocket = true;
      return {text, mood, replies: [], action};
    }
  });

  const askForHelp = exchange([[
    "I need ₥200 to be free of the Baron. I don't have much choice.",
    "Please... if you need coin, I have some in my pocket. Take it... Just don't throw the balloon.",
    sad
  ]], [
    moneyOutcome('Thank you, I appreciate it.', 'I hope you make it out of here.', sad, 'commissionerGift'),
    moneyOutcome("No, I think I'll still throw the balloon.", "Please... Haven't I suffered enough?", stressed),
    moneyOutcome("Thanks for the coin. I'm still going to play.", "What...? But you... Oh, what's the point?", despondent, 'commissionerBetrayal')
  ]);

  const pickpocket = {
    label: '<Pickpocket the Commissioner>',
    once: 'pickpocketCommissioner',
    consumeOnSelect: true,
    next: {
      text: 'What are you doing?! GUARDS! GUARDS!', mood: stressed, mustContinue: true,
      replies: [{label: 'Continue', next: {
        text: '...', mood: frowning, mustContinue: true,
        replies: [{label: 'Continue', next: {
          text: 'Why do I bother?', mood: despondent, action: 'commissionerTheft'
        }}]
      }}]
    }
  };

  menu.replies.push(
    thankHer,
    {...play, next: () => ({
      ...play.next,
      replies: offerUsed ? [reconsider, dismiss] : [reconsider, askForHelp, dismiss]
    })},
    exchange([
      ['Am I crazy, or are the guards cows?', "You're... not... crazy.", deadpan, 'worried'],
      ['So they are cows?', 'Yes.', deadpan]
    ], [{label: 'Continue', playerMood: 'attentive', next: guardWarning}])
  );

  return (played = false) => {
    if (!met) {
      met = true;
      return introduction;
    }
    if (canPickpocket) {
      menu.replies.push(pickpocket);
      canPickpocket = false;
    }
    return played ? {...menu, text: "Oh... it's you. You're just like all the rest.", mood: despondent} : menu;
  };
}
