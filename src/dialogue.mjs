import {openingFor} from './dialogue-content.mjs';

const portraits = {
  player: {row: 0, expressions: ['attentive', 'happy', 'thinking']},
  baron: {row: 1, expressions: ['pleased', 'laughing', 'displeased']},
  milo: {row: 2, expressions: ['worried', 'sad', 'relieved']},
  guard: {row: 3, expressions: ['deadpan', 'suspicious', 'speaking']}
};

export function createDialogue(baron) {
  const panel = document.getElementById('conversation');
  const map = document.getElementById('game').closest('.viewport');
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
    element.style.setProperty('--portrait-position', `${expressions.indexOf(mood) * 50}% ${row * 100 / 3}%`);
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
    (replyList.firstElementChild ?? document.getElementById('conversation-close')).focus();
  }

  document.getElementById('conversation-close').addEventListener('click', close);
  document.addEventListener('keydown', event => {
    if (event.code === 'Escape' && !panel.hidden) {
      event.preventDefault();
      close();
    }
  });

  function open(target) {
    const opening = openingFor(target.id, baron, greetingIndex);
    if (target.id === 'baron') greetingIndex++;
    speaker.textContent = title.textContent = target.title;
    map.hidden = info.hidden = controls.hidden = true;
    panel.hidden = false;
    show(opening, target.id, 'attentive');
  }

  return {open, isOpen: () => !panel.hidden};
}
