import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('ai', async (importOriginal) => {
  const original = await importOriginal<typeof import('ai')>()
  return {
    ...original,
    generateText: vi.fn().mockResolvedValue({
      output: {},
      usage: { promptTokens: 10, completionTokens: 10 }
    })
  }
})

import { executeOpenRouterAnalysis } from '@/lib/ai/openrouter-client'
import { analyzePrompt } from '@/lib/ai/analyze-prompt'
import { normalizeProviderError, ProviderError, isNestedTimeout } from '@/lib/ai/provider-errors'
import { mockAnalysisResult } from '@/lib/ai/mock-analysis'
import { APICallError, NoObjectGeneratedError } from 'ai'
import { SemanticValidationError } from '@/lib/ai/semantic-validation'
import type { AnalysisResult } from '@/lib/ai/schemas'

describe('OpenRouter Analysis Client & Error Normalization', () => {
  describe('executeOpenRouterAnalysis Mocking & Output', () => {
    it('successfully resolves a mocked analysis result when mockMode is enabled', async () => {
      const result = await executeOpenRouterAnalysis(
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
      const result = await executeOpenRouterAnalysis(
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
        selectedProfileSlug: 'general-llm' as const, // Default profile slug
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
        selectedProfileSlug: 'general-llm' as const
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
        url: 'https://openrouter.ai/api/v1/chat/completions',
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
        url: 'https://openrouter.ai/api/v1/chat/completions',
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
        url: 'https://openrouter.ai/api/v1/chat/completions',
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

      expect(networkError).toBeDefined()
      expect(normalized.userMessage).toContain('handling high volume')
    })
  })

  describe('isNestedTimeout & normalizeProviderError Timeout Detection', () => {
    it('detects direct PROVIDER_TIMEOUT error', () => {
      const err = new Error('PROVIDER_TIMEOUT: Request aborted after 60000ms')
      expect(isNestedTimeout(err)).toBe(true)

      const normalized = normalizeProviderError(err)
      expect(normalized.errorCode).toBe('provider_timeout')
      expect(normalized.message).toContain('PROVIDER_TIMEOUT')
    })

    it('detects nested timeout cause in error.cause', () => {
      const nestedErr = new Error('Some wrapping error')
      nestedErr.cause = new Error('PROVIDER_TIMEOUT: Request aborted after 60000ms')
      expect(isNestedTimeout(nestedErr)).toBe(true)

      const normalized = normalizeProviderError(nestedErr)
      expect(normalized.errorCode).toBe('provider_timeout')
      expect(normalized.message).toContain('PROVIDER_TIMEOUT')
    })

    it('detects nested timeout cause in ProviderError.rawError.cause', () => {
      const apiError = new APICallError({
        statusCode: 200,
        cause: new Error('Request aborted after 60000ms'),
        url: 'https://openrouter.ai/api/v1/chat/completions',
        message: 'Request failed',
        requestBodyValues: {}
      })
      const wrappingError = new ProviderError(
        'Failed to process successful response',
        'Standard error',
        apiError
      )

      expect(isNestedTimeout(wrappingError)).toBe(true)

      const normalized = normalizeProviderError(wrappingError)
      expect(normalized.errorCode).toBe('provider_timeout')
      expect(normalized.message).toContain('PROVIDER_TIMEOUT')
    })

    it('detects APICallError-like object with statusCode 200 and nested timeout cause', () => {
      const mockApiError = {
        name: 'APICallError',
        statusCode: 200,
        cause: {
          name: 'Error',
          message: 'PROVIDER_TIMEOUT: Request aborted after 60000ms'
        }
      }

      expect(isNestedTimeout(mockApiError)).toBe(true)

      const normalized = normalizeProviderError(mockApiError)
      expect(normalized.errorCode).toBe('provider_timeout')
      expect(normalized.statusCode).toBe(200)
      expect(normalized.message).toContain('PROVIDER_TIMEOUT')
    })
  })

  describe('executeOpenRouterAnalysis with DB Profiles', () => {
    beforeEach(() => {
      process.env.OPENROUTER_API_KEY = 'mock-api-key'
    })

    it('passes capabilities parameters from dbProfile to generateText', async () => {
      const dbProfile = {
        id: 'p1',
        slug: 'openrouter-deepseek-v4-flash',
        display_name: 'Test Profile',
        provider: 'openrouter',
        model_family: 'deepseek',
        profile_type: 'provider_model',
        source_type: 'internal',
        verification_status: 'verified',
        confidence_level: 'high',
        capabilities_json: {
          model_id: 'custom-model-123',
          temperature: 0.8,
          max_tokens: 1500,
          reasoning: true
        },
        profile_version: '1.0.0',
        created_at: '',
        updated_at: ''
      } as unknown as ModelProfileRow

      const { generateText } = await import('ai')
      vi.mocked(generateText).mockClear()

      await executeOpenRouterAnalysis('sys instruction', 'user prompt', {
        dbProfile
      })

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.8,
          maxOutputTokens: 1500,
          prompt: 'user prompt',
          system: 'sys instruction',
          providerMetadata: expect.objectContaining({
            openrouter: expect.objectContaining({
              reasoning: true
            })
          })
        })
      )
    })
  })
})
