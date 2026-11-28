const pipe = (text, mood) => ({text, mood, exactNpcPortrait: true});
const pip = (text, playerMood) => ({text, speaker: 'Pip', playerMood, exactPlayerPortrait: true, mood: 'attentive'});
const choice = (label, playerMood, next) => ({label, playerMood, next});
const options = (line, replies) => ({...line, mustContinue: true, replies});
const ending = (line, action) => ({...line, action});
const sequence = (lines, end) => lines.reduceRight((next, line) =>
  next ? options(line, [choice('Continue', undefined, next)]) : line, end);
const spokenChoice = (label, mood, next) => choice(label, mood, () => sequence([
  pip(label.replace(/^\[Lie\] /, ''), mood)
], typeof next === 'function' ? next() : next));
const respond = (text, mood, lines, end) => spokenChoice(text, mood, sequence(lines, end));

const generalGreetings = [
  pipe('What NOW?!', 'angry'),
  pipe('Make it quick. Some of us have jobs.', 'unimpressed'),
  pipe('Have you nothing better to do?!', 'angry'),
  pipe('This had better be important.', 'unimpressed'),
  pipe('Which part of STAFF ONLY is confusing you?', 'angry'),
  pipe("Oh, wonderful. It's you again.", 'unimpressed'),
  pipe('To what do I owe the inconvenience?', 'smug'),
  pipe('Back to further your education?', 'smug'),
  pipe('Found a job yet?', 'smug'),
  pipe('I see unemployment is keeping you busy.', 'smug'),
  pipe('Ah, my least productive acquaintance.', 'unimpressed'),
  pipe('Another intellectual enquiry, I presume?', 'smug'),
  pipe("I'm up to my elbows in milk. What is it?", 'flustered'),
  pipe("Every minute you spend talking is another minute the Baron's glass remains empty!", 'angry'),
  pipe("Unless you're holding an empty glass and wearing a uniform, I can't help you.", 'attentive'),
  pipe("If you've got time to stand around, you've got time to work.", 'unimpressed'),
  pipe('I fill the glasses. They empty the glasses. Nobody thinks to wash the glasses.', 'flustered'),
  pipe('This is a workplace, not a ploughing social club!', 'angry')
];
const conditionalGreetings = {
  name: [
    pipe('What do you want, Seed?', 'smug'),
    pipe("Pip. Still haven't changed your name, I see.", 'unimpressed')
  ],
  family: [
    pipe("Oh, look. It's my imaginary relative.", 'smug'),
    pipe('We still look nothing alike!', 'angry')
  ],
  friendly: [
    pipe('Oh, hello again. What can I do for you?', 'relieved'),
    pipe("I suppose I've got a moment.", 'attentive'),
    pipe("You're not entirely intolerable, I suppose.", 'relieved')
  ],
  arrogant: [
    pipe('Oh, His Royal Highness has returned.', 'disgusted'),
    pipe('What does the aristocracy require now?', 'smug')
  ]
};

function employment({coins, karma, communist}) {
  const replies = [
    respond("Hey! I've still got time!", 'exasperated', [
      pipe("So has the cow. I reckon she's more worried than you are.", 'smug')
    ])
  ];
  if (coins > 100 && coins < 175) replies.push(respond(
    `I've actually made a profit of ${coins - 100} coins!`, 'happy', [
      pipe('And how much does the Baron expect you to make?', 'attentive'),
      pip('I need to get to two hundred.', 'worried'),
      pipe('Tertiary education.', 'smug')
    ]));
  if (communist) replies.push(respond("I intend to start a workers' revolution there!", 'happy', [
    pipe('Have you ever actually worked on a dairy farm?', 'unimpressed'),
    pip('No.', 'thinking'),
    pipe('Then leave the poor sods alone!', 'angry')
  ]));
  if (coins >= 175) {
    if (karma < -3) replies.push(respond('Here, peasant. Take this coin and shut up.', 'happy', [
      pipe("I'd tell you where to shove it, but I could use the coin.", 'disgusted'),
      pip("That's what I thought.", 'happy'),
      ending(pipe('Plough off.', 'angry'), 'pipeArrogantTip')
    ]));
    else if (karma > 3) replies.push(respond('I think we got off on the wrong foot. Please accept this tip as an apology.', 'sorry', [
      pipe('What? For me?', 'flustered'),
      pip("Of course. You look like you've been working hard.", 'happy'),
      pipe('Well... perhaps I was a bit harsh on you.', 'apologetic'),
      ending(pipe('Much appreciated.', 'relieved'), 'pipeGenerousTip')
    ]));
    else replies.push(respond('Here. Have a coin for your troubles.', 'thinking', [
      pipe("What's this for?", 'flustered'),
      pip('Putting up with idiots like me, I suppose.', 'thinking'),
      ending(pipe('Finally, an educated man with a bit of self-awareness.', 'relieved'), 'pipeNeutralTip')
    ]));
  }
  if (coins < 100) replies.push(respond(`I'm actually down ${100 - coins} coins.`, 'worried', [
    pipe('How many years did you spend at university?', 'smug'),
    pip("I'd rather not say.", 'sorry')
  ]));
  return sequence([pipe("Oh, yes. I've heard about your little game with the Baron.", 'attentive')],
    options(pipe('Good luck at the dairy!', 'smug'), replies));
}

