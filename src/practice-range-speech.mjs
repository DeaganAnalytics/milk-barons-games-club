const lines = [
  'Protest this!',
  'MOOOOOOOO!',
  'Stay back, taxpayer!',
  'Take that, you filthy communist!',
  "That's what I call crowd control!",
  'Another threat to dairy security eliminated!',
  "Imagine it's a union representative!",
  'Moo-ve along, peasant!',
  'Bullseye! Heh, never gets old.',
  "That's for questioning the milk ration!",
  'Nothing like a bit of recreational law enforcement!',
  "Should've paid your milk tax!",
  'Consider that a formal warning!',
  'Die, cardboard peasant!',
  'I love democracy!',
  "That's what happens when you demand a pay rise!",
  'Protect and serve! The Baron, obviously.',
  'Your complaint has been resolved!',
  'Stop resisting!',
  'Bloody hell, I missed!',
  'Udderly magnificent!',
  'Another successful community engagement exercise!',
  'Take that, political dissident!',
  'This is why nobody questions the milk budget!',
  'Remember, lads! Milk before mercy!',
  'Your right to appeal has expired!',
  'Request for additional milk DENIED!',
  "And that's how we maintain public order!",
  'Warning shots are a waste of ammunition!',
  'God, I love being a guard!'
];

export function createRangeSpeech(random = Math.random) {
  let nextAt = 15;
  let nextLane = 0;
  let remaining = [];
  let current;
  return (elapsed, visible) => {
    if (!visible) return;
    if (elapsed >= nextAt) {
      if (!remaining.length) remaining = [...lines];
      const [text] = remaining.splice(Math.floor(random() * remaining.length), 1);
      current = {text, lane: nextLane, startedAt: elapsed};
      nextLane = (nextLane + 1) % 3;
      nextAt = elapsed + 15;
    }
    if (!current) return;
    const left = 4 - (elapsed - current.startedAt);
    if (left > 0) return {...current, opacity: Math.min(1, left / 0.6)};
  };
}
