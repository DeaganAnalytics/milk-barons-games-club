import {applyCurdistChoice, createCurdistAssessment, curdistAssessmentLines, generateCurdistAssessment} from './curdist-assessment.mjs';

const nextReply = next => ({label: 'Continue', next});
const professor = (text, mood = 'thinking', extras) => ({text, mood, ...extras});
const pip = (label, playerMood = 'thinking') => ({label, playerMood});
const guard = (text, mood = 'formal') => ({text, character: 'guard', mood});
const direction = text => professor('', 'thinking', {direction: text});
const notebook = direction => professor('', 'notebook', {direction});
const note = notebook('The Professor makes a note.');
const anotherNote = notebook('The Professor makes another note.');
const closeNotebook = notebook('The Professor closes his notebook.');
const gesture = direction('The Professor gestures towards Pip.');

function say(lines, next) {
  let replies = Array.isArray(next) ? next : next.responsePrompt ? next.replies : [nextReply(next)];
  let node;
  for (const line of [...lines].reverse()) {
    if (typeof line === 'object' && line.label) {
      const response = replies.length === 1 && replies[0].label === 'Continue'
        ? replies[0].next : {...professor(''), replies, mustContinue: true};
      replies = [{...line, next: response}];
      node = {...professor(''), replies, responsePrompt: true, mustContinue: true};
    } else {
      node = {...(typeof line === 'string' ? professor(line) : line), replies, mustContinue: true};
      replies = [nextReply(node)];
    }
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
    {label: 'That research was completely unscientific!', next: ending([professor('And yet I am the scientist, and you are the peasant.', 'deadpan'), "Curious, isn't it?"])},
    {label: "Well, I'm still a Curdist.", next: ending(['How unfortunate.', 'I suppose every academic study has its limitations.'])},
    {label: 'Hmm. Maybe you have a point.', next: ending(['Good meadows!', professor('Have I discovered a cure? Could it be?!', 'self-assured-smirk'),
      notebook('The Professor hurriedly reopens his notebook.'), 'I must contact the Royal Academy immediately!'])},
    {label: 'DEATH TO THE DAIRY ARISTOCRACY! LIBERATE THE MILK! LONG LIVE THE REVOLUTION!',
      next: ending([notebook('The Professor reopens his notebook.'), professor('Persistent vocal symptoms.', 'deadpan'),
        notebook('The Professor makes one final note.'), professor('Further research required.', 'deadpan')])}
  ];
  return say([closeNotebook, 'Well, that concludes my research.',
    'You have been extraordinarily helpful, my dear peasant. Far more so than I had anticipated.'], [
    {label: 'How did I do?', next: say(['One moment. Let me examine my findings.',
      notebook('The Professor consults his notebook.'), 'I have assessed your condition across four distinct academic dimensions.',
      'The results are quite illuminating.', ...curdistAssessmentLines(assessment.results), closeNotebook,
      professor('Yes, yes. This should make for an exceptionally well-received publication.', 'self-assured-smirk')], final)},
    {label: 'Can I go now?', next: say([professor('Oh, certainly. Your continued presence is no longer of academic value.', 'deadpan')], final)}
  ]);
}

