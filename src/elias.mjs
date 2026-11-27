import {HALL_CENTER, isNpcBlocked, ROOM_HEIGHT, ROOM_WIDTH, routeAroundBaron} from './room.mjs';

export const eliasPost = {x: HALL_CENTER.x + 145, y: HALL_CENTER.y + 130};

export const elias = {
  id: 'elias', title: 'Elias', ...eliasPost, radius: 22,
  message: "Elias. The Baron's right-hand man and accountant."
};

export const eliasPortraits = [
  'devious', 'insulted', 'evil-laugh', 'self-assured-smirk',
  'thinking', 'current-smile', 'laugh', 'demonic-angry', 'worried', 'reading-figures'
];

const continueTo = next => ({label: 'Continue', playerMood: 'attentive', next});
const welcomeEnd = {
  label: 'I have no more questions.', playerMood: 'attentive', next: {
    text: 'Vonderful. I vish you a most profitable evening, Master Pip.',
    mood: 'current-smile', action: 'finishEliasWelcome'
  }
};
const questions = {text: 'Now, Master Pip, do you have any questions?', mood: 'current-smile', replies: []};
const questionLines = [
  [["I didn't do it!", 'Zat is not a question.', 'insulted', 'alarmed']],
  [['How did I get here?', 'Ah... one of ze great secrets of ze universe.', 'devious']],
  [
    ['What is this place?', 'Ah! I am delighted you asked.', 'laugh'],
    ['Continue', "It is ze Baron's pride and joy. A place vere ze finest members of ze Milk Aristocracy come to mingle, to vheel and deal.", 'current-smile'],
    ['Continue', 'A house of amusement, of profligate pleasure, of economic efficiency and, above all... profitability.', 'self-assured-smirk'],
    ['I thought the Milk Baron made his money from milk?', 'Da! But he keeps his fortune by selling pleasure and amusement!', 'laugh']
  ],
  [['How do I double my money?', 'As an aspiring capitalist, I am sure you vill figure it out. Zis establishment offers many delightful games through vich you may multiply your fortune.', 'self-assured-smirk']],
  [
    ['Are those guards cows?', 'Nyet.', 'insulted'],
    ["But they've got horns!", 'Ve have a rather distinctive staff uniform.', 'current-smile'],
    ['And tails!', 'A particularly distinctive staff uniform.', 'self-assured-smirk']
  ],
  [
    ['Can I just leave?', 'Certainly! Upon settlement of your outstanding financial obligations.', 'current-smile'],
    ['And if I leave before then?', 'I vould advise against testing our debt recovery procedures.', 'devious', 'worried']
  ],
  [
    ['Does my family know where I am?', 'I cannot comment on ze knowledge of third parties.', 'thinking', 'worried'],
    ["That's not very reassuring.", 'Reassurance is not among my professional responsibilities.', 'insulted', 'worried']
  ]
];
const revolutionConclusion = exchange([
  ['Continue', 'Our security personnel are predominantly of rural origin.', 'current-smile'],
  ['And they have no interest in revolutionary politics?',
    'Master Pip, ve have yet to encounter a political grievance zat could not be resolved vith a bucket of oats.', 'self-assured-smirk',
    'thinking', {replies: [
      [["What sort of people are you employing?!", 'Exceptionally cost-effective ones.', 'reading-figures', 'alarmed']],
      [
        ["You're paying your employees in oats?!", 'Nyet. Ze oats are a performance incentive.', 'insulted', 'alarmed'],
        ['And their wages?', 'Zey have yet to request any.', 'current-smile'],
        ["That's exploitation!", 'Zat is an allegation best made by ze employees themselves.', 'self-assured-smirk']
      ],
      [
        ['Even the most ignorant worker can develop class consciousness!', 'Perhaps you vould like to conduct a seminar.', 'thinking'],
        ['I would!', 'Vonderful. I recommend bringing your own oats.', 'self-assured-smirk']
      ],
      [
        ["Why do I get the feeling you're leaving something out?", 'Perhaps you are naturally suspicious.', 'devious'],
        ["I'm a revolutionary.", 'Da. A rather expensive form of paranoia.', 'self-assured-smirk']
      ]
    ].map(lines => exchange(lines, questions))}]
], questions).next;

