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

export function formatValidationErrors(errors: ValidationErrorDetail[]): string {
  return errors.map((error) => `[${error.path}]: ${error.message}`).join('\n')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Validates raw AI output or mock data against the production structured schema.
 * Enforces:
 * 1. Basic type/structural validation via Zod analysisResultSchema.
 * 2. Complete coverage of all scoring criteria.
 * 3. No duplicate, missing, unexpected, or out-of-order criteria.
 * 4. A non-empty, non-whitespace-only improved prompt.
 *
 * @param data The input object to validate.
 * @returns The parsed and fully typed AnalysisResult.
 * @throws SemanticValidationError containing all validation failure details.
 */
export function validateAnalysisResult(data: unknown): AnalysisResult {
  const errors: ValidationErrorDetail[] = []

  let cleanData = data
  if (isRecord(data)) {
    const rest = { ...data }
    delete rest.id
    delete rest.overallScore
    delete rest.scoreLevel
    cleanData = rest
  }

  const result = analysisResultSchema.safeParse(cleanData)
  if (!result.success) {
    const zodErrors = result.error.issues.map((err) => ({
      path: err.path.join('.') || 'root',
      message: err.message
    }))
    errors.push(...zodErrors)
  }

  const parsedData = result.success ? result.data : (cleanData as Partial<AnalysisResult> | null)

  if (!isRecord(parsedData)) {
    errors.push({
      path: 'root',
      message: 'Input data is not a valid object.'
    })
  } else {
    if (
      typeof parsedData.improved_prompt !== 'string' ||
      parsedData.improved_prompt.trim().length === 0
    ) {
      errors.push({
        path: 'improved_prompt',
        message: 'Improved prompt cannot be empty or only whitespace.'
      })
    }

    const criteriaScores = parsedData.criteria_scores

    if (!Array.isArray(criteriaScores)) {
      errors.push({
        path: 'criteria_scores',
        message: 'Criteria scores must be an array.'
      })
    } else {
      const expectedCriteria = [...scoringCriteria]
      const expectedCriteriaSet = new Set<string>(expectedCriteria)
      const seenCriteria = new Set<string>()

      if (criteriaScores.length !== expectedCriteria.length) {
        errors.push({
          path: 'criteria_scores',
          message: `Expected exactly ${expectedCriteria.length} criteria scores, received ${criteriaScores.length}.`
        })
      }

      for (let i = 0; i < criteriaScores.length; i++) {
        const item = criteriaScores[i]

        if (!isRecord(item)) {
          errors.push({
            path: `criteria_scores.${i}`,
            message: 'Criteria score item must be an object.'
          })
          continue
        }

        const criterion = item.criterion

        if (typeof criterion !== 'string') {
          errors.push({
            path: `criteria_scores.${i}.criterion`,
            message: 'Criterion must be a string.'
          })
          continue
        }

        if (!expectedCriteriaSet.has(criterion)) {
          errors.push({
            path: `criteria_scores.${i}.criterion`,
            message: `Unexpected scoring criterion: ${criterion}`
          })
          continue
        }

        if (seenCriteria.has(criterion)) {
          errors.push({
            path: `criteria_scores.${i}.criterion`,
            message: `Duplicate scoring criterion: ${criterion}`
          })
        }

        seenCriteria.add(criterion)

        const expectedAtIndex = expectedCriteria[i]
        if (expectedAtIndex && criterion !== expectedAtIndex) {
          errors.push({
            path: `criteria_scores.${i}.criterion`,
            message: `Scoring criterion order mismatch. Expected ${expectedAtIndex}, received ${criterion}.`
          })
        }
      }

      for (const criterion of expectedCriteria) {
        if (!seenCriteria.has(criterion)) {
          errors.push({
            path: 'criteria_scores',
            message: `Missing scoring criterion: ${criterion}`
          })
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new SemanticValidationError(errors)
  }

  return result.data as AnalysisResult
}
