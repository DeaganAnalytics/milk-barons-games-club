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

const oracleHints = [];

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

  function hintChoices(accept, decline) {
    return [
      reply(accept, () => {
        if (!remainingHints.length) return say('The milk has no more wisdom to share today, child.', 'serene', back);
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
