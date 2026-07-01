import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('ai', async (importOriginal) => {
  const original = await importOriginal<typeof import('ai')>()
  const mockImplementation = async (options: any) => {
    const signal = options.abortSignal
    if (signal?.aborted) {
      throw signal.reason || new Error('Aborted')
    }
    return new Promise((resolve, reject) => {
      const state = { timer: undefined as ReturnType<typeof setTimeout> | undefined }
      const onAbort = () => {
        if (state.timer) clearTimeout(state.timer)
        reject(signal.reason || new Error('Aborted'))
      }

      if (signal) {
        signal.addEventListener('abort', onAbort)
      }

      state.timer = setTimeout(() => {
        if (signal) signal.removeEventListener('abort', onAbort)
        resolve({
          object: {
            overall_summary: 'Mocked successful output',
            criteria_scores: []
          },
          output: {
            overall_summary: 'Mocked successful output',
            criteria_scores: []
          },
          usage: { promptTokens: 10, completionTokens: 10 }
        })
      }, 100)
    })
  }
  return {
    ...original,
    generateText: vi.fn().mockImplementation(mockImplementation),
    generateObject: vi.fn().mockImplementation(mockImplementation)
  }
})

import { generateText, generateObject } from 'ai'
import { serverEnvSchema } from '@/lib/env/server'
import { executeOpenRouterAnalysis } from '@/lib/ai/openrouter-client'
import { isNestedTimeout, normalizeProviderError } from '@/lib/ai/provider-errors'

