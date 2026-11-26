import {applyCurdistChoice, createCurdistAssessment, curdistAssessmentLines, generateCurdistAssessment} from './curdist-assessment.mjs';

const nextReply = next => ({label: 'Continue', next});
const professor = (text, mood = 'thinking', extras) => ({text, mood, ...extras});
const pip = (text, extras) => professor(text, 'thinking', {speaker: 'Pip', ...extras});
const guard = text => ({text, character: 'guard', mood: 'formal'});
const direction = text => professor('', 'thinking', {direction: text});
const note = direction('The Professor makes a note.');
const anotherNote = direction('The Professor makes another note.');
const closeNotebook = direction('The Professor closes his notebook.');
const gesture = direction('The Professor gestures towards Pip.');

function say(lines, next) {
  let replies = Array.isArray(next) ? next : [nextReply(next)];
  let node;
  for (const line of [...lines].reverse()) {
    node = {...(typeof line === 'string' ? professor(line) : line), replies, mustContinue: true};
    replies = [nextReply(node)];
  }
  return node;
}

function choice(choiceId, label, lines, next) {
  return {label, curdistChoice: choiceId, next: lines.length ? say(lines, next) : next};
}

function ending(lines, action = 'completeCurdistInterview') {
  const last = lines.at(-1);
  return say([...lines.slice(0, -1), {...(typeof last === 'string' ? professor(last) : last), action}],
    [nextReply({exitAction: action})]);
}

function conclusion(assessment) {
  generateCurdistAssessment(assessment);
  const final = [
    {label: 'That research was completely unscientific!', next: ending(['And yet I am the scientist, and you are the peasant.', "Curious, isn't it?"])},
    {label: "Well, I'm still a Curdist.", next: ending(['How unfortunate.', 'I suppose every academic study has its limitations.'])},
    {label: 'Hmm. Maybe you have a point.', next: ending(['Good heavens!', 'Have I discovered a cure? Could it be?!',
      direction('The Professor hurriedly reopens his notebook.'), 'I must contact the Royal Academy immediately!'])},
    {label: 'DEATH TO THE DAIRY ARISTOCRACY! LIBERATE THE MILK! LONG LIVE THE REVOLUTION!',
      next: ending([direction('The Professor reopens his notebook.'), 'Persistent vocal symptoms.',
        direction('The Professor makes one final note.'), 'Further research required.'])}
  ];
  return say([closeNotebook, 'Well, that concludes my research.',
    'You have been extraordinarily helpful, my dear peasant. Far more so than I had anticipated.'], [
    {label: 'How did I do?', next: say(['One moment. Let me examine my findings.',
      direction('The Professor consults his notebook.'), 'I have assessed your condition across four distinct academic dimensions.',
      'The results are quite illuminating.', ...curdistAssessmentLines(assessment.results), closeNotebook,
      'Yes, yes. This should make for an exceptionally well-received publication.'], final)},
    {label: 'Can I go now?', next: say(['Oh, certainly. Your continued presence is no longer of academic value.'], final)}
  ]);
}

