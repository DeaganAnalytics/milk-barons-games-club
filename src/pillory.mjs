const attendantLines = [
  'Come one, come all! Throw a balloon of milk at this miserable bore!',
  "Mad at the bureaucracy? It's your lucky day!",
  'Hey there, young man! Come and play a game!',
  "Don't just cry over spilt milk! Make someone else cry!",
  'Feeling oppressed? Feeling distressed? Throw a balloon and get it off your chest!',
  'All the satisfaction of civil disobedience, without the paperwork!',
  'A splash of milk keeps the revolutionary tendencies away!',
  'Why petition the government when you can pelt a peasant?',
  'Come and exercise your right to throw milk at the Rights Commissioner!',
  'Stickman rights? What about your right to a good time?',
  'She fought for equality! Now everyone gets an equal opportunity to pelt her!',
  'Give the Commissioner some feedback! Balloons available right here!',
  'A champion of the oppressed, now available for your amusement!'
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
