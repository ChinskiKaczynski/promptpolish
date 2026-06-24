import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { executeOpenRouterAnalysis, type TextGenerator } from '@/lib/ai/openrouter-client'
import { ProviderError } from '@/lib/ai/provider-errors'
import type { AnalysisResult } from '@/lib/ai/schemas'

describe('Fallback Classification & Configuration Tests', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.OPENROUTER_FALLBACK_MODEL_ID = 'openai/gpt-4o-mini'
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  it('triggers fallback on transient failure and succeeds on attempt 2', async () => {
    let callCount = 0
    const mockGenerator: TextGenerator = async () => {
      callCount++
      if (callCount === 1) {
        throw new ProviderError(
          'PROVIDER_TIMEOUT: Simulated transient failure for primary model (timeout)',
          'Simulated primary model timeout.',
          new Error('Simulated upstream timeout'),
          504,
          'provider_timeout'
        )
      }
      return {
        output: {
          overall_summary: 'Test summary',
          criteria_scores: []
        } as unknown as AnalysisResult,
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        finishReason: 'stop'
      }
    }

    const result = await executeOpenRouterAnalysis('sys', 'user', {
      textGenerator: mockGenerator
    })
    expect(result.attempt).toBe(2)
    expect(result.selectedModel).toBe('openai/gpt-4o-mini')
    expect(result.output.overall_summary).toBe('Test summary')
    expect(callCount).toBe(2)
  })

  it('does not trigger fallback on non-transient primary failure (e.g. 401)', async () => {
    let callCount = 0
    const mockGenerator: TextGenerator = async () => {
      callCount++
      throw new ProviderError(
        'Simulated non-transient failure (401 Unauthorized)',
        'Authentication failed.',
        new Error('Simulated 401'),
        401,
        'provider_authentication_error'
      )
    }

    await expect(
      executeOpenRouterAnalysis('sys', 'user', { textGenerator: mockGenerator })
    ).rejects.toThrow(/Simulated non-transient failure/)
    expect(callCount).toBe(1)
  })

  it('disables fallback when fallback ID is equal to primary ID', async () => {
    process.env.OPENROUTER_FALLBACK_MODEL_ID = 'openrouter/owl-alpha' // identical to default primary

    let callCount = 0
    const mockGenerator: TextGenerator = async () => {
      callCount++
      throw new ProviderError(
        'PROVIDER_TIMEOUT: Simulated transient failure',
        'Timeout',
        new Error('Simulated upstream timeout'),
        504,
        'provider_timeout'
      )
    }

    await expect(
      executeOpenRouterAnalysis('sys', 'user', { textGenerator: mockGenerator })
    ).rejects.toThrow(/PROVIDER_TIMEOUT/)
    expect(callCount).toBe(1)
  })

  it('disables fallback when fallback configuration is empty or absent', async () => {
    process.env.OPENROUTER_FALLBACK_MODEL_ID = '   ' // blank/whitespace

    let callCount = 0
    const mockGenerator: TextGenerator = async () => {
      callCount++
      throw new ProviderError(
        'PROVIDER_TIMEOUT: Simulated transient failure',
        'Timeout',
        new Error('Simulated upstream timeout'),
        504,
        'provider_timeout'
      )
    }

    await expect(
      executeOpenRouterAnalysis('sys', 'user', { textGenerator: mockGenerator })
    ).rejects.toThrow(/PROVIDER_TIMEOUT/)
    expect(callCount).toBe(1)
  })

  it('disables fallback when fallback ID is malformed (missing slash)', async () => {
    process.env.OPENROUTER_FALLBACK_MODEL_ID = 'gpt-4o-mini-malformed' // malformed

    let callCount = 0
    const mockGenerator: TextGenerator = async () => {
      callCount++
      throw new ProviderError(
        'PROVIDER_TIMEOUT: Simulated transient failure',
        'Timeout',
        new Error('Simulated upstream timeout'),
        504,
        'provider_timeout'
      )
    }

    await expect(
      executeOpenRouterAnalysis('sys', 'user', { textGenerator: mockGenerator })
    ).rejects.toThrow(/PROVIDER_TIMEOUT/)
    expect(callCount).toBe(1)
  })

  it('fails with double failure when both primary and fallback fail', async () => {
    let callCount = 0
    const mockGenerator: TextGenerator = async () => {
      callCount++
      if (callCount === 1) {
        throw new ProviderError(
          'PROVIDER_TIMEOUT: Simulated transient failure for primary model (timeout)',
          'Simulated primary model timeout.',
          new Error('Simulated upstream timeout'),
          504,
          'provider_timeout'
        )
      }
      throw new ProviderError(
        'PROVIDER_TIMEOUT: Simulated transient failure for fallback model (timeout)',
        'Simulated fallback model timeout.',
        new Error('Simulated upstream timeout'),
        504,
        'provider_timeout'
      )
    }

    await expect(
      executeOpenRouterAnalysis('sys', 'user', { textGenerator: mockGenerator })
    ).rejects.toThrow(/PROVIDER_TIMEOUT: Simulated transient failure for fallback/)
    expect(callCount).toBe(2)
  })
})
