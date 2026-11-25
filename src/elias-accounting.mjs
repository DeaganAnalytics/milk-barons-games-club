export function createTally(startingValue) {
  let value = startingValue;
  let gained = 0;
  let lost = 0;
  let revision = 0;
  let reviewed = 0;
  return {
    record(next, movement) {
      const difference = next - value;
      const credit = movement?.credit ?? Math.max(0, difference);
      const debit = movement?.debit ?? Math.max(0, -difference);
      value = next;
      if (credit || debit) {
        gained += credit;
        lost += debit;
        revision++;
      }
    },
    get available() { return revision !== reviewed; },
    snapshot() { return {value, gained, lost, revision}; },
    review(snapshotRevision) { reviewed = snapshotRevision; }
  };
}

const signed = value => value > 0 ? '+' + value : value < 0 ? '−' + Math.abs(value) : '0';
const line = (text, mood = 'thinking', label = 'Continue') => ({text, mood, label});

function financial({gained, lost, value}) {
  const net = gained - lost;
  return [
    line('Ah! You vish to review your financial performance? Excellent!', 'current-smile'),
    line(`Your total earnings amount to ₥${gained}.`, 'reading-figures'),
    line(`Your total expenditure and losses amount to ₥${lost}.`, 'reading-figures'),
    line(`Zis gives you a net financial result of ₥${signed(net)}.`, 'self-assured-smirk'),
    line(`Your current balance is ₥${value}.`, 'reading-figures'),
    net > 0 ? line('A positive return on capital! Most encouraging, Master Pip.', 'current-smile')
      : net < 0 ? line('A negative return on capital. Perhaps you are better suited to government employment.', 'devious')
      : line('You have achieved absolutely nothing, financially speaking.', 'insulted')
  ];
}

function alignment({gained, lost, value}) {
  return [
    line('Aristocratic alignment, Master Pip. Ve do not use such peasant terminology.', 'insulted'),
    line(`You have accumulated ${gained} points through acts of compassion, generosity and other financially questionable activities.`),
    line(`You have accumulated ${lost} points through acts of selfishness, deception and entrepreneurial initiative.`, 'self-assured-smirk'),
    line(`Your net alignment currently stands at ${signed(value)}.`, 'reading-figures'),
    value < -5 ? line('Magnificent! You possess all ze moral qualities of a successful aristocrat.', 'current-smile')
      : value < 0 ? line('Your moral development is progressing satisfactorily.', 'self-assured-smirk')
      : value === 0 ? line('You appear to be suffering from moral indecision.')
      : value <= 5 ? line('I am concerned by your apparent attachment to morality.', 'worried')
      : line('Most alarming. I shall have to discuss your communist tendencies vith ze Baron.', 'insulted')
  ];
}

function health({gained, lost, value}) {
  return [
    line('Ah, yes. Your physical depreciation.'),
    line('You are, after all, an asset of ze Baron until your debt is repaid.', 'devious', 'My what?'),
    line(`You have sustained ${lost} hearts of damage.`, lost ? 'worried' : 'thinking'),
    line(`You have recovered ${gained} hearts.`, gained ? 'current-smile' : 'thinking'),
    line(`Your net change in health is ${signed(gained - lost)} hearts.`),
    line(`You currently possess ${value} out of 3 hearts.`, 'reading-figures'),
    value === 3 ? line('Excellent! No physical depreciation whatsoever.', 'current-smile')
      : value >= 2 ? line('Some minor wear and tear. Nothing zat should affect your resale value.')
      : value >= 1 ? line('Your physical condition is becoming a matter of financial concern.', 'worried')
      : line('Master Pip, I strongly recommend purchasing some milk. Preferably before you become a write-off.', 'worried')
  ];
}

const topics = [
  ['coins', 'How am I doing financially?', financial],
  ['karma', "How's my karma looking?", alignment],
  ['health', "How's my health looking?", health]
];

export function accountingReplies(tallies, menu) {
  if (!tallies) return [];
  return topics.filter(([key]) => tallies[key].available).map(([key, label, build]) => ({
    label, playerMood: 'thinking',
    next: () => {
      const tally = tallies[key];
      const snapshot = tally.snapshot();
      const back = {label: 'Continue', playerMood: 'attentive', next: () => {
        tally.review(snapshot.revision);
        return menu;
      }};
      return build(snapshot).reduceRight((reply, {text, mood, label}) => ({
        label, playerMood: 'thinking', next: {text, mood, replies: [reply], mustContinue: true}
      }), back).next;
    }
  }));
}
