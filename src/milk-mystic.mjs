import {HALL_CENTER, isNpcBlocked, ROOM_HEIGHT, ROOM_WIDTH, routeAroundBaron, sameSquare} from './room.mjs';

export const milkMysticId = 'milk-mystic';
export const milkMysticMoods = ['serene', 'skeptical', 'contemplative', 'warning', 'wry-smile'];

const center = {...HALL_CENTER};
const stops = [
  {...center, y: center.y - ROOM_HEIGHT * 0.65},
  {...center, x: center.x + ROOM_WIDTH * 0.65},
  {...center, y: center.y + ROOM_HEIGHT * 0.65},
  {...center, x: center.x - ROOM_WIDTH * 0.65}
];

export function createMilkMystic() {
  return {...center, id: milkMysticId, title: 'The Milk Mystic', x: center.x - 105, radius: 12, route: [], pauseUntil: 3,
    nextStop: 0, walking: false, facingRight: false, stride: 0};
}

export function updateMilkMystic(mystic, baron, elapsed, dt) {
  mystic.walking = false;
  if (elapsed < mystic.pauseUntil) return;
  if (!mystic.route.length) {
    const leavingCenter = sameSquare(mystic, center);
    const destination = leavingCenter ? stops[mystic.nextStop] : center;
    mystic.route = routeAroundBaron(mystic, destination, baron);
    if (!mystic.route.length) {
      mystic.pauseUntil = elapsed + 1;
      return;
    }
    if (leavingCenter) mystic.nextStop = (mystic.nextStop + 1) % stops.length;
  }
  const target = mystic.route[0];
  const dx = target.x - mystic.x;
  const dy = target.y - mystic.y;
  const distance = Math.hypot(dx, dy);
  const step = Math.min(54 * dt, distance);
  const fraction = distance ? step / distance : 0;
  const x = mystic.x + dx * fraction;
  const y = mystic.y + dy * fraction;
  const inTerritory = sameSquare({x, y}, center) || stops.some(stop => sameSquare({x, y}, stop));
  if (!inTerritory || isNpcBlocked(x, y, mystic.radius, baron, mystic)) {
    mystic.route = [];
    mystic.pauseUntil = elapsed + 1;
    return;
  }
  mystic.x = x;
  mystic.y = y;
  if (Math.abs(dx) > 1) mystic.facingRight = dx > 0;
  mystic.walking = step > 0;
  mystic.stride = (mystic.stride + step * 0.33) % (Math.PI * 2);
  if (step === distance) {
    mystic.route.shift();
    if (!mystic.route.length) mystic.pauseUntil = elapsed + 2.5;
  }
}

const oracleHints = [
  // General hints
  "The tree of life branches again and again. An old friend may have new words for you. Revisit those whose paths you have already crossed.",
  "There are many udders from which fortune flows, child. Do not spend your days milking just one.",
  "The cow that fills your bucket today may kick it over tomorrow. Fortune is a fickle beast.",
  "Do not mistake the end of a conversation for the end of an opportunity. There may yet be words left unspoken.",
  "Every deed leaves a stain upon the soul. Some wash away with milk. Others do not.",
  "A dishonest tongue may fill an honest man's purse. But silver cannot cleanse the soul.",
  "Vanity is a hunger that even the wealthiest cannot satisfy. Feed it, and you may find yourself rewarded.",
  "Many walk through these halls with their eyes open, yet see nothing. Examine that which others overlook.",
  "A drop of kindness may return to you as a bucket of milk.",
  "Do not mourn every coin that leaves your purse. Some must be planted before fortune can be harvested.",
  "Words spoken to one may bear fruit with another. The roots of this place are deeply intertwined.",
  "Every soul hungers for something different. Learn what fills another's heart, and you shall know how to speak to them.",
  "He who fears spilling a single drop may never fill his glass.",
  "When the gate is closed, child, remember that not every path requires a gate.",

  // Character-specific hints
  "The largest cow in these halls hungers not only for milk, but admiration.",
  "The singing milkman speaks of a world without greed. Yet his purse remains firmly closed.",
  "The great one longs to hear that his favourite minstrel sings his praises.",
  "The pale one values obedience above kindness, and coin above both.",
  "Some men hunger not for wealth, but for recognition of their intellect.",
  "Beneath the rags of the fallen lies a story worth hearing.",
  "Trust your eyes, child, even when every tongue tells you otherwise.",
  "A gun is not merely an ornament, child. Never forget that it can end your journey.",
  "The woman who gambles with fortune may yet gamble with her heart. Perhaps a little charm will serve you better than coin.",
  "Those who bathe in milk must leave their garments behind. An unattended possession is a temptation for the wandering soul.",
  "The ladies in the southwest have little patience for those beneath them. Disturb their peace too often, and you may come to regret it.",
  "Many are cast aside by those who command them. Yet those who hand out redundancies seldom remember the faces of those they employ.",

  // Humorous hints
  "Never cry over spilt milk. Unless it belonged to the Baron.",
  "Not all who wander are lost. Some are merely looking for the toilet.",
  "Money cannot buy happiness. It can, however, prevent you from being sent to the dairy.",
  "The future is cloudy, child. Much like a glass of milk.",
  "Beware the man who promises you free milk. Particularly if he owns a dairy."
];

