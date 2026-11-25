export const professorMoods = ['self-assured-smirk', 'skeptical', 'thinking', 'condescending', 'deadpan'];
const [smirk, skeptical, thinking, condescending, deadpan] = professorMoods;

const menu = {text: '', mood: smirk, replies: []};
const back = [{label: 'Continue', playerMood: 'attentive', next: menu}];

function exchange(steps, replies = back, action) {
  return steps.reduceRight((next, [label, text, mood, playerMood = 'thinking']) => ({
    label, playerMood, next: {text, mood, replies: next ? [next] : replies, action: next ? undefined : action}
  }), null);
}

const firstMeeting = {
  text: 'Ah! What a fascinating economic specimen. Tell me, peasant, what is your name?',
  mood: thinking,
  replies: [exchange([
    ['My name is Pip.', 'Pip? The naming conventions of the underclass never cease to amaze me. So few syllables. How economical.', condescending, 'attentive'],
    ["And what's your name?", 'Professor Archibald Reginald Montgomery von Butterworth-Smythe the Third, distinguished scholar of political economy and hereditary privilege.', smirk],
    ["That's quite a long name.", 'Naturally. We can afford the additional syllables.', smirk, 'alarmed'],
    ['Can I just call you Professor?', 'I suppose intellectual concessions must occasionally be made for the lower classes.', deadpan]
  ])]
};

const fountainHygiene = exchange([
  ['Is the fountain hygienic?', 'Impeccably so. Fresh milk on tap at all hours.', smirk],
  ["Doesn't it recycle the milk?", "Recycle? Don't be ridiculous! This is a one-way system.", skeptical],
  ['Where does all the milk go?', 'Out to sea, presumably. Where else?', thinking],
  ["Isn't that a terrible waste?", "Waste? My dear boy, the continuous consumption of milk stimulates the dairy economy. I've published extensively on the subject.", condescending, 'worried']
]);

const requestMilk = exchange([
  ['Can I have some milk?', "No, no, no. That wouldn't be fitting of your station.", condescending]
], [
  exchange([['Oh, okay.', 'Splendid. A peasant who understands his place.', smirk, 'sorry']]),
  exchange([
    ['I deserve milk just as much as anybody else.', 'That is patently untrue. I have written several treatises on this very subject.', skeptical, 'attentive'],
    ['Can I read them?', "Good heavens, no! I wouldn't want your poverty-stricken hands degrading the leather bindings.", condescending],
    ['Can I read a digital version?', 'Digital? My works?! I would never degrade them so!', skeptical],
    ['Then how am I supposed to understand your argument?', "You aren't required to understand it. Merely to accept it.", deadpan, 'worried']
  ])
]);

const baronPhysique = exchange([
  ["Isn't he a bit, umm... big-boned?", 'Big-boned? My dear peasant, he has the physique of a god! That magnificent body is pure milk fat. We can only aspire to such proportions.', condescending, 'worried'],
  ["Isn't that unhealthy?", "Certainly not! I've published several academic papers demonstrating the obvious health benefits of the Baron's physique.", skeptical],
  ['What sources did you cite?', 'Myself, of course.', smirk],
  ["Isn't that a bit biased?", 'Nonsense. I am a highly respected authority on my own research.', condescending]
]);

const baronBehaviour = exchange([
  ['He keeps watching me.', 'Studying, not watching.', deadpan, 'worried'],
  ['Why?', 'To better understand the peasant mind. Our Baron takes a remarkably generous interest in the lower classes.', smirk]
], [
  exchange([
    ["I don't think he's generous at all.", 'Blasphemy! He has provided this magnificent milk fountain entirely free of charge for his guests.', skeptical, 'attentive'],
    ['He paid for all this himself?', "Well, the taxpayers paid for it. But the Baron's guests and the taxpayers rarely overlap on a Venn diagram.", thinking],
    ['Can I have some milk, then?', 'No, no. That would rather undermine the distinction.', deadpan]
  ]),
  exchange([
    ['Does he watch anyone else?', 'Yes, yes. Attractive young ladies, primarily. And the wives of poorer men.', deadpan],
    ['Why them specifically?', 'Ensuring that they are adequately cared for, naturally. The Baron takes his charitable responsibilities very seriously.', smirk],
    ['And their husbands?', 'Their husbands should be grateful that the Baron has taken such a personal interest in their household.', condescending],
    ['Are they?', 'Gratitude is not always immediately apparent among the lower classes.', deadpan]
  ])
]);

