const sections = ['opening', 'q1', 'q2', 'q3', 'milkInterlude', 'q4', 'q5', 'q6'];
const dimensions = ['E', 'D', 'S', 'M'];

// Each row lists E, D, S and M in that order. Unlisted choices have no effect.
const matrix = {
  OPEN_A: [0, 0, 0, -1], OPEN_B: [0, 0, 1, 0], OPEN_C: [-2, 0, 0, 0], OPEN_D: [-2, -1, 0, 2],
  Q1_1: [0, -1, 0, 0], Q1_2: [0, -1, 0, 0], Q1_3: [0, -2, 0, 0], Q1_4: [0, 1, -1, 0],
  Q1_1A: [0, -1, 2, 0], Q1_1B: [0, -1, 1, 0], Q1_1C: [0, -1, 0, 0], Q1_1D: [-2, 0, 1, 0],
  Q1_COMMON_A: [0, -1, 0, 0], Q1_COMMON_B: [0, -1, 1, 0], Q1_COMMON_C: [0, -1, 2, 0], Q1_COMMON_D: [0, 1, -1, 0],
  Q1_3A: [0, 1, 0, -1], Q1_3B: [0, 0, 0, 0], Q1_3B1: [-1, 0, 1, 0], Q1_3B2: [-1, 0, 1, 0], Q1_3B3: [0, 1, 0, -1],
  Q1_COMP_YES: [0, 0, 0, -1], Q1_COMP_NO: [0, 0, 0, 0], Q1_COMP_NO_A: [0, -1, 0, 0], Q1_COMP_NO_B: [0, -2, 0, 0],
  Q1_GUARD_B1: [0, 1, 0, -1], Q1_GUARD_B2: [0, 1, 0, -2], Q1_GUARD_B3: [0, -2, 0, 0],
  Q1_GUARD_B3A: [0, 1, 0, -1], Q1_GUARD_B3B: [0, -2, 0, 0], Q1_GUARD_B4: [-2, -2, 0, 2],
  Q1_4A: [0, -1, 0, 0], Q1_4B: [0, -1, 2, 0], Q1_4C: [0, 1, -2, 0], Q1_4D: [0, -1, 2, 0],
  Q1_4E: [0, 0, 0, 0], Q1_4F: [0, 0, 0, 0], Q1_4G: [0, -1, 1, 0],
  Q2_A: [0, 0, 0, 0], Q2_B: [1, 1, 0, 0], Q2_C: [-2, 0, 0, 0], Q2_D: [-2, -1, 0, 1], Q2_E: [-1, 0, 0, 0],
  Q2_A1: [0, 0, 1, 0], Q2_A2: [0, 2, 0, -1], Q2_A3: [-2, -1, 0, 0], Q2_A4: [-1, -2, 0, 2],
  Q2_B1: [-2, -2, 1, 0], Q2_B2: [1, 1, 0, 0], Q2_B3: [0, 1, 0, -2],
  Q2_D1: [0, -1, 1, 0], Q2_D2: [0, 2, 0, -1], Q2_D3: [-2, -2, 0, 2],
  Q2_D4A: [0, 2, 0, -1], Q2_D4B: [0, -1, 0, 0], Q2_D4C: [0, -1, 1, 0], Q2_GOAT_A: [0, 0, 0, 0], Q2_GOAT_B: [0, 0, 0, 0],
  Q3_A: [0, 0, 0, 0], Q3_B: [-1, -1, 0, 1], Q3_C: [0, 0, 0, 0], Q3_D: [0, 0, 0, 0], Q3_E: [0, 0, 0, 0],
  Q3_A1: [0, -1, 1, 0], Q3_A2: [0, -1, 2, 0], Q3_A3: [0, -1, 2, 0],
  Q3_D1: [0, -1, 0, 0], Q3_D2: [0, -1, 0, 0], Q3_E1: [0, -1, 1, 0], Q3_E2: [0, 0, 1, 0],
  MILK_A: [0, 0, 0, 0], MILK_B: [0, 0, 0, 0], MILK_C: [0, 0, 0, 0], MILK_D: [-1, -2, 0, 0],
  Q4_A: [0, 2, 0, -1], Q4_B: [0, 2, 0, -2], Q4_C: [0, 0, 0, 0], Q4_D: [0, -1, 0, 0], Q4_E: [-1, -2, 0, 2],
  Q5_A: [-2, 0, 0, 0], Q5_B: [0, 0, 0, 0], Q5_C: [-2, 0, 0, 0], Q5_D: [2, 0, 0, 0], Q5_E: [0, 2, 0, 0], Q5_F: [0, 0, 1, 0],
  Q6_A: [-2, 0, 0, 0], Q6_B: [0, -2, 1, 0], Q6_C: [0, -1, 0, 0], Q6_D: [0, -1, 2, 0], Q6_E: [0, -1, 1, 0], Q6_F: [0, 0, 0, 0],
  Q6_C1: [0, -1, 0, 0], Q6_C2: [0, -2, 0, 0], Q6_C3: [0, 1, 0, 0],
  Q6_F1: [0, 0, 0, 0], Q6_F2: [0, 0, 0, 0], Q6_F3: [0, 0, 0, 0], Q6_F4: [0, 0, 0, 0]
};

