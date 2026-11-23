const guardOpening = 'Do you have a problem to report? Otherwise get out of my way.';
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

const portraits = {
  player: {row: 0, expressions: ['attentive', 'happy', 'thinking']},
  baron: {row: 1, expressions: ['pleased', 'laughing', 'displeased']},
  milo: {row: 2, expressions: ['worried', 'sad', 'relieved']},
  guard: {row: 3, expressions: ['deadpan', 'suspicious', 'speaking']}
};

export function createDialogue() {
  const panel = document.getElementById('conversation');
  const map = document.querySelector('.viewport');
  const info = document.getElementById('info').closest('.panel');
  const controls = document.querySelector('.controls');
  const interact = document.getElementById('interact');
  const title = document.getElementById('conversation-title');
  const speaker = document.getElementById('conversation-speaker');
  const line = document.getElementById('conversation-line');
  const replyList = document.getElementById('conversation-replies');
  const playerPortrait = document.getElementById('conversation-player');
  const npcPortrait = document.getElementById('conversation-npc');
  let greetingIndex = 0;

  function setPortrait(element, character, mood) {
    const {row, expressions} = portraits[character];
    element.style.backgroundPosition = `${expressions.indexOf(mood) * 50}% ${row * 100 / 3}%`;
    element.dataset.expression = mood;
  }

  function close() {
    panel.hidden = true;
    map.hidden = info.hidden = controls.hidden = false;
    interact.focus({preventScroll: true});
  }

  function show(node, character, playerMood) {
    line.textContent = node.text;
    setPortrait(playerPortrait, 'player', playerMood);
    setPortrait(npcPortrait, character, node.mood);
    replyList.replaceChildren(...(node.replies ?? []).map(reply => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = reply.label;
      button.addEventListener('click', () => show(reply.next, character, reply.playerMood));
      return button;
    }));
    (replyList.firstElementChild ?? document.getElementById('conversation-close')).focus({preventScroll: true});
  }

  document.getElementById('conversation-close').addEventListener('click', close);
  document.addEventListener('keydown', event => {
    if (event.code === 'Escape' && !panel.hidden) {
      event.preventDefault();
      close();
    }
  });

  function open(target) {
    const opening = target.id === 'guard' ? {text: guardOpening, replies: guardReplies, mood: 'deadpan'}
      : target.id === 'milo' ? {text: target.message, replies: miloReplies, mood: 'worried'}
        : {...baronGreetings[greetingIndex++ % baronGreetings.length], replies: baronReplies};
    speaker.textContent = title.textContent = target.title;
    map.hidden = info.hidden = controls.hidden = true;
    panel.hidden = false;
    show(opening, target.id, 'attentive');
  }

  return {open, isOpen: () => !panel.hidden};
}
