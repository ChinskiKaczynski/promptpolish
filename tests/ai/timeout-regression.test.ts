import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('ai', async (importOriginal) => {
  const original = await importOriginal<typeof import('ai')>()
  return {
    ...original,
    generateText: vi.fn().mockImplementation(async (options) => {
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
            output: {
              overall_summary: 'Mocked successful output',
              criteria_scores: []
            },
            usage: { promptTokens: 10, completionTokens: 10 }
          })
        }, 100)
      })
    })
  }
})

import { serverEnvSchema } from '@/lib/env/server'
import { executeOpenRouterAnalysis } from '@/lib/ai/openrouter-client'
import { isNestedTimeout, normalizeProviderError } from '@/lib/ai/provider-errors'

describe('Timeout and Abort Regression Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.OPENROUTER_API_KEY = 'mock-key'
  })

  describe('1. Zod Environment Variable Validation', () => {
    it('uses the default value of 45000 when missing', () => {
      const parsed = serverEnvSchema.parse({
        // Empty env values
      })
      expect(parsed.AI_PROVIDER_TIMEOUT_MS).toBe(45000)
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
})
