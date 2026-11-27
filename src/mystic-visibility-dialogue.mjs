const line = (text, mood, extras) => ({text, mood, ...extras});
const elias = (text, extras) => line(text, 'current-smile', {character: 'elias', ...extras});

const scenes = {
  baron: [
    "What's with the old woman wearing a cow's head?", line('I LIKE COWS!', 'pleased'),
    "Yes, I'd gathered that. But why the old woman?", line('OLD WOMAN?! Only young and beautiful women are permitted in my establishment!', 'displeased'),
    "But she's walking around your club!", line('IMPOSSIBLE! I have exceptionally high standards!', 'displeased'),
    "She's literally—", elias('Bothering our magnificent host again, Master Pip?', {direction: 'Elias appears.'}),
    "I'm just trying to—", elias('Here, my Lord. Some more milk.'),
    'Continue', line('MARVELLOUS! MILK!', 'sipping'),
    'Continue', elias('Perhaps ve should leave His Lordship to his refreshments.', {direction: 'The Baron becomes distracted by his milk.'}),
    'Continue', elias('', {direction: 'Elias disappears.'})
  ],
  'creamery-bartender': [
    'Can I ask you a question?', 'You just did, sir.',
    "What's with the old woman wearing a cow's head?", "I'm not sure what you mean, sir.",
    'The old lady wandering around the club.', "I'm confined to the bar, sir.",
    "You've never seen her walk past?", 'I generally look at the people ordering drinks.',
    'Right...', 'Speaking of which, can I get you anything?'
  ],
  'pillory-attendant': [
    "Have you seen an old woman wearing a cow's head?", "A woman old, a head of cow?\nI've got a prisoner to punish now!",
    "That doesn't answer my question.", 'If answers are what you seek today,\nPerhaps some tokens you should pay!',
    'Will you answer my question if I pay you?', 'A balloon of milk, a splendid throw!\nWatch the milk and laughter flow!',
    'Do you ever actually answer questions?', 'A question here, a question there!\nWould you like to soak her hair?',
    'Good grief.'
  ],
  'pillory-commissioner': [
    "Have you noticed an old woman wandering around wearing a cow's head?", "I'm afraid my ability to observe my surroundings has been severely restricted.",
    'Because of the pillory?', 'Obviously.',
    "So you haven't seen her?", "For the better part of my imprisonment, I've been afforded an excellent view of the floor.",
    'Oh.', 'Perhaps you could assist me in restoring my freedom of movement?',
    "I'll give it some thought.", 'How tremendously reassuring.'
  ],
  'lin-waitress': [
    "Lin, have you seen an old woman wearing a cow's head?", line("A cow's head?", 'skeptical'),
    "Yes. She's wandering around the club.", line('Oh, Pip! What are you up to now?', 'pleased'),
    'What do you mean?', 'Is this another excuse to come and talk to me?',
    'No! I genuinely wanted to ask you about the old woman!', 'Of course you did.',
    "You don't believe me?", "Well, let's see. Is she wearing a little hat?",
    'No.', 'Carrying a handbag?',
    "She's carrying a staff.", 'Oh! How mysterious!',
    "LIN! I'm being serious!", line('And does this mysterious woman know that you fancy me?', 'blushing'),
    '...', 'Well?',
    "I suddenly can't remember why I came over here.", line('Thought so.', 'blushing', {direction: 'Lin laughs affectionately.'})
  ],
  'male-waiter': [
    "Have you seen an old woman wearing a cow's head?", 'I beg your pardon, sir?',
    "An elderly woman. Cow's head. Carries a staff.", 'Is this a complaint regarding another patron, sir?',
    "No. I'm just wondering who she is.", "I'm afraid I don't make a habit of enquiring about our patrons' personal affairs.",
    "But you've seen her?", "I can't say that I have, sir.",
    'Strange.', 'There are considerably stranger things in this establishment, sir.'
  ],
  'handlebar-waiter': [
    "Have you seen an old woman wearing a cow's head?", line('Good heavens! What dreadful attire!', 'offended'),
    "So you've seen her?", 'Certainly not, sir! I would remember such an egregious violation of good taste.',
    "She's quite difficult to miss.", 'As is my moustache, sir, yet remarkably few patrons compliment it.',
    "You've got a very nice moustache.", line('HA! A gentleman of impeccable taste!', 'pleased'),
    'But about the woman—', line('You have made my evening, sir!', 'pleased')
  ],
  'martini-waiter': [
    "Do you know anything about the old woman wearing a cow's head?", 'Is she a woman of considerable wealth, sir?',
    "I doubt it. She's dressed in rags.", "Then I'm afraid our social circles are unlikely to overlap.",
    'But you serve everyone.', 'Professionally, sir. Not socially.',
    "So you haven't noticed her?", 'I tend to notice expensive clothing, jewellery and generous patrons.',
    'Right.', 'One must maintain certain aspirations, sir.'
  ],
  'female-waiter': [
    'Have you seen an elderly woman wandering around the club?', 'Is she lost, sir?',
    "I don't think so. She's wearing a cow's head.", line('Oh, dear.', 'apologetic'),
    "You've seen her?", "No, sir. But I do hope she's alright.",
    'She seems perfectly happy.', line("Well, that's a relief.", 'pleased'),
    "You don't think it's strange that she's wearing a cow's head?", "Sir, I've worked here for quite some time.",
    'Continue', "I've learned to be grateful when our patrons are simply happy."
  ],
  'blonde-waitress': [
    "Have you seen an old woman wearing a cow's head?", "A real cow's head?",
    'Yes.', line('EWWWW!', 'hurried'),
    "So you haven't seen her?", 'No! Is she here now?!',
    'Probably.', "Oh, that's horrible! Imagine what it would do to your hair!",
    'Her hair?', 'And the smell!',
    "I hadn't really considered—", 'Do you think she washes it?',
    "I don't know, Brie.", 'Well, I hope she does!'
  ],
  professor: [
    "Professor, what's with the old woman wearing a cow's head?", 'Ah! An excellent opportunity to educate you.',
    'So you know her?', 'Are you familiar with the primitive religious practices that preceded modern dairy theology?',
    'No.', line('Naturally. I suspected as much.', 'thinking', {
      alternateReply: {label: '[Lie] Yes.', text: 'Really?! I find that hard to believe.', mood: 'thinking'}
    }),
    'Continue', 'Throughout history, intellectually impoverished societies have attributed spiritual significance to all manner of substances.',
    'Continue', 'Water, wine, oil. Even fermented grapes!',
    "Isn't that wine?", 'Please refrain from interrupting.',
    'Continue', 'It was only with the emergence of sophisticated dairy-based civilisation that humanity achieved genuine theological maturity.',
    'Fascinating. But the old woman—', 'I once published a forty-seven-page dissertation on the intellectual deficiencies of non-lactose-based spirituality.',
    'Did anyone read it?', 'Naturally. I reviewed it myself on numerous occasions.',
    'But have you actually seen the woman?', 'My dear boy, I concern myself with the theoretical rather than the pedestrian.',
    "So that's a no.", 'An extraordinarily simplistic interpretation of my explanation.'
  ],
  lifeguard: [
    "Have you seen an old woman wearing a cow's head?", 'Was she swimming?',
    'No.', 'Standing beside the pool?',
    'No.', 'Wearing a bikini?',
    'No.', "Then I probably haven't noticed her.",
    "Don't you ever look anywhere other than the pool?", "Mate, I'm a highly trained professional.",
    'Of course.', line('These aristocratic beauties depend upon my unwavering vigilance.', 'big-excited-smile', {enterAction: 'hearLifeguardBeauties'}),
    'And the male swimmers?', 'What about them?',
    'Never mind.'
  ],
  dj: [
    "Have you seen an old woman wandering around wearing a cow's head?", 'OHHHH! YOU CAN SEE HER TOO, MY MAN?!',
    'YES! Finally! Someone else!', "YOU'RE TUNING INTO A HIGHER FREQUENCY, BRO!",
    'Who is she?!', 'THE DIVINE DAIRY GODDESS!',
    'The old woman?', 'EIGHT FEET TALL! SIX ARMS! GOLDEN WINGS!',
    'What?', 'RIDING A MAGNIFICENT PURPLE COW THROUGH THE COSMOS!',
    "No. She's just an old woman with a staff.", "YOU'RE NOT QUITE THERE YET, MY MAN!",
    'Where, exactly?', 'THE SEVENTH SPIRITUAL PLANE!',
    'How many spiritual planes are there?', "DEPENDS WHAT I'VE HAD TO DRINK, BROTHER!",
    "Right. I'll keep asking around.", 'KEEP YOUR THIRD EYE OPEN, MY MAN!'
  ],
  guard: [
    "Have you seen an old woman wearing a cow's head?", line("A REAL COW'S HEAD, SIR?!", 'angry'),
    'I think so.', line('THAT IS APPALLING, SIR!', 'angry'),
    'Is it?', 'An innocent cow, brutally slaughtered and subjected to such indignity!',
    "You're taking this rather personally.", {text: 'Negative, sir.', branches: [
      {lines: [
        'Why are you so concerned about cows?', 'Cows are noble, intelligent and exceptionally dignified creatures, sir.',
        'You sound rather proud of them.', 'Naturally, sir.',
        "Because you're a cow?", line('NEGATIVE, SIR!', 'angry'),
        'Just checking.'
      ]},
      {ends: true, lines: [
        "Don't worry. I'm sure she won't take your head.", 'I should bloody well hope not, sir!',
        "So you admit you've got a cow's head?", '...',
        'HA! GOT YOU!', 'Sir, I strongly recommend that you reconsider your current line of questioning.',
        'Is that a threat?', 'An exceptionally generous warning, sir.',
        'Right. Understood.'
      ]},
      {lines: [
        "Shouldn't you investigate?", 'Have you witnessed the slaughter of a cow, sir?',
        'No.', 'Have you identified a deceased cow, sir?',
        'No.', 'Have you obtained evidence of criminal activity, sir?',
        "She's wearing the evidence!", "Have you confirmed the authenticity of the cow's head, sir?",
        'Well, no.', 'Then I suggest you cease making unsubstantiated allegations, sir.',
        'You seemed pretty convinced a moment ago.', 'Negative, sir.'
      ]}
    ]}
  ],
  elias: [
    'Elias, I need to ask you something.', 'Of course, Master Pip.',
    "There's an old woman wandering around the club wearing a cow's head.", 'Da.',
    "Wait. You know who I'm talking about?!", 'Naturally.',
    'YOU CAN SEE HER?!', 'My eyesight is perfectly adequate, Master Pip.',
    "Nobody else seems to know what I'm talking about!", 'And zis concerns you?',
    'YES!', 'How peculiar.',
    'Exactly!', 'No. I am referring to your concern.',
    'Oh.', {text: '', branches: [
      {lines: [
        'Who exactly is she?', 'Ze Milk Mystic.',
        'And?', 'She is mystic. She deals primarily vith milk.',
        "That's not particularly informative.", 'I find her title to be remarkably descriptive, actually.'
      ]},
      {lines: [
        "Why can't anyone else see her?", 'Perhaps zey are not looking.',
        "I've asked several people!", 'Da. I am avare.',
        "You've been watching me?", 'Standard corporate procedure.',
        'Of course.'
      ]},
      {lines: [
        'Is she dangerous?', 'Has she threatened your life?',
        'No.', 'Has she interfered vith your financial obligations to ze Baron?',
        'No.', 'Zen I see no immediate cause for concern.',
        'What if she starts threatening my life?', 'Please ensure your outstanding debt is settled beforehand.',
        'How comforting.', 'You are most velcome.'
      ]},
      {lines: [
        'Why can you see her?', 'Vhy can you see her?',
        "I don't know!", 'Zen perhaps you should investigate zat question instead.',
        'Are you deliberately being mysterious?', 'No. I simply have very little interest in zis conversation.',
        'Right.', 'Vas zere anything else, Master Pip?'
      ]}
    ]}
  ],
  'milk-mystic': [
    "Nobody else can see you, can they?", 'Many eyes gaze upon the milk, child. Few truly see it.',
    'Elias can see you.', 'The creature of the night sees much that escapes the eyes of mortal men.',
    'And why can I see you?', 'Perhaps you are not like the others, child.',
    'Am I special?', 'Perhaps.',
    'Do I have some sort of supernatural gift?', 'Perhaps.',
    'Am I destined for something greater?', 'Perhaps.',
    'Do you actually know?', 'Perhaps.',
    '...', 'Would you like some spiritual guidance, child? A single coin shall suffice.',
    'Unbelievable.'
  ]
};

