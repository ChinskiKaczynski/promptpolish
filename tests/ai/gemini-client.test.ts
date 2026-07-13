import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

vi.mock(
  'ai',
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import('ai')
      >()

    return {
      ...original,

      generateText:
        vi.fn().mockResolvedValue({
          output: {},
          usage: {
            promptTokens: 10,
            completionTokens: 10,
            totalTokens: 20,
          },
        }),

      generateObject:
        vi.fn().mockResolvedValue({
          object: {},
          usage: {
            promptTokens: 10,
            completionTokens: 10,
            totalTokens: 20,
          },
          finishReason: 'stop',
        }),
    }
  }
)

import {
  APICallError,
  generateObject,
  NoObjectGeneratedError,
} from 'ai'
import {
  executeGeminiAnalysis,
} from '@/lib/ai/gemini-client'
import {
  analyzePrompt,
} from '@/lib/ai/analyze-prompt'
import {
  isNestedTimeout,
  normalizeProviderError,
  ProviderError,
} from '@/lib/ai/provider-errors'
import {
  mockAnalysisResult,
} from '@/lib/ai/mock-analysis'
import {
  SemanticValidationError,
} from '@/lib/ai/semantic-validation'
import type {
  AnalysisResult,
} from '@/lib/ai/schemas'
import type {
  AIRuntimeConfig,
} from '@/lib/ai/runtime-config'

function makeRuntimeConfig(
  overrides: Partial<AIRuntimeConfig> = {}
): AIRuntimeConfig {
  return {
    provider: 'google',
    modelId:
      'gemini-2.5-flash',
    fallbackProvider: null,
    fallbackModelId: null,
    temperature: 0.1,
    maxOutputTokens: 6000,
    timeoutMs: 55000,
    thinkingBudget: 0,
    source: 'database',
    ...overrides,
  }
}

