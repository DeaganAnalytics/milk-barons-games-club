const baron = (text, mood = 'pleased', extras) => ({text, mood, ...extras});
const elias = (text, mood = 'reading-figures') => ({text, mood, character: 'elias'});
const reply = (label, next) => ({label, next, playerMood: 'thinking'});
const advance = next => [reply('Continue', next)];

function scene(lines, replies) {
  return lines.reduceRight((next, line) => ({...line, replies: next ? advance(next) : replies}), null);
}

export function commissionerDiscussion(askedEliasAboutVampires) {
  const completed = new Set();

  function finish(branch, line) {
    return () => {
      completed.add(branch);
      return completed.size === topics.length
        ? {...line, autoCloseMs: 2600}
        : {...line, replies: advance(menu)};
    };
  }

  const garlic = reply('Garlic.', scene([
    elias('VHAT?! VHO HAS GARLIC?!', 'worried'),
    elias('I mean... have ve considered letting customers throw garlic, my lord?', 'worried'),
    baron('Gar-lic? Is that a milkable animal?', 'flustered'),
    elias('No, my lord.', 'insulted')
  ], advance(finish('money', baron('Hmmm... Milk...')))));

  function moneyChoices(...choices) {
    return askedEliasAboutVampires ? [...choices, garlic] : choices;
  }

  const calculator = reply('Elias, have you heard of a calculator?', scene([
    elias("Vhat?! Ah, I've lost my place. I must start again!", 'insulted'),
    baron('', 'milk-drool', {direction: 'The Baron falls asleep. Milk dribbles down his chin.'})
  ], [
    reply("Never mind. I'm no longer interested.", () => {
      completed.add('money');
      return completed.size === topics.length ? null : menu();
    })
  ]));

  const waiting = [
    '...ah, but what about ze ongoing maintenance...',
    '...allow for unexpected fluctuations in ze price of milk...',
    '...perhaps ve should establish a separate cost centre...'
  ].reduceRight((next, text) =>
    reply('Wait', {...elias(text), replies: moneyChoices(...(next ? [next] : []), calculator)}), null);

  const watch = reply('Check watch', scene([
    elias('...account for depreciation of ze pillory...'),
    baron('Milk, milk, milk my cow...', 'pleased', {direction: 'Singing softly'}),
    elias('...employee pension fund. Wait, zere is none!', 'insulted')
  ], moneyChoices(waiting, calculator)));

  const topics = [
    ['objection', reply("Surely you can't imprison someone for criticising you?", scene([
      baron("Of course not! That's why I have employees.", 'laughing'),
      elias('Ze Baron did not personally lift a finger.', 'self-assured-smirk')
    ], advance(finish('objection', baron('LIFT?! I hate exercise.', 'displeased')))))],
    ['money', reply('How much money do you make from the pillory?', scene([
      baron('An excellent question! Elias, fetch the figures!', 'laughing'),
      elias('₥1 per milk balloon... Ten milk balloons per hour... Minus ze expenses, of course...'),
      baron('All this mental exercise is working up a sweat.', 'winded'),
      baron('MILK!', 'displeased'),
      {text: 'Right away, my lord.', mood: 'hurried', character: 'female-waiter', speaker: 'Waitress'},
      baron('', 'sipping', {direction: 'The waitress delivers a glass of milk. The Baron takes a sip.'}),
      baron('Much better.'),
      elias('Carry ze one...')
    ], moneyChoices(watch)))],
    ['authority', reply('Who gave you the authority to do that?',
      finish('authority', baron('What a strange question to ask the owner of the pillory.', 'suspicious')))],
    ['release', reply('Could you let her go?', baron('During business hours?!', 'flustered', {replies: [
      reply('When do business hours end?', scene([
        elias('Zis is a 24-hour establishment.', 'current-smile'),
        baron('My hands are tied.')
      ], advance(finish('release', elias('One could say you are ze real victim, my lord.', 'self-assured-smirk')))))
    ]}))]
  ];

  function menu() {
    return baron('', 'pleased', {replies: topics.filter(([branch]) => !completed.has(branch)).map(([, choice]) => choice)});
  }

  return baron('Did I? I delegate so many of these things.', 'pleased', {replies: advance(
    {...elias('Ze Baron is a very busy man. He has considerable quantities of money to count.', 'self-assured-smirk'),
      replies: menu().replies}
  )});
}
