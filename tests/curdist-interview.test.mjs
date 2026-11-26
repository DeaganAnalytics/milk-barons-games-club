import assert from 'node:assert/strict';
import test from 'node:test';
import {applyCurdistChoice, classifyCurdistDimension, createCurdistAssessment, curdistAssessmentLines, generateCurdistAssessment} from '../src/curdist-assessment.mjs';
import {createProfessorInterview} from '../src/professor-interview.mjs';

const answered = {curdist: true, seducedExecutive: false, seenDj: false, spokeToMilo: false};
const starts = [
  'How anthropologically fascinating!',
  'The Professor produces a notebook.',
  'Question two.',
  'Word association has produced',
  'Thirsty work, young man.',
  'Question four.',
  'Let us examine your understanding',
  'Now, let us examine your educational background.'
];

function interviewStart(flags = answered) {
  const interview = createProfessorInterview();
  const node = interview.option(flags).next();
  return {interview, node};
}

function choose(interview, node, id) {
  const reply = id ? node.replies.find(option => option.curdistChoice === id || option.label === id) : node.replies[0];
  assert.ok(reply, id);
  if (reply.curdistChoice) interview.score(reply.curdistChoice);
  if (typeof reply.next === 'function') return reply.next();
  return reply.next;
}

function advance(interview, node) {
  for (let count = 0; count < 200 && node.replies.length === 1 && !node.replies[0].curdistChoice && !node.action; count++) {
    node = choose(interview, node);
  }
  return node;
}

function walk(interview, node, ...ids) {
  for (const id of ids) node = advance(interview, choose(interview, advance(interview, node), id));
  return node;
}

test('interview eligibility and completion are per playthrough and assessment is available even when skipped', () => {
  const interview = createProfessorInterview();
  assert.equal(interview.option({curdist: false}), null);
  const option = interview.option(answered);
  assert.equal(option.label, 'What do you think of Karl Curd?');
  const node = walk(interview, option.next(), 'OPEN_B', 'Q1_2', 'Q2_B', 'Q2_B2', 'Q3_C', 'MILK_A', 'Q4_C', 'Q5_D', 'Q6_F', 'Q6_F4');
  assert.equal(interview.assessment.results.E.classification, 'stronglyCapitalist');
  assert.notEqual(interview.assessment.results.D.classification, 'submissive');
  const original = interview.assessment.results;
  const assessment = choose(interview, node, 'How did I do?');
  const text = [];
  let step = assessment;
  while (step.replies.length === 1) {
    text.push(step.text);
    step = choose(interview, step);
  }
  assert.deepEqual(text.slice(4, -1), curdistAssessmentLines(original));
  const skipped = walk(interview, node, 'Can I go now?');
  assert.deepEqual(skipped.replies, step.replies);
  for (const reply of skipped.replies) {
    const end = walk(interview, skipped, reply.label);
    assert.equal(end.replies[0].next.exitAction, 'completeCurdistInterview');
  }
  interview.complete();
  assert.equal(interview.assessment.completed, true);
  assert.equal(interview.assessment.results, original);
  assert.equal(interview.option(answered), null);
  assert.ok(createProfessorInterview().option(answered));
});

