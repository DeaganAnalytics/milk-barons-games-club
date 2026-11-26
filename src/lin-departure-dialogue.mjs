const reactions = {
  'female-waiter': [
    'Do you know where Lin went?', "You've got some nerve asking me that.",
    "I just wanted to know if she's alright.", 'Perhaps you should have considered that before humiliating her.',
    "I didn't mean for her to leave.", 'She used to get excited whenever she saw you coming.',
    'She did?', 'Yes. God knows why.',
    'Oh...', 'Will you be ordering anything, sir?'
  ],
  'blonde-waitress': [
    'Have you seen Lin?', "Oh, look! It's Prince Charming!",
    'Brie, please.', "Have you tried looking around the milk pool? Apparently that's where you like to find women.",
    "That's not fair.", 'Neither was making Lin cry, you horrible little man.',
    'She cried?', 'What do you think?!',
    'Oh...', 'Milk is ₥2. Sympathy is unavailable.'
  ],
  'male-waiter': [
    'Do you know where Lin went?', 'HAHAHAHAHA!',
    "What's so funny?", 'Forgive me, sir. I simply cannot comprehend how you managed it.',
    'Managed what?', 'A beautiful young woman practically throwing herself at you, and you somehow managed to make her resign.',
    "She wasn't throwing herself at me.", 'Good heavens, sir. Were you even paying attention?',
    'Apparently not.', 'Evidently.'
  ],
  'handlebar-waiter': [
    'Any idea where Lin went?', 'HA! HA! HA!',
    'Is everyone going to laugh at me?', "My dear fellow, you've accomplished something quite remarkable.",
    'Have I?', 'I’ve been married three times, sir, and even I have never managed to end a relationship before it began.',
    'Three times?', 'Four, if you include the annulment.',
    "Perhaps I shouldn't be asking you for advice.", 'An astute observation, sir.'
  ],
  'martini-waiter': [
    'Do you know where Lin went?', 'Away from you, I would imagine, sir.',
    'Very funny.', 'I must confess, your handling of the situation was quite spectacular.',
    'Thank you.', 'Spectacularly incompetent, sir.',
    'Right.', 'Even the Baron exercises greater tact when courting women.',
    'Surely not.', 'I assure you, sir. The bar is exceptionally low.'
  ],
  baron: [
    'Do you know where Lin went?', 'WHO?!',
    'Lin. One of your waitresses.', 'Which one?',
    'The pretty one.', "They're all pretty! I have exceptionally high recruitment standards!",
    'She was serving milk over there.', 'MILO!',
    'What?', 'MILO! HAVE WE LOST A MILK SERVANT?!',
    'Never mind.', 'If you find her, tell her my glass is empty!'
  ],
  elias: [
    'Elias, do you know where Lin went?', 'Ah, yes. Your recent personnel incident.',
    'Personnel incident?', 'I must congratulate you on your increasingly aristocratic alignment.',
    'What are you talking about?', "You've successfully alienated a member of the working class without incurring any direct financial liability.",
    'I liked her!', 'An unfortunate emotional investment.',
    'I feel terrible.', 'Naturally. Your transition into the aristocracy is not yet complete.',
    "I don't want to be an aristocrat!", 'Resistance to professional development is quite common at your level.'
  ],
  'milk-mystic': [
    'Can you tell me where Lin went?', 'I have gazed into the milk, child.',
    'And?', 'I see no future for you.',
    'With Lin?', '...',
    'With Lin, right?', 'The milk has spoken.',
    "That's not particularly reassuring.", 'Some milk cannot be unspilled, child.',
    'Can I at least apologise to her?', 'You may apologise to the milk.',
    "I'm sorry, milk.", 'It does not forgive you.'
  ],
  'edmund-vale': [
    'Do you know where Lin went?', 'Away from you, kid.',
    'Yes, but where?', 'Somewhere with fewer idiots, hopefully.',
    'I really liked her.', 'Everyone knew that.',
    'Everyone?!', "Kid, I've seen election campaigns less obvious than your attempts to court that woman.",
    'Do you think I can fix things?', 'No.',
    "You don't even want to think about it?", "I've spent decades watching men destroy promising careers by opening their mouths.",
    'Continue', "You're an idiot, kid.",
    'Thanks, Edmund.', 'Anytime.'
  ],
  'creamery-bartender': [
    'Have you heard anything about Lin?', 'Mate, the entire staff has heard about Lin.',
    'Do you know where she went?', 'No. But she left in tears.',
    'Oh...', 'You know, people usually come to a bartender for relationship advice BEFORE they ruin everything.',
    'Do you have any advice for afterwards?', 'Learn from it.',
    'Anything else?', 'Buy a drink.',
    'Will that help?', "No, but it'll help me."
  ],
  dj: [
    'Hey, DJ Dairy. Have you seen Lin?', 'OHHHH! THE HEARTBREAKER HIMSELF!',
    "Please don't announce it.", 'MY MAN! HOW DID YOU MANAGE TO FUMBLE THAT?!',
    "It's complicated.", 'SHE LIKED YOU, BRO!',
    'I know that now.', 'EVERYBODY KNEW!',
    'Yes, apparently everybody except me.', 'I WAS ALREADY PLANNING YOUR WEDDING PLAYLIST!',
    'You were?!', 'THREE HOURS OF ROMANTIC DAIRY CLASSICS!',
    'Oh, God.', "GUESS I'LL HAVE TO PLAY SOMETHING FOR THE BROKENHEARTED!",
    "Please don't.", 'THIS NEXT ONE GOES OUT TO PIP, WHO MANAGED TO LOSE A GIRLFRIEND WITHOUT EVER GETTING ONE!',
    'I hate this place.'
  ]
};

