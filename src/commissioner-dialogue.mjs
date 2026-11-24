export const commissionerMoods = ['sad', 'despondent', 'frowning', 'stressed', 'deadpan'];
const [sad, despondent, frowning, stressed, deadpan] = commissionerMoods;
const guardWarning = {
  text: "No, no, no! What a ridiculous claim! Spreading such rumours is a dangerous game!",
  character: 'pillory-attendant',
  mood: 'self-assured',
  replies: [{
    label: 'But she just said—', playerMood: 'alarmed', next: {
      text: "I... um... I'd rather not talk about it. I don't want to attract any more attention.",
      mood: stressed, replies: [], action: 'attendantMilkBalloon'
    }
  }]
};
const menu = {text: '', mood: sad, replies: []};
const back = [{label: 'Continue', playerMood: 'attentive', next: menu}];

function exchange(steps, replies = back) {
  return steps.reduceRight((next, [label, text, mood, playerMood = 'thinking']) => ({
    label, playerMood, next: {text, mood, replies: next ? [next] : replies}
  }), null);
}

const introduction = {
  text: 'Please... help me.',
  mood: stressed,
  replies: [exchange([
    ['Who are you?', "I'm the Stickman Rights Commissioner. Or at least, I was.", sad],
    ['What happened?', 'I asked the Baron to increase milk rations for the poor. I thought if I presented enough evidence, he might listen.', sad],
    ['And he put you here?', 'He called it a public consultation exercise.', deadpan, 'alarmed'],
    ['A public consultation?', 'Apparently, the public is invited to express its opinion of my work through milk balloons.', frowning],
    ['How long have you been here?', "I've lost track of the days. Nobody will tell me when I'm being released.", despondent, 'worried'],
    ['Is there anything I can do?', "I don't know anymore. You're the first person who's stopped to speak to me without throwing something.", sad, 'worried']
  ])]
};

menu.replies.push(
  exchange([["I'm poor. Thank you for your help.", "I'm not sure it was worth it.", despondent, 'attentive']]),
  exchange([["I'm going to play the game.", "Why...? Please don't.", stressed, 'attentive']], [
    {label: "Maybe I won't.", next: null},
    exchange([['I think I need to. I want the Baron to like me.', "Please... don't.", stressed, 'worried']], []),
    exchange([['Screw you and your stickman rights. I want to be wealthy.', '...Why did I even bother?', despondent, 'attentive']], [])
  ]),
  exchange([
    ['Am I crazy, or are the guards cows?', "You're... not... crazy.", deadpan, 'worried'],
    ['So they are cows?', 'Yes.', deadpan]
  ], [{label: 'Continue', playerMood: 'attentive', next: guardWarning}])
);

export function createCommissionerConversation() {
  let met = false;
  return () => {
    const node = met ? menu : introduction;
    met = true;
    return node;
  };
}
