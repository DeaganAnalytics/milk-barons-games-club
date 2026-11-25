import {DANCE_FLOOR} from './room.mjs';

export const djTarget = {id: 'dj', title: 'DJ Dairy', x: DANCE_FLOOR.x, y: DANCE_FLOOR.y - 315, radius: 16};
export const djMoods = ['smirk', 'excited', 'skeptical', 'laughing', 'thinking', 'deadpan'];

export function createDjConversation(hasSeducedExecutive) {
  const used = new Set();
  const say = (text, mood, replies) => ({text, mood, replies, mustContinue: true});
  const reply = (label, next, playerMood = 'attentive') => ({label, next, playerMood});
  const more = next => [reply('Continue', next)];
  const finish = (text, mood) => say(text, mood, more(() => menu()));

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
              reply('I can barely afford to buy milk for drinking.', finish('Money, man. Like, what does it even mean, you dig?', 'thinking'))
            ]))
      ]))))
  ];

  function menu() {
    return {
      text: '', mood: 'smirk', mustContinue: true,
      replies: [
        ...topics.filter(topic => !used.has(topic)).map(topic => ({...topic, next: () => {
          used.add(topic);
          return topic.next;
        }})),
        reply('Enjoy your music.', {text: 'Stay fresh, stay pasteurised!', mood: 'laughing'})
      ]
    };
  }

  return () => ({...menu(), text: 'DJ Dairy in Da House!', mood: 'excited'});
}