const defendDemocracy = exchange([
  ['I read that it was fairer than the system we have today.', 'Reading? A dangerous pastime for someone of your station. Tsk, tsk.', condescending, 'attentive'],
  ["What's wrong with reading?", 'It encourages independent thought, which invariably leads to unreasonable expectations.', thinking],
  ['Such as?', 'Equality, political representation, affordable milk. All manner of economic absurdities.', deadpan]
]);

const politicalSystem = exchange([
  ['What system do we have today?', 'Plutocratic Proportionalism, of course! Voting power proportionate to personal wealth. A far more equitable arrangement.', smirk],
  ['How is that fairer?', "Well, if we allowed poor people an equal say, they'd simply vote themselves more milk. Utterly unacceptable. I've published several studies demonstrating this.", condescending],
  ["Don't wealthy people vote themselves more milk?", "Naturally, but that's an entirely different economic phenomenon.", deadpan],
  ['How so?', "When the poor do it, it's redistribution. When the wealthy do it, it's sound economic policy.", condescending],
  ['How many votes does the Baron get?', 'Oh, enough to ensure the correct outcome.', smirk],
  ["Then what's the point of voting?", 'To demonstrate overwhelming public support for the correct outcome, naturally.', smirk]
]);

const moneyLecture = exchange([
  ['Can I have some money?', 'Good heavens, no! The indiscriminate redistribution of wealth undermines the incentive structures upon which our magnificent economic system depends.', skeptical, 'attentive'],
  ['Continue', 'Were I to reward your poverty with money, I would effectively be subsidising your failure to accumulate capital.', condescending],
  ['Continue', 'Furthermore, by reducing my own wealth, I would diminish my capacity to generate future wealth, thereby depriving society of the considerable economic benefits of my prosperity.', thinking],
  ['Continue', 'You see, young man, by refusing to give you money, I am ultimately acting in your best interests.', smirk, 'worried'],
  ['I suppose that makes sense.', "Splendid! Now, would you agree that the acquisition of knowledge is an investment in one's future prosperity?", smirk, 'attentive'],
  ['Well, yes.', 'And that those who provide valuable services deserve financial compensation?', thinking],
  ['I guess so.', 'Excellent! That concludes your introductory lecture in political economy. My usual consultation fee is ₥50, but in recognition of your financial circumstances, I shall charge you a mere ₥5.', smirk],
  ['Wait, what?!', "Congratulations, young man! You've just made your first investment in human capital.", smirk, 'alarmed']
], back, 'chargeProfessorFee');
moneyLecture.once = 'chargeProfessorFee';

const oneTimeTopics = [
  exchange([
    ['What are you doing here?', 'Drinking milk, of course. Keeps the bones strong, the skin youthful and the intellect sharp.', smirk],
    ['From a fountain?', 'Naturally. Where do you drink your milk from?', skeptical, 'alarmed'],
    ["My family can't afford milk.", "Yes, yes. I'm sure poverty has its inconveniences.", condescending, 'sorry']
  ], [fountainHygiene, requestMilk]),
  exchange([
    ['What do you think of the Baron?', "Why, he's the greatest man who ever lived!", smirk]
  ], [baronPhysique, baronBehaviour]),
  exchange([
    ['What do you think about democracy?', 'Democracy?! A terrible thing indeed. One stickman, one vote. Makes absolutely no sense. Thank heavens we abolished it generations ago.', skeptical]
  ], [defendDemocracy, politicalSystem]),
  exchange([
    ['You seem like a smart man. Why are the guards cows?', 'Thank you. I am exceptionally intelligent, yes.', smirk],
    ["You didn't answer my question!", 'Yes, I did. I thanked you for the compliment.', deadpan, 'alarmed'],
    ['The guards. Cows. The guards being cows.', 'Good heavens, what are you on about?', skeptical, 'attentive'],
    ['All the guards are cows! Some of them even have guns!', "Well, naturally. They're guards.", deadpan, 'alarmed'],
    ["But they're cows!", 'Guards.', deadpan, 'worried'],
    ['They have horns!', 'Guards.', deadpan, 'alarmed'],
    ['And udders!', 'My dear boy, I cannot make this any simpler for you. They are guards.', condescending, 'alarmed'],
    ['But...', 'Guards!', skeptical, 'worried']
  ], [])
];

menu.replies.push(
  ...oneTimeTopics.map(reply => ({...reply, once: 'professor: ' + reply.label, consumeOnSelect: true})),
  moneyLecture
);

export function createProfessorConversation() {
  let metProfessor = false;
  return () => {
    const opening = metProfessor ? menu : firstMeeting;
    metProfessor = true;
    return opening;
  };
}
