const baron = (text, mood = 'displeased') => ({text, mood});
const elias = (text, direction) => ({text, mood: 'current-smile', character: 'elias', direction});
const pause = {text: '', mood: 'flustered', direction: 'Pause.'};

function exchange(steps, replies) {
  for (const [label, response] of [...steps].reverse()) {
    replies = [{label, next: {...response, mustContinue: true, replies}}];
  }
  return replies[0];
}

export function baronCurdReply(menu) {
  const ending = {
    label: 'Continue', next: {
      ...baron('', 'pleased'), direction: 'Elias disappears.', mustContinue: true,
      enterAction: 'finishBaronKarlCurd', replies: [{label: 'Continue', next: menu}]
    }
  };
  const branches = [
    [
      ['Surely workers are entitled to the fruits of their labour?', baron('ABSOLUTELY NOT!')],
      ['Continue', elias('I believe His Excellency means zat labour is but one component of production. Capital, infrastructure and financial risk must also be considered.')],
      ['Continue', baron('EXACTLY WHAT I WAS GOING TO SAY!', 'pleased')],
      ['And what financial risk does the Baron personally undertake?', baron('ELIAS HANDLES ALL THAT!')],
      ['Continue', elias('His Excellency provides ze necessary capital.')],
      ['Which he acquired how?', baron('MY FATHER GAVE IT TO ME!')],
      ['Continue', elias('Through generations of prudent financial management.')],
      ['Continue', baron('MY GRANDFATHER GAVE IT TO HIM!')],
      ['Continue', elias('Quite, my Lord.')],
      ['So what exactly do you contribute?', baron('I DRINK THE MILK!', 'pleased')],
      ['Continue', elias('His Excellency maintains a keen interest in product quality.')],
      ['Continue', baron('GALLONS OF IT!', 'pleased')],
      ['Continue', elias('A remarkably keen interest.')]
    ],
    [
      ['How can you justify such enormous inequality?', baron("BECAUSE I'M BETTER THAN EVERYONE ELSE!", 'pleased')],
      ['Continue', elias('His Excellency is referring to ze importance of rewarding individual enterprise.')],
      ['And what about those born into poverty?', elias('Economic mobility is theoretically available to all citizens.')],
      ['Continue', baron('NOT IN MY ESTABLISHMENT!')],
      ['Continue', elias('His Excellency is referring to our admission standards.')],
      ['Continue', baron("I CAN'T STAND POOR PEOPLE!")],
      ['Continue', elias('A preference for financially established clientele.')],
      ["You're just translating everything he says into something less offensive.", elias('Among my many professional responsibilities, Master Pip.')],
      ['Continue', baron("AND HE'S BLOODY GOOD AT IT!", 'pleased')]
    ],
    [
      ["Why shouldn't the dairy belong to those who work in it?", baron("BECAUSE IT'S MINE!")],
      ["That's not an argument.", baron('IT BLOODY WELL IS!')],
      ['Continue', elias('Collective ownership does not necessarily guarantee efficient management, Master Pip. Individual ownership provides clear incentives and accountability.')],
      ['And who holds the Baron accountable?', elias('Ultimately, ze market.')],
      ['Continue', baron('I OWN THE MARKET!', 'pleased')],
      ['Continue', elias('Figuratively speaking, my Lord.')],
      ['Continue', baron('NO, I BOUGHT IT LAST THURSDAY!')],
      ['Continue', elias('Ah. I had forgotten about zat acquisition.')],
      ['So much for accountability.', baron('I BOUGHT THE ACCOUNTANTS TOO!', 'pleased')],
      ['Continue', elias('Yes, my Lord. I am acutely avare.')]
    ],
    [
      ['From each according to his ability, to each according to his needs!', baron('I AGREE ENTIRELY!', 'pleased')],
      ['You do?!', elias('My Lord, I believe Master Pip is quoting Karl Curd.')],
      ['Continue', baron('WHAT?! THEN I DISAGREE ENTIRELY!')],
      ['But you just agreed with the principle!', baron('I THOUGHT YOU WERE TALKING ABOUT ME!')],
      ['How so?', baron('THEY PRODUCE THE MILK ACCORDING TO THEIR ABILITY, AND I DRINK IT ACCORDING TO MY NEEDS!', 'pleased')],
      ['Continue', elias('An admittedly unconventional interpretation.')],
      ["That's the exact opposite of what Curd intended!", baron('THEN CURD SHOULD HAVE WORDED IT BETTER!')],
      ['Continue', elias('I shall make a note of your literary criticism, my Lord.')]
    ],
    [
      ['One day, the proletariat will rise against you!', baron('ELIAS! WILL THEY?!', 'flustered')],
      ['Continue', elias('Highly unlikely, my Lord.')],
      ['Continue', baron('HA! THERE YOU HAVE IT!', 'pleased')],
      ['What makes you so certain?', elias('Ve have undertaken considerable investment in revolutionary prevention.')],
      ['Continue', baron('YES! AND MY SECURITY EXPENDITURE HAS HALVED!', 'pleased')],
      ["Because your guards don't understand Curdism?", baron("THEY DON'T UNDERSTAND—")],
      ['Continue', elias('My Lord!')],
      ['Continue', baron('WHAT?!')],
      ['Continue', elias('Perhaps ve should refrain from discussing confidential personnel matters.')],
      ['Continue', baron('OH! YES! VERY CONFIDENTIAL!', 'flustered')],
      ['What exactly were you about to say?', baron('ELIAS?', 'flustered')],
      ['Continue', elias('His Excellency vas about to comment upon ze excellent political neutrality of our security personnel.')],
      ['Continue', baron('WAS I?', 'flustered')],
      ['Continue', elias('Da, my Lord.')],
      ['Continue', baron('MARVELLOUS!', 'pleased')]
    ],
    [
      ['I agree. Curdism is a dreadful ideology.', baron('HA! YOU SEE, ELIAS?! THE BOY HAS SENSE!', 'pleased')],
      ['Continue', elias('Indeed, my Lord.')],
      ['Private enterprise encourages innovation and economic growth.', baron('PRECISELY!', 'pleased')],
      ['Competition encourages businesses to improve their products.', baron('COMPETITION?!', 'flustered')],
      ['Continue', elias('In principle, my Lord.')],
      ['Continue', baron('I HAD MY COMPETITORS SHUT DOWN!')],
      ['But surely a free market—', baron('WHY WOULD I WANT THAT?!')],
      ['Continue', elias('His Excellency favours a more controlled competitive environment.')],
      ['Continue', baron('I FAVOUR NO COMPETITION WHATSOEVER!')],
      ["I'm beginning to think you don't actually believe in capitalism.", baron('I BELIEVE IN MONEY!', 'pleased')],
      ['Continue', elias("A fair summary of His Excellency's economic philosophy.")],
      ['Continue', baron('AND MILK!', 'pleased')],
      ['Continue', elias('Naturally.')]
    ],
    [
      ['Do you actually know what Curdism is?', baron('OF COURSE I DO!')],
      ['Explain it to me.', baron('ELIAS!')],
      ['No. You explain it.', baron('WELL...', 'flustered')],
      ['Continue', pause],
      ['Continue', baron("IT'S WHEN THE GOVERNMENT TAKES YOUR MILK!")],
      ['And what is capitalism?', baron('WHEN I TAKE YOUR MILK!', 'pleased')],
      ['Continue', pause],
      ['Continue', elias('My Lord, perhaps ve should conclude zis discussion.')],
      ['Continue', baron('DID I WIN?', 'flustered')],
      ['Continue', elias('Decisively, my Lord.')],
      ['Continue', baron('HA! TAKE THAT, CURD!', 'pleased')],
      ['Unbelievable.', {...baron('', 'pleased'), direction: 'Elias disappears.',
        enterAction: 'finishBaronKarlCurd'}]
    ]
  ];

  const topic = exchange([
    ['What do you think of Karl Curd?', baron('CURD?! THAT FILTHY LITTLE RED!')],
    ["You've read his work?", baron('I HAD IT READ TO ME!')],
    ['And what did you disagree with?', baron('ALL OF IT!')],
    ['Anything in particular?', baron('THE COMMUNISM!')],
    ['Yes, but which of his arguments?', baron('ELIAS!')],
    ['Continue', elias('You summoned me, my Lord?', 'Elias appears.')],
    ['Continue', baron('EXPLAIN WHY CURD IS AN IDIOT!')],
    ['Continue', elias('Vith pleasure, my Lord.')]
  ], branches.map((steps, index) => exchange(steps, index === 6 ? ending.next.replies : [ending])));
  return {...topic, once: 'baronKarlCurd', requiresDisposition: 'communist'};
}