function education(spokeToMilo, next) {
  return say(['Now, let us examine your educational background.',
    'At what point during your university education did you develop the unfortunate impression that your opinions were of consequence?'], [
    choice('Q6_A', 'When I started reading Karl Curd.', ['Ah. Exposure to academically hazardous literature.',
      'Were there no warning labels on the book?', pip('Warning labels?!'),
      'I have long advocated that his publications carry illustrations depicting the consequences of collectivism.',
      pip('Like what?'), 'Empty milk glasses. Malnourished aristocrats. That sort of thing.', note], next),
    choice('Q6_B', 'When I realised how corrupt our society was.', ['Subject demonstrates difficulty distinguishing corruption from established institutional practices.',
      pip('The wealthy control the government!'), 'Yes, yes. I am familiar with the constitutional arrangements.',
      pip("And that doesn't concern you?"), 'Not whilst I remain wealthy, no.', note], next),
    choice('Q6_C', 'When I started attending political rallies.', ['Ah! Peer pressure amongst the unwashed masses.',
      'Were you, by any chance, familiar with Milo?', pip('The man behind the "Where\'s my milk?" campaign?'),
      'Precisely. A fascinating case study in the consequences of excessive political participation.'], [
      choice('Q6_C1', 'I admired him.', ['An unfortunate choice of role model. I do hope you have alternative career aspirations.', note], next),
      ...(spokeToMilo ? [choice('Q6_C2', 'The Baron makes him wear his own campaign banner!', ['An extraordinarily cost-effective form of political education.',
        pip('And he hits him!'), 'The programme incorporates both theoretical and practical components.', note], next)] : []),
      choice('Q6_C3', 'I thought his campaign was ridiculous.', ['Splendid! Some capacity for independent thought, albeit regrettably selective.', note], next)
    ]),
    choice('Q6_D', "Isn't independent thought the purpose of education?", ['For the aristocracy, certainly.',
      pip('And for everyone else?'), 'Literacy, arithmetic and punctuality. Beyond that, the economic returns diminish rather rapidly.',
      pip("So we're educated just to become workers?"), "Good heavens! Your education wasn't entirely wasted after all.", note], next),
    choice('Q6_E', 'When I realised I was considerably more intelligent than my lecturers.', ['Delusions of intellectual superiority. A particularly common affliction amongst educated peasants.',
      pip('What if I actually am more intelligent?'), 'Do you possess a doctorate?', pip('No.'),
      'Have you published any academic literature?', pip('No.'), 'Do you have a hereditary title?',
      pip('What does that have to do with intelligence?!'), 'I think we have established the limitations of your academic understanding.', note], next),
    choice('Q6_F', 'I was trying to impress a girl.', ['Ah! Romantic aspirations manifesting themselves through ideological affiliation.', 'Did it work?'], [
      choice('Q6_F1', 'Yes.', ['Good heavens. Curdism may be sexually transmissible.', note], next),
      choice('Q6_F2', 'No.', ['Unsuccessful courtship followed by prolonged ideological commitment. Entirely consistent with my research.', note], next),
      choice('Q6_F3', 'She left me for a wealthy man.', ['A young lady of considerable economic intelligence.', note], next),
      choice('Q6_F4', 'She was a Curdist too.', ["Oh, dear. They're beginning to form breeding pairs.", note], next)
    ])
  ]);
}

function allocation(next) {
  return say(['Let us examine your understanding of resource allocation through a hypothetical economic scenario.',
    'Imagine, if you will, ten peasants and a single cow.', 'How would you propose allocating the milk?'], [
    choice('Q5_A', 'Equally amongst the ten peasants.', ['Good heavens! Not a single drop allocated to the aristocracy?',
      pip("You didn't mention any aristocrats."), 'Their presence should be implicit in any respectable economic model.', note], next),
    choice('Q5_B', 'According to how much each peasant contributes.', ['A rudimentary understanding of economic incentives. Encouraging.',
      pip('So you agree?'), 'Provided we recognise hereditary privilege as a considerable economic contribution.',
      pip('How is being born a contribution?'), 'That rather depends upon whom one is born to.', note], next),
    choice('Q5_C', 'From each according to his ability, to each according to his need!', ['An excellent principle! Consider the Baron. His considerable physical proportions necessitate several gallons of milk per day.',
      pip("That's not what Curd meant!"), 'Then I suggest Curd should have given greater consideration to the nutritional requirements of the aristocracy.', note], next),
    choice('Q5_D', 'Give it to whoever owns the cow.', ['Splendid! An emerging recognition of private property rights.',
      pip('What if the ten peasants collectively own the cow?'), 'Good heavens. You were making such promising progress.', note], next),
    choice('Q5_E', 'Give it all to the Milk Baron.', ['Extraordinary!', direction('The Professor enthusiastically makes several notes.'),
      'A complete ideological transformation within a single academic session!', 'I may have inadvertently developed a cure for Curdism!',
      pip('Can I have some milk now?'), "Oh, let's not undo all our progress."], next),
    choice('Q5_F', 'Has anyone consulted the cow?', ['Consulted the cow?!', 'My dear boy, it is a cow. What possible economic insight could it offer?',
      guard('I actually studied agricultural economics at—'), guard('...'), guard('Never mind, sir.'),
      'Now, where were we?', note], next)
  ]);
}

