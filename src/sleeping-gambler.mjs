export const sleepingGamblerId = 'sleeping-gambler';
export const gamblerPortraits = ['asleep', 'awake'];

export function createSleepingGambler() {
  let tokens = true;
  let wokeAt = null;
  return {
    get hasTokens() { return tokens; },
    takeTokens(wake, elapsed) {
      if (!tokens) return false;
      tokens = false;
      if (wake) wokeAt = elapsed;
      return true;
    },
    pose(elapsed) {
      const time = wokeAt === null ? Infinity : elapsed - wokeAt;
      return {
        tokens: tokens || time < 0.75,
        awake: time < 5.5,
        reach: time < 0.75 ? Math.sin(time / 0.75 * Math.PI) : 0,
        pull: time >= 1 && time < 1.9 ? Math.sin((time - 1) / 0.9 * Math.PI) ** 2 : 0,
        remark: time >= 2.1 && time < 5.5 ? 'Damn it! There goes breakfast.' : null
      };
    }
  };
}

export function sleepingGamblerDialogue(gambler) {
  const reply = (label, next) => ({label, next, playerMood: 'attentive'});
  if (!gambler.hasTokens) return {
    text: 'The man is fast asleep.', speaker: 'Narrator', mood: 'asleep',
    mustContinue: true, replies: [reply('Leave him alone', null)]
  };
  const awake = (text, replies, action, mood = 'awake') => ({
    text, mood, replies, action, mustContinue: replies.length > 0
  });
  return {
    text: 'You notice the sleeping man has milk tokens in the payout tray.',
    speaker: 'Narrator', mood: 'asleep', mustContinue: true,
    replies: [
      reply('Wake the man', awake('What?!', [
        reply('Continue', awake('What time is it? Where am I?!', [
          reply('Continue', awake('Who are you?', [
            reply('You have tokens in the tray.', awake('Mine! Get back! Mine!', [], 'wakeSleepingGambler', 'protective'))
          ], undefined, 'drowsy'))
        ], undefined, 'dismayed'))
      ])),
      reply('Steal the tokens', {exitAction: 'stealSleepingGamblerTokens'}),
      reply('Leave him alone', null)
    ]
  };
}
