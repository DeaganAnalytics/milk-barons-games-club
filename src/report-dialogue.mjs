const baronReport = {
  label: 'The Baron keeps following me.', playerMood: 'worried',
  next: {text: "No he doesn't.", mood: 'deadpan', replies: [
    {label: 'Look! He is approaching us now.', playerMood: 'alarmed',
      next: {text: "Sir you've had too much to drink. Or too little.", mood: 'suspicious', replies: [
        {label: 'But the Baron...', playerMood: 'worried', next: {text: 'MOOOOVE IT!', mood: 'angry', action: 'reportBaronFollowing'}}
      ]}}
  ]}
};

const miloReport = {
  label: "There's a man in rags wandering around the walls.", playerMood: 'attentive',
  next: {text: 'We have a code 9, I repeat a code 9. Possible Milo sighting.', mood: 'radio',
    direction: 'Grabs radio', replies: [
      {label: "What's gonna happen to him?", playerMood: 'worried',
        next: {text: 'Sir you have done your nation and the Baron a great duty today. Here\'s a performance bonus.', mood: 'formal', action: 'reportMilo'}}
    ]}
};

export function availableReports(completedTrips, seenMilo, miloUnavailable, baronReported = false) {
  const replies = [];
  if (completedTrips >= 2 && !baronReported) replies.push(baronReport);
  if (seenMilo && !miloUnavailable) replies.push(miloReport);
  return replies;
}

export const injuredMiloReply = {
  label: 'What happened to you?', playerMood: 'alarmed',
  next: {text: 'The guards... someone reported me again', mood: 'sad', replies: [
    {label: 'That was me.', playerMood: 'sorry',
      next: {text: 'You monster!', mood: 'angry', action: 'fleeMilo'}},
    {label: "That's horrible... I don't know who did that...", playerMood: 'worried',
      next: {text: "Just stay away, I don't want the attention.", mood: 'worried'}}
  ]}
};

// Each step is the player's choice followed by the guard's line and expression.
function exchange(steps, ending = {}) {
  return steps.reduceRight((next, [label, text, mood, playerMood = 'thinking', direction]) => ({
    label, playerMood,
    next: {text, mood, direction, ...(next ? {replies: [next]} : ending)}
  }), null);
}

const inspectPool = {action: 'inspectPool'};

const manInPool = {
  label: "There's a man in the pool chasing women.", playerMood: 'attentive',
  next: {text: 'A wealthy man or a poor man?', mood: 'suspicious', replies: [
    exchange([
      ['Wealthy, I think.', "Then there's no problem.", 'deadpan'],
      ["But he's chasing women!", "Yes, you've already established that he's enjoying himself. Stop bothering me.", 'angry', 'alarmed']
    ]),
    exchange([
      ['[Lie] A poor man.', 'Good heavens! How did he get past security?', 'speaking', 'worried'],
      ['Continue', 'Lifeguard, this is Roaming One. Is there a man in the pool?', 'radio', 'worried', 'Speaks into radio.'],
      ['Continue', 'And is he poor?', 'radio', 'worried', '...'],
      ['Continue', 'How wealthy?', 'radio', 'worried', '...'],
      ['Continue', 'Ah. Understood. Give him my regards.', 'radio', 'worried', '...'],
      ['Continue', 'Get out of here, you liar! Wasting valuable security resources! ₥10 fine. Pay up!', 'angry', 'alarmed']
    ], {action: 'finePoolLie'})
  ]}
};

const mensClothes = exchange([
  ["No, men's clothes.", 'Oh... I see.', 'deadpan'],
  ["Aren't you going to investigate?", "Well, let's not be too hasty. I'm sure there's a perfectly reasonable explanation.", 'suspicious'],
  ["There's a naked man in the pool.", "Yes, thank you. I'd rather not picture it.", 'deadpan']
], {replies: [
  exchange([
    ["There are women's clothes there too.", "Well, why didn't you lead with that?!", 'speaking'],
    ['Does that change things?', 'Considerably. This now warrants an immediate and thorough investigation.', 'formal'],
    ['What about the man?', "Hopefully he's submerged.", 'deadpan']
  ], inspectPool),
  exchange([
    ["Well, I'll leave it with you.", "I'd rather you didn't.", 'deadpan'],
    ["Aren't you going to do anything?", 'I shall exercise my professional discretion and investigate absolutely nothing.', 'formal']
  ])
]});

export const unattendedClothes = {
  label: 'There are some unattended clothes by the pool.', playerMood: 'attentive',
  next: {text: "Women's clothes?", mood: 'suspicious', replies: [
    exchange([
      ['Yes.', "Good heavens. I'd better investigate.", 'speaking', 'attentive'],
      ['Is that a security concern?', "Potentially. I'll need to conduct a thorough visual inspection.", 'formal'],
      ['Of the clothes?', 'Of the entire pool area. Standard procedure.', 'formal'],
      ["Shouldn't you radio the lifeguard?", "No, no. I wouldn't want to burden him with additional responsibilities. I'll handle this personally.", 'deadpan']
    ], inspectPool),
    mensClothes
  ]}
};

export const lifeguardQualificationReport = exchange([
  ["I don't think the lifeguard is qualified.", 'What makes you say that?', 'suspicious'],
  ["He told me he can't swim.", 'Well, can he see?', 'deadpan'],
  ['Yes.', "Then he's perfectly capable of watching the pool.", 'formal', 'attentive'],
  ['What if someone drowns?', "That's a matter for the lifeguard.", 'deadpan', 'worried']
]);

export const poolReports = [
  manInPool,
  unattendedClothes,
  lifeguardQualificationReport,
  exchange([
    ['I think something inappropriate is happening in the pool.', 'Inappropriate by whose standards?', 'suspicious', 'worried'],
    ['Well, generally accepted standards of public decency.', 'Ah. Peasant standards.', 'deadpan'],
    ['Excuse me?', 'The Dairy Aristocracy operates under a different set of standards. Unless someone is stealing milk or upsetting the Baron, I suggest you mind your own business.', 'formal', 'alarmed']
  ])
];