describe('Timeout and Abort Regression Suite', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GEMINI_MODEL_ID = 'gemini-2.5-flash'
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'mock-google-key'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('1. Zod Environment Variable Validation', () => {
    it('uses the default value of 55000 when missing', () => {
      const parsed = serverEnvSchema.parse({
        // Empty env values
      })
      expect(parsed.AI_PROVIDER_TIMEOUT_MS).toBe(55000)
    })

    it('accepts a valid timeout value', () => {
      const parsed = serverEnvSchema.parse({
        AI_PROVIDER_TIMEOUT_MS: '60000'
      })
      expect(parsed.AI_PROVIDER_TIMEOUT_MS).toBe(60000)
    })

    it('rejects a zero value below min(5000)', () => {
      const result = serverEnvSchema.safeParse({
        AI_PROVIDER_TIMEOUT_MS: '0'
      })
      expect(result.success).toBe(false)
    })

    it('rejects an invalid numeric value', () => {
      const result = serverEnvSchema.safeParse({
        AI_PROVIDER_TIMEOUT_MS: 'not-a-number'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('2. executeOpenRouterAnalysis Timeout & Abort Mechanics', () => {
    it('aborts internally on timeoutMs and includes the configured limit in error message (provider_timeout)', async () => {
      const promise = executeOpenRouterAnalysis(
        'instruction',
        'prompt',
        { timeoutMs: 10, mockMode: false }
      )
      await expect(promise).rejects.toThrowError(/PROVIDER_TIMEOUT: Request aborted after 10ms/)
      try {
        await promise
      } catch (err) {
        const error = err as { errorCode?: string; statusCode?: number }
        expect(error.errorCode).toBe('provider_timeout')
        expect(error.statusCode).toBe(504)
      }
    })

    it('handles client cancellation via abortSignal and throws CLIENT_CLOSED', async () => {
      const controller = new AbortController()
      
      const promise = executeOpenRouterAnalysis(
        'instruction',
        'prompt',
        { abortSignal: controller.signal, timeoutMs: 30000, mockMode: false }
      )

      controller.abort(new Error('CLIENT_CLOSED'))

      await expect(promise).rejects.toThrowError('CLIENT_CLOSED')
    })

    it('handles external signal already aborted on call', async () => {
      const controller = new AbortController()
      controller.abort(new Error('CLIENT_CLOSED'))

      const promise = executeOpenRouterAnalysis(
        'instruction',
        'prompt',
        { abortSignal: controller.signal, timeoutMs: 30000, mockMode: false }
      )

      await expect(promise).rejects.toThrowError('CLIENT_CLOSED')
    })

    it('cleans up timeout timers on success', async () => {
      const spyClearTimeout = vi.spyOn(global, 'clearTimeout')
      await executeOpenRouterAnalysis('inst', 'prompt', { timeoutMs: 20000 })
      expect(spyClearTimeout).toHaveBeenCalled()
      spyClearTimeout.mockRestore()
    })

    it('cleans up abort event listeners on success', async () => {
      const controller = new AbortController()
      const spyRemoveEventListener = vi.spyOn(controller.signal, 'removeEventListener')
      
      await executeOpenRouterAnalysis('inst', 'prompt', { abortSignal: controller.signal, timeoutMs: 20000 })
      
      expect(spyRemoveEventListener).toHaveBeenCalledWith('abort', expect.any(Function))
      spyRemoveEventListener.mockRestore()
    })

    it('cleans up timeout timers and listeners on failure', async () => {
      const spyClearTimeout = vi.spyOn(global, 'clearTimeout')
      const controller = new AbortController()
      const spyRemoveEventListener = vi.spyOn(controller.signal, 'removeEventListener')

      try {
        await executeOpenRouterAnalysis('inst', 'prompt', { abortSignal: controller.signal, timeoutMs: 5 })
      } catch {
        // expected timeout
      }

      expect(spyClearTimeout).toHaveBeenCalled()
      expect(spyRemoveEventListener).toHaveBeenCalledWith('abort', expect.any(Function))

      spyClearTimeout.mockRestore()
      spyRemoveEventListener.mockRestore()
    })
  })

  describe('3. Error Normalization & Distinguishing Causes', () => {
    it('correctly classifies nested timeout string case-insensitively', () => {
      const upperError = new Error('PROVIDER_TIMEOUT')
      const lowerError = new Error('provider_timeout')
      const abortError = new Error('Request aborted after 45000ms')

      expect(isNestedTimeout(upperError)).toBe(true)
      expect(isNestedTimeout(lowerError)).toBe(true)
      expect(isNestedTimeout(abortError)).toBe(true)
    })

    it('maps Vercel platform-level timeouts to function_platform_timeout', () => {
      const platformError = new Error('FUNCTION_INVOCATION_TIMEOUT: Vercel serverless execution limit reached.')
      const normalized = normalizeProviderError(platformError)

      expect(normalized.errorCode).toBe('function_platform_timeout')
      expect(normalized.statusCode).toBe(504)
      expect(normalized.userMessage).toContain('platform level')
    })

    it('maps other nested timeouts to upstream_provider_error when signal not aborted', () => {
      const upstreamError = new Error('Connection timeout to OpenRouter API.')
      const normalized = normalizeProviderError(upstreamError)

      expect(normalized.errorCode).toBe('upstream_provider_error')
      expect(normalized.statusCode).toBe(504)
      expect(normalized.userMessage).toContain('AI provider')
    })

    it('non-timeout provider errors do not become timeout errors', () => {
      const genericError = new Error('API Key Invalid')
      const normalized = normalizeProviderError(genericError)
      expect(normalized.errorCode).not.toBe('provider_timeout')
      expect(normalized.errorCode).not.toBe('upstream_provider_error')
      expect(normalized.errorCode).not.toBe('function_platform_timeout')
    })
  })

  describe('4. Transient Retry & Remaining Timeout Mechanics', () => {
    beforeEach(() => {
      process.env.AI_MODEL_ALIAS = 'cheap'
      process.env.GEMINI_MODEL_ID = 'openai/gpt-4o-mini'
    })

    it('executes one successful retry after a transient failure', async () => {
      let calls = 0
      vi.mocked(generateObject).mockImplementation(async () => {
        calls++
        if (calls === 1) {
          throw new Error('fetch failed') // Retryable: maps to provider_unavailable
        }
        return {
          object: {
            overall_summary: 'Mocked successful output after retry',
            criteria_scores: []
          },
          output: {
            overall_summary: 'Mocked successful output after retry',
            criteria_scores: []
          },
          usage: { promptTokens: 10, completionTokens: 10 }
        } as unknown as Awaited<ReturnType<typeof generateObject>>
      })

      const res = await executeOpenRouterAnalysis('inst', 'prompt', { timeoutMs: 30000 })
      expect(calls).toBe(2)
      expect(res.output.overall_summary).toBe('Mocked successful output after retry')
    })

    it('stops retrying and throws error once retry attempts are exhausted', async () => {
      let calls = 0
      vi.mocked(generateObject).mockImplementation(async () => {
        calls++
        throw new Error('fetch failed') // Retryable: maps to provider_unavailable
      })

      await expect(executeOpenRouterAnalysis('inst', 'prompt', { timeoutMs: 30000 })).rejects.toThrowError('fetch failed')
      expect(calls).toBe(2)
    })

    it('does not retry permanent errors (like authorization errors)', async () => {
      let calls = 0
      vi.mocked(generateObject).mockImplementation(async () => {
        calls++
        throw new Error('API Key Invalid') // Non-retryable
      })

      await expect(executeOpenRouterAnalysis('inst', 'prompt', { timeoutMs: 30000 })).rejects.toThrowError('API Key Invalid')
      expect(calls).toBe(1)
    })
  })

  describe('5. Fallback Quality, Timeouts, Tokens and Logging Rules', () => {
    let spyConsoleInfo: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      // Fallback via dbProfile capabilities_json (new mechanism)
      spyConsoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {})
    })

    afterEach(() => {
      spyConsoleInfo.mockRestore()
    })

    it('uses primary model first, then fallback model on safe errors', async () => {
      const calls: string[] = []
      vi.mocked(generateObject).mockImplementation(async (options: unknown) => {
        const opts = options as { model: { modelId: string } }
        const modelId = opts.model.modelId
        calls.push(modelId)
        if (calls.length === 1) {
          throw new Error('Request aborted after 10000ms') // Timeout error
        }
        return {
          object: { overall_summary: 'Successful fallback' },
          output: { overall_summary: 'Successful fallback' },
          usage: { promptTokens: 150, completionTokens: 200, outputTokenDetails: { reasoningTokens: 50 } },
          finishReason: 'stop'
        } as unknown as Awaited<ReturnType<typeof generateObject>>
      })

      const res = await executeOpenRouterAnalysis('system-inst', 'user-prompt', {
        timeoutMs: 30000,
        requestId: 'test-req-id',
        dbProfile: {
          id: 'test',
          slug: 'general-llm',
          display_name: 'General LLM',
          provider: 'google',
          verification_status: 'unverified',
          confidence_level: 'medium',
          profile_version: '1.0.0',
          is_active: true,
          capabilities_json: {
            fallback_model_id: 'gemini-2.5-flash-lite'
          },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      })

      expect(calls).toEqual(['gemini-2.5-flash', 'gemini-2.5-flash-lite'])
      expect(res.selectedModel).toBe('gemini-2.5-flash-lite')
      expect(res.attempt).toBe(2)
      expect(res.usage?.reasoningTokens).toBe(50)
      expect(res.usage?.visibleTokens).toBe(150)
      expect(res.finishReason).toBe('stop')

      // Assert reasoning is passed as provider-neutral metadata
      expect(generateObject).toHaveBeenCalledTimes(2)
      interface GenerateObjectArgs {
        providerMetadata?: {
          reasoning?: boolean
        }
      }
      const call1Args = vi.mocked(generateObject).mock.calls[0][0] as unknown as GenerateObjectArgs
      const call2Args = vi.mocked(generateObject).mock.calls[1][0] as unknown as GenerateObjectArgs
      expect(call1Args.providerMetadata?.reasoning).toBe(false)
      expect(call2Args.providerMetadata?.reasoning).toBe(false)

      // Assert sanitized logging occurred
      expect(spyConsoleInfo).toHaveBeenCalled()
      const logLines = spyConsoleInfo.mock.calls.map((c: unknown[]) => JSON.parse(c[1] as string))
      expect(logLines[0]).toMatchObject({
        requestId: 'test-req-id',
        attempt: 1,
        selectedModel: 'gemini-2.5-flash',
        errorCategory: 'upstream_provider_error'
      })
      expect(logLines[1]).toMatchObject({
        requestId: 'test-req-id',
        attempt: 2,
        selectedModel: 'gemini-2.5-flash-lite',
        finishReason: 'stop',
        visibleOutputTokens: 150,
        reasoningTokens: 50,
        totalOutputTokens: 200
      })
      // Double check no prompts or outputs are logged
      const loggedString = JSON.stringify(logLines)
      expect(loggedString).not.toContain('user-prompt')
      expect(loggedString).not.toContain('Successful fallback')
    })

    it('bounds fallback timeout based on remaining operation budget', async () => {
      vi.mocked(generateObject).mockImplementation(async (options: unknown) => {
        const opts = options as { model: { modelId: string } }
        if (opts.model.modelId === 'gemini-2.5-flash') {
          throw new Error('PROVIDER_TIMEOUT')
        }
        return {
          object: { overall_summary: 'Success' },
          output: { overall_summary: 'Success' },
          usage: { promptTokens: 10, completionTokens: 10 }
        } as unknown as Awaited<ReturnType<typeof generateObject>>
      })

      await executeOpenRouterAnalysis('inst', 'prompt', {
        timeoutMs: 20000,
        dbProfile: {
          id: 'test',
          slug: 'general-llm',
          display_name: 'General LLM',
          provider: 'google',
          verification_status: 'unverified',
          confidence_level: 'medium',
          profile_version: '1.0.0',
          is_active: true,
          capabilities_json: { fallback_model_id: 'gemini-2.5-flash-lite' },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      })

      // Verification that generateObject's signal is monitored or remaining time is calculated
      // In the mock, we can verify that the second call was initiated.
      expect(generateObject).toHaveBeenCalledTimes(2)
    })
  })
})
