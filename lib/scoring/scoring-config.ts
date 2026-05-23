export const SCORING_VERSION = '1.0.0'

export const scoringWeights = {
  goal_clarity: 15,
  context_completeness: 12,
  structure: 10,
  constraints: 10,
  output_format: 12,
  model_profile_fit: 10,
  resistance_to_misinterpretation: 10,
  cost_efficiency: 6,
  safety: 8,
  testability: 7
} as const

export type ScoringCriterion = keyof typeof scoringWeights

export const scoringCriteria = Object.keys(scoringWeights) as ScoringCriterion[]

export function assertScoringWeightsSumTo100() {
  const sum = Object.values(scoringWeights).reduce((total, weight) => total + weight, 0)
  if (sum !== 100) {
    throw new Error(`Scoring weights must sum to 100, got ${sum}`)
  }
}
