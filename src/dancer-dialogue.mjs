import {dancers} from './dancers.mjs';

export const dancerMoods = ['happy', 'excited', 'nervous', 'reserved', 'thinking', 'laughing', 'deadpan'];

const titles = {mascot: 'Milk Bottle Boy', coral: 'Coral', jade: 'Jade', guard: 'Off-Duty Bull Guard'};
export const dancerTargets = dancers.map(({id, x, y}) => ({
  id: 'dancer-' + id, title: titles[id], x, y: y - 18, radius: 15
}));

const greetings = {
  mascot: [
    ['WOOOOO! MILK!', 'excited'],
    ['Have you tried the milk here?!', 'happy'],
    ['Best night of my life!', 'laughing'],
    ['Do I look good? Be honest!', 'nervous'],
    ["I reckon the girls have been looking at me!", 'happy'],
    ["Hey, mate! Do you reckon I'm handsome?", 'nervous'],
    ['Do girls like blokes who drink lots of milk?', 'thinking'],
    ["I'm just waiting for the right moment, mate!", 'reserved'],
    ["You don't think that guard's better looking than me, do you?", 'nervous'],
    ["Feel my muscles! I've been drinking whole milk!", 'excited'],
    ["Tonight's the night, mate! I can feel it!", 'excited'],
    ["You haven't got any spare milk, have you?", 'deadpan']
  ],
  coral: [
    ['WOOOOO! PARTY TIME!', 'excited'],
    ['Come on! Shake it!', 'happy'],
    ['Are you here to dance or what?!', 'deadpan'],
    ['Someone get me another milk!', 'excited'],
    ['Jade! This is our song!', 'excited'],
    ['Oh, hiiiii!', 'happy'],
    ['Having fun, cutie?!', 'laughing'],
    ['I LOVE THIS PLACE!', 'excited'],
    ['Have you come to party with us?!', 'happy'],
    ["Jade! We've got another one!", 'laughing'],
    ['Less talking, more dancing!', 'deadpan'],
    ['Oh my goodness! I love your outfit!', 'happy']
  ],
  jade: [
    ['Oh! Hi!', 'nervous'],
    ['Are those two still looking at us?', 'nervous'],
    ['Coral, behave yourself!', 'deadpan'],
    ["Please tell me you're not another waiter.", 'reserved'],
    ["I'm just here to dance!", 'reserved'],
    ['Oh, thank goodness. Someone relatively normal.', 'happy'],
    ['Is that guard looking at me?', 'nervous'],
    ["Sorry about Coral. She's had a lot of milk.", 'reserved'],
    ['Can you tell that guy to stop shouting about milk?', 'deadpan'],
    ['Coral! Stop encouraging them!', 'nervous'],
    ["You're not going to moo at me, are you?", 'thinking'],
    ['Why do we always attract the weird ones?', 'deadpan']
  ],
  guard: [
    ['MOOOOOO! How are ya, little fella?!', 'excited'],
    ["I'm off duty! No ploughing complaints!", 'deadpan'],
    ['What a night! What a magnificent night!', 'happy'],
    ['Have you seen those two ladies?!', 'excited'],
    ['The Great Cow bless the Baron!', 'happy'],
    ["I'd arrest myself for looking this milkin good!", 'laughing'],
    ["You haven't got any red on you, have ya?", 'nervous'],
    ["Between you and me, little fella, I'm milkin irresistible.", 'reserved'],
    ['That idiot with the milk bottle is getting on my nerves.', 'deadpan'],
    ['Watch and learn, runt. Watch and learn!', 'excited'],
    ["I'm normally much smoother than this.", 'reserved'],
    ["I'm not drunk! I've just got four... never mind.", 'nervous'],
    ['You reckon the ladies like a man in uniform?', 'thinking'],
    ["Milkin hell, that milk's starting to hit me.", 'deadpan'],
    ['MOOOOOO! Sorry about that. Hiccups.', 'laughing'],
    ['Look at these moves! Light on my hooves!', 'excited'],
    ['Finest specimen on the dance floor!', 'excited'],
    ['Not bad for a big fella, eh?', 'excited'],
    ["MOOOOOO! That's my singing voice!", 'excited'],
    ["Careful, little fella. Don't get trampled!", 'excited']
  ]
};

export function dancerPortraitName(id, mood) {
  return id.slice('dancer-'.length) + '-' + mood + '.webp';
}

export function createDancerConversation() {
  const nextGreeting = new Map();
  return function open(id) {
    const lines = greetings[id.slice('dancer-'.length)];
    const index = nextGreeting.get(id) ?? 0;
    nextGreeting.set(id, (index + 1) % lines.length);
    const [text, mood] = lines[index];
    return {text, mood};
  };
}
