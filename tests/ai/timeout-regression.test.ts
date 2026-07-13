import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import type { AIRuntimeConfig } from '@/lib/ai/runtime-config'

vi.mock('server-only', () => ({}))

vi.mock('ai', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('ai')>()

  const mockImplementation = async (
    options: {
      abortSignal?: AbortSignal
    }
  ) => {
    const signal = options.abortSignal

    if (signal?.aborted) {
      throw (
        signal.reason ||
        new Error('Aborted')
      )
    }

    return new Promise(
      (resolve, reject) => {
        const state = {
          timer: undefined as
            | ReturnType<typeof setTimeout>
            | undefined,
        }

        const onAbort = () => {
          if (state.timer) {
            clearTimeout(state.timer)
          }

          reject(
            signal?.reason ||
            new Error('Aborted')
          )
        }

        if (signal) {
          signal.addEventListener(
            'abort',
            onAbort
          )
        }

        state.timer = setTimeout(() => {
          if (signal) {
            signal.removeEventListener(
              'abort',
              onAbort
            )
          }

          resolve({
            object: {
              overall_summary:
                'Mocked successful output',
              criteria_scores: [],
            },
            output: {
              overall_summary:
                'Mocked successful output',
              criteria_scores: [],
            },
            usage: {
              promptTokens: 10,
              completionTokens: 10,
              totalTokens: 20,
            },
            finishReason: 'stop',
          })
        }, 100)
      }
    )
  }

  return {
    ...original,
    generateText:
      vi.fn().mockImplementation(
        mockImplementation
      ),
    generateObject:
      vi.fn().mockImplementation(
        mockImplementation
      ),
  }
})

import { generateObject } from 'ai'
import { serverEnvSchema } from '@/lib/env/server'
import { executeGeminiAnalysis } from '@/lib/ai/gemini-client'
import {
  isNestedTimeout,
  normalizeProviderError,
} from '@/lib/ai/provider-errors'

