const staff = (text, mood = 'attentive') => ({text, mood, exactNpcPortrait: true});
const pip = (text, playerMood = 'thinking') => ({text, speaker: 'Pip', mood: 'attentive', playerMood, exactPlayerPortrait: true});

export const membershipQuestion = 'Do all guests pay for milk?';

const variants = new Map([
  ['lin-waitress', [
    staff('No, sir.'),
    pip('Why not?'),
    staff('Most of our guests are members. Refreshments are included in their membership.'),
    pip('How much is membership?'),
    staff('Ten thousand coins, sir.'),
    pip('TEN THOUSAND?!', 'alarmed'),
    staff('Per week, sir.')
  ]],
  ['blonde-waitress', [
    staff("Oh, no! Only the ones who aren't members.", 'pleased'),
    pip("Why's that?"),
    staff("Members get all the milk they want! Isn't that lovely?", 'pleased'),
    pip('How much does membership cost?'),
    staff('Ten thousand coins!', 'pleased'),
    pip('TEN THOUSAND?!', 'alarmed'),
    staff('Every week! Imagine having that much money!', 'pleased')
  ]],
  ['female-waiter', [
    staff("No, sir. Most of our regular guests don't."),
    pip('Why not?'),
    staff("They're members, sir. Milk is included in their membership fee."),
    pip('How much is the membership fee?'),
    staff('Ten thousand coins, sir.'),
    pip('TEN THOUSAND?!', 'alarmed'),
    staff("That's the weekly rate, I'm afraid.", 'apologetic')
  ]],
  ['male-waiter', [
    staff('Certainly not, sir.'),
    pip('Why not?'),
    staff('The majority of our patrons enjoy the privileges of membership. Complimentary milk is one such privilege.'),
    pip('How much does membership cost?'),
    staff('A mere ten thousand coins, sir.', 'pleased'),
    pip('A MERE TEN THOUSAND?!', 'alarmed'),
    staff('Per week, naturally.')
  ]],
  ['handlebar-waiter', [
    staff('Good heavens, no, sir!', 'welcoming'),
    pip('Why not?'),
    staff('Our esteemed members are entitled to an unlimited supply of the finest milk!', 'pleased'),
    pip('How much does membership cost?'),
    staff('Ten thousand coins, sir!', 'pleased'),
    pip('TEN THOUSAND?!', 'alarmed'),
    staff('PER WEEK, SIR!', 'pleased')
  ]],
  ['martini-waiter', [
    staff('Only those without a membership, sir.'),
    pip('Why?'),
    staff('Our more affluent patrons prefer not to concern themselves with such trivial transactions.'),
    pip('How much does membership cost?'),
    staff('Ten thousand coins, sir.'),
    pip('TEN THOUSAND?!', 'alarmed'),
    staff("Per week. I take it you're not interested?")
  ]]
]);

export function waiterMembershipDialogue(id) {
  return variants.get(id)?.reduceRight((next, beat) => next ? {
    ...beat, mustContinue: true, replies: [{label: 'Continue', next}]
  } : beat, null);
}