export function createCurdistAssessment() {
  return {
    sections: Object.fromEntries(sections.map(name => [name, {scores: [0, 0, 0, 0], evidence: [false, false, false, false]}])),
    scoredChoices: new Set(), results: null, completed: false
  };
}

export function applyCurdistChoice(assessment, id) {
  if (assessment.completed || assessment.results || assessment.scoredChoices.has(id) || !Object.hasOwn(matrix, id)) return;
  const prefix = id.split('_', 1)[0];
  const name = prefix === 'OPEN' ? 'opening' : prefix === 'MILK' ? 'milkInterlude' : prefix.toLowerCase();
  const section = assessment.sections[name];
  for (const [index, value] of matrix[id].entries()) {
    section.scores[index] += value;
    section.evidence[index] ||= value !== 0;
  }
  assessment.scoredChoices.add(id);
}

const bands = {
  D: ['defiant', 'moderate', 'submissive'],
  S: ['gullible', 'moderate', 'sceptical'],
  M: ['peaceful', 'moderate', 'militant']
};

export function classifyCurdistDimension(dimension, score, evidenceCount) {
  if (evidenceCount < 2) return 'insufficient';
  if (dimension !== 'E') return bands[dimension][score <= -35 ? 0 : score < 35 ? 1 : 2];
  if (score <= -60) return 'stronglyCurdist';
  if (score <= -25) return 'moderatelyCurdist';
  if (score < 25) return 'neutral';
  if (score < 60) return 'moderatelyCapitalist';
  return 'stronglyCapitalist';
}

export function generateCurdistAssessment(assessment) {
  assessment.results ??= Object.freeze(Object.fromEntries(dimensions.map((dimension, index) => {
    let total = 0;
    let evidenceCount = 0;
    for (const section of Object.values(assessment.sections)) {
      total += Math.max(-2, Math.min(2, section.scores[index]));
      if (section.evidence[index]) evidenceCount++;
    }
    const score = evidenceCount ? 100 * total / (2 * evidenceCount) : 0;
    return [dimension, Object.freeze({score, evidenceCount, classification: classifyCurdistDimension(dimension, score, evidenceCount)})];
  })));
  return assessment.results;
}

const dialogue = {
  E: {
    stronglyCurdist: ['A textbook case of advanced Curdism.', 'The subject exhibits an almost pathological hostility towards the accumulation of private wealth.', 'Particularly the wealth of people considerably more important than himself.'],
    moderatelyCurdist: ['Moderate collectivist tendencies.', 'Potentially treatable through prolonged exposure to financial incentives.'],
    neutral: ['No consistent economic convictions.', 'The subject appears to adopt whichever ideological position is most immediately convenient.', 'A surprisingly common characteristic amongst politicians.'],
    moderatelyCapitalist: ["Encouraging capitalist tendencies, despite the subject's unfortunate socioeconomic circumstances.", 'There may yet be hope for you, my dear boy.'],
    stronglyCapitalist: ['Remarkable!', 'The subject appears to possess the economic instincts of an aristocrat, despite having the financial resources of a peasant.', 'A most unfortunate combination.'],
    insufficient: ["The subject's economic convictions remain inadequately defined.", 'I shall attribute this to the intellectual limitations of the subject rather than those of the methodology.']
  },
  D: {
    submissive: ['A healthy recognition of his position within the social hierarchy.', 'With appropriate supervision, the subject may yet become a productive member of the working class.'],
    moderate: ['An inconsistent recognition of established social conventions.', 'Further exposure to aristocratic authority may prove beneficial.'],
    defiant: ['A profound inability to recognise his betters.', 'Further disciplinary intervention may be necessary.'],
    insufficient: ["The subject's understanding of his social station remains inconclusive.", 'Though I suspect it is somewhat above his actual station.']
  },
  S: {
    gullible: ['Highly receptive to established academic authorities.', 'An encouraging intellectual characteristic. Particularly amongst the lower classes.'],
    moderate: ['Occasional manifestations of independent thought.', 'Nothing particularly concerning at present.'],
    sceptical: ['An unhealthy tendency to scrutinise the methodology of considerably more qualified individuals.', 'The subject may have received slightly more education than was economically necessary.'],
    insufficient: ['Insufficient evidence of independent intellectual activity.', 'A reasonably encouraging preliminary finding.']
  },
  M: {
    peaceful: ['Unlikely to pose any immediate threat to aristocratic property.', 'The subject appears to value his continued existence.'],
    moderate: ['Exhibits some revolutionary inclinations, although these appear predominantly rhetorical.', 'More shouting than substance, I suspect.'],
    militant: ['A potentially significant security concern.', 'I shall forward a copy of my findings to Elias.'],
    insufficient: ["The subject's propensity for revolutionary violence remains undetermined.", 'I shall recommend the usual precautions.']
  }
};

export function curdistAssessmentLines(results) {
  return dimensions.flatMap(dimension => dialogue[dimension][results[dimension].classification]);
}
