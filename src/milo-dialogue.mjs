const reply = (label, next) => ({label, next, playerMood: 'thinking'});
const say = (text, mood, replies, details) => ({text, mood, replies, ...details});
const more = next => [reply('Continue', next)];

export function miloMenu(text, hasBeenSlapped, injuryReply, wasInjured, hasSeenGuard) {
  const angry = wasInjured ? 'angry' : 'worried';
  const topic = 'miloCampaignBanner';
  const menu = say(text, 'worried', []);
  const back = more(menu);
  const terminal = (label, next) => ({...reply(label, next), once: topic, consumeOnSelect: true});
  const finish = (text, mood, details) => say(text, mood, back, details);

  const laughed = [
    terminal('Sorry.', finish("At least you're capable of apologising.", 'relieved')),
    terminal('<Threaten to hit Milo>', say('PLEASE! NOT AGAIN!', 'worried',
      more(say('...', 'worried', more(finish('Oh... Very funny.', 'sad')))),
      {direction: 'Milo flinches.', enterAction: 'threatenMilo'})),
    terminal('Sorry. Just have to laugh at the absurdity sometimes.', say('I used to laugh too.', 'sad',
      more(finish("It helps. Until it doesn't.", 'sad')), {enterAction: 'comfortMilo'}))
  ];
  if (hasBeenSlapped) {
    laughed.splice(1, 0, terminal("I was. Wasn't that bad...", finish('He must like you.', 'sad')));
  }

  const wentTooFar = say('My slogan. My fame. My downfall.', 'sad', more(say(
    "The Baron makes me wear it as a reminder. When he's not hitting me.", 'worried', [
      reply('Hahahaha! He hits you?', say('Funny, is it? You try being hit by 400 pounds of fat.', angry, laughed)),
      reply('He hits you?', say("Well, usually his guards do. He's too fat to catch me.", 'worried', [
        terminal('Big-boned is the politically correct term.', say('Why are you defending him?', 'worried', [
          reply('Fat people have rights too.', say('FAT PEOPLE HAVE ALL THE RIGHTS!', angry,
            more(say('...', 'sad', more(finish("Sorry. I shouldn't raise my voice.", 'sad'))))))
        ], {direction: 'Milo stares in disbelief.'})),
        terminal("God, he's fat. And my family starves!", finish('All our families starve. Except for those in here.', 'sad'))
      ]))
    ]
  )));

  const remembered = say("Where's my milk indeed.", 'sad', more(say('The answer is right here. With the Baron.', angry, [
    terminal('You should start campaigning again!', say("Look at what I'm wearing.", 'worried', [
      reply("You've already got a banner!", say('...', 'worried', more(finish("You're going to get us both killed.", 'worried'))))
    ])),
    terminal('Have you considered asking the Baron nicely?', finish('What do you think I did BEFORE the protests?!', angry)),
    terminal('Well, at least your banner is still getting some exposure.', finish("Wonderful. Perhaps he'll let me wear it to my execution.", 'sad'))
  ])));

  if (injuryReply) menu.replies.push(injuryReply);
  menu.replies.push(
    reply("Hey, don't I know you?", say("No. Don't talk to me.", 'worried', [
      reply('Are you Milo, the milk activist?', finish('Please leave me alone. Please go away. Your presence attracts the Baron.', 'sad'))
    ])),
    {...reply('Why are you wrapped in rags?', say("These aren't rags. They're the remains of my campaign banner.", 'sad', [
      reply('Campaign banner?', say('"Where\'s my milk?" Ring any bells?', 'worried', [
        reply('No.', wentTooFar),
        reply('<Lie> Yes, of course.', wentTooFar)
      ])),
      reply('I remember that! "Where\'s my milk?!"', remembered)
    ])), once: topic}
  );

  if (hasSeenGuard) {
    const cowTopic = 'miloCowGuards';
    const camera = (mood, direction, advanceTo) => say('', mood, [], {
      character: 'security-camera', speaker: 'Security camera', direction, advanceTo, mustContinue: true
    });
    const whisper = say('Please stop asking questions.', 'worried', [
      {...reply('Continue', menu), once: cowTopic, consumeOnSelect: true}
    ], {direction: 'Whispers', mustContinue: true});
    const lookAway = camera('away', 'The security camera rotates away.', whisper);
    const denial = say("...course the guards aren't cows. That's crazy.", 'worried', [
      reply('I goddamn swear...', say('Perfectly ordinary guards. Nothing unusual about them.', 'sad', [
        reply('But the horns!', say("I haven't noticed any horns.", 'worried', [
          reply('THE TAILS?!', say("I don't know what you're talking about.", 'worried', more(lookAway)))
        ]))
      ]))
    ]);
    const turn = camera('toward', 'The security camera buzzes as it rotates to face Milo.', denial);
    menu.replies.push({
      ...reply("The guards. Please tell me they're cows.", say('Of cours...', 'worried', more(turn))),
      once: cowTopic
    });
  }
  return menu;
}
