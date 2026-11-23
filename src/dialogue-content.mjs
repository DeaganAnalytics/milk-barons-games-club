const baronGreetings = [
  {text: 'Welcome, welcome to my establishment!', mood: 'pleased'},
  {text: 'Pip! Good to see you!', mood: 'laughing'},
  {text: 'Enjoying your time?', mood: 'pleased'}
];

const guardReplies = [
  {
    label: 'Are you a cow?', playerMood: 'thinking',
    next: {text: 'I am a guard.', mood: 'deadpan', replies: [
      {label: 'But you have horns.', playerMood: 'thinking', next: {text: 'I am a guard.', mood: 'deadpan'}}
    ]}
  },
  {
    label: "No I don't have anything to report.", playerMood: 'attentive',
    next: {text: 'Then get out of my way!', mood: 'speaking'}
  },
  {
    label: 'Ah yes, I do.', playerMood: 'happy',
    next: {text: 'What is the problem.', mood: 'suspicious', replies: [
      {label: 'Actually nevermind.', playerMood: 'thinking', next: {text: '...', mood: 'deadpan'}}
    ]}
  }
];

const miloReplies = [
  {
    label: "Hey, don't I know you?", playerMood: 'thinking',
    next: {text: "No. Don't talk to me.", mood: 'worried', replies: [
      {label: 'Are you Milo, the milk activist.', playerMood: 'thinking', next: {text: 'Please leave me alone. Please go away, your presence attracts the Baron.', mood: 'sad'}}
    ]}
  }
];

const baronReplies = [
  {
    label: 'Do you own this place?', playerMood: 'thinking',
    next: {text: 'Of course, I own nearly every place.', mood: 'laughing'}
  },
  {
    label: 'Why do you have cows for guards?', playerMood: 'thinking',
    next: {text: 'What do you mean?', mood: 'pleased', replies: [
      {
        label: 'The guards are cows.', playerMood: 'attentive',
        next: {text: 'I have guards.', mood: 'displeased', replies: [
          {label: 'But the horns?', playerMood: 'thinking', next: {text: 'I have guards.', mood: 'displeased'}}
        ]}
      }
    ]}
  }
];

const followingReply = {
  label: 'Are you following me?', playerMood: 'thinking',
  next: {text: 'Following you? Never! I am merely managing my institution.', mood: 'displeased'}
};

const watchingReply = {
  label: 'Why do you keep watching me?', playerMood: 'thinking',
  next: {text: 'What are you talking about young Pip?', mood: 'pleased', replies: [
    {
      label: 'Your eyes never leave me.', playerMood: 'attentive',
      next: {text: 'Pip my boy, I am merely supervising the business.', mood: 'pleased'}
    }
  ]}
};

export function availableBaronReplies(baron) {
  const replies = [...baronReplies];
  if (baron.completedRugTrips >= 3) replies.push(followingReply);
  if (baron.watchedDirections.size >= 6) replies.push(watchingReply);
  return replies;
}

export function openingFor(character, baron, greetingIndex) {
  if (character === 'guard') {
    return {text: 'Do you have a problem to report? Otherwise get out of my way.', replies: guardReplies, mood: 'deadpan'};
  }
  if (character === 'milo') {
    return {text: 'Shh! I’m trying to stay out of the Baron’s way.', replies: miloReplies, mood: 'worried'};
  }
  return {...baronGreetings[greetingIndex % baronGreetings.length], replies: availableBaronReplies(baron)};
}
