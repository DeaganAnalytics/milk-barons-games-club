import {TURN} from './directions.mjs';
import {DANCE_FLOOR} from './room.mjs';

export const dancers = [
  {id: 'mascot', dx: -96, dy: -53, facing: 1, height: 74, tempo: 6.8, phase: 0.4, travel: 10, sway: 0.09, bounce: 5},
  {id: 'coral', dx: -46, dy: 55, facing: 1, height: 66, tempo: 5.9, phase: 0, travel: 7, sway: 0.07, bounce: 3},
  {id: 'jade', dx: 46, dy: 55, facing: -1, height: 66, tempo: 5.9, phase: Math.PI, travel: 6, sway: 0.075, bounce: 2},
  {id: 'guard', dx: 97, dy: -50, facing: 1, height: 76, tempo: 3.6, phase: 2.1, travel: 11, sway: 0.15, bounce: 1.5}
].map(dancer => ({...dancer, x: DANCE_FLOOR.x + dancer.dx, y: DANCE_FLOOR.y + dancer.dy}));

const remarks = {
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
  return elapsed => {
    const slot = Math.floor(elapsed / remarkInterval);
    const age = elapsed % remarkInterval;
    if (slot === 0 || age >= remarkDuration) return null;
    if (slot !== lastSlot) {
      dancer = dancers[Math.floor(random() * dancers.length)];
      const lines = remarks[dancer.id];
      text = lines[Math.floor(random() * lines.length)];
      lastSlot = slot;
    }
    const {x, bob, rotation} = dancerPose(dancer, elapsed);
    return {
      dancer, text,
      x: x + Math.sin(rotation) * dancer.height,
      headY: dancer.y - bob - Math.cos(rotation) * dancer.height,
      opacity: Math.min(1, age / 0.22, (remarkDuration - age) / 0.45)
    };
  };
}

export function drawDancer(ctx, sprite, dancer, elapsed) {
  const {x, bob, rotation} = dancerPose(dancer, elapsed);
  const width = dancer.height * sprite.naturalWidth / sprite.naturalHeight;

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
  ctx.drawImage(sprite, -width / 2, -dancer.height, width, dancer.height);
  ctx.restore();
}
