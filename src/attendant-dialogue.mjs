export const attendantMoods = ['exuberant', 'laughing', 'happy', 'self-assured', 'thinking'];
const [exuberant, laughing, happy, assured, thinking] = attendantMoods;
const menu = {text: '', mysticVisibilityMenu: true, mood: happy, replies: []};
const back = [{label: 'Continue', playerMood: 'attentive', next: menu}];

function exchange(steps, replies = back, action) {
  return steps.reduceRight((next, [label, text, mood, playerMood = 'thinking']) => ({
    label, playerMood, next: {text, mood, replies: next ? [next] : replies, action: next ? undefined : action}
  }), null);
}

const opening = {
  text: 'Welcome, welcome, to the greatest game of all! Milk balloons to the face, just step up and have a ball!',
  mood: exuberant,
  replies: [exchange([
    ["What's going on here?", "A commissioner who dared to question our great state! Now she's here for your amusement, such a fitting fate!", assured],
    ['And I get to throw milk balloons at her?', 'Take your aim and let them fly! Hit her squarely, hear her cry!', exuberant, 'alarmed']
  ])]
};

const oneTimeTopics = [
  exchange([['What do you think of the Baron?', 'A man of great wealth, a man of great taste! Not a drop of his milk shall ever go to waste!', happy]], [
    exchange([
      ["Isn't he a bit cruel?", 'Cruel, you say? Oh, perish the thought! Our beloved Baron is simply keeping order, as he ought!', laughing],
      ['What if I disagree with him?', 'Keep such opinions tucked away, or in the pillory you might stay!', assured, 'worried']
    ]),
    exchange([
      ["I've seen plenty of waste here.", 'What you call waste, we call good taste!', assured],
      ["There's an entire swimming pool filled with milk!", 'For those who wear gold and dress in fine silk!', happy],
      ["Couldn't that milk feed hundreds of poor families?", "Milk for the poor? What a terrible notion! I'd sooner see it poured into the ocean!", laughing, 'worried'],
      ['That seems rather wasteful.', "The Baron's spending is beyond reproach! Such matters are not for peasants to broach!", assured]
    ])
  ]),
  exchange([
    ['Why are the guards cows?', "Cows, you say? How absurd! That's the strangest thing I've ever heard!", laughing],
    ["But surely you've noticed their horns?", 'A fine pair of horns is no cause for alarm! Our gallant guards keep us safe from harm!', happy],
    ['And the hooves? And the tails?', 'Such peculiar details you choose to inspect! Our gallant guards deserve more respect!', thinking],
    ['One of them even mooed at me!', 'Perhaps he was clearing his throat, my dear! You really must have a peculiar ear!', laughing, 'alarmed'],
    ['Are you deliberately avoiding my question?', 'I see no cattle, just guards in blue! Perhaps the problem lies with you!', assured],
    ['Why does nobody acknowledge this?!', 'Your strange obsession is quite a bore! Now ask me something else, or bother me no more!', assured, 'alarmed']
  ]),
  exchange([
    ['What did this woman do?', "She asked for more milk for the poor, despite them receiving enough, I'm sure!", thinking],
    ["That's hardly a crime.", "She questioned the rations, she questioned the state! Now she's discovering the price of debate!", assured],
    ["Wasn't she just doing her job?", 'Protecting the poor was her occupation! But she went too far and upset her station!', assured],
    ['Surely the poor deserve more milk?', 'A drop for the poor is a drop from the rich! Keep talking like that and your places might switch!', assured, 'worried'],
    ['How long will she be stuck here?', 'Until she repents or the Baron grows bored! Such is the mercy of our glorious lord!', laughing]
  ])
];

menu.replies.push(
  ...oneTimeTopics.map(reply => ({...reply, once: 'attendant: ' + reply.label, consumeOnSelect: true})),
  exchange([
    ['Can I play?', 'Of course, young lad! Step right this way! Grab a milk balloon and brighten your day!', exuberant],
    ['Do I have to pay?', 'Not a penny, not a dime! The Baron subsidises this delightful pastime!', happy],
    ['Are there any rules?', 'Take a balloon and aim for her face! Give that commissioner a milky disgrace!', assured],
    ["Alright, let's play.", "That's the spirit! Let the milk fly! Give her a splash and watch her cry!", exuberant, 'attentive']
  ], [], 'startMilkBalloon')
);

export function createAttendantConversation() {
  let met = false;
  const replayBack = {label: 'Continue', playerMood: 'attentive', next: null};
  const replayMenu = {...menu, replies: [...menu.replies.slice(0, -1),
    exchange([['Can I play?', 'Please, yes, please do. All the more fun for me and you!', exuberant]], [], 'startMilkBalloon'),
    exchange([['Hey! You said not a penny, not a dime. Yet you took a coin. What gives?',
      'The game is free, just as I said! The fee is for the milk you shed!', assured, 'alarmed']],
      [replayBack])
  ]};
  replayBack.next = replayMenu;
  return (played = false) => {
    const node = met ? (played ? replayMenu : menu) : opening;
    met = true;
    return node;
  };
}