const revolution = [
  ['Are you not afraid of the inevitable proletarian revolution?', 'Nyet. Ze Dairy Aristocracy has largely resolved zat particular problem.',
    'current-smile', 'thinking', {replies: [
      [
        ['You cannot suppress class consciousness forever!', 'Ve have found it considerably easier to recruit employees vithout it.', 'thinking'],
        ['How?', 'A rather innovative agricultural recruitment programme.', 'self-assured-smirk']
      ],
      [
        ['Through the violent suppression of the working class, no doubt!', 'Ve prefer preventative measures.', 'current-smile'],
        ['Propaganda?', 'Selective breeding.', 'thinking'],
        ['WHAT?!', 'Of loyalty, Master Pip. Loyalty.', 'worried', 'alarmed']
      ],
      [
        ['How exactly does one prevent a revolution?', 'Ze secret lies in recruitment, Master Pip.', 'devious'],
        ['Recruiting loyal workers?', 'Preferably before zey develop political opinions.', 'self-assured-smirk']
      ]
    ].map(lines => exchange(lines, revolutionConclusion))}]
];

const revolutionaryLiterature = [
  ["Perhaps they should read Karl Curd's The Means of Milk Production!", 'Ve actually experimented vith an employee literacy programme.', 'thinking'],
  ['And?', 'Ze reading material proved considerably more popular as a dietary supplement.', 'current-smile'],
  ['THEY ATE THE BOOKS?!', 'Da. Ze hardcover editions proved particularly unpopular.', 'self-assured-smirk', 'alarmed', {replies: [
    [
      ['They consumed one of the greatest works of political philosophy ever written?!',
        'Da. Although consumption declined considerably during ze chapter on agricultural collectivisation.', 'thinking', 'alarmed'],
      ['Why?!', 'Ve suspect indigestion.', 'current-smile']
    ],
    [
      ['What the hell is wrong with your employees?', 'Very little, according to our veterinarian.', 'current-smile'],
      ['YOUR WHAT?!', 'Vas zere anything else, Master Pip?', 'self-assured-smirk', 'alarmed']
    ],
    [
      ["Then I'll read it aloud to them!", 'An excellent idea.', 'current-smile'],
      ['Really?', 'Da. Zey respond rather vell to soothing voices.', 'thinking'],
      ["It's revolutionary literature, not a bedtime story!", 'I vould recommend keeping your movements slow and deliberate.', 'self-assured-smirk']
    ]
  ].map(lines => exchange(lines, questions))}]
];

const revolutionaryThreat = [
  ['One day, the workers will seize everything the Baron owns!', 'Ve have taken considerable precautions against such an eventuality.', 'current-smile'],
  ['Even your own employees will turn against you!', 'Our security personnel have demonstrated remarkably little revolutionary sentiment.',
    'thinking', 'thinking', {replies: [
      revolutionaryLiterature,
      [
        ["What's stopping your employees from forming a union?", 'Zey already congregate in large groups.', 'current-smile'],
        ["That's not the same thing!", 'Da. Zere is considerably less paperwork.', 'self-assured-smirk'],
        ['Have they ever collectively demanded better working conditions?', 'Once.', 'thinking'],
        ['HA! CLASS CONSCIOUSNESS!', 'Ve opened a window.', 'current-smile', 'alarmed'],
        ['Oh.', 'Industrial harmony vas immediately restored.', 'self-assured-smirk']
      ],
      [
        ['Perhaps I should recruit your security personnel into the revolutionary movement!', 'I vould be fascinated to observe your efforts.', 'devious'],
        ['Workers of the world, unite!', 'You have nothing to lose but your—', 'thinking'],
        ['CHAINS!', 'Da. Although I believe ve removed those several years ago.', 'current-smile', 'alarmed'],
        ['Excuse me?', 'A modernisation of our employee management practices.', 'thinking'],
        ['WHAT KIND OF ESTABLISHMENT IS THIS?!', 'A highly profitable one.', 'self-assured-smirk', 'alarmed']
      ],
      [
        ['Your employees and I have more in common than you realise.', 'An intriguing assertion.', 'thinking'],
        ['We are all victims of capitalist exploitation!', 'Da. Although most of our security personnel appear considerably happier than you.', 'current-smile'],
        ['Because they lack political education!', 'Perhaps. Or perhaps zey simply enjoy ze grass.', 'thinking'],
        ['What?', 'Ze grounds are exceptionally vell maintained.', 'self-assured-smirk']
      ]
    ].map(lines => exchange(lines, questions))}]
];

