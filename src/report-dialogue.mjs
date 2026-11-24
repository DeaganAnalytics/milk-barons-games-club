const baronReport = {
  label: 'The Baron keeps following me.', playerMood: 'worried',
  next: {text: "No he doesn't.", mood: 'deadpan', replies: [
    {label: 'Look! He is approaching us now.', playerMood: 'alarmed',
      next: {text: "Sir you've had too much to drink. Or too little.", mood: 'suspicious', replies: [
        {label: 'But the Baron...', playerMood: 'worried', next: {text: 'MOOOOVE IT!', mood: 'angry'}}
      ]}}
  ]}
};

const miloReport = {
  label: "There's a man in rags wandering around the walls.", playerMood: 'attentive',
  next: {text: 'We have a code 9, I repeat a code 9. Possible Milo sighting.', mood: 'radio',
    direction: 'Grabs radio', replies: [
      {label: "What's gonna happen to him?", playerMood: 'worried',
        next: {text: 'Sir you have done your nation and the Baron a great duty today.', mood: 'formal', action: 'reportMilo'}}
    ]}
};

export function availableReports(completedTrips, seenMilo, reportPending) {
  const replies = [];
  if (completedTrips >= 2) replies.push(baronReport);
  if (seenMilo && !reportPending) replies.push(miloReport);
  return replies;
}

export const injuredMiloReply = {
  label: 'What happened to you?', playerMood: 'alarmed',
  next: {text: 'The guards... someone reported me again', mood: 'sad', replies: [
    {label: 'That was me.', playerMood: 'sorry',
      next: {text: 'You monster!', mood: 'angry', action: 'fleeMilo'}},
    {label: "That's horrible... I don't know who did that...", playerMood: 'worried',
      next: {text: "Just stay away, I don't want the attention.", mood: 'worried'}}
  ]}
};
