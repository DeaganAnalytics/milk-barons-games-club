import {DANCE_FLOOR} from './room.mjs';

export const djTarget = {id: 'dj', title: 'DJ Dairy', x: DANCE_FLOOR.x, y: DANCE_FLOOR.y - 315, radius: 16};
export const djMoods = ['smirk', 'excited', 'skeptical', 'laughing', 'thinking', 'deadpan'];

export function createDjConversation(hasSeducedExecutive, canTip = () => true) {
  const used = new Set();
  const say = (text, mood, replies) => ({text, mood, replies, mustContinue: true});
  const reply = (label, next, playerMood = 'attentive') => ({label, next, playerMood});
  const more = next => [reply('Continue', next)];
  const finish = (text, mood) => say(text, mood, more(() => menu()));

  const milky = {text: 'Milky!', mood: 'excited'};
  const eliasAppears = {
    ...say('No.', 'current-smile', [
      reply("How'd you get here?", say('How did who get here?', 'skeptical', [
        reply("Wait, where'd he go?", milky, 'alarmed')
      ]), 'alarmed')
    ]),
    character: 'elias'
  };
  const paidToSpeak = reply('But I paid ₥60 to speak to you.',
    say("That's like, your choice, man. You could've just walked past the fence. It's just rope.", 'deadpan', [
      reply('Oh MILK!', null, 'alarmed'),
      reply('I could do that?', eliasAppears, 'thinking')
    ]), 'exasperated');

  const dream = say('I dream of a world where everyone has milk.', 'thinking', [
    reply('So do I. The economic inequality of milk distribution in this society is—',
      say("Like, each person is their own bottle of milk, and we pour it into each other's cereal.", 'smirk', [
        reply('Wait, what? The inequality—',
          say("Yes, unequal milk. Cow, goat. It's like the same, but it's like different, man.", 'thinking', more(
            say('What were you saying?', 'skeptical', [paidToSpeak])
          )), 'alarmed')
      ]), 'thinking'),
    reply('So can I have some money to achieve that dream?',
      say('You gotta milk your own cow in life, man.', 'deadpan', [
        reply('But the Baron owns all the cows!',
          say('Milk it like life milks you. Spiritual awakening of the pasteurised soul. Beautiful.', 'smirk', more(
            say('Good chat, man.', 'smirk', [paidToSpeak])
          )), 'exasperated')
      ]))
  ]);
  const milkIsSoul = say("Money's like, not that important, dawg. It's all about the soul, the sweet, sweet taste of pure milk.", 'thinking', more(
    say('Milk is soul. Soul is milk. You dig?', 'excited', [
      reply("If money's not importan—", dream, 'thinking')
    ])
  ));

  const topics = [
    reply('Is this song about milk?', say('Superficially, yes.', 'thinking', [
      reply('And beneath the surface?', finish('Also milk. But like emotionally, man.', 'smirk'), 'thinking')
    ])),
    reply("Do you have any songs that aren't about milk?", say("Of course! I'm a versatile artist.", 'excited', [
      reply('Like what?', say("I've been experimenting with cream.", 'smirk', [
        reply("That's still dairy.", finish('You sound like my critics, man.', 'skeptical'), 'deadpan')
      ]))
    ])),
    reply('I paid ₥60 to speak to you.', say('You paid to speak to me?', 'skeptical', [
      reply('Yes.', say("Man, I would've spoken to you for free.", 'deadpan', [
        reply("You've got to be kidding me.", say('Music brings people together, man. Money just gets in the way.', 'thinking', [
          reply('Someone should tell the Baron.', finish('Nah, man. He pays my wages.', 'smirk'))
        ]), 'alarmed')
      ]))
    ])),
    reply('Can I request a song?', say('Absolutely, man!', 'excited', [
      reply('Great!', say("Provided it's the one I'm currently playing.", 'smirk', [
        reply("That's not how song requests work.", finish("I don't compromise my artistic integrity, man.", 'skeptical'))
      ]), 'pleased')
    ])),
    reply('You must get lots of girls.', say("Oh yeah, it's udderly marvellous, my main man.", 'laughing',
      more(say('Dairy style!', 'excited', [
        reply('Any tips for me?', () => hasSeducedExecutive()
          ? say("My man, you're covered in lipstick kisses! I saw what you were laying down. Nice!", 'smirk', [
              reply('Did everybody see?', {
                ...say('', 'still', [reply('Oh MILK!', () => menu(), 'alarmed')]),
                character: 'security-camera', speaker: 'Security camera'
              }, 'worried')
            ])
          : say("It's all about the scent, man. I bathe in milk. I spray on milk for perfume! I AM THE MILK!", 'excited', [
              reply('I can barely afford to buy milk for drinking.', say('Money, man. Like, what does it even mean, you dig?', 'thinking', [
                reply('Can I have some then?', finish("Whoa, man. Let's not make this about money.", 'skeptical'))
              ]))
            ]))
      ])))),
    reply("I need to earn ₥200 or I'm off to the dairy. Can I have some money?",
      say("Heavy, man. That's not a good vibe.", 'skeptical', [
        reply('Is that a yes?', milkIsSoul),
        reply('Is that a no?', milkIsSoul)
      ]), 'worried'),
    reply('I love your music, man.', () => say("Really?! It's straight from my heart.", 'excited', [
      ...(canTip() ? [reply("Here's a tip. Keep it up!", {
        text: 'Far out, man! May your glass never run dry!', mood: 'excited', enterAction: 'tipDjDairy'
      })] : []),
      reply('Just wanted to say thanks.', {
        text: "That's beautiful, man. Music is like milk for the ears.", mood: 'smirk'
      })
    ]))
  ];

  function menu() {
    return {
      text: '', mood: 'smirk', mustContinue: true,
      replies: [
        ...topics.filter(topic => !used.has(topic)).map(topic => ({...topic, next: () => {
          used.add(topic);
          return typeof topic.next === 'function' ? topic.next() : topic.next;
        }})),
        reply('Enjoy your music.', {text: 'Stay fresh, stay pasteurised!', mood: 'laughing'})
      ]
    };
  }

  return () => ({...menu(), text: 'DJ Dairy in Da House!', mood: 'excited'});
}
