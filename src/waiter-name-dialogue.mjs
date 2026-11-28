export const waiterNameLines = {
  'handlebar-waiter': [
    'Your name is Bull?', 'Correct, sir.',
    'Are you related to the guards?', {text: 'What an extraordinarily offensive question.', mood: 'offended'},
    'Sorry.', {text: 'Apology accepted. I shall endeavour not to hold a grudge.', mood: 'welcoming'},
    'Thank you.', {text: 'Unlike the guards.', mood: 'offended'}
  ],
  'male-waiter': [
    'Your parents actually named you Feta?', 'Indeed, sir.',
    'After the cheese?', 'Correct, sir. My father was particularly fond of dairy products.',
    'What did your mother think?', 'She wanted to call me Cheddar.',
    'Good grief.', 'I consider myself rather fortunate, sir.'
  ],
  'blonde-waitress': [
    'Your parents actually named you Brie?', "I know! Isn't it adorable?",
    "But it's a type of cheese.", "Oh, I know! It's such a cute cheese too!",
    'Cheese can be cute?', "Of course! It's all soft and round!",
    'Right...', "I've always thought Camembert would be a lovely name for a little girl.",
    "Please don't have children.", "Aww! You're funny!"
  ],
  'martini-waiter': [
    'Sterling? Finally, a normal name.', 'Yes, sir. Named after the precious metal silver.',
    "Oh. So it's not a normal name at all.", 'My brother is named Platinum, sir.',
    'Of course he is.', 'My parents have exceptionally expensive tastes.',
    "I'm beginning to wonder if anyone here has a normal name.", "Rather boring things, normal names. Wouldn't you agree, Pip?",
    'Wait. How do you know my name?', 'Company memo, sir.',
    'Memo?', {text: 'Standard corporate procedure.', character: 'elias', mood: 'current-smile'},
    'BAH! Where did you come from?!', "Sir, I've been here the whole time."
  ],
  'female-waiter': [
    'Genevieve?', 'Yes, sir?',
    "That's your actual name?", 'Of course, sir.',
    "It's not some obscure French cheese?", 'No, sir.',
    'A breed of cow?', 'No...',
    'Some sort of precious metal?', 'I was named after my grandmother, sir.',
    'And why was she called Genevieve?', 'I believe her parents liked the name.',
    "That's it?", 'Yes, sir. Is something wrong?',
    "No. That's remarkably normal.", 'Thank you... I think?',
    'You have no idea how reassuring this conversation has been.'
  ],
  'lin-waitress': [
    "Lin. That's a really pretty name.", 'Thank you, sir.',
    'Is it short for anything?', 'No. Just Lin.',
    "That's nice. Really nice, actually.", 'Can I get you something, sir?',
    'No, I just wanted to... um...', 'Yes?',
    'You have really nice eyes.', 'Thank you, sir.',
    'And your hair. I like your hair.', 'Did you want a glass of milk?',
    "Yes! Milk! That's why I'm here. Obviously.", "That'll be ₥2, sir.",
    'Right. Yes. Of course.'
  ]
};

export const sterlingResponses = [
  [
    'But Elias! He was just here!', 'No, sir.',
    'I literally just saw him!', "Perhaps you've had too much milk, sir."
  ],
  [
    "[Shaken] Yeah... Of course. You don't serve garlic, do you?", 'Garlic? No, sir.',
    'Pity.'
  ]
];

