import {PILLORY, PILLORY_ATTENDANT} from './room.mjs';

export const pilloryAttendant = {
  id: 'pillory-attendant', title: 'Attendant', ...PILLORY_ATTENDANT, radius: 21
};

export const pilloryCommissioner = {
  id: 'pillory-commissioner', title: 'Commissioner', ...PILLORY, radius: 23
};

const attendantLines = [
  'Come one, come all! Have a ball! Make the Commissioner bawl!',
  'Mad at the bureaucracy? Filled with dismay? Throw a milk balloon and brighten your day!',
  'Hey there, young man! Come and try your aim! Humiliating officials is a wonderful game!',
  "Don't cry over spilt milk, my dear! Make the Commissioner shed a tear!",
  'Feeling oppressed? Feeling distressed? Throw a balloon and get it off your chest!',
  'Civil disobedience without the crime! Come and have a splendid time!',
  'Revolutionary thoughts getting in the way? A splash of milk keeps rebellion at bay!',
  'Why petition the state when you can participate? Grab a milk balloon and vent your hate!',
  'Exercise your rights and take delight! Give the Commissioner a milky fright!',
  'Stickman rights? What a dreadful bore! Throw a balloon and ask for more!',
  "She fought for equality, she fought for the poor! Now she's our entertainment, forevermore!",
  'Give the Commissioner feedback today! Grab a milk balloon and let it spray!',
  'A champion of the oppressed, now our honoured guest! Grab a balloon and put your aim to the test!'
];

const commissionerLines = [
  'Why did I ever challenge the Baron?',
  'I merely recommended a parliamentary inquiry!',
  'This is a flagrant violation of stickman rights!',
  'I used to have an office, you know.',
  "My report wasn't even particularly critical!",
  'Perhaps I should have accepted that bribe.',
  'I spent thirty years studying law for this?',
  "Surely there's an appeals process?",
  'I specifically recommended abolishing public humiliation!',
  'My successor will have a remarkably short list of recommendations.',
  'All I wanted was affordable milk for everyone!',
  "Please, haven't I been pasteurised enough?",
  'I wonder if my department still exists.',
  'So much for the independence of statutory authorities.',
  "Next time, I'll just recommend another tax cut for the Baron."
];

export function createPillorySpeech(random = Math.random) {
  const speakers = [
    {id: 'attendant', interval: 15, next: 15, lines: attendantLines, last: -1},
    {id: 'commissioner', interval: 40, next: 40, lines: commissionerLines, last: -1}
  ];
  let speech;
  return (elapsed, visible) => {
    if (speech && elapsed < speech.until) {
      return visible[speech.id] ? {...speech, opacity: Math.min(1, (speech.until - elapsed) / 0.5)} : null;
    }
    const speaker = speakers.filter(({id, next}) => visible[id] && elapsed >= next)
      .sort((a, b) => a.next - b.next)[0];
    if (!speaker) return null;
    const pick = Math.floor(random() * (speaker.lines.length - Number(speaker.last >= 0)));
    speaker.last = speaker.last >= 0 && pick >= speaker.last ? pick + 1 : pick;
    const text = speaker.lines[speaker.last];
    speech = {id: speaker.id, text, until: elapsed + Math.max(3, text.length / 17)};
    speaker.next = elapsed + speaker.interval;
    return {...speech, opacity: 1};
  };
}
