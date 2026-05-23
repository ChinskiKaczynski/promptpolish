import { assertScoringWeightsSumTo100, scoringCriteria, scoringWeights, type ScoringCriterion, SCORING_VERSION } from './scoring-config'
import { getScoreLevel } from './score-level'

export type CriterionScoreInput = {
  criterion: ScoringCriterion
  raw_score_0_10: number
}

export type CalculatedScore = {
  overallScore: number
  scoreLevel: ReturnType<typeof getScoreLevel>
  scoringVersion: string
}

export function calculateScore(scores: CriterionScoreInput[]): CalculatedScore {
  assertScoringWeightsSumTo100()
  const scoreMap = new Map(scores.map((score) => [score.criterion, score.raw_score_0_10]))

  for (const criterion of scoringCriteria) {
    if (!scoreMap.has(criterion)) {
      throw new Error(`Missing criterion score: ${criterion}`)
    }
  }

  const weighted = scoringCriteria.reduce((total, criterion) => {
    const raw = clamp(scoreMap.get(criterion) ?? 0, 0, 10)
    return total + raw * scoringWeights[criterion]
  }, 0)

  const overallScore = clamp(Math.round(weighted / 10), 0, 100)

  return {
    overallScore,
    scoreLevel: getScoreLevel(overallScore),
    scoringVersion: SCORING_VERSION
  }
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}