test('conditional cameos and alternatives follow the existing encounter flags', () => {
  for (const flag of [false, true]) {
    const {interview, node} = interviewStart({...answered, seducedExecutive: flag, seenDj: flag, spokeToMilo: flag});
    const personal = walk(interview, node, 'OPEN_C', 'Q1_4');
    const ids = personal.replies.map(reply => reply.curdistChoice);
    assert.equal(ids.includes('Q1_4G'), flag);
    assert.equal(ids.includes('Q1_4E'), !flag);
    assert.equal(ids.includes('Q1_4F'), !flag);

    const goat = walk(interview, personal, 'Q1_4A', 'Q2_D', 'Q2_D1', 'Q2_D4B');
    assert.equal(goat.replies[0].next, goat.replies[1].next);
    let next = choose(interview, goat, 'Q2_GOAT_A');
    const speakers = [];
    if (!flag) assert.equal(next.replies[0].label, 'Continue');
    let sawPipResponse = false;
    while (next.replies.length === 1 && !next.replies[0].curdistChoice) {
      sawPipResponse ||= next.replies[0].label === 'You mean black people?';
      speakers.push(next.character);
      next = choose(interview, next);
    }
    assert.equal(speakers.includes('dj'), !flag);
    assert.ok(sawPipResponse);
    assert.equal(next.character, undefined);
    const pretty = walk(interview, next, 'Q3_D');
    assert.equal(pretty.replies.some(reply => reply.curdistChoice === 'Q3_D2'), flag);
    const milo = walk(interview, pretty, flag ? 'Q3_D2' : 'Q3_D1', 'MILK_C', 'Q4_E', 'Q5_F', 'Q6_C');
    assert.equal(milo.replies.some(reply => reply.curdistChoice === 'Q6_C2'), flag);
  }
});

test('curriculum traversal proves every surviving choice advances and identifies attainable assessment bands', () => {
  const reachable = Object.fromEntries(['E', 'D', 'S', 'M'].map(dimension => [dimension, new Set()]));
  let maximumCoins = 0;
  for (const seducedExecutive of [false, true]) {
    const {node} = interviewStart({...answered, seducedExecutive, spokeToMilo: seducedExecutive, seenDj: seducedExecutive});
    let sectionNode = node;
    let scoreStates = Array.from({length: 4}, () => new Map([['0,0', [0, 0]]]));
    let reward = 0;
    for (const [index, start] of starts.entries()) {
      assert.ok((sectionNode.direction ?? sectionNode.text).startsWith(start));
      if (index === 1) assert.equal(sectionNode.mood, 'notebook');
      const paths = [];
      const destinations = new Set();
      const deaths = new Set();
      function explore(current, assessment, actions, visited) {
        assert.ok(!visited.has(current), 'dialogue contains a loop');
        if (typeof current === 'function' || (current.direction ?? current.text)?.startsWith(starts[index + 1])) {
          destinations.add(current);
          paths.push({assessment, actions});
          return;
        }
        if (current.action === 'curdistInterviewDeath') {
          deaths.add(current);
          assert.equal(index, 1);
          assert.deepEqual(actions, []);
          assert.equal(assessment.results, null);
          return;
        }
        assert.notEqual(current.speaker, 'Pip', 'Pip lines should be response buttons');
        assert.ok(current.mustContinue);
        assert.ok(current.replies?.length, 'unexpected dead end');
        const nextActions = current.enterAction ? [...actions, current.enterAction] : actions;
        const path = new Set([...visited, current]);
        for (const reply of current.replies) {
          const branch = reply.curdistChoice ? structuredClone(assessment) : assessment;
          if (reply.curdistChoice) applyCurdistChoice(branch, reply.curdistChoice);
          explore(reply.next, branch, nextActions, path);
        }
      }
      explore(sectionNode, createCurdistAssessment(), [], new Set());
      assert.equal(destinations.size, 1);
      assert.equal(deaths.size, index === 1 ? 2 : 0);
      [sectionNode] = destinations;
      reward += Math.max(...paths.map(({actions}) => {
        assert.ok(actions.length <= 1);
        const credits = {curdistCompensation: 5, curdistCoercedCompensation: 3, curdistWorkerReward: 10, curdistMilk: 0};
        return actions.reduce((sum, action) => {
          assert.ok(Object.hasOwn(credits, action));
          return sum + credits[action];
        }, 0);
      }));
      scoreStates = scoreStates.map((states, dimension) => {
        const outcomes = new Map();
        for (const {assessment} of paths) {
          const section = Object.values(assessment.sections)[index];
          for (const [total, evidence] of states.values()) {
            const pair = [total + Math.max(-2, Math.min(2, section.scores[dimension])), evidence + Number(section.evidence[dimension])];
            outcomes.set(pair.join(), pair);
          }
        }
        return outcomes;
      });
    }
    maximumCoins = Math.max(maximumCoins, reward);
    for (const [index, dimension] of ['E', 'D', 'S', 'M'].entries()) {
      for (const [total, count] of scoreStates[index].values()) {
        const score = count ? 100 * total / (2 * count) : 0;
        assert.ok(Math.abs(score) <= 100);
        reachable[dimension].add(classifyCurdistDimension(dimension, score, count));
      }
    }
  }
  assert.equal(maximumCoins, 15);
  assert.deepEqual(reachable, {
    E: new Set(['stronglyCurdist', 'moderatelyCurdist', 'neutral', 'moderatelyCapitalist', 'stronglyCapitalist', 'insufficient']),
    D: new Set(['defiant', 'moderate', 'submissive', 'insufficient']),
    S: new Set(['moderate', 'sceptical', 'insufficient']),
    M: new Set(['peaceful', 'moderate', 'militant', 'insufficient'])
  });
});

