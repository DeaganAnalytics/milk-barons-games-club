const fallback = {
  shocked: 'hurried', angry: 'hurried', worried: 'apologetic', gossiping: 'pleased',
  lovestruck: 'pleased', confused: 'attentive', sulking: 'apologetic', thinking: 'attentive'
};

const brie = (text, mood, extra) => ({text, mood: fallback[mood] ?? mood, ...extra});
const pip = (text, playerMood) => ({text, playerMood, speaker: 'Pip', mood: 'attentive'});
const advance = next => ({label: 'Continue', next});
const chain = (lines, end = {replies: []}) => lines.reduceRight((next, line) =>
  ({mustContinue: true, replies: [advance(next)], ...line}), end);
const choice = (label, playerMood, next) => ({label, playerMood, next});
const close = exitAction => ({exitAction});

export function createBrieCurdTopic() {
  let used = false;
  return (communist, menu, {seduced, relationship, flirts}) => {
    if (!communist || used) return null;
    const back = [advance(menu)];
    const ending = (text, mood, action) => brie(text, mood, {replies: action ? [advance(close(action))] : [], mustContinue: Boolean(action)});
    const conclusion1 = chain([
      pip("I don't think we're talking about the same guy.", 'exasperated'),
      brie('Probably not!', 'pleased', {replies: back})
    ]);
    const conclusion2 = chain([
      pip("I don't think we're talking about the same man.", 'exasperated'),
      brie("Oh! Well, that's good then!", 'pleased', {replies: back})
    ]);
    const departure = chain([
      brie('WHAT?! MY KARL?!', 'shocked'),
      ending("Oh, I'm going to give him a piece of my mind!", 'angry', 'brieDepart')
    ]);
    const explanation = chain([
      brie('Sighs.', 'attentive'),
      brie('When a man and a woman love each other very much...', 'attentive'),
      brie('Though apparently not enough to propose...', 'sulking'),
      brie('They become boyfriend and girlfriend!', 'pleased', {replies: [
        choice('I KNOW WHAT A BOYFRIEND IS!', 'exasperated', chain([
          brie('Well, why did you ask then?', 'confused'),
          pip("Because he's been dead for centuries!", 'exasperated'),
          brie("I think I'd know if my boyfriend was dead...", 'attentive'),
          brie('Although, after a night of drinking, it can be hard to tell.', 'thinking'),
          pip('Right...', 'thinking'),
          brie('Anyway, lovely chat!', 'pleased'),
          ending("Got to go! The Baron's calling!", 'hurried', 'brieRunToBaron')
        ])),
        choice('How long have you been together?', 'thinking', chain([
          brie('Three whole weeks!', 'lovestruck'),
          pip("He's been dead for three centuries!", 'exasperated'),
          brie("You're very strange, Pip.", 'confused', {replies: back})
        ]))
      ]})
    ]);
    const boyfriend = chain([brie('Yes. Boyfriend.', 'attentive', {replies: [
      choice("I don't understand.", 'thinking', explanation),
      choice("That's impossible!", 'alarmed', chain([
        brie("It's quite possible, silly!", 'pleased'),
        pip('But HOW?!', 'exasperated')
      ], explanation))
    ]})]);
    const history = chain([
      brie('Whispers. Lots of exes.', 'gossiping'),
      pip("He didn't actually have many relationships.", 'thinking'),
      brie("That's what he tells me! I've read his letters, though!", 'angry'),
      pip("You've read his letters?", 'thinking'),
      brie("Oh, yes. He doesn't know, though.", 'gossiping'),
      pip('Fascinating! Were there any unpublished works?', 'happy'),
      brie('Mostly apologies to other girls.', 'attentive'),
      pip('So you would know about his male... um... friends?', 'thinking'),
      brie('What sort of friends?', 'confused', {replies: [
        choice('[Lie] Drinking buddies! Yes, those.', 'worried', chain([
          pip('Drinking buddies! Yes, those.', 'worried'),
          brie('Oh, them...', 'apologetic'),
          brie('Terrible influence. He never comes home before midnight.', 'attentive'),
          pip("I'll leave you to it.", 'attentive'),
          brie('Okie dokie!', 'pleased', {replies: back})
        ])),
        choice('You know, like boyfriend and girlfriend... without the girlfriend.', 'worried', departure),
        choice('Forget I said anything.', 'sorry', brie('Okay!', 'pleased', {replies: back}))
      ]})
    ]);
    const historicalFigure = chain([
      brie("Don't be silly! He's twenty-one!", 'pleased'),
      pip("No, he's not! He's a historical figure!", 'exasperated'),
      brie('He certainly has a lot of history.', 'attentive'),
      brie('A bit too much for my liking, actually.', 'sulking', {replies: [
        choice('Too much history?', 'thinking', history),
        choice("Too much history? He's a legend! My hero!", 'happy', brie('Did he put you up to this?', 'confused', {replies: [
          choice('What? No, of course not.', 'thinking', chain([
            brie("Sounds like something he'd do. He's a bit of a prankster!", 'pleased')
          ], conclusion1)),
          choice('[Lie] Yes.', 'happy', chain([
            pip('Yes.', 'happy'),
            brie('Well, give him this from me!', 'angry'),
            {...pip('WHAT WAS THAT FOR?!', 'alarmed'), enterAction: 'brieCurdSlap'},
            ending("I'm sick of his silly jokes!", 'angry')
          ]))
        ]}))
      ]})
    ]);
    const romance = seduced ? chain([
      pip("I wouldn't say that.", 'happy'), brie('Yes, well... word gets around.', 'gossiping'),
      pip('It does?', 'worried'), brie('Oh, absolutely!', 'pleased')
    ], conclusion1) : relationship !== 'normal' ? chain([
      pip('Well, there was this one girl...', 'sorry'), brie('And you ruined that!', 'angry'),
      pip('Right...', 'sorry'), brie('Honestly, Pip.', 'attentive')
    ], conclusion1) : flirts > 3 ? chain([
      pip("Well, there's this one girl...", 'thinking'),
      brie('Oh, I know! She really likes you, you know.', 'gossiping'),
      brie("Don't you dare break her heart.", 'attentive'),
      pip('Really?!', 'happy'), ending('Yes! Go get her, tiger!', 'pleased')
    ]) : chain([
      pip('No, not really.', 'worried'), brie("Have you spoken to Lin? She's been eyeing you!", 'gossiping'),
      pip('Really?!', 'alarmed'), ending('Yes! Go get her, tiger!', 'pleased')
    ]);
    const admiration = chain([
      brie('Ohhh! Right!', 'attentive'), brie('Thank the Great Cow!', 'pleased'),
      brie("He is wonderful, isn't he?", 'lovestruck', {replies: [
        choice("He's one of the greatest political minds of all time!", 'happy', chain([
          brie('Well, he does get very political after a few Piña Cow-ladas.', 'attentive'),
          pip('What does he talk about?', 'thinking'),
          brie('Mostly how unfair it is that he has to pay for his drinks.', 'apologetic')
        ], conclusion1)),
        choice("He's my hero!", 'happy', chain([brie('Not much luck with the ladies, then?', 'attentive')], romance)),
        choice('The milkless have nothing to lose but their chains!', 'happy', chain([
          brie('Oh, I hope not! Karl bought me a lovely little silver chain for my birthday.', 'worried'),
          pip('Not that sort of chain.', 'exasperated'),
          brie("It's got a little cow on it!", 'pleased')
        ], conclusion1))
      ]})
    ]);
    const book = chain([
      brie('Oh! That sounds just like him!', 'pleased'),
      pip("It's from his book, The Means of Milk Production.", 'happy'),
      brie('HE HAS A BOOK?!', 'shocked', {replies: [
        choice('Yes! Where else would you have heard that?', 'thinking', chain([
          brie('He whispers it to me at night.', 'lovestruck'), pip('He WHAT?!', 'alarmed'),
          brie("He's such a romantic!", 'lovestruck')
        ], conclusion2)),
        choice("Yes! And it's the greatest book of all time!", 'happy', chain([
          brie('What else is he hiding from me?!', 'worried'), pip("It's hardly a secret.", 'thinking'),
          brie('Well, it was to me!', 'angry')
        ], conclusion2)),
        choice("Of course he does! It's very famous!", 'exasperated', chain([
          brie('All that time he spent writing it, he could have spent with me!', 'angry'),
          pip("It's quite an important book.", 'thinking'), brie("I'm quite an important girlfriend!", 'angry')
        ], conclusion2)),
        choice('Have you read it?', 'thinking', chain([
          brie('Is it romantic?', 'attentive'), pip("It's a critique of the economic exploitation of the working class.", 'thinking'),
          brie('Oh. Probably not my sort of book, then.', 'apologetic')
        ], conclusion2))
      ]})
    ]);
    return choice('What do you think of Karl Curd?', 'thinking', () => {
      if (used) return menu;
      used = true;
      return chain([pip('What do you think of Karl Curd?', 'thinking')], brie('Oh, I love him!', 'lovestruck', {mustContinue: true, replies: [
        choice('YOU DO?!', 'alarmed', brie("Of course, silly! He's my boyfriend!", 'pleased', {mustContinue: true, replies: [
          choice('Your... boyfriend?', 'thinking', boyfriend),
          choice("But he's been dead for over 300 years!", 'alarmed', historicalFigure)
        ]})),
        choice('I love him too!', 'happy', chain([
          brie("Don't be silly! That's gay!", 'pleased'),
          brie("He isn't gay, is he?", 'worried', {replies: [
            choice('Well, there is some literature and a number of recovered letters suggesting that he may have been...', 'thinking', departure),
            choice('No! I don\'t love him romantically. I just admire him.', 'thinking', admiration)
          ]})
        ])),
        choice('The means of milk production belong to the workers!', 'happy', book)
      ]}));
    });
  };
}
