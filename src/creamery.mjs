import {NORTH_EDGE, WEST_EDGE} from './room.mjs';

export const bartender = {
  id: 'creamery-bartender',
  title: 'The Bartender',
  x: WEST_EDGE + 187,
  y: NORTH_EDGE + 161,
  radius: 35
};

export const creameryHatch = {width: 142, height: 110, top: NORTH_EDGE + 43};

export function createCreameryGuard() {
  return {
    x: WEST_EDGE + 263,
    y: NORTH_EDGE + 180,
    radius: 14,
    facing: 0,
    walking: false,
    posted: true,
    creamery: true
  };
}

const drunkGuardLines = [
  'Moooooo... I mean, move.',
  "Who's guarding the milk? Oh. That's me.",
  "I'm not drunk. I'm professionally relaxed.",
  "Why's the floor doing that?",
  'Nobody steals the milk on my... *hiccup*... watch.',
  "I've got a licence for this thing somewhere.",
  'Two bartenders? When did we hire another one?',
  "I'm udderly exhausted.",
  "You know what? Peasants aren't all that bad.",
  'I could go for a nice patch of grass right about now.',
  'Who put all these spots on my uniform?',
  "I'm perfectly capable of standing. Watch.",
  "One more drink and I'll be sober again.",
  "I love you, milk. Don't ever change.",
  "Don't tell the Baron. He's a bit of a control freak.",
  'MOOVE IT! Actually... could you help me move?',
  "I swear this rifle wasn't this heavy earlier.",
  'Am I being paid for this? I milkin hope so.',
  'My horns feel heavier than usual.',
  'I could go for a nice lie down in a paddock.',
  'Anyone else feel like chewing something?',
  "I reckon I've had a few too many gallons.",
  "I'm a milkin good guard, you know.",
  "Don't worry. I've only got double vision in one eye.",
  "I'd charge at you, but I can't be bothered.",
  'Lovely bloke, the Baron. Terrible temper, though.'
];

export function drunkGuardSpeech(guard, elapsed) {
  if (!guard?.drunk || guard.drunkSince == null) return null;
  const interval = 20;
  const age = elapsed - guard.drunkSince;
  const cycle = Math.floor(age / interval);
  const lineAge = age % interval;
  if (cycle < 1 || lineAge >= 4) return null;
  return {text: drunkGuardLines[(cycle - 1) % drunkGuardLines.length], opacity: Math.min(1, (4 - lineAge) / 0.6)};
}