const standardQuestionCount = questionLines.length;
questionLines.push(
  revolution,
  [
    ['Elias, you are a worker too! Why do you serve the capitalist class?', 'Ze capitalist class provides me vith an exceptionally generous salary.', 'reading-figures'],
    ['Where is your class solidarity?!', 'Included in my annual performance bonus.', 'self-assured-smirk']
  ],
  [
    ["Why shouldn't this establishment belong to the people?", 'Because ze people did not purchase it.', 'current-smile'],
    ['It was built upon the exploitation of their labour!', 'Da. An exceedingly profitable arrangement.', 'self-assured-smirk']
  ],
  revolutionaryThreat
);

const revolutionaryFarewell = exchange([
  ['LONG LIVE THE REVOLUTION!', 'And may it generate considerable taxable revenue.', 'self-assured-smirk', 'alarmed'],
  ['Continue', 'I vish you a most profitable evening, Master Pip.', 'current-smile', 'attentive',
    {action: 'finishEliasWelcome', replies: []}]
], questions);

questions.replies = [
  ...questionLines.map((lines, index) => ({
    ...exchange(lines, questions), once: 'eliasWelcome:' + index, consumeOnSelect: true,
    ...(index >= standardQuestionCount ? {requiresDisposition: 'communist'} : {})
  })),
  {...revolutionaryFarewell, requiresDisposition: 'communist'},
  welcomeEnd
];