function makeRuntimeConfig(
  overrides: Partial<AIRuntimeConfig> = {}
): AIRuntimeConfig {
  return {
    provider: 'google',
    modelId: 'gemini-2.5-flash',
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

function makeFallbackRuntimeConfig(
  overrides: Partial<AIRuntimeConfig> = {}
): AIRuntimeConfig {
  return makeRuntimeConfig({
    fallbackProvider: 'google',
    fallbackModelId:
      'gemini-2.5-flash-lite',
    ...overrides,
  })
}

describe(
  'Timeout and Abort Regression Suite',
  () => {
    const originalEnv = {
      ...process.env,
    }

    beforeEach(() => {
      vi.clearAllMocks()

      process.env.GEMINI_MODEL_ID =
        'gemini-2.5-flash'

      process.env
        .GOOGLE_GENERATIVE_AI_API_KEY =
        'mock-google-key'

      process.env.OPENROUTER_API_KEY =
        'mock-openrouter-key'
    })

    afterEach(() => {
      process.env = {
        ...originalEnv,
      }
    })

    describe(
      '1. Zod Environment Variable Validation',
      () => {
        it(
          'uses the default value of 55000 when missing',
          () => {
            const parsed =
              serverEnvSchema.parse({})

            expect(
              parsed.AI_PROVIDER_TIMEOUT_MS
            ).toBe(55000)
          }
        )

        it(
          'accepts a valid timeout value',
          () => {
            const parsed =
              serverEnvSchema.parse({
                AI_PROVIDER_TIMEOUT_MS:
                  '60000',
              })

            expect(
              parsed.AI_PROVIDER_TIMEOUT_MS
            ).toBe(60000)
          }
        )

        it(
          'rejects a zero value below min(5000)',
          () => {
            const result =
              serverEnvSchema.safeParse({
                AI_PROVIDER_TIMEOUT_MS:
                  '0',
              })

            expect(
              result.success
            ).toBe(false)
          }
        )

        it(
          'rejects an invalid numeric value',
          () => {
            const result =
              serverEnvSchema.safeParse({
                AI_PROVIDER_TIMEOUT_MS:
                  'not-a-number',
              })

            expect(
              result.success
            ).toBe(false)
          }
        )
      }
    )

    describe(
      '2. executeGeminiAnalysis Timeout & Abort Mechanics',
      () => {
        it(
          'aborts internally on timeoutMs and includes the configured limit in error message (provider_timeout)',
          async () => {
            const promise =
              executeGeminiAnalysis(
                'instruction',
                'prompt',
                {
                  timeoutMs: 10,
                  mockMode: false,
                  runtimeConfig:
                    makeRuntimeConfig(),
                }
              )

            await expect(
              promise
            ).rejects.toThrowError(
              /PROVIDER_TIMEOUT: Request aborted after 10ms/
            )

            try {
              await promise
            } catch (error) {
              const providerError =
                error as {
                  errorCode?: string
                  statusCode?: number
                }

              expect(
                providerError.errorCode
              ).toBe(
                'provider_timeout'
              )

              expect(
                providerError.statusCode
              ).toBe(504)
            }
          }
        )

        it(
          'handles client cancellation via abortSignal and throws CLIENT_CLOSED',
          async () => {
            const controller =
              new AbortController()

            const promise =
              executeGeminiAnalysis(
                'instruction',
                'prompt',
                {
                  abortSignal:
                    controller.signal,
                  timeoutMs: 30000,
                  mockMode: false,
                  runtimeConfig:
                    makeRuntimeConfig(),
                }
              )

            controller.abort(
              new Error('CLIENT_CLOSED')
            )

            await expect(
              promise
            ).rejects.toThrowError(
              'CLIENT_CLOSED'
            )
          }
        )

        it(
          'handles external signal already aborted on call',
          async () => {
            const controller =
              new AbortController()

            controller.abort(
              new Error('CLIENT_CLOSED')
            )

            const promise =
              executeGeminiAnalysis(
                'instruction',
                'prompt',
                {
                  abortSignal:
                    controller.signal,
                  timeoutMs: 30000,
                  mockMode: false,
                  runtimeConfig:
                    makeRuntimeConfig(),
                }
              )

            await expect(
              promise
            ).rejects.toThrowError(
              'CLIENT_CLOSED'
            )
          }
        )

        it(
          'cleans up timeout timers on success',
          async () => {
            const spyClearTimeout =
              vi.spyOn(
                global,
                'clearTimeout'
              )

            await executeGeminiAnalysis(
              'inst',
              'prompt',
              {
                timeoutMs: 20000,
                runtimeConfig:
                  makeRuntimeConfig(),
              }
            )

            expect(
              spyClearTimeout
            ).toHaveBeenCalled()

            spyClearTimeout.mockRestore()
          }
        )

        it(
          'cleans up abort event listeners on success',
          async () => {
            const controller =
              new AbortController()

            const spyRemoveEventListener =
              vi.spyOn(
                controller.signal,
                'removeEventListener'
              )

            await executeGeminiAnalysis(
              'inst',
              'prompt',
              {
                abortSignal:
                  controller.signal,
                timeoutMs: 20000,
                runtimeConfig:
                  makeRuntimeConfig(),
              }
            )

            expect(
              spyRemoveEventListener
            ).toHaveBeenCalledWith(
              'abort',
              expect.any(Function)
            )

            spyRemoveEventListener
              .mockRestore()
          }
        )

        it(
          'cleans up timeout timers and listeners on failure',
          async () => {
            const spyClearTimeout =
              vi.spyOn(
                global,
                'clearTimeout'
              )

            const controller =
              new AbortController()

            const spyRemoveEventListener =
              vi.spyOn(
                controller.signal,
                'removeEventListener'
              )

            try {
              await executeGeminiAnalysis(
                'inst',
                'prompt',
                {
                  abortSignal:
                    controller.signal,
                  timeoutMs: 5,
                  runtimeConfig:
                    makeRuntimeConfig(),
                }
              )
            } catch {
              // Expected provider timeout.
            }

            expect(
              spyClearTimeout
            ).toHaveBeenCalled()

            expect(
              spyRemoveEventListener
            ).toHaveBeenCalledWith(
              'abort',
              expect.any(Function)
            )

            spyClearTimeout.mockRestore()

            spyRemoveEventListener
              .mockRestore()
          }
        )
      }
    )

    describe(
      '3. Error Normalization & Distinguishing Causes',
      () => {
        it(
          'correctly classifies explicit nested timeout markers case-insensitively',
          () => {
            const upperError =
              new Error(
                'PROVIDER_TIMEOUT'
              )

            const lowerError =
              new Error(
                'provider_timeout'
              )

            const abortError =
              new Error(
                'Request aborted after 45000ms'
              )

            expect(
              isNestedTimeout(
                upperError
              )
            ).toBe(true)

            expect(
              isNestedTimeout(
                lowerError
              )
            ).toBe(true)

            expect(
              isNestedTimeout(
                abortError
              )
            ).toBe(true)
          }
        )

        it(
          'maps Vercel platform-level timeouts to function_platform_timeout',
          () => {
            const platformError =
              new Error(
                'FUNCTION_INVOCATION_TIMEOUT: Vercel serverless execution limit reached.'
              )

            const normalized =
              normalizeProviderError(
                platformError
              )

            expect(
              normalized.errorCode
            ).toBe(
              'function_platform_timeout'
            )

            expect(
              normalized.statusCode
            ).toBe(504)

            expect(
              normalized.userMessage
            ).toContain(
              'platform level'
            )
          }
        )

        it(
          'maps explicit nested network timeout codes to upstream_provider_error when signal was not aborted',
          () => {
            const timeoutCause =
              Object.assign(
                new Error(
                  'Upstream connection exceeded its deadline.'
                ),
                {
                  code: 'ETIMEDOUT',
                }
              )

            const upstreamError =
              new Error(
                'OpenRouter request failed.',
                {
                  cause: timeoutCause,
                }
              )

            const normalized =
              normalizeProviderError(
                upstreamError
              )

            expect(
              normalized.errorCode
            ).toBe(
              'upstream_provider_error'
            )

            expect(
              normalized.statusCode
            ).toBe(504)

            expect(
              normalized.userMessage
            ).toContain(
              'AI provider'
            )
          }
        )

        it(
          'non-timeout provider errors do not become timeout errors',
          () => {
            const genericError =
              new Error(
                'API Key Invalid'
              )

            const normalized =
              normalizeProviderError(
                genericError
              )

            expect(
              normalized.errorCode
            ).not.toBe(
              'provider_timeout'
            )

            expect(
              normalized.errorCode
            ).not.toBe(
              'upstream_provider_error'
            )

            expect(
              normalized.errorCode
            ).not.toBe(
              'function_platform_timeout'
            )
          }
        )
      }
    )

    describe(
      '4. Transient Retry & Remaining Timeout Mechanics',
      () => {
        it(
          'executes one successful retry after a transient failure',
          async () => {
            let calls = 0

            vi.mocked(
              generateObject
            ).mockImplementation(
              async () => {
                calls += 1

                if (calls === 1) {
                  throw new Error(
                    'fetch failed'
                  )
                }

                return {
                  object: {
                    overall_summary:
                      'Mocked successful output after retry',
                    criteria_scores: [],
                  },
                  output: {
                    overall_summary:
                      'Mocked successful output after retry',
                    criteria_scores: [],
                  },
                  usage: {
                    promptTokens: 10,
                    completionTokens: 10,
                    totalTokens: 20,
                  },
                  finishReason: 'stop',
                } as unknown as Awaited<
                  ReturnType<
                    typeof generateObject
                  >
                >
              }
            )

            const result =
              await executeGeminiAnalysis(
                'inst',
                'prompt',
                {
                  timeoutMs: 30000,
                  runtimeConfig:
                    makeFallbackRuntimeConfig({
                      timeoutMs: 30000,
                    }),
                }
              )

            expect(calls).toBe(2)

            expect(
              result.output
                .overall_summary
            ).toBe(
              'Mocked successful output after retry'
            )

            expect(
              result.selectedModel
            ).toBe(
              'gemini-2.5-flash-lite'
            )

            expect(
              result.selectedProvider
            ).toBe('google')

            expect(
              result.attempt
            ).toBe(2)
          }
        )

        it(
          'stops retrying and throws error once retry attempts are exhausted',
          async () => {
            let calls = 0

            vi.mocked(
              generateObject
            ).mockImplementation(
              async () => {
                calls += 1

                throw new Error(
                  'fetch failed'
                )
              }
            )

            await expect(
              executeGeminiAnalysis(
                'inst',
                'prompt',
                {
                  timeoutMs: 30000,
                  runtimeConfig:
                    makeFallbackRuntimeConfig({
                      timeoutMs: 30000,
                    }),
                }
              )
            ).rejects.toThrowError(
              'fetch failed'
            )

            expect(calls).toBe(2)
          }
        )

        it(
          'does not retry permanent errors such as authorization failures',
          async () => {
            let calls = 0

            vi.mocked(
              generateObject
            ).mockImplementation(
              async () => {
                calls += 1

                throw new Error(
                  'API Key Invalid'
                )
              }
            )

            await expect(
              executeGeminiAnalysis(
                'inst',
                'prompt',
                {
                  timeoutMs: 30000,
                  runtimeConfig:
                    makeFallbackRuntimeConfig({
                      timeoutMs: 30000,
                    }),
                }
              )
            ).rejects.toThrowError(
              'API Key Invalid'
            )

            expect(calls).toBe(1)
          }
        )
      }
    )

    describe(
      '5. Fallback Quality, Timeouts, Tokens and Logging Rules',
      () => {
        let spyConsoleInfo:
          ReturnType<
            typeof vi.spyOn
          >

        beforeEach(() => {
          spyConsoleInfo =
            vi.spyOn(
              console,
              'info'
            ).mockImplementation(
              () => {}
            )
        })

        afterEach(() => {
          spyConsoleInfo.mockRestore()
        })

        it(
          'uses primary model first, then fallback model on safe errors',
          async () => {
            const calls: string[] = []

            vi.mocked(
              generateObject
            ).mockImplementation(
              async (
                options: unknown
              ) => {
                const parsedOptions =
                  options as {
                    model: {
                      modelId: string
                    }
                  }

                const modelId =
                  parsedOptions.model
                    .modelId

                calls.push(modelId)

                if (
                  calls.length === 1
                ) {
                  throw new Error(
                    'Request aborted after 10000ms'
                  )
                }

                return {
                  object: {
                    overall_summary:
                      'Successful fallback',
                  },
                  output: {
                    overall_summary:
                      'Successful fallback',
                  },
                  usage: {
                    promptTokens: 150,
                    completionTokens: 200,
                    totalTokens: 350,
                    outputTokenDetails: {
                      reasoningTokens: 50,
                    },
                  },
                  finishReason: 'stop',
                } as unknown as Awaited<
                  ReturnType<
                    typeof generateObject
                  >
                >
              }
            )

            const result =
              await executeGeminiAnalysis(
                'system-inst',
                'user-prompt',
                {
                  timeoutMs: 30000,
                  requestId:
                    'test-req-id',
                  runtimeConfig:
                    makeFallbackRuntimeConfig({
                      timeoutMs: 30000,
                      thinkingBudget: 0,
                    }),
                }
              )

            expect(calls).toEqual([
              'gemini-2.5-flash',
              'gemini-2.5-flash-lite',
            ])

            expect(
              result.selectedModel
            ).toBe(
              'gemini-2.5-flash-lite'
            )

            expect(
              result.selectedProvider
            ).toBe('google')

            expect(
              result.attempt
            ).toBe(2)

            expect(
              result.usage
                ?.reasoningTokens
            ).toBe(50)

            expect(
              result.usage
                ?.visibleTokens
            ).toBe(150)

            expect(
              result.finishReason
            ).toBe('stop')

            expect(
              generateObject
            ).toHaveBeenCalledTimes(2)

            interface GenerateObjectArgs {
              providerOptions?: {
                google?: {
                  thinkingConfig?: {
                    thinkingBudget?:
                      number
                    includeThoughts?:
                      boolean
                  }
                }
              }
            }

            const firstCall =
              vi.mocked(
                generateObject
              ).mock.calls[0][0] as unknown as
                GenerateObjectArgs

            const secondCall =
              vi.mocked(
                generateObject
              ).mock.calls[1][0] as unknown as
                GenerateObjectArgs

            expect(
              firstCall
                .providerOptions
                ?.google
                ?.thinkingConfig
            ).toEqual({
              thinkingBudget: 0,
              includeThoughts: false,
            })

            expect(
              secondCall
                .providerOptions
                ?.google
                ?.thinkingConfig
            ).toEqual({
              thinkingBudget: 0,
              includeThoughts: false,
            })

            expect(
              spyConsoleInfo
            ).toHaveBeenCalled()

            const logLines =
              spyConsoleInfo.mock.calls.map(
                (
                  call: unknown[]
                ) =>
                  JSON.parse(
                    call[1] as string
                  )
              )

            expect(
              logLines[0]
            ).toMatchObject({
              requestId:
                'test-req-id',
              attempt: 1,
              selectedModel:
                'gemini-2.5-flash',
              provider: 'google',
              errorCategory:
                'upstream_provider_error',
            })

            expect(
              logLines[1]
            ).toMatchObject({
              requestId:
                'test-req-id',
              attempt: 2,
              selectedModel:
                'gemini-2.5-flash-lite',
              provider: 'google',
              finishReason: 'stop',
              visibleOutputTokens:
                150,
              reasoningTokens: 50,
              totalOutputTokens: 200,
            })

            const loggedString =
              JSON.stringify(
                logLines
              )

            expect(
              loggedString
            ).not.toContain(
              'user-prompt'
            )

            expect(
              loggedString
            ).not.toContain(
              'Successful fallback'
            )
          }
        )

        it(
          'starts a fallback attempt within the remaining operation budget',
          async () => {
            const calledModels:
              string[] = []

            vi.mocked(
              generateObject
            ).mockImplementation(
              async (
                options: unknown
              ) => {
                const parsedOptions =
                  options as {
                    model: {
                      modelId: string
                    }
                    abortSignal?:
                      AbortSignal
                  }

                calledModels.push(
                  parsedOptions.model
                    .modelId
                )

                expect(
                  parsedOptions
                    .abortSignal
                ).toBeInstanceOf(
                  AbortSignal
                )

                if (
                  parsedOptions.model
                    .modelId ===
                  'gemini-2.5-flash'
                ) {
                  throw new Error(
                    'PROVIDER_TIMEOUT'
                  )
                }

                return {
                  object: {
                    overall_summary:
                      'Success',
                  },
                  output: {
                    overall_summary:
                      'Success',
                  },
                  usage: {
                    promptTokens: 10,
                    completionTokens: 10,
                    totalTokens: 20,
                  },
                  finishReason: 'stop',
                } as unknown as Awaited<
                  ReturnType<
                    typeof generateObject
                  >
                >
              }
            )

            const result =
              await executeGeminiAnalysis(
                'inst',
                'prompt',
                {
                  timeoutMs: 20000,
                  runtimeConfig:
                    makeFallbackRuntimeConfig({
                      timeoutMs: 20000,
                    }),
                }
              )

            expect(
              generateObject
            ).toHaveBeenCalledTimes(2)

            expect(
              calledModels
            ).toEqual([
              'gemini-2.5-flash',
              'gemini-2.5-flash-lite',
            ])

            expect(
              result.attempt
            ).toBe(2)

            expect(
              result.selectedModel
            ).toBe(
              'gemini-2.5-flash-lite'
            )
          }
        )
      }
    )
  }
)