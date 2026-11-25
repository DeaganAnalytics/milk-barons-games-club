export const politicianId = 'slot-politician';
export const politicianMoods = ['weary', 'irritated', 'skeptical', 'smug', 'angry'];

const greetings = [
  ['Another day, another expenditure of public funds.', 'weary'],
  ["Go away! Can't you see I'm busy?", 'irritated'],
  ["Not now! I'm conducting important government business.", 'irritated'],
  ['Ah, a constituent. How unfortunate.', 'smug'],
  ['Please, no questions about the milk shortage.', 'skeptical']
];

const reply = (label, next, playerMood = 'attentive') => ({label, next, playerMood});
const say = (text, mood, replies, details) => ({text, mood, replies, mustContinue: Boolean(replies?.length), ...details});

export function createPoliticianConversation(getKarma, random = Math.random) {
  let greetingIndex = 0;
  let blackmailed = false;
  const completed = new Set();

  return function open() {
    if (blackmailed) {
      return say('Go away. We have nothing more to discuss.', 'irritated', [], {
        autoCloseMs: 3200, mustContinue: true
      });
    }
    const [greeting, mood] = greetings[greetingIndex++ % greetings.length];

    function menu() {
      const finish = (topic, text, mood) => say(text, mood, [reply('Continue', () => {
        completed.add(topic);
        return menu();
      })]);
      const replies = [];
      if (!completed.has('taxpayer')) {
        replies.push(reply("Hey! I've seen you on TV!", say('What? Damn it, lost again.', 'irritated', [
          reply("Aren't you a senator or something?", say('What? Yes, yes. Minister of Rural Affairs.', 'weary', [
            reply("Is that your money you're gambling with?", say('In a manner of speaking.', 'skeptical', [
              reply('Huh? What do you mean?', say("Well, I'm still a taxpayer, aren't I?", 'smug', [
                reply("You're gambling with taxpayer money?", finish('taxpayer', "Of course. I've already lost all of mine.", 'weary'), 'alarmed'),
                reply("I don't understand.", say('Peasants rarely do.', 'smug', [
                  reply('Continue', finish('taxpayer', 'Me senator. Me spend your money.', 'smug'))
                ]), 'thinking')
              ]), 'thinking')
            ]), 'thinking')
          ]), 'thinking')
        ])));
      }
      if (!completed.has('duration')) {
        replies.push(reply('How long have you been here?', say("I don't know. Eight?", 'skeptical', [
          reply('Eight hours?', finish('duration', 'Eight days.', 'weary'), 'thinking')
        ]), 'thinking'));
      }
      if (completed.has('taxpayer') && !completed.has('responsibility')) {
        replies.push(reply("Don't you feel bad gambling with taxpayers' money?", say('I feel worse about having to pay tax.', 'irritated', [
          reply("You're a bad person.", () => getKarma() < 0
            ? finish('responsibility', "You're one to talk. I've seen your behaviour around the club.", 'skeptical')
            : finish('responsibility', "It's easy to be moral when you're poor.", 'smug'))
        ]), 'thinking'));
      }
      if (!completed.has('money')) {
        replies.push(reply('Can I have some money?', say('What? No!', 'irritated', [
          reply('Oh, okay.', () => {
            completed.add('money');
            return menu();
          }, 'sorry'),
          reply("I'll tell people about what you're doing. Consider it buying my silence.", () => {
            blackmailed = true;
            return random() < 0.5
              ? say('Away from me, peasant!', 'angry', [], {
                  direction: 'The politician hits Pip.', playerMood: 'alarmed',
                  enterAction: 'blackmailPolitician', action: 'politicianHit'
                })
              : say("What's one more bribe? Here, take it and leave.", 'weary', [], {
                  enterAction: 'blackmailPolitician', action: 'politicianBribe'
                });
          })
        ])));
      }
      replies.push(reply("I'll leave you to it.", null));
      return say(greeting, mood, replies);
    }

    return menu();
  };
}
