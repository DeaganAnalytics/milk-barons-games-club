const mood = (text, expression, direction) => ({text, mood: expression, direction});
const smile = text => mood(text, 'blushing', 'Lin smiles.');
const tips = {
  'male-waiter': [
    'A gratuity, sir?', 'Yes.', 'How extraordinarily considerate of you.',
    "Don't people normally tip?", 'Not the sort of people who frequent this establishment, sir.',
    'Continue', mood('My sincerest thanks.', 'pleased')
  ],
  'handlebar-waiter': [
    'A gentleman! A proper gentleman!', "It's only one coin.", 'It is the principle of the matter, sir!',
    'Continue', 'I shall remember this act of generosity until the day I die.',
    "That's a bit dramatic.", 'I take my profession very seriously, sir.'
  ],
  'martini-waiter': [
    'How exceptionally civilised of you, sir.', 'I thought you might appreciate it.',
    'Indeed. My salary is considerably less impressive than my attire.',
    'Really?', 'Appearances are everything in this establishment, sir.'
  ],
  'female-waiter': [
    'Oh! Thank you so much, sir.', "You're welcome.", "It's lovely to be appreciated occasionally.",
    'Rough evening?', 'The Baron is thirsty, sir.', "Isn't he always thirsty?", 'Precisely.'
  ],
  'blonde-waitress': [
    "Awww! Aren't you sweet!", "It's nothing, really.", "I'm going to buy myself something pretty!",
    'What can you buy for one coin?', 'Half of something pretty!', 'Fair enough.'
  ]
};

const linTips = [
  [
    'Oh. Thank you, sir.', 'You deserve it.', "That's very kind of you.",
    "You're very kind too.", 'Thank you.', 'And pretty.', 'Enjoy your milk, sir.', 'Right. Yes. Milk.'
  ],
  [
    "Pip, you don't have to tip me.", 'I know. I want to.', "Aren't you supposed to be paying off your debt?",
    'Some things are more important than money.', "You're a very strange man, Pip.",
    'In a good way?', smile('Yes. In a good way.'), 'Oh...', 'Your milk, Pip.', 'Oh! Yes! Thank you!'
  ],
  [
    mood("Aww, Pip! That's really sweet of you!", 'blushing'), 'You think so?',
    "Of course! You're always finding little ways to brighten my evening.", 'I am?!',
    'Even if some of your questions are absolutely ridiculous.', "I've been trying to think of better ones.",
    "Don't you dare. I've grown rather fond of them.", 'Really?', smile('Really.'),
    'I might need to sit down.', mood('Oh, you silly man!', 'blushing')
  ],
  [
    mood("PIP! You're going to make me blush again!", 'blushing'), 'Again?!', "Oh, don't pretend you haven't noticed!",
    "I genuinely haven't.", 'Good heavens. What am I going to do with you?',
    "I don't know. What would you like to do with me?", "Well, for a start, I'd quite like to spend some time with you when I'm not carrying a tray of milk.",
    'YOU WOULD?!', mood('Yes, you adorable idiot!', 'blushing'), 'Oh my milk.', 'Now, drink your milk before you faint.',
    "This is the best milk I've ever purchased.", "You haven't even tasted it yet!", "Doesn't matter.",
    mood('', 'blushing', 'Lin laughs and smiles affectionately.')
  ],
  [
    'Thank you, sir.', 'I thought you might appreciate it.', 'I appreciate the gratuity.',
    'Does that mean—', mood('It means I appreciate the gratuity, sir.', 'skeptical'),
    'Right.', 'Enjoy your milk.'
  ]
];

export function waiterTipLines(id, relationship, chats) {
  if (id !== 'lin-waitress') return tips[id];
  if (relationship === 'departed') return undefined;
  const tier = relationship === 'alienated' ? 4 : chats >= 8 ? 3 : chats >= 5 ? 2 : chats >= 2 ? 1 : 0;
  return linTips[tier];
}

export const postBanLines = {
  'male-waiter': [
    'Ah. Management has intervened.', 'You knew this would happen?', 'Generosity has a remarkably short lifespan here, sir.'
  ],
  'handlebar-waiter': [
    mood('OUTRAGEOUS!', 'offended'), "That's what I thought.", 'An assault upon the ancient traditions of hospitality!',
    'Continue', mood('An entirely justified assault, naturally, sir.', 'hurried', 'Bull glances towards the nearest security camera.')
  ],
  'martini-waiter': [
    'Naturally, sir.', 'Naturally?', 'Money changing hands without enriching the Baron?',
    'Continue', "I'm astonished you managed it twice."
  ],
  'female-waiter': [
    "Oh. That's a shame.", "I'm sorry.", "Don't apologise, sir. You weren't the one who made that decision."
  ],
  'blonde-waitress': [
    'What?!', "The Baron wasn't getting a cut.", "But he's already got everything!", 'Exactly.', "That's just greedy!",
    'Continue', mood('I mean... economically responsible!', 'hurried', 'Brie glances towards the nearest security camera.')
  ],
  'lin-waitress': [
    'Elias spoke to you?', 'Yes. Sorry.', "Don't be silly. You don't owe me anything.",
    'I just wanted to do something nice.', 'You did, Pip.', 'Continue', 'That matters more than the coin.',
    'Oh...', smile('')
  ]
};

export const linColdPostBan = [
  "I'm aware of the new policy, sir.", 'I would have kept tipping you.', "That won't be necessary.",
  'Lin...', 'Will you be ordering anything, sir?'
];

export const eliasTipIntervention = [
  {text: 'Pip. A brief vord regarding your expenditure.', mood: 'current-smile', direction: 'Elias appears beside Pip.'},
  'BAH! Where did you come from?!', 'Ve have identified rather concerning pattern in your recent transactions.',
  'What pattern?', 'Unauthorised gratuities.', 'You mean tipping?', 'Da. Ve vould appreciate it if you ceased zis practice.',
  "Why? I'm spending money, aren't I?", 'Indeed. However, Baron is not receiving his cut.',
  "That's the entire point of a tip!", 'Precisely. You have identified ze fundamental flaw in zis arrangement.',
  "But it's my money!", {text: 'A rather temporary state of affairs, I assure you.', mood: 'self-assured-smirk', options: [
    [
      'Surely the staff are entitled to a little extra money?', 'Staff remuneration is matter for ze Baron.',
      'And does he pay them well?', 'Baron is exceedingly satisfied vith their salaries.',
      "That's not what I asked.", 'Nevertheless, zat is answer.'
    ],
    [
      "Is there anything the Baron doesn't want a cut of?", 'Losses.', 'Of course.',
      'Excellent. I am pleased ve understand one another.'
    ],
    [
      "Fine. I won't tip them anymore.", 'Vonderful. Your financial behaviour is becoming increasingly aligned vith corporate expectations.',
      'Wonderful.', 'Da. Is precisely vhat I said.'
    ]
  ]}
];