function informing(next) {
  const followup = say([pip("So where's the money?"), 'My dear peasant, I deal in theoretical experiments.', pip('Oh.')], next);
  return say(['Question four. If I offered you one hundred milk tokens to inform upon your fellow Curdist students, would you accept?'], [
    choice('Q4_A', 'Yes.', ['Interesting. The subject is susceptible to even the most elementary of interrogation techniques.', note], followup),
    choice('Q4_B', "A hundred milk tokens?! I'll take that right now!", ['Subject is remarkably susceptible to bribery.', note], followup),
    choice('Q4_C', "I don't have any Curdist friends.", ['Subject appears to have no friends. A potentially significant explanatory variable.', note], next),
    choice('Q4_D', "[Lie] I don't have any Curdist friends.", ['Subject demonstrates a remarkable lack of proficiency in deception.', note], next),
    choice('Q4_E', 'NEVER! VIVA LA REVOLUTION!', ['Remarkably predictable.', note], next)
  ]);
}

function milkBreak(next) {
  const waiter = text => ({text, character: 'male-waiter', speaker: 'Waiter', mood: 'attentive'});
  return say(['Thirsty work, young man. Would you care for some milk?'], [
    choice('MILK_A', 'Yes, please.', ['Pleasantly polite. Waiter?', waiter('Yes, sir?'),
      'A tall glass of milk for our research subject, if you would.', waiter('Right away, sir.'),
      {...direction('Pip drinks the milk.'), enterAction: 'curdistMilk'},
      professor('Excellent. Let us continue.', 'self-assured-smirk', {milkMoustache: true})], next),
    choice('MILK_B', 'Can I drink from the fountain?', ['WHAT?! Good heavens, no! How utterly disgusting!', 'Never mind. Moving on.'], next),
    choice('MILK_C', 'No, thank you.', ['Demonstrates sufficient reverence for his betters to decline their milk. Most impressive.', note], next),
    choice('MILK_D', 'Screw you and your milk, you capitalist cow!', [
      guard('HEY! Who are you calling a cow?!'), guard('I mean... never mind. Mooving on.')], next)
  ]);
}