const welcomeSections = [
  {
    text: "Velcome, velcome to ze Milk Baron's Games Club! Ah, Master Pip. Ve have been expecting you.",
    mood: 'current-smile', playerMood: 'attentive', choices: [
      [['Where am I?', "Ze Milk Baron's Games Club. I believe I just established zis.", 'self-assured-smirk']],
      [['How do you know my name?', 'Ve make it our business to know such things.', 'devious', 'worried']],
      [['BAH! A VAMPIRE!', 'Accountant, Master Pip. Accountant.', 'insulted', 'alarmed']],
      [['Lovely establishment.', 'Ah! A young man of discerning taste!', 'laugh']],
      [['I refuse to recognise the legitimacy of this bourgeois establishment!',
        'Fortunately, Master Pip, ze legitimacy of zis establishment is not dependent upon your recognition.', 'self-assured-smirk', 'exasperated']]
    ]
  },
  {
    text: 'His Excellency, ze Milk Baron, has taken a most considerable interest in you. Your activism at Milk University has not gone unnoticed.',
    mood: 'thinking', choices: [
      [['Someone has to stand up for the working class!', 'Ah, ze enthusiasm of youth.', 'self-assured-smirk']],
      [['I was exercising my democratic rights!', 'Da. Rather expensively, as it turns out.', 'devious']],
      [['Has he? Is there a job opportunity?', 'In a manner of speaking.', 'self-assured-smirk']],
      [['Oh God. Am I in trouble?', 'Let us not get ahead of ourselves.', 'current-smile', 'worried']],
      [['The means of milk production belong to the workers!', 'An interesting theory. Ze ownership documents suggest otherwise.', 'reading-figures', 'exasperated']]
    ]
  },
  {text: 'You are a most intriguing young stickman. Ambitious, resourceful, and, if I may be so bold... delightfully impressionable.', mood: 'devious', playerMood: 'worried'},
  {
    text: "Unfortunately, your most recent protest resulted in considerable damage to ze Baron's property holdings. You are now indebted to His Excellency to ze sum of ₥100.",
    mood: 'insulted', playerMood: 'alarmed', choices: [
      [['A HUNDRED MILK TOKENS?!', 'Da. Your numeracy is most encouraging.', 'self-assured-smirk', 'alarmed']],
      [["I didn't do it!", 'An assertion of remarkably little financial significance.', 'insulted']],
      [["I can't afford that!", 'Ve are acutely avare of your financial circumstances.', 'reading-figures', 'worried']],
      [['The Baron is rich! He can afford it!', 'How do you suppose he remains rich, Master Pip?', 'devious']],
      [['The proletariat owes nothing to its capitalist oppressors!', 'Ze proletariat currently owes precisely one hundred milk tokens.', 'reading-figures', 'exasperated']]
    ]
  },
  {
    text: 'But ze Baron is a generous man. Rather than demand immediate repayment, he vishes to play a little game.',
    mood: 'self-assured-smirk', choices: [
      [['What sort of game?', 'One of considerable educational value.', 'thinking']],
      [["I don't like the sound of this.", 'Your enthusiasm is not a prerequisite.', 'insulted', 'worried']],
      [['I like games!', 'Excellent! Zis should be a most productive evening.', 'laugh', 'happy']],
      [['Can I refuse?', 'Nyet.', 'insulted']],
      [['I refuse to participate in the games of the bourgeoisie!',
        'An admirable commitment to principle, Master Pip. Unfortunately, participation is compulsory.', 'devious', 'exasperated']]
    ]
  },
  {
    text: 'Here is a sum of ₥100. If you can double zis investment to ₥200, you vill have proven yourself a true capitalist.',
    mood: 'current-smile', choices: [
      [["Wait. You're giving me money because I owe you money?", 'Da. Capital investment.', 'current-smile']],
      [["Can't I just give you this money back?", 'Vhere is ze profit in zat?', 'thinking']],
      [['What if I make more than ₥200?', 'Ah! You are already beginning to think like a capitalist!', 'laugh']],
      [['That sounds easy enough.', 'I admire your optimism.', 'self-assured-smirk']],
      [
        ['I shall redistribute this capital amongst the working class!', 'You are free to redistribute it as you vish, provided you return twice ze amount.', 'current-smile'],
        ["That's not how communism works!", 'Da. Zat is precisely vhy ve do not practise it.', 'self-assured-smirk', 'exasperated']
      ]
    ]
  },
  {
    text: 'But should you lose ze money... vell, it is off to ze dairy for you, as an indentured servant.',
    mood: 'demonic-angry', playerMood: 'alarmed', choices: [
      [["THAT'S SLAVERY!", 'Indentured servitude, Master Pip. Ze distinction is important to our legal department.', 'insulted', 'alarmed']],
      [
        ['What happens at the dairy?', 'Vork.', 'current-smile'],
        ['What sort of work?', 'Considerable quantities of it.', 'self-assured-smirk']
      ],
      [["Surely that's illegal?", 'His Excellency maintains an excellent relationship vith ze legislature.', 'devious']],
      [['I suppose there are worse things.', 'Da. Although relatively few.', 'self-assured-smirk', 'worried']],
      [['YOU CANNOT ENSLAVE THE PROLETARIAT! THE WORKERS WILL RISE!',
        'At approximately five every morning, Master Pip. Ze cows require milking.', 'current-smile', 'alarmed']]
    ]
  },
  {text: 'Consider it a most generous opportunity for professional development, Master Pip.', mood: 'self-assured-smirk', playerMood: 'worried'}
];

export const eliasWelcome = welcomeSections.reduceRight((next, {choices, ...line}, section) => ({
  ...line, replies: choices ? choices.map((lines, index) => {
    const option = exchange(lines, next);
    if (index !== choices.length - 1) return option;
    return section < 2 ? {...option, expressesDisposition: 'communist'}
      : {...option, requiresDisposition: 'communist'};
  }) : [continueTo(next)]
}), questions);

function exchange(lines, menu) {
  let replies = [continueTo(menu)];
  for (const [label, text, mood, playerMood = 'thinking', extras] of [...lines].reverse()) {
    replies = [{label, playerMood, next: {text, mood, replies, ...extras}}];
  }
  return replies[0];
}