function education(spokeToMilo, next) {
  return say(['Now, let us examine your educational background.',
    'At what point during your university education did you develop the unfortunate impression that your opinions were of consequence?'], [
    choice('Q6_A', 'When I started reading Karl Curd.', ['Ah. Exposure to academically hazardous literature.',
      'Were there no warning labels on the book?', pip('Warning labels?!', 'alarmed'),
      'I have long advocated that his publications carry illustrations depicting the consequences of collectivism.',
      pip('Like what?'), 'Empty milk glasses. Malnourished aristocrats. That sort of thing.', note], next),
    choice('Q6_B', 'When I realised how corrupt our society was.', ['Subject demonstrates difficulty distinguishing corruption from established institutional practices.',
      pip('The wealthy control the government!', 'exasperated'), 'Yes, yes. I am familiar with the constitutional arrangements.',
      pip("And that doesn't concern you?"), professor('Not whilst I remain wealthy, no.', 'deadpan'), note], next),
    choice('Q6_C', 'When I started attending political rallies.', ['Ah! Peer pressure amongst the unwashed masses.',
      'Were you, by any chance, familiar with Milo?', pip('The man behind the "Where\'s my milk?" campaign?'),
      'Precisely. A fascinating case study in the consequences of excessive political participation.'], [
      choice('Q6_C1', 'I admired him.', ['An unfortunate choice of role model. I do hope you have alternative career aspirations.', note], next),
      ...(spokeToMilo ? [choice('Q6_C2', 'The Baron makes him wear his own campaign banner!', ['An extraordinarily cost-effective form of political education.',
        pip('And he hits him!'), 'The programme incorporates both theoretical and practical components.', note], next)] : []),
      choice('Q6_C3', 'I thought his campaign was ridiculous.', [professor('Splendid! Some capacity for independent thought, albeit regrettably selective.', 'self-assured-smirk'), note], next)
    ]),
    choice('Q6_D', "Isn't independent thought the purpose of education?", ['For the aristocracy, certainly.',
      pip('And for everyone else?'), 'Literacy, arithmetic and punctuality. Beyond that, the economic returns diminish rather rapidly.',
      pip("So we're educated just to become workers?"), professor("By the Great Cow! Your education wasn't entirely wasted after all.", 'condescending'), note], next),
    choice('Q6_E', 'When I realised I was considerably more intelligent than my lecturers.', [professor('Delusions of intellectual superiority. A particularly common affliction amongst educated peasants.', 'condescending'),
      pip('What if I actually am more intelligent?'), professor('Do you possess a doctorate?', 'skeptical'), pip('No.'),
      'Have you published any academic literature?', pip('No.'), professor('Do you have a hereditary title?', 'skeptical'),
      pip('What does that have to do with intelligence?!', 'exasperated'), 'I think we have established the limitations of your academic understanding.', note], next),
    choice('Q6_F', 'I was trying to impress a girl.', ['Ah! Romantic aspirations manifesting themselves through ideological affiliation.', professor('Did it work?', 'skeptical')], [
      choice('Q6_F1', 'Yes.', ['Good meadows. Curdism may be sexually transmissible.', note], next),
      choice('Q6_F2', 'No.', ['Unsuccessful courtship followed by prolonged ideological commitment. Entirely consistent with my research.', note], next),
      choice('Q6_F3', 'She left me for a wealthy man.', ['A young lady of considerable economic intelligence.', note], next),
      choice('Q6_F4', 'She was a Curdist too.', ["Oh, dear. They're beginning to form breeding pairs.", note], next)
    ])
  ]);
}

function allocation(next) {
  return say(['Let us examine your understanding of resource allocation through a hypothetical economic scenario.',
    'Imagine, if you will, ten peasants and a single cow.', 'How would you propose allocating the milk?'], [
    choice('Q5_A', 'Equally amongst the ten peasants.', ['Merciful milk! Not a single drop allocated to the aristocracy?',
      pip("You didn't mention any aristocrats."), 'Their presence should be implicit in any respectable economic model.', note], next),
    choice('Q5_B', 'According to how much each peasant contributes.', ['A rudimentary understanding of economic incentives. Encouraging.',
      pip('So you agree?'), 'Provided we recognise hereditary privilege as a considerable economic contribution.',
      pip('How is being born a contribution?'), 'That rather depends upon whom one is born to.', note], next),
    choice('Q5_C', 'From each according to his ability, to each according to his need!', ['An excellent principle! Consider the Baron. His considerable physical proportions necessitate several gallons of milk per day.',
      pip("That's not what Curd meant!"), 'Then I suggest Curd should have given greater consideration to the nutritional requirements of the aristocracy.', note], next),
    choice('Q5_D', 'Give it to whoever owns the cow.', [professor('Splendid! An emerging recognition of private property rights.', 'self-assured-smirk'),
      pip('What if the ten peasants collectively own the cow?'), 'Merciful milk. You were making such promising progress.', note], next),
    choice('Q5_E', 'Give it all to the Milk Baron.', [professor('Extraordinary!', 'self-assured-smirk'), notebook('The Professor enthusiastically makes several notes.'),
      'A complete ideological transformation within a single academic session!', professor('I may have inadvertently developed a cure for Curdism!', 'self-assured-smirk'),
      pip('Can I have some milk now?'), "Oh, let's not undo all our progress."], next),
    choice('Q5_F', 'Has anyone consulted the cow?', [professor('Consulted the cow?!', 'skeptical'), 'My dear boy, it is a cow. What possible economic insight could it offer?',
      guard('I actually studied agricultural economics at—'), guard('...', 'deadpan'), guard('Never mind, sir.'),
      'Now, where were we?', note], next)
  ]);
}