export function createMilkMysticConversation(getDiscoveries = () => ({}), hints = oracleHints) {
  const say = (text, mood, replies, speaker = 'Oracle', character) =>
    ({text, mood, speaker, character, replies, mustContinue: Boolean(replies)});
  const reply = (label, next) => ({label, next});
  const greeting = say('Come closer, child. The milk has spoken of your arrival.', 'serene');
  const back = [reply('Continue', () => menu())];
  const used = new Set();
  let introduced = false;
  let heardHintOffer = false;
  const remainingHints = [...new Set(hints)];

  const exhausted = reply('Do you have any more wisdom to share?',
    say('Even the most sacred cow eventually runs dry, child.', 'serene', [
      reply("So you've got nothing left?", say('I have illuminated the paths before you. It is now for you to walk them.', 'contemplative', [
        reply('At least I get to keep my coin.', say('Perhaps you have grown wiser after all.', 'wry-smile'))
      ]))
    ]));

  function hintChoices(accept, decline) {
    if (!remainingHints.length) return [exhausted, reply(decline, null)];
    return [
      reply(accept, () => {
        if (!remainingHints.length) return exhausted.next;
        if (!getDiscoveries().canBuyHint) return say('Return when you have a coin to spare, child.', 'serene', back);
        const index = Math.floor(Math.random() * remainingHints.length);
        const [hint] = remainingHints.splice(index, 1);
        const another = say('There are many branches upon the tree of fate. Do you wish to explore another?',
          'contemplative', hintChoices('Tell me more.', "That's enough for now."));
        return {...say(hint, 'contemplative', [reply('Continue', another)]), enterAction: 'buyOracleHint'};
      }),
      reply(decline, null)
    ];
  }

  const introduction = reply('Who are you?', say(
    'I am a humble servant of the sacred milk, child. A reader of fate and a keeper of wisdom.', 'serene', [
      reply('What do you do here?', say('I illuminate the paths that others cannot see.', 'contemplative', [
        reply('Can you help me?', () => {
          heardHintOffer = true;
          return say('For a single coin, I shall share a fragment of my wisdom.', 'serene',
            hintChoices('Enlighten me.', 'Perhaps another time.'));
        })
      ]))
    ]));

  function returningVisit() {
    const offer = say('Our paths cross once more, child. Do you seek the wisdom of the milk?', 'serene');
    const existing = menu(offer);
    return {...existing, replies: [...hintChoices('Yes, please.', 'Not right now.'), ...existing.replies]};
  }

  const topics = [
    reply('Can you see the future?', say('I see many futures. Some sweet. Some sour. Some thoroughly pasteurised.', 'serene', [
      reply('Do I earn ₥200?', say('In some futures.', 'contemplative', [
        reply('And in the others?', say('Moo.', 'wry-smile', back))
      ]))
    ])),
    reply('Why do you wear a cow skull?', say('To see the world through the eyes of the sacred beast.', 'serene', [
      reply("But it doesn't have eyes.", say('Precisely.', 'wry-smile', back))
    ])),
    {...reply('What do you think of DJ Dairy?', say('He speaks much but says little.', 'skeptical', [
      reply("Couldn't the same be said about you?", say('Listen more carefully, child.', 'warning', back))
    ])), requires: 'seenDj'},
    {...reply('Are the guards cows?', say('Your eyes have already revealed the truth, child.', 'serene', [
      reply('FINALLY! Someone admits it!', say('I have admitted nothing.', 'skeptical', [
        reply('But you just said—', say('There is a difference between seeing the truth and speaking it.', 'warning', [
          reply("Oh, for milk's sake!", () => menu())
        ]))
      ]))
    ])), requires: 'askedFourCharacters'},
    {...reply('(Whispering) Is Elias a vampire?', say('There are those who thirst for milk, and those who thirst for something darker.', 'warning', [
      reply('So he is?', say('Have you ever seen him drink milk, child?', 'skeptical', [
        reply('Come to think of it, no.', say("Curious, isn't it?", 'wry-smile', [
          reply('Continue', say('Vat are you two discussing?', 'thinking', [
            reply('AH!', say('The weather.', 'serene', [
              reply('Continue', say("A particularly pleasant lack of sunlight today, wouldn't you agree?", 'current-smile', [
                reply('...', null)
              ], 'Elias', 'elias'))
            ]))
          ], 'Elias', 'elias'))
        ]))
      ]))
    ])), requires: 'askedAboutVampires'}
  ];

  function menu(line = greeting) {
    const discoveries = getDiscoveries();
    const replies = topics.filter(topic => !used.has(topic) && (!topic.requires || discoveries[topic.requires]))
      .map(topic => ({...topic, next: () => {
        used.add(topic);
        return topic.next;
      }}));
    return {...line, replies: heardHintOffer ? replies : [introduction, ...replies]};
  }

  return () => introduced ? (heardHintOffer ? returningVisit() : menu()) : {
    ...greeting, mustContinue: true, replies: [
      reply('The milk speaks to you?', say('Only to those who listen.', 'contemplative', [
        reply('What does it sound like?', () => {
          introduced = true;
          return menu(say('Mostly sloshing.', 'wry-smile'));
        })
      ]))
    ]
  };
}