export const eliasPokieBan = {
  text: 'Ahem. Master Pip, ve have a little problem.',
  mood: 'thinking',
  replies: [exchange([
    ["What's wrong?", 'According to my calculations, you have become an unprofitable customer.', 'thinking'],
    ["Isn't the whole point of gambling to win money?", 'Da! For ze establishment.', 'self-assured-smirk'],
    ['So what are you saying?', 'Following a comprehensive financial review, your pokie machine privileges have been revoked.', 'insulted'],
    ["Because I'm winning?!", 'Precisely. Your continued participation presents an unacceptable risk to shareholder value.', 'devious', 'alarmed'],
    ["That's ridiculous!", 'Might I suggest one of our other games? Preferably one at vhich you are considerably less competent.', 'current-smile', 'alarmed'],
    ['Continue', 'Oh, and one more thing. Ze Baron has decreed zat you must pay an extraordinary profits tax of fifty per cent.', 'devious'],
    ['FIFTY PER CENT?!', 'Da. Extraordinary profits require extraordinary taxation.', 'self-assured-smirk', 'alarmed'],
    ['Does the Baron pay this tax when he makes extraordinary profits?', 'Vhat a ridiculous question! Of course not.', 'insulted'],
    ['How is that fair?!', 'Master Pip, fairness is not a recognised accounting principle.', 'thinking', 'alarmed'],
    ["And what if I'd lost all my money?", 'Zen ve vould have appreciated your patronage.', 'devious'],
    ['This whole place is a scam!', 'A highly profitable enterprise, Master Pip. Please use ze correct terminology.', 'self-assured-smirk', 'alarmed',
      {replies: [], action: 'collectPokieTax'}]
  ])]
};

export const eliasPokieRefusal = {
  text: 'No, no, Master Pip. Ve have discussed zis. Your business is no longer appreciated.',
  mood: 'insulted'
};

const regularExchanges = [
  [
    ['Why are the guards cows?', 'Zey are not. I am unsure of ze purpose of zis question. Is zis another one of your little activist games?', 'insulted'],
    ['But the horns...', 'ZEY ARE NOT COWS!', 'demonic-angry', 'alarmed']
  ],
  [
    ['Who are you?', 'I am Elias.', 'current-smile'],
    ['But who are you in relation to the Baron?', 'I am his accountant.', 'self-assured-smirk'],
    ['His accountant?!', 'Vhy, da! Someone must manage all his money!', 'laugh', 'alarmed']
  ],
  [
    ['Are you a vampire?', 'No. Vampires do not exist.', 'worried', 'thinking', {mustContinue: true}],
    ['But you look like a vampire.', 'I assure you, I am not.', 'insulted', 'thinking', {mustContinue: true}],
    ['Do you want some garlic?', 'VHO HAS GARLIC?!', 'worried', 'thinking', {mustContinue: true}],
    ['...', 'I mean... vho has garlic? Yes, garlic for milk. I am particularly fond of milk-flavoured garlic.', 'self-assured-smirk', 'alarmed', {vampireStage: 1}]
  ]
];

const followingExchange = [
  ['Are you following me?', 'Da.', 'current-smile'],
  ['Wait, what?!', 'Naturally, Master Pip. I must account for every single coin you earn or lose. I am an accountant, after all.', 'self-assured-smirk', 'alarmed']
];

const healthExchange = [
  ['Can I die?', 'Da, of course. Everyone can die.', 'current-smile'],
  ['Continue', 'Ahem... almost everyone.', 'worried'],
  ['What?!', 'Nothing.', 'insulted', 'alarmed'],
  ['I mean, can I die in here?', 'Da. Zere are many guards. Stickman guards, not cows, zat is. Vith guns.', 'current-smile', 'worried'],
  ['Continue', 'Perhaps someone hits you. Perhaps you get poisoned. Zere are many vays to die.', 'thinking'],
  ["How will I know if I'm dying?", 'I am your accountant. Naturally, I shall keep track.', 'self-assured-smirk', 'worried'],
  ['Continue', 'See? I have prepared a little chart vith hearts.', 'current-smile']
];

const karmaExchange = [
  ['Are you tracking my... karma?', 'Karma, yes. A very peasant vord. Ve prefer to call it alignment vith ze values of ze Dairy Aristocracy.', 'self-assured-smirk'],
  ['Why?', 'To assess your future employment prospects, of course.', 'devious', 'worried']
];

function milkTokenExchange(menu) {
  const alternatives = [
    exchange([
      ['You said they were worth their weight in gold!', 'Da, according to our internal valuation. Convertibility is an entirely separate matter.', 'self-assured-smirk', 'alarmed'],
      ["So who decides what they're worth?", 'Ze Baron, naturally. A remarkably efficient monetary system.', 'current-smile']
    ], menu),
    exchange([
      ["People recognise gold. I've never seen these before.", 'Milk tokens are ze currency of ze future, Master Pip!', 'laugh', 'thinking']
    ], menu)
  ];
  return [
    ['What are these coins?', 'Milk tokens, of course. Vorth zeir weight in gold. Silly peasant.', 'self-assured-smirk'],
    ['Can I exchange them for gold, then?', 'Vhat?! No! Vhy on earth?', 'insulted', 'thinking', {replies: alternatives}]
  ];
}