function opening(getState) {
  const university = options(pipe('Have you got a job?', 'unimpressed'), [
    respond('No...', 'sorry', [pipe('Exactly.', 'smug')]),
    spokenChoice('Well, in a manner of speaking, yes.', 'thinking', () => employment(getState())),
    spokenChoice("You could say I'm on a temporary employment contract with the Baron.", 'happy', () => employment(getState()))
  ]);
  const illiterate = options(pipe("Yes, you can. You've got the stench of tertiary education all over you!", 'disgusted'), [
    spokenChoice("What's wrong with tertiary education?!", 'exasperated', university),
    respond('It was a monumental waste of money, actually.', 'thinking', [pipe('Finally, one of you admits it!', 'relieved')]),
    respond('Did you go to university?', 'thinking', [
      pipe('No. I got a job.', 'proud'),
      pip('Doing what?', 'thinking'),
      pipe('WHAT DOES IT LOOK LIKE?!', 'angry')
    ])
  ]);
  const replies = [
    respond('Ohhh... I thought that was the name of the bar.', 'thinking', [
      pipe('Who in their right mind would name a bar Staff Only?', 'unimpressed'),
      pip('I thought it might be exclusive.', 'worried'),
      pipe('IT IS! TO STAFF!', 'angry')
    ]),
    spokenChoice('[Lie] No.', 'thinking', illiterate),
    respond("Sorry! I didn't notice the sign.", 'sorry', [pipe('Well, now you have.', 'unimpressed')]),
    respond('Is that how you speak to customers?', 'exasperated', [
      pipe("You're not my customer.", 'unimpressed'),
      pip('Who is?', 'thinking'),
      pipe('THE STAFF! READ THE PLOUGHING SIGN!', 'angry')
    ]),
    respond('What do you actually do here?', 'thinking', [
      pipe('I fill glasses with milk.', 'proud'),
      pip('Is that difficult?', 'thinking'),
      pipe('Not usually. Unless some idiot keeps interrupting me.', 'unimpressed')
    ])
  ];
  if (getState().communist) replies.push(respond('Greetings, fellow worker!', 'happy', [
    pipe('Where do you work?', 'unimpressed'), pip('Well...', 'worried'),
    pipe('Don\'t you ploughing "fellow worker" me!', 'angry')
  ]));
  return options(pipe("The sign says STAFF ONLY! Can't you read, you ploughing idiot?!", 'angry'), replies);
}

function nameTopic() {
  const close = line => ending(line, 'finishPipeName');
  const shared = sequence([pip("What's your name, then?", 'thinking')], options(pipe('Pipe.', 'proud'), [
    respond("That's basically the same name!", 'exasperated', [
      close(pipe("Your name means seed. I'm named after the milk pipes that power our economy!", 'proud'))
    ]),
    respond("How's that any better?", 'thinking', [
      pipe('By approximately twenty-five per cent.', 'smug'),
      pip('Based on what?', 'thinking'),
      close(pipe("I'VE GOT AN EXTRA LETTER!", 'angry'))
    ]),
    respond("That's the stupidest name I've ever heard.", 'exasperated', [
      close(pipe("Impossible. Your name's Pip.", 'smug'))
    ])
  ]));
  return options(pipe("Pip?! That's the stupidest name I've ever heard.", 'disgusted'), [
    respond('My full name is Pip Squeak.', 'thinking', [
      pipe("I stand corrected. THAT'S the stupidest name I've ever heard.", 'smug')
    ], shared),
    respond("[Lie] It's short for Pippin Percival Ignatius Pemberton von Butterworth. I'm the Baron's nephew.", 'happy', [
      {...pipe("No, you're not. The Baron hasn't got any siblings.", 'unimpressed'), enterAction: 'pipeHeritageLie'}
    ], shared),
    respond("It's not that bad!", 'exasperated', [pipe('Your name means seed.', 'smug')], shared)
  ]);
}

