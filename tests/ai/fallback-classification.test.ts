import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  executeGeminiAnalysis,
  type TextGenerator,
} from '@/lib/ai/gemini-client'
import { ProviderError } from '@/lib/ai/provider-errors'
import type { AnalysisResult } from '@/lib/ai/schemas'
import type { AIRuntimeConfig } from '@/lib/ai/runtime-config'

function makeRuntimeConfig(
  overrides: Partial<AIRuntimeConfig> = {}
): AIRuntimeConfig {
  return {
    provider: 'google',
    modelId:
      'gemini-2.5-flash',

    fallbackProvider:
      'openrouter',

    fallbackModelId:
      'openai/gpt-4o-mini',

    temperature: 0.1,
    maxOutputTokens: 6000,
    timeoutMs: 55000,
    thinkingBudget: 0,
    source: 'database',
    ...overrides,
  }
}

describe(
  'Fallback Classification & Configuration Tests',
  () => {
    beforeEach(() => {
      vi.stubEnv(
        'GOOGLE_GENERATIVE_AI_API_KEY',
        'mock-google-key'
      )

      vi.stubEnv(
        'OPENROUTER_API_KEY',
        'mock-openrouter-key'
      )

      vi.stubEnv(
        'NODE_ENV',
        'test'
      )
    })

    afterEach(() => {
      vi.unstubAllEnvs()
      vi.clearAllMocks()
    })

    it(
      'triggers cross-provider fallback on transient failure and succeeds on attempt 2',
      async () => {
        const calls: Array<{
          model: string
          provider:
            | 'google'
            | 'openrouter'
        }> = []

        const mockGenerator:
          TextGenerator =
          async (
            model,
            _systemInstruction,
            _userPrompt,
            options
          ) => {
            calls.push({
              model,
              provider:
                options.provider,
            })

            if (
              calls.length === 1
            ) {
              throw new ProviderError(
                'PROVIDER_TIMEOUT: Simulated transient failure for primary model (timeout)',
                'Simulated primary model timeout.',
                new Error(
                  'Simulated upstream timeout'
                ),
                504,
                'provider_timeout'
              )
            }

            return {
              output: {
                overall_summary:
                  'Test summary',
                criteria_scores: [],
              } as unknown as AnalysisResult,

              usage: {
                promptTokens: 10,
                completionTokens: 10,
                totalTokens: 20,
              },

              finishReason: 'stop',
            }
          }

        const result =
          await executeGeminiAnalysis(
            'sys',
            'user',
            {
              textGenerator:
                mockGenerator,

              runtimeConfig:
                makeRuntimeConfig(),
            }
          )

        expect(calls).toEqual([
          {
            model:
              'gemini-2.5-flash',
            provider: 'google',
          },
          {
            model:
              'openai/gpt-4o-mini',
            provider:
              'openrouter',
          },
        ])

        expect(
          result.attempt
        ).toBe(2)

        expect(
          result.selectedModel
        ).toBe(
          'openai/gpt-4o-mini'
        )

        expect(
          result.selectedProvider
        ).toBe('openrouter')

        expect(
          result.output
            .overall_summary
        ).toBe('Test summary')
      }
    )

    it(
      'does not trigger fallback on a non-transient primary failure',
      async () => {
        let callCount = 0

        const mockGenerator:
          TextGenerator =
          async () => {
            callCount += 1

            throw new ProviderError(
              'Simulated non-transient failure (401 Unauthorized)',
              'Authentication failed.',
              new Error(
                'Simulated 401'
              ),
              401,
              'provider_authentication_error'
            )
          }

        await expect(
          executeGeminiAnalysis(
            'sys',
            'user',
            {
              textGenerator:
                mockGenerator,

              runtimeConfig:
                makeRuntimeConfig(),
            }
          )
        ).rejects.toThrow(
          /Simulated non-transient failure/
        )

        expect(callCount).toBe(1)
      }
    )

    it(
      'disables fallback when fallback provider and model equal the primary configuration',
      async () => {
        let callCount = 0

        const mockGenerator:
          TextGenerator =
          async () => {
            callCount += 1

            throw new ProviderError(
              'PROVIDER_TIMEOUT: Simulated transient failure',
              'Timeout',
              new Error(
                'Simulated upstream timeout'
              ),
              504,
              'provider_timeout'
            )
          }

        await expect(
          executeGeminiAnalysis(
            'sys',
            'user',
            {
              textGenerator:
                mockGenerator,

              runtimeConfig:
                makeRuntimeConfig({
                  fallbackProvider:
                    'google',

                  fallbackModelId:
                    'gemini-2.5-flash',
                }),
            }
          )
        ).rejects.toThrow(
          /PROVIDER_TIMEOUT/
        )

        expect(callCount).toBe(1)
      }
    )

    it(
      'disables fallback when fallback configuration is absent',
      async () => {
        let callCount = 0

        const mockGenerator:
          TextGenerator =
          async () => {
            callCount += 1

            throw new ProviderError(
              'PROVIDER_TIMEOUT: Simulated transient failure',
              'Timeout',
              new Error(
                'Simulated upstream timeout'
              ),
              504,
              'provider_timeout'
            )
          }

        await expect(
          executeGeminiAnalysis(
            'sys',
            'user',
            {
              textGenerator:
                mockGenerator,

              runtimeConfig:
                makeRuntimeConfig({
                  fallbackProvider:
                    null,

                  fallbackModelId:
                    null,
                }),
            }
          )
        ).rejects.toThrow(
          /PROVIDER_TIMEOUT/
        )

        expect(callCount).toBe(1)
      }
    )

    it(
      'returns the fallback failure when both primary and fallback fail',
      async () => {
        let callCount = 0

        const mockGenerator:
          TextGenerator =
          async () => {
            callCount += 1

            if (callCount === 1) {
              throw new ProviderError(
                'PROVIDER_TIMEOUT: Simulated transient failure for primary model (timeout)',
                'Simulated primary model timeout.',
                new Error(
                  'Simulated upstream timeout'
                ),
                504,
                'provider_timeout'
              )
            }

            throw new ProviderError(
              'PROVIDER_TIMEOUT: Simulated transient failure for fallback model (timeout)',
              'Simulated fallback model timeout.',
              new Error(
                'Simulated upstream timeout'
              ),
              504,
              'provider_timeout'
            )
          }

        await expect(
          executeGeminiAnalysis(
            'sys',
            'user',
            {
              textGenerator:
                mockGenerator,

              runtimeConfig:
                makeRuntimeConfig(),
            }
          )
        ).rejects.toThrow(
          /Simulated transient failure for fallback model/
        )

        expect(callCount).toBe(2)
      }
    )
  }
)