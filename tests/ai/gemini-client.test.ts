import { describe, expect, it } from 'vitest'
import { executeGeminiAnalysis } from '@/lib/ai/gemini-client'
import { analyzePrompt } from '@/lib/ai/analyze-prompt'
import { normalizeProviderError, ProviderError } from '@/lib/ai/provider-errors'
import { mockAnalysisResult } from '@/lib/ai/mock-analysis'
import { APICallError, NoObjectGeneratedError } from 'ai'
import { SemanticValidationError } from '@/lib/ai/semantic-validation'

describe('Gemini Analysis Client & Error Normalization', () => {
  describe('executeGeminiAnalysis Mocking & Output', () => {
    it('successfully resolves a mocked analysis result when mockMode is enabled', async () => {
      const result = await executeGeminiAnalysis(
        'system instruction',
        'polished prompt',
        { mockMode: true }
      )
      expect(result).toBeDefined()
      expect(result.overall_summary).toContain('Prompt ma dobry kierunek')
      expect(result.criteria_scores).toHaveLength(10)
    })

    it('returns custom mock response when provided in options', async () => {
      const customMock = {
        ...mockAnalysisResult,
        overall_summary: 'Custom test summary'
      }
      const result = await executeGeminiAnalysis(
        'system instruction',
        'polished prompt',
        { mockResponse: customMock }
      )
      expect(result.overall_summary).toBe('Custom test summary')
    })
  })

  describe('analyzePrompt Dynamic Orchestration', () => {
    it('performs full analysis flow including semantic validation and mathematical scoring', async () => {
      const params = {
        inputPrompt: 'To jest testowy prompt o długości przynajmniej dwudziestu znaków.',
        workingLanguage: 'pl' as const,
        selectedProfileSlug: 'google-gemini-3-5-flash' as const,
        taskGoal: 'Test goal',
        taskType: 'Translation'
      }

      const result = await analyzePrompt(params, { mockMode: true })

      expect(result.analysis).toBeDefined()
      expect(result.scores).toBeDefined()
      expect(result.scores.overallScore).toBe(mockAnalysisResult.overallScore)
      expect(result.scores.scoreLevel).toBe(mockAnalysisResult.scoreLevel)
    })

    it('rejects an invalid structure through semantic validation', async () => {
      const params = {
        inputPrompt: 'To jest testowy prompt o długości przynajmniej dwudziestu znaków.',
        workingLanguage: 'pl' as const,
        selectedProfileSlug: 'google-gemini-3-5-flash' as const
      }

      // Create an invalid mock response missing overall_summary
      const invalidMock = {
        ...mockAnalysisResult,
        overall_summary: '' // invalid under Zod/Semantic schema
      } as any

      await expect(
        analyzePrompt(params, { mockResponse: invalidMock })
      ).rejects.toThrow(SemanticValidationError)
    })
  })

  describe('normalizeProviderError Throttling & Diagnostics', () => {
    it('maps HTTP 429 rate limit to standardized high volume user message', () => {
      const apiError = new APICallError({
        statusCode: 429,
        statusText: 'Too Many Requests',
        cause: new Error('Rate limit exceeded'),
        url: 'https://api.google.com/generateContent',
        message: 'Rate limit hit'
      })

      const normalized = normalizeProviderError(apiError)

      expect(normalized).toBeInstanceOf(ProviderError)
      expect(normalized.statusCode).toBe(429)
      expect(normalized.userMessage).toContain('handling high volume')
    })

    it('maps HTTP 503 transient failure to standardized high volume user message', () => {
      const apiError = new APICallError({
        statusCode: 503,
        statusText: 'Service Unavailable',
        cause: new Error('Overloaded'),
        url: 'https://api.google.com/generateContent',
        message: 'Server overloaded'
      })

      const normalized = normalizeProviderError(apiError)

      expect(normalized).toBeInstanceOf(ProviderError)
      expect(normalized.statusCode).toBe(503)
      expect(normalized.userMessage).toContain('handling high volume')
    })

    it('maps non-transient HTTP 400 bad request to generic error message', () => {
      const apiError = new APICallError({
        statusCode: 400,
        statusText: 'Bad Request',
        cause: new Error('Invalid parameter'),
        url: 'https://api.google.com/generateContent',
        message: 'Invalid request parameter'
      })

      const normalized = normalizeProviderError(apiError)

      expect(normalized).toBeInstanceOf(ProviderError)
      expect(normalized.statusCode).toBe(400)
      expect(normalized.userMessage).toContain('encountered an error while processing')
    })

    it('maps NoObjectGeneratedError to generic error message', () => {
      const noObjError = new NoObjectGeneratedError({
        cause: new Error('Zod validation failed'),
        text: '{"some": "malformed json"'
      })

      const normalized = normalizeProviderError(noObjError)

      expect(normalized).toBeInstanceOf(ProviderError)
      expect(normalized.userMessage).toContain('encountered an error while processing')
    })

    it('maps generic network timeout and fetch errors to standardized high volume user message', () => {
      const networkError = new Error('fetch failed due to DNS timeout or network connectivity issue')
      const normalized = normalizeProviderError(networkError)

      expect(normalized.userMessage).toContain('handling high volume')
    })
  })
})