function familyTopic() {
  const close = line => ending(line, 'finishPipeFamily');
  const shared = options(pipe('I, for one, have hair.', 'smug'), [
    respond('[Lie] I shave my head for style.', 'thinking', [
      close(pipe('Whatever helps you sleep at night.', 'unimpressed'))
    ]),
    respond("It's genetic.", 'sorry', [close(pipe("Well, in that case, we're definitely not related.", 'relieved'))]),
    respond('That hurt, man. Low blow.', 'sorry', [close(pipe('You insulted me first.', 'unimpressed'))]),
    respond('Apart from that, we look exactly the same!', 'exasperated', [
      pipe("I've never seen anyone who looks less like me!", 'angry'),
      close(pipe("The Baron, DJ Dairy, Elias... I've got more in common with the lot of them!", 'disgusted'))
    ])
  ]);
  return options(pipe('We look NOTHING alike!', 'disgusted'), [
    spokenChoice("We're practically twins!", 'happy', shared),
    spokenChoice('We do a little bit.', 'thinking', shared),
    spokenChoice('Yes, we do! Have you looked in a mirror?', 'exasperated', shared)
  ]);
}

export const pipeTipKarma = new Map([
  ['pipeArrogantTip', -1], ['pipeGenerousTip', 1], ['pipeNeutralTip', 0.5]
]);

export function createPipeConversation(getState, random = Math.random) {
  const selected = new Set();
  const greetings = new Set();
  let introduced = false;

  function open() {
    if (!introduced) {
      introduced = true;
      return opening(getState);
    }
    const state = getState();
    const topics = [
      ['security', state.spokeToCreamery, "How come you don't get your own guard?", 'thinking',
        () => pipe('Guns are ranged weapons, you ploughing fool!', 'angry')],
      ['elias', state.askedEliasAboutVampires, 'Have you ever seen Elias drink milk?', 'thinking',
        () => pipe('How would I know?! Ask the ploughing waitstaff!', 'angry')],
      ['menu', true, 'So... what have you got on the menu?', 'thinking',
        () => pipe('NOTHING! Go bother the bartender next door!', 'angry')],
      ['union', state.communist, "I'm thinking of starting a workers' union. Want to join?", 'happy',
        () => sequence([pipe('A union?!', 'flustered'), pipe('FOR THE UNEMPLOYED?! Go bother someone else!', 'angry')])],
      ['name', true, "My name's Pip. What's yours?", 'happy', nameTopic],
      ['family', true, 'Are we related? We kind of look alike.', 'thinking', familyTopic],
      ['guards', state.seenCowGuard, 'Why are the guards cows?', 'thinking',
        () => pipe('Why are you wasting my time?!', 'angry')],
      ['mystic', state.metMystic, 'Have you seen a woman walking around wearing a cow skull?', 'thinking',
        () => sequence([
          pipe('Oh, yes. I saw her having tea with Father Milkmas and the Dairy Bunny.', 'smug'),
          pipe('They were being served by the Great Cow himself.', 'smug')
        ])]
    ];
    const pool = [...generalGreetings, ...[...greetings].flatMap(key => conditionalGreetings[key])];
    const greeting = pool[Math.floor(random() * pool.length)];
    const replies = topics.filter(([key, eligible]) => eligible && !selected.has(key))
      .map(([key, , label, mood, next]) => choice(label, mood, () => {
        selected.add(key);
        return sequence([pip(label, mood)], next());
      }));
    return {...greeting, replies};
  }

  open.finish = action => {
    if (action === 'finishPipeName') greetings.add('name');
    if (action === 'finishPipeFamily') greetings.add('family');
    if (pipeTipKarma.has(action)) greetings.add(action === 'pipeArrogantTip' ? 'arrogant' : 'friendly');
  };
  return open;
}