export const linCrushLines = [
  [
    'So... is the milk fresh?', 'Yes, sir.',
    'Fresh today?', 'Yes, sir.',
    'And tomorrow?', "We'll have fresh milk tomorrow too, sir.",
    'Excellent. I might come back tomorrow then.', "You're certainly welcome to.",
    'Really?!', "We're open to all paying customers, sir.",
    'Oh. Right.'
  ],
  [
    "Lovely weather we're having.", 'Is it, sir?',
    'Absolutely lovely.', {text: 'Have you been outside recently?', options: [
      ['No.', 'Neither have I.', "Well, statistically, it's probably quite nice.", 'If you say so, sir.'],
      [
        '[Lie] Yes! Just a little while ago.', 'Oh, wonderful. Has the rain stopped?',
        'Yes! Completely.', 'And has that dreadful wind died down?',
        'Absolutely.', "That's strange. Sterling told me it was sunny and perfectly still this morning.",
        'Continue', {text: 'Ah...', speaker: 'Pip', playerMood: 'worried', options: [
          [
            "Alright, I haven't actually been outside.", 'Then why did you say you had?',
            'I wanted to talk to you.', 'You could have just said hello, sir.',
            'In hindsight, yes.'
          ],
          [
            '[Lie] Very localised weather conditions.', 'Really?',
            'Extremely localised. Practically confined to the entrance.', 'How extraordinary.',
            'Meteorologically unprecedented, actually.', "I'll be sure to look out for it when I finish my shift.",
            "Please don't."
          ]
        ]}
      ]
    ]}
  ],
  [
    "Excuse me, where's the milk fountain?", 'Directly behind you, sir.',
    'Ah. Yes. And the pool?', 'Over there, sir.',
    'And where do you normally stand?', 'Here, sir.',
    'Excellent. Very helpful. Thank you.', "You're welcome, sir."
  ],
  [
    "What's your favourite colour?", 'Blue, sir.',
    'NO WAY! Mine too!', 'How lovely.',
    'What shade?', "I haven't given it much thought.",
    "Neither have I! We've got so much in common.", 'Apparently so, sir.'
  ],
  [
    'Do you wash these glasses yourself?', 'Sometimes, sir.',
    "You're very good at it.", 'At washing glasses?',
    'Exceptionally good.', {text: 'We have a dishwasher, sir.', options: [
      ["Well, you've clearly trained it very well.", 'Thank you, sir.'],
      ["And I'm sure you're an exceptionally talented dishwasher operator.", 'Thank you, sir.'],
      [
        'You do?!', 'Yes, sir. The Baron is exceedingly wealthy. Sometimes he even lets us wash our own dishes in it.',
        'You have your own dishes?', 'I can only dream, sir.',
        'Oh...'
      ]
    ]}
  ],
  [
    'Are you working tomorrow?', 'Yes, sir.',
    'And the day after?', 'Yes, sir.',
    'And next week?', 'Sir, are you asking for a copy of my roster?',
    'What? No! That would be weird.', 'Quite.',
    'Unless you have a spare copy...', "I don't, sir."
  ],
  [
    'Excuse me, Lin?', 'Yes, sir?',
    'I had something very important to ask you.', 'Go ahead, sir.',
    '...', 'Sir?',
    'Sorry. I got distracted.', {text: 'By what?', options: [
      ['Nothing! Absolutely nothing!', 'Very well, sir.'],
      [
        'Your eyes.', 'My eyes?',
        'Yes. I was looking into them and forgot what I was going to say.', 'Oh.',
        "They're very distracting.", 'Would you prefer it if I looked elsewhere, sir?',
        'NO!', '...',
        'Sorry. That came out a little louder than intended.', 'Quite, sir.',
        "I'm going to go now.", {text: 'Enjoy your evening, sir.', endChat: true}
      ]
    ]}
  ],
  [
    "You're much better at serving milk than the other waiters.", "That's very kind of you, sir.",
    'Particularly Sterling.', 'Sterling is actually very experienced.',
    "Well, he doesn't have your smile.", "No, I suppose he doesn't.",
    'Or your eyes.', "We're different people, sir.",
    'Thank the Cow for that.'
  ],
  [
    'Do you get many interesting customers?', 'Occasionally, sir.',
    'Anyone particularly memorable?', 'The Baron is rather difficult to forget.',
    'Anyone smaller?', 'Most customers are smaller than the Baron.',
    'Anyone about my height?', 'Sir, are you asking whether I remember you?',
    '...Maybe.', 'You do come over here quite frequently.',
    "You've noticed?!", "It's rather difficult not to, sir."
  ],
  [
    'Hello, Lin.', 'Hello, sir.',
    '...', '...',
    '...', 'Have you run out of questions, sir?',
    'Yes.', "You know, you don't actually need an excuse to say hello.",
    "I don't?!", 'No, sir.',
    'Hello, Lin!', 'Hello, Pip.',
    'You remembered my name!', 'Of course.',
    '...', 'Are you alright?',
    'Never better.'
  ]
];

export const linColdNameLines = [
  "Lin. That's a really pretty name.", 'Thank you, sir.',
  'Is it short for anything?', 'No.',
  "You've got really nice eyes, too.", 'Will you be ordering anything, sir?',
  'I was just trying to get to know you.', "I'm sure Lady Penelope would appreciate your company.",
  'Oh...'
];

