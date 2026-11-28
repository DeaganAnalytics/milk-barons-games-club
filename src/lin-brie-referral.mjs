const pip = (text, playerMood) => ({text, speaker: 'Pip', playerMood, mood: 'attentive'});
const lin = (text, mood) => ({text, mood, exactNpcPortrait: true});
const chain = (lines, end) => lines.reduceRight((next, line) => ({
  ...line, ...(next ? {mustContinue: true, replies: [{label: 'Continue', next}]}
    : {action: 'finishLinBrieReferral'})
}), end);
const choice = (label, playerMood, lines) => ({label, playerMood, next: chain(lines)});

export function linBrieReferral(knowsName) {
  const opening = chain([
    pip('Um... Brie suggested I come and talk to you.', 'worried'),
    lin('Did she, sir?', 'attentive'),
    pip('Yes. She mentioned you were single.', 'thinking'),
    lin('Oh, Brie...', 'blushing'),
    pip('Was she not supposed to tell me that?', 'worried')
  ], {
    ...lin("She's not particularly good at keeping things to herself.", 'apologetic'),
    mustContinue: true,
    replies: [
      choice('Should I go away?', 'worried', [
        lin("I didn't say that, sir.", 'pleased'),
        pip('Oh! Excellent!', 'happy'),
        lin('Was there something you wanted to talk about?', 'attentive'),
        pip("I hadn't actually planned that far ahead.", 'worried'),
        lin('Perhaps next time, sir.', 'pleased')
      ]),
      choice('Do you mind that she sent me?', 'thinking', [
        lin('No, sir.', 'blushing'),
        pip('Really?!', 'happy'),
        lin("You're perfectly welcome to come and talk to me.", 'attentive'),
        pip("I'll be back!", 'happy'),
        lin('Very well, sir.', 'attentive')
      ]),
      choice('Has Brie mentioned me before?', 'thinking', [
        lin("I'm afraid that's between Brie and me, sir.", 'blushing'),
        pip('So you have talked about me?!', 'happy'),
        lin("I didn't say that.", 'skeptical'),
        pip("You didn't say you hadn't!", 'happy'),
        lin("Don't you have some gambling to do, sir?", 'blushing'),
        pip('Yes! Right! See you later!', 'happy')
      ])
    ]
  });
  return {...(knowsName ? opening : chain([
    pip('Excuse me, are you Lin?', 'thinking'),
    lin('Yes, sir. Can I help you?', 'attentive')
  ], opening)), linBrieReferral: true};
}