function informing(next) {
  const followup = say([pip("So where's the money?"), professor('My dear peasant, I deal in theoretical experiments.', 'condescending'), pip('Oh.', 'sorry')], next);
  return say(['Question four. If I offered you one hundred milk tokens to inform upon your fellow Curdist students, would you accept?'], [
    choice('Q4_A', 'Yes.', ['Interesting. The subject is susceptible to even the most elementary of interrogation techniques.', note], followup),
    choice('Q4_B', "A hundred milk tokens?! I'll take that right now!", ['Subject is remarkably susceptible to bribery.', note], followup),
    choice('Q4_C', "I don't have any Curdist friends.", ['Subject appears to have no friends. A potentially significant explanatory variable.', note], next),
    choice('Q4_D', "[Lie] I don't have any Curdist friends.", ['Subject demonstrates a remarkable lack of proficiency in deception.', note], next),
    choice('Q4_E', 'NEVER! VIVA LA REVOLUTION!', [professor('Remarkably predictable.', 'deadpan'), note], next)
  ]);
}

function milkBreak(next) {
  const waiter = text => ({text, character: 'male-waiter', speaker: 'Waiter', mood: 'attentive'});
  return say(['Thirsty work, young man. Would you care for some milk?'], [
    choice('MILK_A', 'Yes, please.', ['Pleasantly polite. Waiter?', waiter('Yes, sir?'),
      'A tall glass of milk for our research subject, if you would.', waiter('Right away, sir.'),
      {...direction('Pip drinks the milk.'), enterAction: 'curdistMilk'},
      professor('Excellent. Let us continue.', 'self-assured-smirk', {milkMoustache: true})], next),
    choice('MILK_B', 'Can I drink from the fountain?', [professor('WHAT?! Good meadows, no! How utterly disgusting!', 'skeptical'), 'Never mind. Moving on.'], next),
    choice('MILK_C', 'No, thank you.', ['Demonstrates sufficient reverence for his betters to decline their milk. Most impressive.', note], next),
    choice('MILK_D', 'Screw you and your milk, you capitalist cow!', [
      guard('HEY! Who are you calling a cow?!', 'speaking'), guard('I mean... never mind. Mooving on.', 'deadpan')], next)
  ]);
}

