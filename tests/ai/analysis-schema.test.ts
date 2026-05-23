import { describe, expect, it } from 'vitest'
import { validateAnalysisResult, SemanticValidationError } from '@/lib/ai/semantic-validation'
import { mockAnalysisResult } from '@/lib/ai/mock-analysis'
import { analysisSchemaVersion } from '@/lib/ai/schemas'

describe('AI Analysis Schema & Semantic Validation', () => {
  it('successfully validates a completely valid AnalysisResult fixture', () => {
    // mockAnalysisResult contains a valid schema version, correct types,
    // all 10 required scoring criteria exactly once, and a non-empty improved prompt.
    expect(() => validateAnalysisResult(mockAnalysisResult)).not.toThrow()
    
    const validated = validateAnalysisResult(mockAnalysisResult)
    expect(validated.analysis_schema_version).toBe(analysisSchemaVersion)
    expect(validated.criteria_scores).toHaveLength(10)
    expect(validated.improved_prompt.length).toBeGreaterThan(0)
  })

  it('rejects an invalid structure with Zod schema errors', () => {
    const invalidObj = {
      // Missing overall_summary, detected_task_type, criteria_scores, etc.
      analysis_schema_version: '1.0.0',
      improved_prompt: 'Test prompt'
    }

    expect(() => validateAnalysisResult(invalidObj)).toThrow(SemanticValidationError)

    try {
      validateAnalysisResult(invalidObj)
    } catch (err) {
      const semErr = err as SemanticValidationError
      expect(semErr.errors).toBeDefined()
      // Check that it flags missing overall_summary
      const paths = semErr.errors.map((e) => e.path)
      expect(paths).toContain('overall_summary')
      expect(paths).toContain('detected_task_type')
    }
  })

  it('rejects a missing scoring criterion', () => {
    // Clone valid result and remove goal_clarity
    const incompleteScores = mockAnalysisResult.criteria_scores.filter(
      (item) => item.criterion !== 'goal_clarity'
    )
    const invalidResult = {
      ...mockAnalysisResult,
      criteria_scores: incompleteScores
    }

    expect(() => validateAnalysisResult(invalidResult)).toThrow(SemanticValidationError)

    try {
      validateAnalysisResult(invalidResult)
    } catch (err) {
      const semErr = err as SemanticValidationError
      const missingMsg = semErr.errors.find((e) => e.message.includes('Missing scoring criterion: goal_clarity'))
      expect(missingMsg).toBeDefined()
    }
  })

  it('rejects a duplicate scoring criterion', () => {
    // Clone valid result and duplicate goal_clarity
    const goalClarityItem = mockAnalysisResult.criteria_scores.find(
      (item) => item.criterion === 'goal_clarity'
    )
    
    expect(goalClarityItem).toBeDefined()

    const duplicateScores = [...mockAnalysisResult.criteria_scores, goalClarityItem!]
    const invalidResult = {
      ...mockAnalysisResult,
      criteria_scores: duplicateScores
    }

    expect(() => validateAnalysisResult(invalidResult)).toThrow(SemanticValidationError)

    try {
      validateAnalysisResult(invalidResult)
    } catch (err) {
      const semErr = err as SemanticValidationError
      const duplicateMsg = semErr.errors.find((e) => e.path.startsWith('criteria_scores.'))
      expect(duplicateMsg).toBeDefined()
      expect(duplicateMsg?.message).toContain('Duplicate scoring criterion: goal_clarity')
    }
  })

  it('rejects an empty improved_prompt', () => {
    const invalidResult = {
      ...mockAnalysisResult,
      improved_prompt: ''
    }

    expect(() => validateAnalysisResult(invalidResult)).toThrow(SemanticValidationError)

    try {
      validateAnalysisResult(invalidResult)
    } catch (err) {
      const semErr = err as SemanticValidationError
      const promptMsg = semErr.errors.find(
        (e) => e.path === 'improved_prompt' && e.message.includes('cannot be empty or only whitespace')
      )
      expect(promptMsg).toBeDefined()
    }
  })

  it('rejects a whitespace-only improved_prompt', () => {
    const invalidResult = {
      ...mockAnalysisResult,
      improved_prompt: '     \n    \t  '
    }

    expect(() => validateAnalysisResult(invalidResult)).toThrow(SemanticValidationError)

    try {
      validateAnalysisResult(invalidResult)
    } catch (err) {
      const semErr = err as SemanticValidationError
      const promptMsg = semErr.errors.find((e) => e.path === 'improved_prompt')
      expect(promptMsg).toBeDefined()
      expect(promptMsg?.message).toContain('cannot be empty or only whitespace')
    }
  })
})
