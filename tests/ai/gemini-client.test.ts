import { describe, expect, it } from 'vitest'
import { executeGeminiAnalysis } from '@/lib/ai/gemini-client'
import { analyzePrompt } from '@/lib/ai/analyze-prompt'
import { normalizeProviderError, ProviderError } from '@/lib/ai/provider-errors'
import { mockAnalysisResult } from '@/lib/ai/mock-analysis'
import { APICallError, NoObjectGeneratedError } from 'ai'
import { SemanticValidationError } from '@/lib/ai/semantic-validation'
import type { AnalysisResult } from '@/lib/ai/schemas'

describe('Gemini Analysis Client & Error Normalization', () => {
  describe('executeGeminiAnalysis Mocking & Output', () => {
    it('successfully resolves a mocked analysis result when mockMode is enabled', async () => {
      const result = await executeGeminiAnalysis(
        'system instruction',
        'polished prompt',
        { mockMode: true }
      )
      expect(result).toBeDefined()
      expect(result.output.overall_summary).toContain('Prompt ma dobry kierunek')
      expect(result.output.criteria_scores).toHaveLength(10)
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
      expect(result.output.overall_summary).toBe('Custom test summary')
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
      const invalidMock: AnalysisResult = {
        ...mockAnalysisResult,
        overall_summary: '' // invalid under Zod/Semantic schema
      }

      await expect(
        analyzePrompt(params, { mockResponse: invalidMock })
      ).rejects.toThrow(SemanticValidationError)
    })
  })

  describe('normalizeProviderError Throttling & Diagnostics', () => {
    it('maps HTTP 429 rate limit to standardized high volume user message', () => {
      const apiError = new APICallError({
        statusCode: 429,
        cause: new Error('Rate limit exceeded'),
        url: 'https://api.google.com/generateContent',
        message: 'Rate limit hit',
        requestBodyValues: {}
      })

      const normalized = normalizeProviderError(apiError)

      expect(normalized).toBeInstanceOf(ProviderError)
      expect(normalized.statusCode).toBe(429)
      expect(normalized.userMessage).toContain('handling high volume')
    })

    it('maps HTTP 503 transient failure to standardized high volume user message', () => {
      const apiError = new APICallError({
        statusCode: 503,
        cause: new Error('Overloaded'),
        url: 'https://api.google.com/generateContent',
        message: 'Server overloaded',
        requestBodyValues: {}
      })

      const normalized = normalizeProviderError(apiError)

      expect(normalized).toBeInstanceOf(ProviderError)
      expect(normalized.statusCode).toBe(503)
      expect(normalized.userMessage).toContain('handling high volume')
    })

    it('maps non-transient HTTP 400 bad request to generic error message', () => {
      const apiError = new APICallError({
        statusCode: 400,
        cause: new Error('Invalid parameter'),
        url: 'https://api.google.com/generateContent',
        message: 'Invalid request parameter',
        requestBodyValues: {}
      })

      const normalized = normalizeProviderError(apiError)

      expect(normalized).toBeInstanceOf(ProviderError)
      expect(normalized.statusCode).toBe(400)
      expect(normalized.userMessage).toContain('encountered an error while processing')
    })

    it('maps NoObjectGeneratedError to generic error message', () => {
      const noObjError = new NoObjectGeneratedError({
        cause: new Error('Zod validation failed'),
        text: '{"some": "malformed json"',
        response: { id: 'test-id', modelId: 'test-model', timestamp: new Date() },
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          inputTokenDetails: {
            noCacheTokens: 0,
            cacheReadTokens: 0,
            cacheWriteTokens: 0
          },
          outputTokenDetails: {
            textTokens: 0,
            reasoningTokens: 0
          }
        },
        finishReason: 'error'
      })

      const normalized = normalizeProviderError(noObjError)

      expect(normalized).toBeInstanceOf(ProviderError)
      expect(normalized.userMessage).toContain('encountered an error while processing')
    })

    it('maps generic network timeout and fetch errors to standardized high volume user message', () => {
      const networkError = new Error('fetch failed due to DNS timeout or network connectivity issue')
      const normalized = normalizeProviderError(networkError)

      expect(networkError).toBeDefined() // to avoid unused variable warning if any
      expect(normalized.userMessage).toContain('handling high volume')
    })
  })
})
