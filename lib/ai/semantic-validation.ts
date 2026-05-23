import { type AnalysisResult, analysisResultSchema } from './schemas'
import { scoringCriteria } from '@/lib/scoring/scoring-config'

export interface ValidationErrorDetail {
  path: string
  message: string
}

export class SemanticValidationError extends Error {
  public errors: ValidationErrorDetail[]

  constructor(errors: ValidationErrorDetail[]) {
    const formattedErrors = errors
      .map((e) => `[${e.path}]: ${e.message}`)
      .join('\n')
    super(`Semantic validation failed:\n${formattedErrors}`)
    this.errors = errors
    this.name = 'SemanticValidationError'
    Object.setPrototypeOf(this, SemanticValidationError.prototype)
  }
}

/**
 * Validates raw AI output or mock data against the production structured schema.
 * Enforces both the static Zod constraints and the dynamic semantic rules:
 * 1. Basic type/structural validation via Zod analysisResultSchema.
 * 2. Complete coverage of all 10 scoring criteria with no duplicates or omissions.
 * 3. A non-empty, non-whitespace-only improved prompt.
 *
 * @param data The input object to validate.
 * @returns The parsed and fully typed AnalysisResult.
 * @throws SemanticValidationError containing all validation failure details.
 */
export function validateAnalysisResult(data: unknown): AnalysisResult {
  const errors: ValidationErrorDetail[] = []

  // 1. Zod Basic Schema Validation
  const result = analysisResultSchema.safeParse(data)
  if (!result.success) {
    const zodErrors = result.error.issues.map((err) => ({
      path: err.path.join('.') || 'root',
      message: err.message
    }))
    errors.push(...zodErrors)
  }

  // If Zod fails, we still do some analysis to report maximum context to the developer
  const parsedData = result.success ? result.data : (data as Partial<AnalysisResult> | null)

  if (parsedData && typeof parsedData === 'object') {
    // 2. Semantic check: Non-empty improved_prompt
    if (
      typeof parsedData.improved_prompt !== 'string' ||
      parsedData.improved_prompt.trim().length === 0
    ) {
      errors.push({
        path: 'improved_prompt',
        message: 'Improved prompt cannot be empty or only whitespace.'
      })
    }

    // 3. Semantic check: Complete and unique criteria_scores
    const criteriaScores = parsedData.criteria_scores
    if (Array.isArray(criteriaScores)) {
      const seenCriteria = new Set<string>()

      for (let i = 0; i < criteriaScores.length; i++) {
        const item = criteriaScores[i]
        if (item && typeof item === 'object' && 'criterion' in item) {
          const criterion = item.criterion as string
          if (seenCriteria.has(criterion)) {
            errors.push({
              path: `criteria_scores.${i}.criterion`,
              message: `Duplicate scoring criterion: ${criterion}`
            })
          }
          seenCriteria.add(criterion)
        }
      }

      // Check for missing criteria from the global list
      for (const criterion of scoringCriteria) {
        if (!seenCriteria.has(criterion)) {
          errors.push({
            path: 'criteria_scores',
            message: `Missing scoring criterion: ${criterion}`
          })
        }
      }
    } else {
      // criteria_scores is missing or not an array (this is already covered by Zod, but added for completeness)
      errors.push({
        path: 'criteria_scores',
        message: 'Criteria scores must be an array.'
      })
    }
  } else {
    errors.push({
      path: 'root',
      message: 'Input data is not a valid object.'
    })
  }

  if (errors.length > 0) {
    throw new SemanticValidationError(errors)
  }

  // TypeScript assertion: safeParse succeeded and semantic checks passed
  return result.data!
}