function buildConversation(exchanges) {
  const menu = {text: elias.message, mood: 'current-smile', replies: []};
  menu.replies = [...exchanges, milkTokenExchange(menu)].map(lines => {
    const option = exchange(lines, menu);
    return {...option, once: 'Elias: ' + option.label, consumeOnSelect: true, requiresKarmaChange: lines === karmaExchange};
  });
  return menu;
}

export const eliasConversation = buildConversation([...regularExchanges, healthExchange, karmaExchange]);
export const eliasFollowingConversation = buildConversation([...regularExchanges, followingExchange, healthExchange, karmaExchange]);

export function vampireFollowup(menu, stage) {
  if (stage === 1) return {
    label: 'So, about vampires...', playerMood: 'thinking',
    next: {text: 'Ve have discussed zis already, Master Pip.', mood: 'insulted', vampireStage: 2, replies: [continueTo(menu)]}
  };
  if (stage === 2) return {
    label: 'Seriously, you look like a vampire.', playerMood: 'attentive',
    next: {text: 'I shall start fining you for vasting my time.', mood: 'insulted', enterAction: 'eliasVampireFine'}
  };
  return null;
}

const danceFeeReply = {
  label: 'Dancing fee?! What dancing fee?',
  playerMood: 'alarmed',
  next: {
    text: 'Do not be ridiculous, Master Pip. Gentlemen cannot enter a nightclub for free!',
    mood: 'insulted',
    action: 'chargeDanceFee'
  }
};

export const eliasDanceConversation = {
  text: 'Did you enjoy ze dancing, Master Pip?',
  mood: 'current-smile',
  replies: [
    {label: 'Yes.', playerMood: 'attentive', next: {
      text: 'Good, good! I shall deduct ze dancing fee from your account.',
      mood: 'self-assured-smirk', replies: [danceFeeReply]
    }},
    {label: 'No.', playerMood: 'worried', next: {
      text: 'Vell, you vill enjoy zis even less. I shall deduct ze dancing fee from your account.',
      mood: 'devious', replies: [danceFeeReply]
    }}
  ]
};

export function eliasTaxConversation({earnings, due}) {
  const demand = {
    text: `Thirty per cent, Master Pip. Kindly hand over ₥${due}.`,
    mood: 'self-assured-smirk',
    action: 'collectTax'
  };
  return {
    text: `Master Pip! A most profitable series of ventures. Your recent undertakings have earned you ₥${earnings}.`,
    mood: 'current-smile',
    replies: [{
      label: "Thanks! I think I'm getting the hang of it.", playerMood: 'attentive',
      next: {
        text: 'Indeed, indeed. Zere is just ze small matter of taxation.',
        mood: 'devious',
        replies: [{
          label: "Taxation?! I thought the Milk Aristocracy didn't pay tax!", playerMood: 'alarmed',
          next: {text: 'Correct. Zey do not. You do.', mood: 'self-assured-smirk', replies: [continueTo(demand)]}
        }]
      }
    }]
  };
}

export function routeEliasToPip(actor, player, baron, spacing = 38) {
  const radius = 11;
  const spots = [[-spacing, 0], [spacing, 0], [0, -spacing], [0, spacing]]
    .map(([dx, dy]) => ({x: player.x + dx, y: player.y + dy}))
    .filter(({x, y}) => !isNpcBlocked(x, y, radius, baron))
    .sort((a, b) => Math.hypot(a.x - actor.x, a.y - actor.y) - Math.hypot(b.x - actor.x, b.y - actor.y));
  return routeAroundBaron({...actor, radius}, spots[0] ?? player, baron);
}