const ambientLines = [
  'The milk flows in mysterious ways.',
  'All rivers eventually lead to the great udder.',
  'The threads of fate are woven into a most peculiar tapestry.',
  'I sense a disturbance in the milk.',
  'From milk we came. To milk we shall return.',
  'The sacred cow watches over us all.',
  'Many souls wander these halls. Few know where they are going.',
  'The milk remembers what man forgets.',
  'A thousand futures lie within a single drop of milk.',
  'Even the smallest calf casts a shadow.',
  'The wheel of fate turns. The wheel of cheese remains stationary.',
  'The great cow gives. The great cow takes away.',
  'Some seek fortune. Others seek wisdom. Most seek milk.',
  'The past is curdled. The future is yet to be pasteurised.',
  'I have seen things that would sour your milk.',
  'There is much darkness beneath these magnificent rugs.',
  'The dead speak softly. The cows considerably louder.',
  'The spirits are restless today. Perhaps they are lactose intolerant.',
  'Such strange creatures inhabit these halls.',
  'Wisdom for a coin. Enlightenment for a modest fee.',
  'Come, wandering soul. Let me illuminate your path.',
  'The milk speaks to those who listen.',
  'Hmmm... an unsettling prophecy. Or perhaps indigestion.',
  'My bones ache. Even the enlightened grow old.',
  'I must remember where I left my bucket.',
  'The end is near. Though I have been saying that for some years.'
];

export function createMilkMysticSpeech() {
  let nextAt = 30;
  let until = 0;
  let nextLine = 0;
  let text;
  return (elapsed, visible) => {
    if (!visible) return null;
    if (elapsed >= nextAt) {
      text = ambientLines[nextLine];
      nextLine = (nextLine + 1) % ambientLines.length;
      until = elapsed + Math.max(3, text.length / 18);
      nextAt = elapsed + 30;
    }
    return elapsed < until ? {text, opacity: Math.min(1, (until - elapsed) / 0.5)} : null;
  };
}