const moods = {
  'creamery-bartender': ['deadpan', 'skeptical', 'polite'],
  'pillory-attendant': ['exuberant', 'self-assured', 'laughing'],
  'pillory-commissioner': ['deadpan', 'frowning', 'despondent'],
  'lin-waitress': ['skeptical', 'pleased'],
  professor: ['self-assured-smirk', 'condescending', 'thinking'],
  lifeguard: ['deadpan', 'thinking', 'frown'],
  dj: ['excited', 'laughing', 'microphone'],
  guard: ['formal', 'deadpan', 'speaking'],
  elias: ['current-smile', 'thinking', 'self-assured-smirk'],
  'milk-mystic': ['serene', 'contemplative', 'wry-smile']
};

export function createMysticVisibilityDialogue() {
  const completed = new Set();
  let metMystic = false;

  function option(id, menu, {linChats = 0, linRelationship = 'normal'} = {}) {
    if (!metMystic || !Object.hasOwn(scenes, id) || completed.has(id)) return null;
    if (id === 'elias' && completed.size < 4) return null;
    if (id === 'milk-mystic' && !completed.has('elias')) return null;
    if (id === 'lin-waitress' && (linChats < 5 || linRelationship !== 'normal')) return null;

    const expressions = moods[id] ?? ['attentive', 'pleased'];
    const finish = ends => () => {
      completed.add(id);
      return ends ? null : menu;
    };

    function build(lines, ends = false) {
      const complete = finish(ends);
      let replies = [{label: 'Continue', next: complete}];
      for (let index = (lines.length - 1) & ~1; index >= 0; index -= 2) {
        const response = lines[index + 1];
        if (response === undefined) {
          replies = [{label: lines[index], next: complete, playerMood: 'thinking'}];
          continue;
        }
        const {branches, alternateReply, ...portrait} = typeof response === 'string' ? {text: response} : response;
        const next = {
          mood: expressions[(index / 2) % expressions.length],
          ...(id === 'milk-mystic' ? {speaker: 'Milk Mystic'} : {}),
          ...portrait,
          mustContinue: true,
          replies: branches ? branches.map(branch => build(branch.lines, branch.ends)) : replies
        };
        replies = [{label: lines[index], playerMood: 'thinking', next}];
        if (alternateReply) {
          const {label, ...alternatePortrait} = alternateReply;
          replies.push({label, playerMood: 'thinking', next: {...next, ...alternatePortrait}});
        }
      }
      return replies[0];
    }

    return build(scenes[id], id === 'baron');
  }

  return {option, hasMetMystic: () => metMystic, meetMystic: () => { metMystic = true; }};
}