function women(seducedExecutive, next) {
  return say(['Word association has produced some remarkable results. Let us try another.',
    'Question three. "Women are..."', gesture], [
    choice('Q3_A', '...female stickmen?', ['Remarkably, the subject appears to possess the intellectual faculties of a woman. Most interesting.'], [
      choice('Q3_A1', "That's sexist!", ['Entirely as predicted! My theoretical model is proving quite impeccable.', note, pip('(Whispering) Kill me...')], next),
      choice('Q3_A2', "What?! That's a perfectly adequate dictionary definition!", ['Subject appears to own a dictionary. Must investigate the relationship between access to dictionaries and political radicalisation.', note], next),
      choice('Q3_A3', 'Well, obviously, there is no statistically significant difference in intelligence between men and women.',
        ['Subject has managed to convince himself of something patently untrue. This is beginning to explain the intellectual appeal of Curdism.', note], next)
    ]),
    choice('Q3_B', '...an oppressed minority with whom we must unite to break the shackles of capitalism!',
      ['As anticipated, the subject demonstrates both a mathematical and a linguistic misunderstanding of the word "minority".', note], next),
    choice('Q3_C', '...property?', ['Subject demonstrates an inadequate understanding of the current legal system, but may prove a valuable ideological ally in matters of legislative reform.',
      note, pip("So women aren't property?"), 'Not presently, no.', pip('Presently?!'),
      'There are several legislative proposals circulating amongst my colleagues.', pip('Have you consulted any women?'),
      'Good heavens, no. That would introduce an undesirable degree of bias into the research.', note], next),
    choice('Q3_D', '...pretty?', ['Subject exhibits encouraging signs of simple-mindedness.',
      "Appears to possess conventional reproductive inclinations. Reassuring, given the economy's continued reliance upon successive generations of peasants.", note], [
      choice('Q3_D1', 'What if I find aristocratic women attractive?', ["An unfortunate consequence of possessing eyesight beyond one's social station.",
        pip('Am I not allowed to find them attractive?'), 'Certainly. Aspiration is an excellent incentive for productivity. Attainment, however, is another matter entirely.'], next),
      ...(seducedExecutive ? [choice('Q3_D2', 'Lady Penelope certainly thought I was attractive.',
        ['Yes, well. Even the aristocracy occasionally makes regrettable consumer decisions.', note], next)] : [])
    ]),
    choice('Q3_E', '...equal to men!', ['Ah! An encouraging recognition of the social hierarchy. Peasants of either sex are equally undeserving of wealth, political influence and unrestricted access to milk.', note], [
      choice('Q3_E1', "That's not what I meant!", ['Oh?', pip('I believe everyone is equal!'),
        'Everyone?! Even the lactose intolerant?', pip('YES!'), 'A most comprehensive disregard for the natural order.', note], next),
      choice('Q3_E2', 'What about aristocratic women?', ['My dear boy, an aristocratic woman is infinitely superior to a peasant man.',
        pip('But you just implied women were intellectually inferior!'), 'Yes, but poverty is a considerably more debilitating condition.', note], next)
    ])
  ]);
}