test('scoring records cancellation as evidence, clamps each section and freezes results', () => {
  const assessment = createCurdistAssessment();
  assert.ok(Object.values(assessment.sections).every(section => section.scores.every(score => score === 0)));
  for (const id of ['OPEN_D', 'Q1_1D', 'Q2_D', 'Q2_D3', 'Q5_D', 'Q6_A', 'Q1_1D']) applyCurdistChoice(assessment, id);
  const result = generateCurdistAssessment(assessment);
  assert.deepEqual(result.E, {score: -60, evidenceCount: 5, classification: 'stronglyCurdist'});
  applyCurdistChoice(assessment, 'MILK_D');
  assert.equal(generateCurdistAssessment(assessment), result);
  assert.equal(assessment.scoredChoices.has('MILK_D'), false);
  const cancellation = createCurdistAssessment();
  for (const id of ['OPEN_B', 'Q1_1B', 'Q1_COMMON_D']) applyCurdistChoice(cancellation, id);
  assert.deepEqual(generateCurdistAssessment(cancellation).S, {score: 25, evidenceCount: 2, classification: 'moderate'});
  assert.equal(generateCurdistAssessment(cancellation).M.score, 0);
  assert.equal(generateCurdistAssessment(cancellation).M.classification, 'insufficient');

  for (const [score, label] of [[-60, 'stronglyCurdist'], [-59.999, 'moderatelyCurdist'], [-25, 'moderatelyCurdist'],
    [-24.999, 'neutral'], [24.999, 'neutral'], [25, 'moderatelyCapitalist'], [59.999, 'moderatelyCapitalist'], [60, 'stronglyCapitalist']]) {
    assert.equal(classifyCurdistDimension('E', score, 2), label);
    assert.equal(classifyCurdistDimension('E', score, 1), 'insufficient');
  }
  for (const [dimension, low, high] of [['D', 'defiant', 'submissive'], ['S', 'gullible', 'sceptical'], ['M', 'peaceful', 'militant']]) {
    for (const [score, label] of [[-35, low], [-34.999, 'moderate'], [34.999, 'moderate'], [35, high]]) {
      assert.equal(classifyCurdistDimension(dimension, score, 2), label);
    }
  }
});

test('interview effect keys reject duplicate rewards including alternative compensation', () => {
  const {interview} = interviewStart();
  assert.equal(interview.applyEffect('curdistCoercedCompensation'), true);
  assert.equal(interview.applyEffect('curdistCompensation'), false);
  for (const effect of ['curdistWorkerReward', 'curdistMilk']) {
    assert.equal(interview.applyEffect(effect), true);
    assert.equal(interview.applyEffect(effect), false);
  }
});