function women(seducedExecutive, next) {
  return say(['Word association has produced some remarkable results. Let us try another.',
    'Question three. "Women are..."', gesture], [
    choice('Q3_A', '...female stickmen?', ['Remarkably, the subject appears to possess the intellectual faculties of a woman. Most interesting.'], [
      choice('Q3_A1', "That's sexist!", [professor('Entirely as predicted! My theoretical model is proving quite impeccable.', 'condescending'), note, pip('(Whispering) Kill me...')], next),
      choice('Q3_A2', "What?! That's a perfectly adequate dictionary definition!", ['Subject appears to own a dictionary. Must investigate the relationship between access to dictionaries and political radicalisation.', note], next),
      choice('Q3_A3', 'Well, obviously, there is no statistically significant difference in intelligence between men and women.',
        ['Subject has managed to convince himself of something patently untrue. This is beginning to explain the intellectual appeal of Curdism.', note], next)
    ]),
    choice('Q3_B', '...an oppressed minority with whom we must unite to break the shackles of capitalism!',
      ['As anticipated, the subject demonstrates both a mathematical and a linguistic misunderstanding of the word "minority".', note], next),
    choice('Q3_C', '...property?', ['Subject demonstrates an inadequate understanding of the current legal system, but may prove a valuable ideological ally in matters of legislative reform.',
      note, pip("So women aren't property?"), professor('Not presently, no.', 'deadpan'), pip('Presently?!', 'alarmed'),
      professor('There are several legislative proposals circulating amongst my colleagues.', 'condescending'), pip('Have you consulted any women?'),
      'Good meadows, no. That would introduce an undesirable degree of bias into the research.', note], next),
    choice('Q3_D', '...pretty?', [professor('Subject exhibits encouraging signs of simple-mindedness.', 'condescending'),
      "Appears to possess conventional reproductive inclinations. Reassuring, given the economy's continued reliance upon successive generations of peasants.", note], [
      choice('Q3_D1', 'What if I find aristocratic women attractive?', ["An unfortunate consequence of possessing eyesight beyond one's social station.",
        pip('Am I not allowed to find them attractive?'), 'Certainly. Aspiration is an excellent incentive for productivity. Attainment, however, is another matter entirely.'], next),
      ...(seducedExecutive ? [choice('Q3_D2', 'Lady Penelope certainly thought I was attractive.',
        [professor('Yes, well. Even the aristocracy occasionally makes regrettable consumer decisions.', 'condescending'), note], next)] : [])
    ]),
    choice('Q3_E', '...equal to men!', [professor('Ah! An encouraging recognition of the social hierarchy. Peasants of either sex are equally undeserving of wealth, political influence and unrestricted access to milk.', 'self-assured-smirk'), note], [
      choice('Q3_E1', "That's not what I meant!", ['Oh?', pip('I believe everyone is equal!'),
        professor('Everyone?! Even the lactose intolerant?', 'skeptical'), pip('YES!', 'alarmed'), 'A most comprehensive disregard for the natural order.', note], next),
      choice('Q3_E2', 'What about aristocratic women?', ['My dear boy, an aristocratic woman is infinitely superior to a peasant man.',
        pip('But you just implied women were intellectually inferior!'), 'Yes, but poverty is a considerably more debilitating condition.', note], next)
    ])
  ]);
}

