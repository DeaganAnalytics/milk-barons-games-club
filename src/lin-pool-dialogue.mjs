const line = (text, mood, enterAction, extras) => ({text, mood, enterAction, ...extras});
const pip = (text, extras) => line(text, 'attentive', undefined, {speaker: 'Pip', ...extras});

function insult(clothing) {
  const ending = line('Enjoy your bloody milk!', 'angry', 'linThrowMilk', {
    direction: "Lin throws her glass of milk into Pip's face.",
    ...(clothing ? {action: 'linDepart'} : {options: [['Continue', pip('...', {action: 'linDepart'})]]})
  });
  return [
    "At least they're not prudes like you.", line('Excuse me?!', 'angry'),
    'You heard me.', line(clothing ? 'And to think I actually liked you.' : 'You know what? I actually liked you.', 'hurt'),
    'Lin—', ending
  ];
}

function lifeguardPhraseBranch(phrase, clothing, highKarma) {
  const apology = clothing
    ? highKarma ? [
      "Sorry! I was quoting the lifeguard. That was inappropriate. Will you forgive me?",
      line("You know, if anyone else had said that to me, I wouldn't give them another chance.", 'hurt', 'linApologyKarma'),
      "I'm really sorry.", "But I've seen how you treat people, Pip.",
      'Continue', "I know you're better than that.",
      'I am. I promise.', 'Then bloody well act like it.',
      'Yes, Lin.'
    ] : [
      "Sorry! I was quoting the lifeguard. That was inappropriate. Will you forgive me?",
      line('You stole their clothes and now you’re making jokes about it?', 'hurt', 'linApologyKarma'),
      "I didn't mean it like that!", "I'm not interested in your excuses anymore.",
      'Lin, please.', line('Will you be ordering any milk, sir?', 'skeptical', 'alienateLin')
    ] : [
      'Sorry! I was quoting the lifeguard. That was inappropriate.', 'Extremely inappropriate.',
      'Will you forgive me?', "You're an idiot, Pip.",
      'I know.', 'A complete idiot.',
      'I know.', "Fine. But don't ever call women that again.",
      "I won't.", line('Good.', 'skeptical', 'linApologyKarma')
    ];
  return [
    `I wanted to see some aristocratic ${phrase}.`, line(clothing ? 'You really are disgusting!' : 'You wanted to see WHAT?!', 'angry'),
    'Continue', pip('OW!', {enterAction: 'linBunniesSlap', direction: 'Lin slaps Pip.', playerMood: 'alarmed',
      options: [apology, insult(clothing)]})
  ];
}

export function linPoolJealousy(heardBeauties) {
  const reassurance = [
    ['That\'s okay. This place does have rather loose morals.', "That's putting it politely.",
      'Very politely.', line("I'm glad you're not like some of the other men here.", 'blushing')],
    ['I only have eyes for you.', line('Oh, stop it.', 'blushing'), "It's true!",
      line("You're going to make me blush, you idiot.", 'blushing', undefined, {direction: 'Lin smiles.'})],
    ["You actually thought I'd be interested in a waitress?", line('...', 'hurt'),
      "Come on. You didn't seriously think that, did you?", line('Apparently I was mistaken about more than just the pool.', 'hurt'),
      'Lin—', line('Milk is ₥2 a glass, sir.', 'skeptical', 'linCruelRejection')]
  ];
  const reassure = (label, action) => [
    label, line('Oh, good.', 'blushing', action), 'Continue',
    line('Sorry. I suppose I thought rather poorly of you.', 'hurt', undefined, {options: reassurance})
  ];
  return [
    'Hi, Lin!', line('Hmph. Hi yourself.', 'skeptical'),
    "What's wrong?", "You've been spending an awfully long time around the milk pool.",
    'Have I?', line("Don't pretend you haven't noticed.", 'skeptical', undefined, {options: [
      [
        "I owe the Baron a lot of money. I'm just trying to make myself useful.", 'Oh.',
        'Continue', line("So you weren't there for any other reason?", 'skeptical', undefined, {options: [
          reassure('No, of course not.'),
          reassure('[Lie] No, of course not.', 'linReassuranceLie'),
          [
            'Well, I heard there were naked women.', line('Oh. How terribly exciting for you.', 'angry'),
            'Well, naturally I was curious—', pip('OW!', {enterAction: 'linAlienatingSlap', direction: 'Lin slaps Pip.', playerMood: 'alarmed'}),
            'Continue', 'Perhaps one of them can serve you milk from now on.',
            'But—', line('Good evening, sir.', 'skeptical')
          ]
        ]})
      ],
      ...(heardBeauties ? [lifeguardPhraseBranch('beauties', false)] : [])
    ]})
  ];
}

export function linClothingConfrontation({clothing, heardBunnies, heardBeauties, karma}) {
  const phrase = heardBunnies ? 'bunnies' : heardBeauties ? 'beauties' : null;
  const positive = karma > 0;
  return [
    'Hi, Lin!', line(clothing === 'man' ? "I hear you've been stealing clothes from the milk pool." : "I hear you've been stealing women's clothes.", 'angry'),
    'Oh...', line('Honestly, Pip. I thought better of you.', 'hurt'),
    'I can explain.', line('This should be good.', 'skeptical', undefined, {options: [
      ['The lifeguard paid me to do it. I need the money.', ...(positive ? [
        "You're really struggling with that debt, aren't you?", 'You have no idea.',
        'I suppose desperate people do desperate things.', 'Exactly.',
        "Just promise me you won't make a habit of it.", 'I promise.'
      ] : [
        "You've certainly found plenty of immoral ways to make money.", "I'm trying to pay off my debt!",
        'And does that excuse everything?', 'No...', 'I suggest you give that some thought.'
      ])],
      ...(clothing === 'all' ? [[
        "To be fair, I took everyone's clothes.", 'Oh, well, that makes it perfectly acceptable then!',
        "No, I mean I took the man's clothes too.", 'And?',
        "It wasn't about seeing naked women. The lifeguard paid me for every pile.", 'Oh.',
        "I'm trying to pay off my debt, Lin.", 'I suppose that makes a little more sense.',
        "I'm an opportunist, not a pervert.", 'What a reassuring distinction.',
        'Thank you.', "That wasn't entirely a compliment."
      ]] : []),
      [
        '[Lie] I thought someone had left them behind. I took them to lost and found.',
        line('Oh! Is that what happened?', 'skeptical', 'linClothingLie'),
        "Of course. I wouldn't just steal someone's clothes.", "That's actually rather considerate of you.",
        'I do try.', 'Sorry for doubting you, Pip.', "Don't worry about it."
      ],
      [
        "[Lie] I didn't steal anyone's clothes.", 'Really?',
        'Absolutely not.', ...(positive ? [
          line("Well, you don't strike me as the sort of person who would do something like that.", 'skeptical', 'linClothingLie'),
          'Exactly!', "I suppose I shouldn't listen to every bit of gossip in this place.", 'Definitely not.'
        ] : [
          line('Do you really expect me to believe that?', 'skeptical', 'linClothingLie'),
          'Yes?', 'At least have the decency to be honest with me.',
          'Lin...', line("Don't bother, Pip.", 'hurt', 'alienateLin')
        ])
      ],
      ...(phrase ? [lifeguardPhraseBranch(phrase, true, karma > 5)] : [])
    ]})
  ];
}