export const linPrivateReaction = {
  beforeFlirting: [
    'I hear congratulations are in order, sir.',
    'Oh, not you too.', {text: 'Lady Penelope, was it?', mood: 'skeptical'},
    'Look, it was mostly a financial transaction.', 'How very entrepreneurial of you, sir.',
    'Thank you?', {text: "That wasn't a compliment.", direction: 'Lin slaps Pip.', enterAction: 'linPrivateSlap', mood: 'angry'},
    'OW! What was that for?!', 'Lady Penelope is married, sir.',
    'Yes, but—', 'Will you be ordering any milk, sir?'
  ],
  afterFlirting: [
    {text: 'Hello, Lin!', speaker: 'Pip', playerMood: 'happy'},
    'Continue', "I hear you've been doing some private networking, sir.",
    'Oh, milk. You know too?', 'The entire club knows, sir.',
    "It wasn't what you think!", 'No?',
    'It was a financial transaction!', {text: 'Well, I hope it was profitable.', direction: 'Lin slaps Pip.', enterAction: 'linPrivateSlap', mood: 'angry'},
    'OW!', 'Will you be ordering anything, sir?',
    'Lin, please...', {text: 'Milk is ₥2 a glass, sir.', mood: 'skeptical'},
    'But I really like you!', 'How unfortunate.'
  ]
};

export const linPublicReaction = [
  'Continue', {text: 'Lin! Lovely to see you!', speaker: 'Pip', playerMood: 'happy'},
  'Continue', "Oh, is it? I'm surprised you have time for me.",
  'What do you mean?', "Shouldn't you be upstairs entertaining married women?",
  "Oh... You've heard.", {text: "Yes. Apparently you're considerably more charming when there's money involved.", mood: 'hurt'},
  'Lin, please. It was a financial transaction!', 'How romantic. And here I was thinking you were just an adorably awkward idiot.',
  'You thought I was adorable?!', {text: 'Past tense, Pip.', mood: 'hurt'},
  'But—', {text: 'OW!', speaker: 'Pip', playerMood: 'alarmed', direction: 'Lin slaps Pip.', enterAction: 'linSlap'},
  'Continue', 'Perhaps Lady Penelope can kiss it better.',
  'Lin...', {text: 'And to think I actually looked forward to your stupid little questions.', action: 'linWalkAway', mood: 'hurt'}
];

export const linColdTalkLines = [
  'Can we talk?', 'About your order, sir?',
  'No, about us.', 'There is no us, sir.',
  'Oh...'
];

export const linKindnessLines = [
  "Oh, hello, Lin. Sorry, I'm not having the best evening.", {text: 'I saw what happened. That was terribly unfair.', mood: 'hurt'},
  'Apparently being a decent person is a punishable offence around here.', {
    text: 'Here. Take this.', direction: 'Lin hands Pip a small collection of milk tokens.', enterAction: 'receiveLinGift', mood: 'pleased'
  },
  "What's this?", "Some tips I've collected.",
  "Lin! I can't take your money!", 'Yes, you can.',
  "But you've worked for this!", "And you've been punished for being a good person. There aren't enough of those around here.",
  "I don't know what to say.", "That's a first. Usually you have some ridiculous question for me.",
  'You remember those?', {text: 'Every single one.', mood: 'blushing'},
  'Oh...', "Don't ever let this place change you, Pip.",
  "I won't.", {
    text: "Good. Now, I've got work to do.", direction: 'Lin smiles and returns to her normal duties.',
    enterAction: 'releaseLinFromKindness', mood: 'pleased'
  },
  'Continue', {text: "I think I'm in love.", speaker: 'Pip', playerMood: 'happy', action: 'finishLinKindness'}
];

export const linFinalInsultLines = [
  'Are you still upset about Lady Penelope?', "I'm not interested in discussing your private affairs, sir.",
  "It really didn't mean anything.", {text: 'How lovely for both of you.', mood: 'skeptical', options: [
    [
      "I'm genuinely sorry I hurt you.", 'Thank you, sir.',
      'Can we start again?', 'Will you be ordering any milk?',
      'Right...'
    ],
    [
      "We weren't even together, Lin.", 'No. Thankfully.',
      'So why are you so upset?', 'Because I severely misjudged your character.',
      'Oh.', {text: "Now, if you'll excuse me, I have work to do.", endInteraction: true}
    ],
    [
      "At least Lady Penelope isn't a prude like you.", {text: 'What did you just say?', mood: 'angry'},
      'Perhaps you could learn a thing or two from her.', 'You know what? I spend all day serving milk to horrible, entitled people.',
      'Continue', {text: "For a little while, I thought I'd actually met someone different.", mood: 'hurt'},
      'Lin—', "But you're just another one of them, aren't you?",
      "That's not—", {text: 'You deserve each other.', mood: 'angry', direction: "Lin throws her glass of milk into Pip's face.", enterAction: 'linThrowMilk'},
      'Continue', {text: 'I quit.', mood: 'angry', action: 'linDepartWithRegret'}
    ]
  ]}
];
