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

  const introductionStart = [
    ['Who are you?', "I'm the Stickman Rights Commissioner. Or at least, I was.", sad],
    ['What happened?', 'I asked the Baron to increase milk rations for the poor. I thought if I presented enough evidence, he might listen.', sad],
    ['And he put you here?', 'He called it a public consultation exercise.', deadpan, 'alarmed']
  ];
  const publicConsultation = ['A public consultation?', 'Apparently, the public is invited to express its opinion of my work through milk balloons.', frowning];
  const timeInPillory = ['How long have you been here?', "I've lost track of the days. Nobody will tell me when I'm being released.", despondent, 'worried'];

  function introduction(played, splattered) {
    const text = played ? "Oh... it's you. Come to throw another balloon?"
      : splattered ? 'Please... not another one.' : 'Please... help me.';
    const consultation = played
      ? [['A public consultation?', "Yes. You've already participated.", deadpan]]
      : [publicConsultation];
    if (splattered && !played) {
      consultation.push(['Does everyone throw them?', 'Some even come back for another turn.', despondent]);
    }
    const finalReply = played ? "Haven't you done enough?"
      : splattered ? "Just... please don't be like the others."
        : "I don't know anymore. You're the first person who's stopped to speak to me without throwing something.";
    return {
      text,
      mood: played ? despondent : stressed,
      replies: [exchange([
        ...introductionStart,
        ...consultation,
        timeInPillory,
        ['Is there anything I can do?', finalReply, played ? frowning : sad, 'worried']
      ])]
    };
  }

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

  const poolTopic = 'commissionerMilkPool';
  const poolBranches = [
    exchange([['I just thought it was cool.', 'What... are you? A... child?', frowning]]),
    exchange([
      ["Apparently, it's good for your skin.", 'How... is this... relevant?', deadpan],
      ['It might help you see the bright side of all this?', 'God help me.', despondent]
    ]),
    exchange([
      ['Just another display of wastefulness.', "Be quiet! That's how I ended up here.", stressed],
      ['By complaining about the pool?', "I'm surrounded by idiots.", frowning]
    ])
  ];
  poolBranches[2].next.direction = 'Whispers';
  const poolQuestion = {
    ...exchange([["Did you know there's a milk pool here?", 'Why... are you telling me this?', deadpan]],
      poolBranches.map(branch => ({...branch, once: poolTopic, consumeOnSelect: true}))),
    once: poolTopic
  };

  let milkQuestionAnswered = false;
  const milkQuestion = {
    label: "What's that on your face?",
    playerMood: 'thinking',
    next: null
  };
  const finishMilkQuestion = {
    label: 'Continue',
    next: () => {
      milkQuestionAnswered = true;
      menu.replies = menu.replies.filter(reply => reply !== milkQuestion);
      return menu;
    }
  };

  return (played = false, splattered = false, seenMilkPool = false) => {
    if (seenMilkPool && !menu.replies.includes(poolQuestion)) menu.replies.push(poolQuestion);
    menu.replies = menu.replies.filter(reply => reply !== milkQuestion);
    if (splattered && !milkQuestionAnswered) {
      milkQuestion.next = {
        text: played ? 'Milk. You put it there...' : 'Milk. It drips off eventually.',
        mood: played ? frowning : deadpan,
        mustContinue: true,
        replies: [finishMilkQuestion]
      };
      menu.replies.push(milkQuestion);
    }
    if (!met) {
      met = true;
      return introduction(played, splattered);
    }
    if (canPickpocket) {
      menu.replies.push(pickpocket);
      canPickpocket = false;
    }
    return played ? {...menu, text: "Oh... it's you. You're just like all the rest.", mood: despondent} : menu;
  };
}