function workers(seenDj, next) {
  const djFollowup = say([
    'Quiet, quiet! At the Royal Academy, we prefer the term Stickmanus Melanodermis.',
    pip('Wow.'), 'Curdists are considerably worse than I had anticipated.', note
  ], next);
  const dj = say(['Even...', direction('The Professor lowers his voice to a whisper.'), 'Men like DJ Dairy?',
    ...(!seenDj ? [pip('DJ who?'), '(Whispering) Him.', direction('The Professor discreetly points towards DJ Dairy.'),
      {text: 'DJ DAIRY IN DA HOUSE!', character: 'dj', speaker: 'DJ Dairy', mood: 'microphone'}] : []),
    pip('You mean black people?')
  ], djFollowup);
  const inclusivity = say(['Unbelievable. So even lactose-intolerant workers?', pip('Yes.'), 'Goat-herding workers?'], [
    choice('Q2_GOAT_A', 'Yes!', [], dj),
    choice('Q2_GOAT_B', 'Goat herding?', [], dj)
  ]);
  const common = say(['Now, by "workers of the world", you mean workers of your own race, religion and nationality, presumably?'], [
    choice('Q2_D4A', '[Lie] Yes.', ['Splendid! Absolutely splendid! I can submit my paper to the Royal Academy tomorrow morning.', note], next),
    choice('Q2_D4B', 'No.', [], inclusivity),
    choice('Q2_D4C', "You can't be serious!", [], inclusivity)
  ]);
  return say(['Question two. Complete the following sentence.', '"Workers..."', gesture], [
    choice('Q2_A', '...are an essential part of society.', ["Essential to society, yet subservient to capital. I didn't realise you'd read my book!",
      'Good heavens. How could you afford it?'], [
      choice('Q2_A1', "I didn't... That's from your book?!", ['The public propaganda programme has paid dividends. Most interesting.', note,
        pip("What propaganda?! I didn't even say that!"), 'So effective that the subject remains entirely unaware of its influence. Remarkable.', anotherNote], next),
      choice('Q2_A2', '[Lie] I saved up all my pocket money for eight years just to purchase half a page.',
        [professor('Such dedication to intellectual advancement! Here, my dear boy. A modest reward for being such an exemplary member of the working class.',
          'self-assured-smirk', {enterAction: 'curdistWorkerReward'})], next),
      choice('Q2_A3', 'Workers are MORE important than capital!', ['And yet I have amassed considerably more wealth than any of my workers. Explain that, undergraduate.'], next),
      choice('Q2_A4', 'The revolution will be bloody.', ['Yes, yes. How terribly predictable.',
        'An inverse relationship between intellectual capacity and the propensity for violence. Entirely consistent with my earlier findings.', note], next)
    ]),
    choice('Q2_B', '...are a regrettable necessity for the present moment, at least until robotics advances sufficiently.',
      ['My God! It is capable of learning!', note], [
        choice('Q2_B1', '...is the sort of propaganda you leeches spew!', ['Ah. I was premature in my assessment.', note], next),
        choice('Q2_B2', 'What can I say? This place is rubbing off on me.',
          ['So exposure therapy does work?! Although exposing the peasantry to aristocratic living conditions on a meaningful scale would be economically prohibitive...', note], next),
        choice('Q2_B3', "Look, Doc, I just want my two hundred milk tokens so I can be free. I'll say whatever at this point.",
          ['Responds to both the carrot AND the stick. Fascinating.', note], next)
      ]),
    choice('Q2_C', '...should own the means of milk production.', ['Good heavens! Has nobody explained the concept of ownership to these people?', note], next),
    choice('Q2_D', 'WORKERS OF THE WORLD UNITE!', ["Excellent, excellent! I've always wanted to ascertain the meaning of this rather pitiable catchphrase. There has been considerable debate on the subject at the Royal Academy.",
      'The prevailing interpretation is "Workers of the world, unite in your love of your betters." Is it not?'], [
      choice('Q2_D1', "What?! No! You can't be serious!", ['Good heavens. There are several distinguished academics whose reputations depend upon that interpretation.', note], common),
      choice('Q2_D2', '[Lie] Yes.', ['Splendid! That settles nearly thirty years of academic debate.', note], common),
      choice('Q2_D3', 'It means unite in overthrowing the Dairy Aristocracy and reclaiming the milk produced by our collective labour!',
        ['Oh, how thoroughly unpleasant.', 'I much preferred our interpretation.', note], common)
    ]),
    choice('Q2_E', '...deserve basic rights and a liveable wage.', ['Ah, moderate collectivism. A particularly dangerous gateway drug to ideological extremism.',
      'It begins with a liveable wage and ends with the peasantry demanding political representation.', note], next)
  ]);
}