const guards = [
  [
    'Have you seen Lin?', 'Congratulations, sir.',
    'For what?', 'Successfully asserting your authority over a member of staff.',
    "That's not what I was trying to do!", 'Modesty. An admirable aristocratic quality.',
    "For God's sake."
  ],
  [
    'Do you know where the waitress went?', 'Negative, sir.',
    'She just ran out of here.', 'Staff turnover is an indicator of effective management, sir.',
    'Is it?', 'Congratulations on your contribution.',
    "You're definitely a cow.", 'Negative, sir.'
  ],
  [
    "I think I've really upset Lin.", 'Excellent work, sir.',
    'How is that excellent work?', 'Maintaining the distinction between patrons and employees is essential to club security.',
    'I was trying to do the opposite!', 'Nevertheless, the distinction has been successfully maintained.',
    'Unbelievable.'
  ]
];

const moods = {
  baron: ['flustered', 'displeased', 'pleased'],
  elias: ['current-smile', 'thinking', 'self-assured-smirk'],
  'milk-mystic': ['contemplative', 'serene', 'wry-smile'],
  'edmund-vale': ['exasperated', 'conspiratorial', 'wistful'],
  'creamery-bartender': ['deadpan', 'thinking', 'skeptical'],
  dj: ['microphone'],
  guard: ['formal', 'deadpan', 'speaking']
};

export function createLinDepartureReactions() {
  const used = new Set();
  let nextGuard = 0;

  return function option(target, menu) {
    const {id} = target;
    const key = target.guard ?? (target.practiceGuard ? `practice:${target.y}` : id);
    const lines = id === 'guard' ? guards[nextGuard % guards.length] : reactions[id];
    if (!lines || used.has(key)) return null;
    const expressions = moods[id] ?? ['pleased', 'attentive', 'apologetic'];
    const back = {label: 'Continue', next: () => menu};
    let reply = back;
    for (let index = (lines.length - 1) & ~1; index >= 0; index -= 2) {
      const text = lines[index + 1];
      const node = text === undefined ? back.next : {
        text, mood: expressions[(index / 2) % expressions.length], mustContinue: true, replies: [reply],
        ...(id === 'milk-mystic' ? {speaker: 'Oracle'} : {})
      };
      reply = {label: lines[index], next: node, playerMood: 'worried'};
    }
    const opening = reply.next;
    return {...reply, next: () => {
      used.add(key);
      if (id === 'guard') nextGuard++;
      return opening;
    }};
  };
}

export const linDepartureAnnouncements = [
  'THIS ONE GOES OUT TO ALL THE SINGLE PEOPLE! ESPECIALLY THE RECENTLY SINGLE!',
  'PIP, MY MAN! PLENTY MORE FISH IN THE MILK POOL!',
  "REMEMBER, FOLKS! DON'T LET YOUR MOUTH WRITE CHEQUES YOUR HEART CAN'T CASH!",
  'LOVE IS TEMPORARY! DAIRY IS FOREVER!',
  'SOMETIMES LOVE CURDLES, BABY!',
  'LET ME HEAR IT FOR ALL THE LADIES WHO DESERVE BETTER!'
];