describe(
  'Gemini Analysis Client & Error Normalization',
  () => {
    beforeEach(() => {
      vi.clearAllMocks()

      process.env
        .GOOGLE_GENERATIVE_AI_API_KEY =
        'mock-api-key'
    })

    describe(
      'executeGeminiAnalysis Mocking & Output',
      () => {
        it(
          'successfully resolves a mocked analysis result when mockMode is enabled',
          async () => {
            const result =
              await executeGeminiAnalysis(
                'system instruction',
                'polished prompt',
                {
                  mockMode: true,
                }
              )

            expect(result).toBeDefined()

            expect(
              result.output
                .overall_summary
            ).toContain(
              'Prompt ma dobry kierunek'
            )

            expect(
              result.output
                .criteria_scores
            ).toHaveLength(10)

            expect(
              result.selectedProvider
            ).toBe('google')
          }
        )

        it(
          'returns custom mock response when provided in options',
          async () => {
            const customMock = {
              ...mockAnalysisResult,
              overall_summary:
                'Custom test summary',
            }

            const result =
              await executeGeminiAnalysis(
                'system instruction',
                'polished prompt',
                {
                  mockResponse:
                    customMock,
                }
              )

            expect(
              result.output
                .overall_summary
            ).toBe(
              'Custom test summary'
            )
          }
        )
      }
    )

    describe(
      'analyzePrompt Dynamic Orchestration',
      () => {
        it(
          'performs full analysis flow including semantic validation and mathematical scoring',
          async () => {
            const params = {
              inputPrompt:
                'To jest testowy prompt o długości przynajmniej dwudziestu znaków.',

              workingLanguage:
                'pl' as const,

              selectedProfileSlug:
                'general-llm' as const,

              taskGoal:
                'Test goal',

              taskType:
                'Translation',
            }

            const result =
              await analyzePrompt(
                params,
                {
                  mockMode: true,
                }
              )

            expect(
              result.analysis
            ).toBeDefined()

            expect(
              result.scores
            ).toBeDefined()

            expect(
              result.scores
                .overallScore
            ).toBe(
              mockAnalysisResult
                .overallScore
            )

            expect(
              result.scores
                .scoreLevel
            ).toBe(
              mockAnalysisResult
                .scoreLevel
            )

            expect(
              result.selectedProvider
            ).toBe('google')
          }
        )

        it(
          'rejects an invalid structure through semantic validation',
          async () => {
            const params = {
              inputPrompt:
                'To jest testowy prompt o długości przynajmniej dwudziestu znaków.',

              workingLanguage:
                'pl' as const,

              selectedProfileSlug:
                'general-llm' as const,
            }

            const invalidMock:
              AnalysisResult = {
              ...mockAnalysisResult,
              overall_summary: '',
            }

            await expect(
              analyzePrompt(
                params,
                {
                  mockResponse:
                    invalidMock,
                }
              )
            ).rejects.toThrow(
              SemanticValidationError
            )
          }
        )
      }
    )

    describe(
      'normalizeProviderError Throttling & Diagnostics',
      () => {
        it(
          'maps HTTP 429 rate limit to standardized high volume user message',
          () => {
            const apiError =
              new APICallError({
                statusCode: 429,

                cause:
                  new Error(
                    'Rate limit exceeded'
                  ),

                url:
                  'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent',

                message:
                  'Rate limit hit',

                requestBodyValues: {},
              })

            const normalized =
              normalizeProviderError(
                apiError
              )

            expect(
              normalized
            ).toBeInstanceOf(
              ProviderError
            )

            expect(
              normalized.statusCode
            ).toBe(429)

            expect(
              normalized.userMessage
            ).toContain(
              'handling high volume'
            )
          }
        )

        it(
          'maps HTTP 503 transient failure to standardized high volume user message',
          () => {
            const apiError =
              new APICallError({
                statusCode: 503,

                cause:
                  new Error(
                    'Overloaded'
                  ),

                url:
                  'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent',

                message:
                  'Server overloaded',

                requestBodyValues: {},
              })

            const normalized =
              normalizeProviderError(
                apiError
              )

            expect(
              normalized
            ).toBeInstanceOf(
              ProviderError
            )

            expect(
              normalized.statusCode
            ).toBe(503)

            expect(
              normalized.userMessage
            ).toContain(
              'handling high volume'
            )
          }
        )

        it(
          'maps non-transient HTTP 400 bad request to generic error message',
          () => {
            const apiError =
              new APICallError({
                statusCode: 400,

                cause:
                  new Error(
                    'Invalid parameter'
                  ),

                url:
                  'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent',

                message:
                  'Invalid request parameter',

                requestBodyValues: {},
              })

            const normalized =
              normalizeProviderError(
                apiError
              )

            expect(
              normalized
            ).toBeInstanceOf(
              ProviderError
            )

            expect(
              normalized.statusCode
            ).toBe(400)

            expect(
              normalized.userMessage
            ).toContain(
              'encountered an error while processing'
            )
          }
        )

        it(
          'maps NoObjectGeneratedError to malformed structured output',
          () => {
            const noObjectError =
              new NoObjectGeneratedError({
                cause:
                  new Error(
                    'Zod validation failed'
                  ),

                text:
                  '{"some": "malformed json"',

                response: {
                  id: 'test-id',
                  modelId:
                    'test-model',
                  timestamp:
                    new Date(),
                },

                usage: {
                  inputTokens: 0,
                  outputTokens: 0,
                  totalTokens: 0,

                  inputTokenDetails: {
                    noCacheTokens: 0,
                    cacheReadTokens: 0,
                    cacheWriteTokens: 0,
                  },

                  outputTokenDetails: {
                    textTokens: 0,
                    reasoningTokens: 0,
                  },
                },

                finishReason:
                  'error',
              })

            const normalized =
              normalizeProviderError(
                noObjectError
              )

            expect(
              normalized
            ).toBeInstanceOf(
              ProviderError
            )

            expect(
              normalized.errorCode
            ).toBe(
              'malformed_provider_output'
            )

            expect(
              normalized.userMessage
            ).toContain(
              'encountered an error while processing'
            )
          }
        )

        it(
          'maps explicit network timeout codes to timeout message',
          () => {
            const timeoutError =
              Object.assign(
                new Error(
                  'Network request failed'
                ),
                {
                  code:
                    'ETIMEDOUT',
                }
              )

            const normalized =
              normalizeProviderError(
                timeoutError
              )

            expect(
              normalized.errorCode
            ).toBe(
              'upstream_provider_error'
            )

            expect(
              normalized.userMessage
            ).toContain(
              'timed out'
            )
          }
        )

        it(
          'maps generic fetch failures to provider unavailable',
          () => {
            const networkError =
              new Error(
                'fetch failed due to DNS or network connectivity issue'
              )

            const normalized =
              normalizeProviderError(
                networkError
              )

            expect(
              normalized.errorCode
            ).toBe(
              'provider_unavailable'
            )

            expect(
              normalized.userMessage
            ).toContain(
              'handling high volume'
            )
          }
        )
      }
    )

    describe(
      'isNestedTimeout & normalizeProviderError Timeout Detection',
      () => {
        it(
          'detects direct PROVIDER_TIMEOUT error',
          () => {
            const error =
              new Error(
                'PROVIDER_TIMEOUT: Request aborted after 60000ms'
              )

            expect(
              isNestedTimeout(error)
            ).toBe(true)

            const normalized =
              normalizeProviderError(
                error
              )

            expect(
              normalized.errorCode
            ).toBe(
              'upstream_provider_error'
            )

            expect(
              normalized.message
            ).toContain(
              'PROVIDER_TIMEOUT'
            )
          }
        )

        it(
          'detects nested timeout cause in error.cause',
          () => {
            const nestedError =
              new Error(
                'Some wrapping error'
              )

            nestedError.cause =
              new Error(
                'PROVIDER_TIMEOUT: Request aborted after 60000ms'
              )

            expect(
              isNestedTimeout(
                nestedError
              )
            ).toBe(true)

            const normalized =
              normalizeProviderError(
                nestedError
              )

            expect(
              normalized.errorCode
            ).toBe(
              'upstream_provider_error'
            )

            expect(
              normalized.message
            ).toContain(
              'PROVIDER_TIMEOUT'
            )
          }
        )

        it(
          'detects nested timeout cause in an unclassified ProviderError rawError',
          () => {
            const apiError =
              new APICallError({
                statusCode: 200,

                cause:
                  new Error(
                    'Request aborted after 60000ms'
                  ),

                url:
                  'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent',

                message:
                  'Request failed',

                requestBodyValues: {},
              })

            const wrappingError =
              new ProviderError(
                'Failed to process successful response',
                'Standard error',
                apiError
              )

            expect(
              isNestedTimeout(
                wrappingError
              )
            ).toBe(true)

            const normalized =
              normalizeProviderError(
                wrappingError
              )

            expect(
              normalized.errorCode
            ).toBe(
              'upstream_provider_error'
            )

            expect(
              normalized.message
            ).toContain(
              'PROVIDER_TIMEOUT'
            )
          }
        )

        it(
          'detects APICallError-like object with statusCode 200 and nested timeout cause',
          () => {
            const mockApiError = {
              name:
                'APICallError',

              statusCode: 200,

              cause: {
                name: 'Error',
                message:
                  'PROVIDER_TIMEOUT: Request aborted after 60000ms',
              },
            }

            expect(
              isNestedTimeout(
                mockApiError
              )
            ).toBe(true)

            const normalized =
              normalizeProviderError(
                mockApiError
              )

            expect(
              normalized.errorCode
            ).toBe(
              'upstream_provider_error'
            )

            expect(
              normalized.statusCode
            ).toBe(200)

            expect(
              normalized.message
            ).toContain(
              'PROVIDER_TIMEOUT'
            )
          }
        )
      }
    )

    describe(
      'executeGeminiAnalysis with runtime configuration',
      () => {
        it(
          'passes runtime temperature, token limit and thinking configuration to generateObject',
          async () => {
            await executeGeminiAnalysis(
              'sys instruction',
              'user prompt',
              {
                runtimeConfig:
                  makeRuntimeConfig({
                    temperature: 0.8,
                    maxOutputTokens:
                      1500,
                    thinkingBudget:
                      1024,
                  }),
              }
            )

            expect(
              generateObject
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                temperature: 0.8,

                maxOutputTokens:
                  1500,

                prompt:
                  'user prompt',

                system:
                  'sys instruction',

                model:
                  expect.objectContaining({
                    modelId:
                      'gemini-2.5-flash',
                  }),

                providerOptions: {
                  google: {
                    thinkingConfig: {
                      thinkingBudget:
                        1024,

                      includeThoughts:
                        false,
                    },
                  },
                },
              })
            )
          }
        )

        it(
          'uses zero Google thinking budget when disabled in runtime configuration',
          async () => {
            await executeGeminiAnalysis(
              'sys instruction',
              'user prompt',
              {
                runtimeConfig:
                  makeRuntimeConfig({
                    thinkingBudget: 0,
                  }),
              }
            )

            expect(
              generateObject
            ).toHaveBeenCalledWith(
              expect.objectContaining({
                providerOptions: {
                  google: {
                    thinkingConfig: {
                      thinkingBudget: 0,

                      includeThoughts:
                        false,
                    },
                  },
                },
              })
            )
          }
        )
      }
    )
  }
)