export function advanceEliasRun(actor, destination, dt, stop, speed = 230) {
  const dx = destination.x - actor.x;
  const dy = destination.y - actor.y;
  const distance = Math.hypot(dx, dy);
  const step = Math.min(speed * dt, Math.max(0, distance - stop));
  if (step) {
    actor.x += dx / distance * step;
    actor.y += dy / distance * step;
    actor.stride = (actor.stride ?? 0) + step * 0.35;
    if (Math.abs(dx / distance) > 0.05) actor.facing = Math.sign(dx);
  }
  actor.running = distance - step > stop + 0.001;
  return !actor.running;
}

export function updateEliasFollow(actor, player, baron, cameraX, cameraY, dt) {
  const left = cameraX + 24;
  const right = cameraX + ROOM_WIDTH - 24;
  const top = cameraY + 66;
  const bottom = cameraY + ROOM_HEIGHT - 28;
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const outside = actor.x < left || actor.x > right || actor.y < top || actor.y > bottom;
  const close = Math.hypot(player.x - actor.x, player.y - actor.y) < 60;
  // Once Pip approaches, hold position until the scrolling camera pushes Elias to an edge.
  const distanceToPip = Math.hypot(player.x - actor.x, player.y - actor.y);
  const approached = actor.lastPipPosition && distanceToPip
    < Math.hypot(actor.lastPipPosition.x - actor.x, actor.lastPipPosition.y - actor.y);
  actor.lastPipPosition = {x: player.x, y: player.y};
  if (close && approached) actor.findingEdge = false;
  if (!outside && !actor.findingEdge) {
    actor.running = false;
    actor.followRoute = null;
    return;
  }

  const x = actor.findingEdge ? right : clamp(actor.x, left, right);
  const y = clamp(actor.y, top, bottom);
  const radius = 11;
  const clear = point => !isNpcBlocked(point.x, point.y, radius, baron, actor);
  const target = [{x, y}, {x: x - 40, y}, {x: x + 40, y}, {x, y: y - 50}, {x, y: y + 50}]
    .find(point => point.x >= left && point.x <= right && point.y >= top && point.y <= bottom && clear(point));
  if (!target) {
    actor.running = false;
    return;
  }

  const waypoint = actor.followRoute?.[0] ?? target;
  const distance = Math.hypot(waypoint.x - actor.x, waypoint.y - actor.y);
  const step = Math.min(distance, 144 * dt);
  if (step && !clear({
    x: actor.x + (waypoint.x - actor.x) / distance * step,
    y: actor.y + (waypoint.y - actor.y) / distance * step
  })) {
    actor.followRoute = routeAroundBaron({...actor, radius}, target, baron);
    actor.running = false;
    return;
  }
  const arrived = advanceEliasRun(actor, waypoint, dt, 0, 144);
  actor.running = step > 0;
  if (outside && !actor.findingEdge && step > 0) actor.hasFollowedPip = true;
  if (arrived) {
    actor.followRoute?.shift();
    if (!actor.followRoute?.length && Math.hypot(target.x - actor.x, target.y - actor.y) < 1) actor.findingEdge = false;
  }
}

export function drawElias(ctx, sprite, actor) {
  const height = 70;
  const width = height * sprite.naturalWidth / sprite.naturalHeight;
  const feet = actor.y + 18;
  ctx.save();
  ctx.translate(actor.x, 0);
  // The source sprite faces left.
  if (actor.facing === 1) ctx.scale(-1, 1);
  if (!actor.running) {
    ctx.drawImage(sprite, -width / 2, feet - height, width, height);
    ctx.restore();
    return;
  }
  const step = Math.sin(actor.stride);
  const bob = Math.abs(step) * 3;
  const lower = Math.round(sprite.naturalHeight * 0.74);
  const half = Math.floor(sprite.naturalWidth / 2);
  const split = lower * height / sprite.naturalHeight;
  const left = -width / 2;
  const top = feet - height - bob;
  for (const side of [-1, 1]) {
    const offset = side === -1 ? 0 : half;
    const sourceWidth = side === -1 ? half : sprite.naturalWidth - half;
    const lift = Math.max(0, side * step) * 5;
    ctx.drawImage(sprite, offset, lower, sourceWidth, sprite.naturalHeight - lower,
      left + offset * width / sprite.naturalWidth + side * step * 3, top + split,
      sourceWidth * width / sprite.naturalWidth, height - split - lift);
  }
  ctx.drawImage(sprite, 0, 0, sprite.naturalWidth, lower, left, top, width, split);
  ctx.restore();
}
