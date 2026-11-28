const pip = (text, playerMood) => ({text, speaker: 'Pip', playerMood, mood: 'attentive'});
const mystic = (text, mood) => ({text, mood, exactNpcPortrait: true});
const brie = (text, mood) => ({text, mood, exactNpcPortrait: true});
const chain = (lines, end) => lines.reduceRight((next, line) => ({
  ...line, mustContinue: true, replies: [{label: 'Continue', next}]
}), end);

export const mysticSingleQuestion = 'So... are you single?';

export function mysticSingleDialogue() {
  return chain([
    pip(mysticSingleQuestion, 'thinking'),
    mystic('We all enter this world alone, child.', 'contemplative'),
    pip('No, I mean romantically.', 'thinking'),
    mystic('My heart belongs to the sacred milk.', 'serene'),
    pip('Is that a yes?', 'worried')
  ], {...mystic('The milk and I have an understanding, child.', 'serene'), action: 'finishMysticSingle'});
}

export function brieMysticIntervention() {
  return chain([
    brie("Pip! You're embarrassing yourself.", 'angry'),
    pip('Huh?', 'thinking')
  ], {
    ...brie("If you're going to practise for Lin, do it in the bathroom.", 'attentive'),
    mustContinue: true,
    replies: [
      {label: 'Huh? But the Milk Mystic is right here!', playerMood: 'thinking',
        next: brie('Stop playing silly games, Pip.', 'angry')},
      {label: "There's a bathroom here?", playerMood: 'thinking', next: chain([
        brie('Of course, silly!', 'pleased'),
        pip("I haven't seen it.", 'thinking')
      ], brie('Well, it may be temporarily closed for renovations.', 'thinking'))},
      {label: 'Yes... I was practising... Sorry.', playerMood: 'sorry',
        next: brie("Just don't embarrass yourself. Or me!", 'worried')}
    ]
  });
}
