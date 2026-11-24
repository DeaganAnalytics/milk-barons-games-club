import {isBaronDancing} from './baron.mjs';
import {TURN} from './directions.mjs';
import {DANCE_FLOOR} from './room.mjs';

export const dancers = [
  {id: 'mascot', dx: -96, dy: -53, facing: 1, height: 74, tempo: 6.8, phase: 0.4, travel: 10, sway: 0.09, bounce: 5, shoulders: [[18, 121], [91, 124]]},
  {id: 'coral', dx: -46, dy: 55, facing: 1, height: 66, tempo: 5.9, phase: 0, travel: 7, sway: 0.07, bounce: 3, fullBodyFrames: 2},
  {id: 'jade', dx: 46, dy: 55, facing: -1, height: 66, tempo: 5.9, phase: Math.PI, travel: 6, sway: 0.075, bounce: 2, fullBodyFrames: 2},
  {id: 'guard', dx: 97, dy: -50, facing: 1, height: 76, tempo: 3.6, phase: 2.1, travel: 11, sway: 0.15, bounce: 1.5, shoulders: [[49, 105], [91, 109]]}
].map(dancer => ({...dancer, x: DANCE_FLOOR.x + dancer.dx, y: DANCE_FLOOR.y + dancer.dy}));

const remarks = {
  baron: [
    'Milk milk milk my cow!',
    'Shake that belly, shake that belly',
    'Ah to be young again. But I prefer being fat!',
    'Go get em cowboy! Approach the lovely ladies.'
  ],
  mascot: [
    'I LOVE milk!',
    "I'll need more milk if I want the courage to dance with the girls",
    'When I grow up I want to be as fat as the Baron!',
    'Milk my cow! Milk her now!'
  ],
  coral: [
    'I like to PARTAY!',
    'Shake it girlie!!',
    "Where's my milk dada?",
    "This DJ's on fire!"
  ],
  jade: [
    "Don't make eye contact, don't make eye contact...",
    'Should we go dance with the Baron?',
    'WE NEED MILK IN THIS HOUSE! WOOOOO!',
    'That cow guard is kind of cute!!'
  ],
  guard: [
    'I like to MOOOOve it!',
    'Moooooo!',
    "There's too much red around. I'm gonna lose it!",
    "I'm gonna be milking multiple cows tonight! Mooooo!",
    'God bless the Baron!'
  ]
};

const remarkInterval = 20;
const remarkDuration = 5;

function dancerPose(dancer, elapsed) {
  const beat = elapsed * dancer.tempo + dancer.phase;
  const step = Math.sin(beat);
  return {
    x: dancer.x + step * dancer.travel,
    bob: Math.max(0, Math.sin(beat * 2)) * dancer.bounce,
    rotation: step * dancer.sway
  };
}

export function createDancerSpeech(random = Math.random) {
  let lastSlot = 0;
  let dancer;
  let text;
  return (elapsed, baron) => {
    const slot = Math.floor(elapsed / remarkInterval);
    const age = elapsed % remarkInterval;
    if (slot === 0 || age >= remarkDuration) return null;
    if (slot !== lastSlot) {
      const count = dancers.length + Number(Boolean(baron && isBaronDancing(baron)));
      dancer = dancers[Math.floor(random() * count)] ?? null;
      const lines = remarks[dancer?.id ?? 'baron'];
      text = lines[Math.floor(random() * lines.length)];
      lastSlot = slot;
    }
    const opacity = Math.min(1, age / 0.22, (remarkDuration - age) / 0.45);
    if (!dancer) return baron && isBaronDancing(baron)
      ? {dancer: null, text, x: baron.x, headY: baron.y - 61, feetY: baron.y + 34, opacity} : null;
    const {x, bob, rotation} = dancerPose(dancer, elapsed);
    return {
      dancer, text,
      x: x + Math.sin(rotation) * dancer.height,
      headY: dancer.y - bob - Math.cos(rotation) * dancer.height,
      feetY: dancer.y, opacity
    };
  };
}

export function drawDancer(ctx, sprite, dancer, elapsed) {
  const {x, bob, rotation} = dancerPose(dancer, elapsed);
  const frameWidth = sprite.naturalWidth / (dancer.fullBodyFrames ?? 3);
  const scale = dancer.height / sprite.naturalHeight;
  const armBeat = Math.sin(elapsed * dancer.tempo + dancer.phase);

  ctx.save();
  ctx.translate(x, dancer.y);
  ctx.fillStyle = '#25202a60';
  ctx.beginPath();
  ctx.ellipse(0, 0, 11 - bob * 0.4, 2.8, 0, 0, TURN);
  ctx.fill();

  ctx.translate(0, -bob);
  // Pivot at the shoes so the torso sways over each side step.
  ctx.rotate(rotation);
  ctx.scale(dancer.facing, 1);
  ctx.translate(-frameWidth * scale / 2, -dancer.height);
  ctx.scale(scale, scale);
  // Complete poses keep the raised sleeves and the garment silhouette together.
  const frame = dancer.fullBodyFrames && armBeat >= 0 ? 1 : 0;
  ctx.drawImage(sprite, frame * frameWidth, 0, frameWidth, sprite.naturalHeight,
    0, 0, frameWidth, sprite.naturalHeight);
  dancer.shoulders?.forEach(([shoulderX, shoulderY], index) => {
    const side = index * 2 - 1;
    ctx.save();
    ctx.translate(shoulderX, shoulderY);
    const angle = 0.15 + (1 + side * armBeat) * (dancer.id === 'guard' ? 0.12 : 0.28);
    ctx.rotate(-side * angle);
    ctx.drawImage(sprite, (index + 1) * frameWidth, 0, frameWidth, sprite.naturalHeight,
      -shoulderX, -shoulderY, frameWidth, sprite.naturalHeight);
    ctx.restore();
  });
  ctx.restore();
}