function workers(seenDj, next) {
  const djFollowup = say([
    'Quiet, quiet! At the Royal Academy, we prefer the term Stickmanus Melanodermis.',
    pip('Wow.', 'attentive'), 'Curdists are considerably worse than I had anticipated.', note
  ], next);
  const dj = say(['Even...', direction('The Professor lowers his voice to a whisper.'), 'Men like DJ Dairy?',
    ...(!seenDj ? [pip('DJ who?', 'worried'), '(Whispering) Him.', direction('The Professor discreetly points towards DJ Dairy.'),
      {text: 'DJ DAIRY IN DA HOUSE!', character: 'dj', speaker: 'DJ Dairy', mood: 'microphone'}] : []),
    pip('You mean black people?')
  ], djFollowup);
  const inclusivity = say([professor('Unbelievable. So even lactose-intolerant workers?', 'skeptical'), pip('Yes.'), 'Goat-herding workers?'], [
    choice('Q2_GOAT_A', 'Yes!', [], dj),
    choice('Q2_GOAT_B', 'Goat herding?', [], dj)
  ]);
  const common = say(['Now, by "workers of the world", you mean workers of your own race, religion and nationality, presumably?'], [
    choice('Q2_D4A', '[Lie] Yes.', [professor('Splendid! Absolutely splendid! I can submit my paper to the Royal Academy tomorrow morning.', 'self-assured-smirk'), note], next),
    choice('Q2_D4B', 'No.', [], inclusivity),
    choice('Q2_D4C', "You can't be serious!", [], inclusivity)
  ]);
  return say(['Question two. Complete the following sentence.', '"Workers..."', gesture], [
    choice('Q2_A', '...are an essential part of society.', ["Essential to society, yet subservient to capital. I didn't realise you'd read my book!",
      'Good meadows. How could you afford it?'], [
      choice('Q2_A1', "I didn't... That's from your book?!", [professor('The public propaganda programme has paid dividends. Most interesting.', 'self-assured-smirk'), note,
        pip("What propaganda?! I didn't even say that!"), 'So effective that the subject remains entirely unaware of its influence. Remarkable.', anotherNote], next),
      choice('Q2_A2', '[Lie] I saved up all my pocket money for eight years just to purchase half a page.',
        [professor('Such dedication to intellectual advancement! Here, my dear boy. A modest reward for being such an exemplary member of the working class.',
          'self-assured-smirk', {enterAction: 'curdistWorkerReward'})], next),
      choice('Q2_A3', 'Workers are MORE important than capital!', ['And yet I have amassed considerably more wealth than any of my workers. Explain that, undergraduate.'], next),
      choice('Q2_A4', 'The revolution will be bloody.', [professor('Yes, yes. How terribly predictable.', 'condescending'),
        'An inverse relationship between intellectual capacity and the propensity for violence. Entirely consistent with my earlier findings.', note], next)
    ]),
    choice('Q2_B', '...are a regrettable necessity for the present moment, at least until robotics advances sufficiently.',
      [professor('By the Great Cow! It is capable of learning!', 'self-assured-smirk'), note], [
        choice('Q2_B1', '...is the sort of propaganda you leeches spew!', [professor('Ah. I was premature in my assessment.', 'deadpan'), note], next),
        choice('Q2_B2', 'What can I say? This place is rubbing off on me.',
          ['So exposure therapy does work?! Although exposing the peasantry to aristocratic living conditions on a meaningful scale would be economically prohibitive...', note], next),
        choice('Q2_B3', "Look, Doc, I just want my two hundred milk tokens so I can be free. I'll say whatever at this point.",
          ['Responds to both the carrot AND the stick. Fascinating.', note], next)
      ]),
    choice('Q2_C', '...should own the means of milk production.', [professor('Merciful milk! Has nobody explained the concept of ownership to these people?', 'skeptical'), note], next),
    choice('Q2_D', 'WORKERS OF THE WORLD UNITE!', ["Excellent, excellent! I've always wanted to ascertain the meaning of this rather pitiable catchphrase. There has been considerable debate on the subject at the Royal Academy.",
      'The prevailing interpretation is "Workers of the world, unite in your love of your betters." Is it not?'], [
      choice('Q2_D1', "What?! No! You can't be serious!", ['Merciful milk. There are several distinguished academics whose reputations depend upon that interpretation.', note], common),
      choice('Q2_D2', '[Lie] Yes.', [professor('Splendid! That settles nearly thirty years of academic debate.', 'self-assured-smirk'), note], common),
      choice('Q2_D3', 'It means unite in overthrowing the Dairy Aristocracy and reclaiming the milk produced by our collective labour!',
        ['Oh, how thoroughly unpleasant.', 'I much preferred our interpretation.', note], common)
    ]),
    choice('Q2_E', '...deserve basic rights and a liveable wage.', ['Ah, moderate collectivism. A particularly dangerous gateway drug to ideological extremism.',
      'It begins with a liveable wage and ends with the peasantry demanding political representation.', note], next)
  ]);
}

