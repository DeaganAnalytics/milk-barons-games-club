const politicianLosses = [
  "There goes the education budget.",
  "Looks like milk rations will be reduced.",
  "Oh dear. Another hospital closure.",
  "Well, nobody really needs public libraries.",
  "That's unfortunate. I'll have to raise taxes again.",
  "There goes the pension increase.",
  "Perhaps the peasants could work an extra day each week.",
  "Damn it! Another reduction in subsidised milk.",
  "There goes the rural milk delivery programme.",
  "We'll call it a temporary fiscal adjustment.",
  "I suppose the schools can manage with fewer teachers.",
  "Another loss? Blasted economic conditions!",
  "The opposition will be blamed for this.",
  "Perhaps we can privatise another hospital.",
  "It's time for some difficult decisions. For other people.",
  "Skim milk for the peasants this winter, I'm afraid.",
  "There goes the funding for the orphanage.",
  "I'll just introduce a milk consumption levy.",
  "Another loss. Where's that emergency relief fund?",
  "Surely there's something left to privatise.",
  "I suppose we could raise the retirement age again.",
  "Damn it! That's the third infrastructure project this evening!"
];

const politicianWins = [
  "I won, I won! I'll be renovating after all!",
  "Excellent! Time for a parliamentary pay rise.",
  "Finally! A new milk fountain for my residence.",
  "And they say I'm fiscally irresponsible!",
  "What a magnificent return on public investment!",
  "Another successful government initiative!",
  "Splendid! I'll upgrade to first class.",
  "Perhaps a second holiday residence?",
  "Economic prosperity through strong leadership!",
  "I deserve this. Public service is exhausting.",
  "The taxpayers will be delighted. Well, they won't know.",
  "Finally! A heated milk pool!",
  "I'll declare that as a campaign donation.",
  "Another victory for responsible economic management!",
  "Who says government expenditure is unproductive?",
  "Excellent! I'll commission another portrait of myself."
];

const executiveLosses = [
  "Damn it, I lost. Another round of redundancies.",
  "Again... More downsizing.",
  "There goes the employee Christmas party.",
  "We'll have to freeze wages again.",
  "Time to restructure another department.",
  "Perhaps we can replace the remaining staff with unpaid interns.",
  "Damn it! Cancel the parental leave programme.",
  "Another loss? Increase the price of milk.",
  "We'll call it an efficiency dividend.",
  "There goes the employee milk allowance.",
  "I suppose we could water down the milk a little more.",
  "Time to revisit our staffing requirements.",
  "Perhaps the workers could bring their own toilet paper.",
  "Another disappointing quarter. For the employees, anyway.",
  "Cancel the safety inspections.",
  "We'll announce an exciting organisational transformation.",
  "Surely we don't need that many milk quality inspectors.",
  "I refuse to let this affect my bonus.",
  "Perhaps we could charge employees for their milk breaks.",
  "Damn it! Outsource something. Anything!",
  "We'll replace whole milk in the staff kitchen with ocean milk.",
  "Another loss? Time to review our commitment to workplace safety.",
  "The workforce needs to demonstrate greater resilience.",
  "I'll schedule a meeting about reducing unnecessary expenditure."
];

const executiveWins = [
  "I won! Increased bonuses for all executives!",
  "Excellent! Another record-breaking quarter.",
  "Finally! A new executive milk lounge.",
  "What can I say? I'm a natural leader.",
  "This calls for a corporate retreat.",
  "Another victory for shareholder value!",
  "I'll reward myself for this exceptional performance.",
  "Clearly, the redundancies are working.",
  "Premium elephant milk for the board tonight!",
  "I should write a book about financial discipline.",
  "And that's why I'm paid the big money.",
  "Excellent! Time to increase my remuneration package.",
  "Perhaps a private milk tanker?",
  "Another successful strategic investment!",
  "I'll mention this at the next leadership conference.",
  "Splendid! The employees can have a motivational email.",
  "Our success is a testament to my leadership.",
  "Finally! I can install a milk fountain in my office."
];

const remarks = {
  'slot-politician': [...politicianLosses, ...politicianWins],
  'slot-executive': [...executiveLosses, ...executiveWins]
};

export function createSlotSpeech(random = Math.random) {
  let nextAt = 20;
  let current;
  return (elapsed, visiblePlayers) => {
    if (elapsed >= nextAt && visiblePlayers.length) {
      const player = visiblePlayers[Math.floor(random() * visiblePlayers.length)];
      const lines = remarks[player.id];
      current = {player, text: lines[Math.floor(random() * lines.length)], startedAt: elapsed};
      nextAt = elapsed + 20;
    }
    if (!current || !visiblePlayers.includes(current.player)) return;
    const opacity = Math.max(0, Math.min(1, (5 - (elapsed - current.startedAt)) / 0.7));
    return opacity > 0 ? {...current, opacity} : undefined;
  };
}
