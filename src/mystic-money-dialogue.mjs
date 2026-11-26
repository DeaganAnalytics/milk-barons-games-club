export function mysticMoneyOutcome(coins, hearts, maxHearts, coinRoll, healthRoll) {
  const coinChanges = [-20, -10, -5, 0, 5, 10, 20, 30, 50];
  const coinThresholds = [5, 15, 25, 30, 40, 55, 80, 95, 100];
  const reward = coinChanges[coinThresholds.findIndex(threshold => coinRoll <= threshold)];
  const coinChange = Math.max(-coins, coins >= 120 && coins <= 150 ? Math.min(30, reward) : reward);
  const fatal = healthRoll === 100;
  const nextHearts = fatal ? 0
    : healthRoll <= 5 ? Math.min(maxHearts, hearts + 0.5)
    : healthRoll <= 15 ? hearts
    : healthRoll <= 35 ? hearts * 0.75
    : healthRoll <= 74 ? hearts * 0.5
    : healthRoll <= 94 ? hearts * 0.25
    : Math.min(hearts, 0.5);
  return {coinChange, hearts: nextHearts, fatal};
}

const mystic = (text, mood = 'serene', extras) => ({text, mood, speaker: 'Milk Mystic', ...extras});
const pip = (text, playerMood = 'thinking') => ({text, speaker: 'Pip', mood: 'contemplative', playerMood});
const reply = (label, next) => ({label, next});
const withReplies = (line, replies) => ({...line, mustContinue: true, replies});

function sequence(lines, next) {
  return lines.reduceRight((tail, line) => withReplies(line, [reply('Continue', tail)]), next);
}

export function createMysticMoneyTopic(getCoins, transact, menu) {
  let accepted = false;
  const back = () => menu();
  const endWith = (line, next = back) => withReplies(line, [reply('Continue', next)]);

  function moneyReaction(change, next) {
    if (change === 5) return sequence([
      pip("Five tokens? That's it?!", 'annoyed'),
      mystic('Be grateful for the blessings bestowed upon you.')
    ], endWith(pip("I've had more generous blessings from a pokie machine."), next));
    if (change > 0 && change <= 30) return sequence([
      pip('Oh! Actual money!', 'pleased'), mystic('Spend it wisely, child.')
    ], endWith(pip("You do realise we're in a casino?"), next));
    if (change > 30) return sequence([
      pip('FIFTY TOKENS?!', 'alarmed'), mystic('The milk is generous today, child.', 'wry-smile'),
      pip('Perhaps I should become religious.')
    ], endWith(mystic('A familiar response to material prosperity.', 'wry-smile'), next));
    if (change === 0) return sequence([
      pip("Where's my money?"), mystic('Where it was before, child.'),
      pip('What was the point of all that?!', 'annoyed'), mystic('Perhaps there is a lesson in this.')
    ], endWith(pip("Perhaps there's a lesson in not talking to you."), next));

    return sequence([
      pip("WAIT! I'VE LOST MONEY!", 'alarmed'), mystic('The milk giveth, and the milk taketh away.'),
      pip('I ASKED YOU FOR MONEY!', 'angry'), mystic('And the milk has answered.'),
      pip('IT ANSWERED THE WRONG BLOODY QUESTION!', 'angry')
    ], withReplies(mystic('The milk is not mistaken, child.'), [
      reply('I should have known better.', sequence([
        mystic('Wisdom has found you at last.')
      ], endWith(pip('At considerable expense.'), next))),
      reply('Give me my money back!', sequence([
        mystic('What has been given to the milk cannot be reclaimed.', 'warning'),
        pip('Well, tell the milk I want to speak to its manager!', 'annoyed'),
        mystic('The milk answers to no earthly authority.')
      ], endWith(pip('How bloody convenient.'), next))),
      reply("Fine. I'll take it back myself.", sequence([
        {...pip('Where is it?'), direction: "Pip searches the Milk Mystic's robes."},
        mystic('What do you seek, child?'), pip('MY MONEY!', 'angry'),
        {...pip("You haven't got any money on you at all!"), direction: 'Pip continues searching.'},
        mystic('Material possessions are of little consequence to me.'),
        pip('THEN WHERE DID MY MONEY GO?!', 'angry'), mystic('Where all milk must eventually go, child.'),
        pip("That doesn't even make sense!"), mystic('Few things do, child.', 'wry-smile')
      ], endWith({...pip("I'm beginning to hate milk."), enterAction: 'mysticMoneyTheft'}, next)))
    ]));
  }

  function accept() {
    if (accepted || getCoins() > 150) return option().next();
    accepted = true;
    const {coinChange, healthChange, fatal, broke} = transact();
    if (fatal) return sequence([
      mystic('So it shall be.'),
      pip("Oh... I don't feel particularly well.", 'worried'),
      mystic('The milk calls you home, child.', 'warning'), pip('What?', 'alarmed'),
      mystic('Your earthly vessel has served its purpose.', 'warning'),
      pip('WAIT! I ONLY WANTED SOME MONEY!', 'alarmed'),
      mystic('May you find peace in the eternal dairy.'), pip("OH, FOR GOD'S SAKE!", 'alarmed')
    ], mystic('Another vessel emptied.', 'serene', {
      direction: 'Pip collapses.', pipCollapsed: true, action: 'mysticMoneyDeath'
    }));

    const healthReaction = healthChange < 0 ? [
      pip('AARGH! WHAT THE HELL?!', 'alarmed'), mystic('The balance has been restored.'),
      pip('YOU COULD HAVE WARNED ME!', 'angry'), mystic('I did, child.'),
      pip('You were talking about bloody vessels!', 'annoyed'), mystic('And now you understand.', 'wry-smile')
    ] : healthChange > 0 ? [
      pip('Oh! I actually feel a little better.', 'pleased'), mystic('The milk flows favourably through you, child.'),
      pip("I don't suppose you could do that again?"), mystic('One must not become greedy with miracles.', 'warning')
    ] : [
      pip("I don't feel any different."), mystic('Not all sacrifices are felt, child.'),
      pip("That's rather ominous.", 'worried')
    ];
    const next = broke ? {exitAction: 'finishMysticMoney'} : back;
    return sequence([mystic('So it shall be.'), ...healthReaction], moneyReaction(coinChange, next));
  }

  function option() {
    return accepted ? reply('Could I have some more milk tokens?', () => sequence([
      mystic('The milk has already been drawn, child.'), pip('What does that mean?'),
      mystic('I have nothing more to give.')
    ], endWith(pip('You could have just said that.')))) : reply('Could you spare some milk tokens?', () => {
      if (getCoins() > 150) return sequence([
        mystic('You already have plenty, child.'), pip("A little more wouldn't hurt."),
        mystic('Greed is a vessel that can never be filled.', 'warning')
      ], endWith(pip('You sound considerably less capitalist than everyone else here.')));
      return sequence([
        mystic('Wealth is never freely bestowed, child. All things require sacrifice.'),
        pip('What sort of sacrifice?', 'worried'), mystic('To fill one vessel, another must be emptied.'),
        pip('Could you be a little more specific?'), mystic('The milk shall determine both your fortune and your sacrifice.'),
        pip("That's not particularly reassuring.", 'worried')
      ], withReplies(mystic('Do you accept, child?'), [
        reply("Alright. What's the worst that could happen?", accept),
        reply("On second thought, I don't like the sound of this.", sequence([
          mystic('Perhaps you are wiser than you appear, child.', 'wry-smile')
        ], endWith(pip('Thank you. I think.'))))
      ]));
    });
  }

  return option;
}
