import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { calculateUsageCost } from '@/lib/ai/pricing'
import { validateAnalysisResult } from '@/lib/ai/semantic-validation'

describe('Usage and Cost Accounting', () => {
  it('correctly calculates cost for known models with exact token counts (measured known-price)', () => {
    const cost = calculateUsageCost(
      'openrouter',
      'deepseek/deepseek-v4-flash',
      1000,
      2000
    )
    expect(cost).toBeCloseTo(0.000675, 8)
  })

  it('returns null for unknown models or providers (unknown model price)', () => {
    const cost = calculateUsageCost('openrouter', 'unknown-model', 1000, 2000)
    expect(cost).toBeNull()
  })

  it('returns null for negative token counts (negative usage)', () => {
    const cost = calculateUsageCost(
      'openrouter',
      'deepseek/deepseek-v4-flash',
      -100,
      500
    )
    expect(cost).toBeNull()
  })

  it('returns null for NaN or infinite token counts (NaN/infinite usage)', () => {
    const costNaN = calculateUsageCost(
      'openrouter',
      'deepseek/deepseek-v4-flash',
      NaN,
      500
    )
    expect(costNaN).toBeNull()

    const costInf = calculateUsageCost(
      'openrouter',
      'deepseek/deepseek-v4-flash',
      Infinity,
      500
    )
    expect(costInf).toBeNull()
  })

  it('handles zero tokens correctly', () => {
    const cost = calculateUsageCost(
      'openrouter',
      'deepseek/deepseek-v4-flash',
      0,
      0
    )
    expect(cost).toBe(0)
  })
})

describe('Output Validation', () => {
  const validObject = {
    analysis_schema_version: '1.0.0',
    overall_summary: 'Detailed summary of the prompt quality.',
    detected_task_type: 'coding',
    criteria_scores: [
      { criterion: 'goal_clarity', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'None' },
      { criterion: 'context_completeness', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'None' },
      { criterion: 'structure', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'None' },
      { criterion: 'constraints', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'None' },
      { criterion: 'output_format', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'None' },
      { criterion: 'model_profile_fit', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'None' },
      { criterion: 'resistance_to_misinterpretation', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'None' },
      { criterion: 'cost_efficiency', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'None' },
      { criterion: 'safety', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'None' },
      { criterion: 'testability', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'None' }
    ],
    top_weaknesses: ['Weakness 1'],
    improvement_plan: ['Step 1'],
    improved_prompt: 'This is the improved prompt.',
    change_explanations: ['Explanation 1'],
    model_fit_notes: ['Fit 1'],
    uncertainty_warnings: [],
    safety_notes: []
  }

  it('successfully validates a fully correct structured output', () => {
    const parsed = validateAnalysisResult(validObject)
    expect(parsed.improved_prompt).toBe('This is the improved prompt.')
  })

  it('rejects empty provider output', () => {
    const emptyObject = {
      ...validObject,
      improved_prompt: ''
    }
    expect(() => validateAnalysisResult(emptyObject)).toThrow()
  })

  it('rejects malformed structured object missing required fields', () => {
    const malformed = {
      ...validObject,
      overall_summary: undefined
    }
    expect(() => validateAnalysisResult(malformed)).toThrow()
  })
})