function personalFailure(seducedExecutive, next) {
  const compensation = text => professor(text, 'thinking', {enterAction: 'curdistCompensation'});
  const profDenial = professor('A severe disconnect from observable reality. Good meadows, the condition is more advanced than I anticipated.', 'condescending');
  const personalLabel = 'Well, I suppose when I was seventeen, there was this girl, and she...';
  const personal = say(['Ah! Sexual impotence. A common affliction of the collectivist mind.', note], [
    choice('Q1_4A', 'Hey! I am perfectly potent!', [professor('How peculiar. One would have thought a sexually fulfilled peasant would have little inclination towards revolutionary politics.', 'skeptical')], next),
    choice('Q1_4B', "Wait a minute. You said I'm your first primary source. How would you know?",
      ['My dear peasant, my conclusions are supported by decades of rigorous academic inquiry, extensive peer-reviewed literature and several exceptionally sophisticated models.',
        pip('Models?'), 'Predominantly theoretical in nature, admittedly. The empirical component of my research has been somewhat lacking.',
        pip("So you've never actually tested your theory?"), "For milk's sake, what do you suppose I'm doing now?"], next),
    choice('Q1_4C', 'That makes a lot of sense.', ['Merciful milk. The condition may be more advanced than I anticipated.', anotherNote], next),
    choice('Q1_4D', "I'm starting to question your academic credentials.", ['Intellectual hostility towards established authorities. Yes, Curd did write about that.', note], next),
    ...(seducedExecutive ? [
      choice('Q1_4G', 'What are you on about?!', [direction('Pip points at his face.'), professor("By the Great Cow! Is that Lady Penelope's lipstick?", 'skeptical'),
        pip('YES!', 'alarmed'), 'Oh, dear. I shall have to make some adjustments to my theoretical models.'], next)
    ] : [
      choice('Q1_4E', "[Lie] I've had many sexual partners!", ['Sexual insecurity manifesting itself through exaggerated claims of reproductive success. Fascinating.'], next),
      choice('Q1_4F', "I've had many sexual partners!", ['Ah. Promiscuity. A rather literal interpretation of collective ownership.'], next)
    ])
  ]);
  const common = say(['Now, returning to the original question. When did you first realise you were a failure in life?'], [
    choice('Q1_COMMON_A', 'I am not a failure.', [profDenial, note], next),
    choice('Q1_COMMON_B', 'This is ridiculous!', [professor("Intellectual incapacity to comprehend even the most elementary of questions. Yes, yes. It's all beginning to make sense.", 'condescending'), note], next),
    choice('Q1_COMMON_C', "You can't simply declare all Curdists to be failures!", [professor('A fundamental inability to recognise intellectual authority. Precisely as I hypothesised.', 'condescending'), note], next),
    choice('Q1_COMMON_D', personalLabel, [], personal)
  ]);
  const coercion = say([professor('Ah. Coercion, then.', 'deadpan'), professor('GUARDS!', 'deadpan'), guard('Yes, sir?'),
    "Kindly shoot this peasant should he attempt to terminate the interview prematurely. He's a Curdist, you see.", guard('With pleasure, sir. Disgusting.', 'speaking')], [
    choice('Q1_GUARD_B1', "Alright, alright! I'll do the study!", ['Responds favourably to the threat of violence. How very interesting.', note], next),
    choice('Q1_GUARD_B2', 'Is it too late to accept compensation?', [professor('Oh, splendid! Ideological convictions deteriorate remarkably quickly under pressure.', 'self-assured-smirk'),
      professor('Three milk tokens should suffice. Your negotiating position has deteriorated somewhat.', 'self-assured-smirk', {enterAction: 'curdistCoercedCompensation'}), note], next),
    choice('Q1_GUARD_B3', 'I still refuse!', [professor('Good meadows. Are you genuinely prepared to sacrifice your life to avoid participating in an academic study?', 'skeptical')], [
      choice('Q1_GUARD_B3A', "Alright, alright! I'll participate!", ['Survival instinct ultimately supersedes ideological conviction.', note], next),
      choice('Q1_GUARD_B3B', 'I refuse!', [], ending([professor('How academically inconvenient.', 'skeptical'), professor('Guard, if you would be so kind.', 'deadpan')], 'curdistInterviewDeath'))
    ]),
    choice('Q1_GUARD_B4', 'VIVA LA REVOLUTION!', [], ending([professor('Oh, splendid. A terminal case.', 'self-assured-smirk'), professor('Guard?', 'deadpan')], 'curdistInterviewDeath'))
  ]);
  const offer = say(['Now, will financial compensation be necessary?'], [
    choice('Q1_COMP_YES', 'Yes.', [compensation('Financial incentives supersede ideological convictions. Most interesting.'), note], next),
    choice('Q1_COMP_NO', 'No.', ['A strong inclination towards unpaid labour. How characteristically peasant-like.', note], [
      choice('Q1_COMP_NO_A', "I don't want your money.", ['Hostility towards aristocratic wealth, even when offered voluntarily. A fascinating manifestation of class resentment.', note], next),
      choice('Q1_COMP_NO_B', "I don't want to be interviewed!", [], coercion)
    ])
  ]);
  return say([notebook('The Professor produces a notebook.'), 'First question. When did you first realise you were a failure in life?'], [
    choice('Q1_1', 'Failure? WHAT?!', [
      'My dear boy, we are in a room full of extraordinarily wealthy and refined individuals, accompanied by several regrettably necessary servants who are nonetheless productive members of society, in a manner of speaking.',
      'None of them exhibit any characteristics whatsoever indicative of an ideological alignment with Curdism.',
      'I can only conclude that personal failure is a prerequisite for the development of a collectivist mindset.'
    ], [
      choice('Q1_1A', "That's correlation, not causation!", ['Yet I have found that one hundred per cent of those who make that distinction are failures. Nary a word on the subject from a distinguished aristocrat.',
        pip("That isn't science! You've just plotted two dots and drawn a line!"), 'Ah! So you understand the methodology? Splendid. We can proceed.'], common),
      choice('Q1_1B', "You can't seriously believe that?", ['With the utmost conviction, my dear peasant. The empirical evidence speaks for itself.',
        pip("WHAT EVIDENCE?! You've just plotted two dots and drawn a line!", 'exasperated'), 'Ah! So you understand the methodology? Splendid. We can proceed.'], common),
      choice('Q1_1C', "I didn't understand a word you said, but I don't like it.", [professor('Precisely as the model predicted...', 'condescending'), note], common),
      choice('Q1_1D', 'But Karl Curd said, "The poverty of the milkless is not a consequence of their inadequacy, but a condition of aristocratic prosperity."',
        [professor('And Karl Curd died penniless, thereby substantiating my hypothesis.', 'condescending')], common)
    ]),
    choice('Q1_2', "I'm not a failure!", [profDenial, note], next),
    choice('Q1_3', 'I refuse to be interviewed!', ['If financial compensation is the issue, an arrangement can certainly be made.'], [
      choice('Q1_3A', 'Really? Okay!', [compensation('Easily bribed. Most interesting.'), note], next),
      choice('Q1_3B', 'You would pay me for an interview?', [professor("Naturally! I'm not a Curdist, my dear peasant. I believe in appropriate remuneration for labour.", 'condescending')], [
        choice('Q1_3B1', 'You mean fair pay?', [professor('My dear boy, I choose my words with considerable academic precision.', 'condescending')], offer),
        choice('Q1_3B2', 'Curdism still recognises the value of compensating labour!', ['Does it indeed?!', professor('How academically illuminating.', 'self-assured-smirk'), note], offer),
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
        return say([professor('How anthropologically fascinating! A genuine Curdist in the flesh? My, my. This will advance my research considerably.', 'self-assured-smirk')], [
          choice('OPEN_A', "[Lie] I'm not a Curdist.", [professor("Oh, really? And what was all that shouting about when Elias received you? Denial of one's ideological affiliations. Typical Curdist behaviour, so I've read.", 'skeptical'),
            'I have several questions for you.'], q1),
          choice('OPEN_B', 'Advance your research?', ['I have written several treatises on the failures and intellectual deficiencies of Curdism. But to have access to a primary source!',
            "Oh, my. I think I'll need a moment.", '...', professor('Yes. This will be extraordinarily well received at the Royal Academy.', 'self-assured-smirk')], q1),
          choice('OPEN_C', 'Yes, I am a Curdist.', [professor('And not even ashamed of it? Truly remarkable.', 'condescending'), 'I have several questions for you.'], q1),
          choice('OPEN_D', 'FREE THE PROLETARIAT!', [professor("Yes, yes. We'll get to the symptoms shortly.", 'condescending')], q1)
        ]);
      }};
    }
  };
}