function personalFailure(seducedExecutive, next) {
  const compensation = text => professor(text, 'thinking', {enterAction: 'curdistCompensation'});
  const profDenial = 'A severe disconnect from observable reality. Good heavens, the condition is more advanced than I anticipated.';
  const personalLabel = 'Well, I suppose when I was seventeen, there was this girl, and she...';
  const personal = say(['Ah! Sexual impotence. A common affliction of the collectivist mind.', note], [
    choice('Q1_4A', 'Hey! I am perfectly potent!', ['How peculiar. One would have thought a sexually fulfilled peasant would have little inclination towards revolutionary politics.'], next),
    choice('Q1_4B', "Wait a minute. You said I'm your first primary source. How would you know?",
      ['My dear peasant, my conclusions are supported by decades of rigorous academic inquiry, extensive peer-reviewed literature and several exceptionally sophisticated models.',
        pip('Models?'), 'Predominantly theoretical in nature, admittedly. The empirical component of my research has been somewhat lacking.',
        pip("So you've never actually tested your theory?"), "Good heavens, what do you suppose I'm doing now?"], next),
    choice('Q1_4C', 'That makes a lot of sense.', ['Good heavens. The condition may be more advanced than I anticipated.', anotherNote], next),
    choice('Q1_4D', "I'm starting to question your academic credentials.", ['Intellectual hostility towards established authorities. Yes, Curd did write about that.', note], next),
    ...(seducedExecutive ? [
      choice('Q1_4G', 'What are you on about?!', [direction('Pip points at his face.'), "Good heavens! Is that Lady Penelope's lipstick?",
        pip('YES!'), 'Oh, dear. I shall have to make some adjustments to my theoretical models.'], next)
    ] : [
      choice('Q1_4E', "[Lie] I've had many sexual partners!", ['Sexual insecurity manifesting itself through exaggerated claims of reproductive success. Fascinating.'], next),
      choice('Q1_4F', "I've had many sexual partners!", ['Ah. Promiscuity. A rather literal interpretation of collective ownership.'], next)
    ])
  ]);
  const common = say(['Now, returning to the original question. When did you first realise you were a failure in life?'], [
    choice('Q1_COMMON_A', 'I am not a failure.', [profDenial, note], next),
    choice('Q1_COMMON_B', 'This is ridiculous!', ["Intellectual incapacity to comprehend even the most elementary of questions. Yes, yes. It's all beginning to make sense.", note], next),
    choice('Q1_COMMON_C', "You can't simply declare all Curdists to be failures!", ['A fundamental inability to recognise intellectual authority. Precisely as I hypothesised.', note], next),
    choice('Q1_COMMON_D', personalLabel, [], personal)
  ]);
  const coercion = say(['Ah. Coercion, then.', 'GUARDS!', guard('Yes, sir?'),
    "Kindly shoot this peasant should he attempt to terminate the interview prematurely. He's a Curdist, you see.", guard('With pleasure, sir. Disgusting.')], [
    choice('Q1_GUARD_B1', "Alright, alright! I'll do the study!", ['Responds favourably to the threat of violence. How very interesting.', note], next),
    choice('Q1_GUARD_B2', 'Is it too late to accept compensation?', ['Oh, splendid! Ideological convictions deteriorate remarkably quickly under pressure.',
      professor('Three milk tokens should suffice. Your negotiating position has deteriorated somewhat.', 'self-assured-smirk', {enterAction: 'curdistCoercedCompensation'}), note], next),
    choice('Q1_GUARD_B3', 'I still refuse!', ['Good heavens. Are you genuinely prepared to sacrifice your life to avoid participating in an academic study?'], [
      choice('Q1_GUARD_B3A', "Alright, alright! I'll participate!", ['Survival instinct ultimately supersedes ideological conviction.', note], next),
      choice('Q1_GUARD_B3B', 'I refuse!', [], ending(['How academically inconvenient.', 'Guard, if you would be so kind.'], 'curdistInterviewDeath'))
    ]),
    choice('Q1_GUARD_B4', 'VIVA LA REVOLUTION!', [], ending(['Oh, splendid. A terminal case.', 'Guard?'], 'curdistInterviewDeath'))
  ]);
  const offer = say(['Now, will financial compensation be necessary?'], [
    choice('Q1_COMP_YES', 'Yes.', [compensation('Financial incentives supersede ideological convictions. Most interesting.'), note], next),
    choice('Q1_COMP_NO', 'No.', ['A strong inclination towards unpaid labour. How characteristically peasant-like.', note], [
      choice('Q1_COMP_NO_A', "I don't want your money.", ['Hostility towards aristocratic wealth, even when offered voluntarily. A fascinating manifestation of class resentment.', note], next),
      choice('Q1_COMP_NO_B', "I don't want to be interviewed!", [], coercion)
    ])
  ]);
  return say([direction('The Professor produces a notebook.'), 'First question. When did you first realise you were a failure in life?'], [
    choice('Q1_1', 'Failure? WHAT?!', [
      'My dear boy, we are in a room full of extraordinarily wealthy and refined individuals, accompanied by several regrettably necessary servants who are nonetheless productive members of society, in a manner of speaking.',
      'None of them exhibit any characteristics whatsoever indicative of an ideological alignment with Curdism.',
      'I can only conclude that personal failure is a prerequisite for the development of a collectivist mindset.'
    ], [
      choice('Q1_1A', "That's correlation, not causation!", ['Yet I have found that one hundred per cent of those who make that distinction are failures. Nary a word on the subject from a distinguished aristocrat.',
        pip("That isn't science! You've just plotted two dots and drawn a line!"), 'Ah! So you understand the methodology? Splendid. We can proceed.'], common),
      choice('Q1_1B', "You can't seriously believe that?", ['With the utmost conviction, my dear peasant. The empirical evidence speaks for itself.',
        pip("WHAT EVIDENCE?! You've just plotted two dots and drawn a line!"), 'Ah! So you understand the methodology? Splendid. We can proceed.'], common),
      choice('Q1_1C', "I didn't understand a word you said, but I don't like it.", ['Precisely as the model predicted...', note], common),
      choice('Q1_1D', 'But Karl Curd said, "The poverty of the milkless is not a consequence of their inadequacy, but a condition of aristocratic prosperity."',
        ['And Karl Curd died penniless, thereby substantiating my hypothesis.'], common)
    ]),
    choice('Q1_2', "I'm not a failure!", [profDenial, note], next),
    choice('Q1_3', 'I refuse to be interviewed!', ['If financial compensation is the issue, an arrangement can certainly be made.'], [
      choice('Q1_3A', 'Really? Okay!', [compensation('Easily bribed. Most interesting.'), note], next),
      choice('Q1_3B', 'You would pay me for an interview?', ["Naturally! I'm not a Curdist, my dear peasant. I believe in appropriate remuneration for labour."], [
        choice('Q1_3B1', 'You mean fair pay?', ['My dear boy, I choose my words with considerable academic precision.'], offer),
        choice('Q1_3B2', 'Curdism still recognises the value of compensating labour!', ['Does it indeed?!', 'How academically illuminating.', note], offer),
        choice('Q1_3B3', 'Sounds fair.', [compensation('A remarkably enthusiastic response to the acquisition of private capital.'), note], next)
      ])
    ]),
    choice('Q1_4', personalLabel, [], personal)
  ]);
}

