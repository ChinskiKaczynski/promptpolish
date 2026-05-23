import { describe, expect, it } from 'vitest'
import { calculateScore, type CriterionScoreInput } from '@/lib/scoring/calculate-score'
import { assertScoringWeightsSumTo100, scoringCriteria } from '@/lib/scoring/scoring-config'

function generateScores(rawScore: number): CriterionScoreInput[] {
  return scoringCriteria.map((criterion) => ({
    criterion,
    raw_score_0_10: rawScore
  }))
}

describe('calculateScore - Deterministic Backend Scoring', () => {
  
  it('verifies that all scoring criteria weights sum to exactly 100', () => {
    // This assertion should run without throwing any exceptions
    expect(() => assertScoringWeightsSumTo100()).not.toThrow()
  })

  it('calculates low quality case (weak score level)', () => {
    const scores = generateScores(3) // All criteria score 3
    const result = calculateScore(scores)
    
    expect(result.overallScore).toBe(30)
    expect(result.scoreLevel).toBe('weak') // 0-39 range
  })

  it('calculates medium-low quality case (needs_work score level)', () => {
    const scores = generateScores(5) // All criteria score 5
    const result = calculateScore(scores)
    
    expect(result.overallScore).toBe(50)
    expect(result.scoreLevel).toBe('needs_work') // 40-59 range
  })

  it('calculates medium quality case (decent score level)', () => {
    const scores = generateScores(6) // All criteria score 6
    const result = calculateScore(scores)
    
    expect(result.overallScore).toBe(60)
    expect(result.scoreLevel).toBe('decent') // 60-74 range
  })

  it('calculates mixed medium quality case (decent score level)', () => {
    // Mixed scores designed to sum to a weighted total of 682, yielding an overallScore of 68
    const mixedScores: CriterionScoreInput[] = [
      { criterion: 'goal_clarity', raw_score_0_10: 8 },         // weight 15 -> 120
      { criterion: 'context_completeness', raw_score_0_10: 7 }, // weight 12 -> 84
      { criterion: 'structure', raw_score_0_10: 7 },            // weight 10 -> 70
      { criterion: 'constraints', raw_score_0_10: 6 },          // weight 10 -> 60
      { criterion: 'output_format', raw_score_0_10: 5 },         // weight 12 -> 60
      { criterion: 'model_profile_fit', raw_score_0_10: 7 },     // weight 10 -> 70
      { criterion: 'resistance_to_misinterpretation', raw_score_0_10: 7 }, // weight 10 -> 70
      { criterion: 'cost_efficiency', raw_score_0_10: 7 },       // weight 6  -> 42
      { criterion: 'safety', raw_score_0_10: 8 },                // weight 8  -> 64
      { criterion: 'testability', raw_score_0_10: 6 }            // weight 7  -> 42
    ]
    
    const result = calculateScore(mixedScores)
    expect(result.overallScore).toBe(68)
    expect(result.scoreLevel).toBe('decent')
  })

  it('calculates high-medium quality case (strong score level)', () => {
    const scores = generateScores(8) // All criteria score 8
    const result = calculateScore(scores)
    
    expect(result.overallScore).toBe(80)
    expect(result.scoreLevel).toBe('strong') // 75-89 range
  })

  it('calculates high quality case (excellent score level)', () => {
    const scores = generateScores(9) // All criteria score 9
    const result = calculateScore(scores)
    
    expect(result.overallScore).toBe(90)
    expect(result.scoreLevel).toBe('excellent') // 90-100 range
  })

  it('clamps excessive raw scores (> 10) downwards to 10', () => {
    const scores = generateScores(15) // Over the maximum of 10
    const result = calculateScore(scores)
    
    expect(result.overallScore).toBe(100)
    expect(result.scoreLevel).toBe('excellent')
  })

  it('clamps negative raw scores (< 0) upwards to 0', () => {
    const scores = generateScores(-5) // Under the minimum of 0
    const result = calculateScore(scores)
    
    expect(result.overallScore).toBe(0)
    expect(result.scoreLevel).toBe('weak')
  })

  it('fails with a descriptive exception when a required criterion is missing', () => {
    // Generate scores but filter out 'goal_clarity'
    const incompleteScores = generateScores(7).filter(
      (s) => s.criterion !== 'goal_clarity'
    )
    
    expect(() => calculateScore(incompleteScores)).toThrow(
      /Missing criterion score: goal_clarity/
    )
  })

  it('returns the correct static scoring_version matching configuration metadata', () => {
    const result = calculateScore(generateScores(8))
    expect(result.scoringVersion).toBe('1.0.0')
  })
  
})
