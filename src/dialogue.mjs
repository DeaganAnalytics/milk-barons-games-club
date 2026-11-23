const guardOpening = 'Do you have a problem to report? Otherwise get out of my way.';
const baronGreetings = [
  'Welcome, welcome to my establishment!',
  'Pip! Good to see you!',
  'Enjoying your time?'
];

const guardReplies = [
  {
    label: 'Are you a cow?', playerMood: 2,
    next: {text: 'I am a guard.', mood: 0, replies: [
      {label: 'But you have horns.', playerMood: 2, next: {text: 'I am a guard.', mood: 0}}
    ]}
  },
  {
    label: "No I don't have anything to report.", playerMood: 0,
    next: {text: 'Then get out of my way!', mood: 2}
  },
  {
    label: 'Ah yes, I do.', playerMood: 1,
    next: {text: 'What is the problem.', mood: 1, replies: [
      {label: 'Actually nevermind.', playerMood: 0, next: {text: '...', mood: 0}}
    ]}
  }
];

const miloReplies = [
  {
    label: "Hey, don't I know you?", playerMood: 2,
    next: {text: "No. Don't talk to me.", mood: 0, replies: [
      {label: 'Are you Milo, the milk activist.', playerMood: 2, next: {text: 'Please leave me alone.', mood: 1}}
    ]}
  }
];

const baronReplies = [
  {
    label: 'Do you own this place?', playerMood: 2,
    next: {text: 'Of course, I own nearly every place.', mood: 1}
  },
  {
    label: 'Why do you have cows for guards?', playerMood: 2,
    next: {text: 'What do you mean?', mood: 0, replies: [
      {
        label: 'The guards are cows.', playerMood: 0,
        next: {text: 'I have guards.', mood: 2, replies: [
          {label: 'But the horns?', playerMood: 2, next: {text: 'I have guards.', mood: 2}}
        ]}
      }
    ]}
  }
];

const portraits = {baron: 1, milo: 2, guard: 3};

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

  function setPortrait(element, row, mood) {
    element.style.backgroundPosition = `${mood * 50}% ${row * 100 / 3}%`;
  }

  function close() {
    panel.hidden = true;
    map.hidden = info.hidden = controls.hidden = false;
    interact.focus({preventScroll: true});
  }

  function show(node, row, playerMood) {
    line.textContent = node.text;
    setPortrait(playerPortrait, 0, playerMood);
    setPortrait(npcPortrait, row, node.mood);
    replyList.replaceChildren(...(node.replies ?? []).map(reply => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = reply.label;
      button.addEventListener('click', () => show(reply.next, row, reply.playerMood));
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
    const row = portraits[target.id];
    const opening = target.id === 'guard' ? {text: guardOpening, replies: guardReplies, mood: 0}
      : target.id === 'milo' ? {text: target.message, replies: miloReplies, mood: 0}
        : {text: baronGreetings[greetingIndex++ % baronGreetings.length], replies: baronReplies, mood: 1};
    speaker.textContent = title.textContent = target.title;
    map.hidden = info.hidden = controls.hidden = true;
    panel.hidden = false;
    show(opening, row, 0);
  }

  return {open, isOpen: () => !panel.hidden};
}