export function createProfessorInterview() {
  let assessment;
  const appliedEffects = new Set();
  return {
    get assessment() { return assessment; },
    score(id) { applyCurdistChoice(assessment, id); },
    applyEffect(action) {
      const key = action === 'curdistCoercedCompensation' ? 'curdistCompensation' : action;
      if (appliedEffects.has(key)) return false;
      appliedEffects.add(key);
      return true;
    },
    complete() { assessment.completed = true; },
    option({curdist, seducedExecutive, seenDj, spokeToMilo}) {
      if (!curdist || assessment) return null;
      return {label: 'What do you think of Karl Curd?', next: () => {
        assessment = createCurdistAssessment();
        const q6 = education(spokeToMilo, () => conclusion(assessment));
        const q1 = personalFailure(seducedExecutive, workers(seenDj, women(seducedExecutive, milkBreak(informing(allocation(q6))))));
        return say(['How anthropologically fascinating! A genuine Curdist in the flesh? My, my. This will advance my research considerably.'], [
          choice('OPEN_A', "[Lie] I'm not a Curdist.", ["Oh, really? And what was all that shouting about when Elias received you? Denial of one's ideological affiliations. Typical Curdist behaviour, so I've read.",
            'I have several questions for you.'], q1),
          choice('OPEN_B', 'Advance your research?', ['I have written several treatises on the failures and intellectual deficiencies of Curdism. But to have access to a primary source!',
            "Oh, my. I think I'll need a moment.", '...', 'Yes. This will be extraordinarily well received at the Royal Academy.'], q1),
          choice('OPEN_C', 'Yes, I am a Curdist.', ['And not even ashamed of it? Truly remarkable.', 'I have several questions for you.'], q1),
          choice('OPEN_D', 'FREE THE PROLETARIAT!', ["Yes, yes. We'll get to the symptoms shortly."], q1)
        ]);
      }};
    }
  };
}
