import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { executeOpenRouterAnalysis } from '@/lib/ai/openrouter-client'

vi.mock('ai', async (importOriginal) => {
  const original = await importOriginal<typeof import('ai')>()
  return {
    ...original,
    generateText: vi.fn().mockResolvedValue({
      output: {
        overall_summary: 'Test summary',
        criteria_scores: []
      },
      usage: { promptTokens: 10, completionTokens: 10 },
      finishReason: 'stop'
    })
  }
})

describe('Fallback Classification & Configuration Tests', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'mock-key'
    process.env.OPENROUTER_MODEL_ID = 'deepseek/deepseek-v4-flash'
    process.env.OPENROUTER_FALLBACK_MODEL_ID = 'openai/gpt-4o-mini'
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  it('triggers fallback on transient failure and succeeds on attempt 2', async () => {
    process.env.TEST_FORCE_PRIMARY_FAILURE = 'true'

    const result = await executeOpenRouterAnalysis('sys', 'user')
    expect(result.attempt).toBe(2)
    expect(result.selectedModel).toBe('openai/gpt-4o-mini')
    expect(result.output.overall_summary).toBe('Test summary')
  })

  it('does not trigger fallback on non-transient primary failure (e.g. 401)', async () => {
    process.env.TEST_FORCE_PRIMARY_NON_TRANSIENT_FAILURE = 'true'

    await expect(executeOpenRouterAnalysis('sys', 'user')).rejects.toThrow(
      /Simulated non-transient failure/
    )
  })

  it('disables fallback when fallback ID is equal to primary ID', async () => {
    process.env.TEST_FORCE_PRIMARY_FAILURE = 'true'
    process.env.OPENROUTER_FALLBACK_MODEL_ID = 'deepseek/deepseek-v4-flash' // identical

    await expect(executeOpenRouterAnalysis('sys', 'user')).rejects.toThrow(
      /PROVIDER_TIMEOUT: Simulated transient failure/
    )
  })

  it('disables fallback when fallback configuration is empty or absent', async () => {
    process.env.TEST_FORCE_PRIMARY_FAILURE = 'true'
    process.env.OPENROUTER_FALLBACK_MODEL_ID = '   ' // blank/whitespace

    await expect(executeOpenRouterAnalysis('sys', 'user')).rejects.toThrow(
      /PROVIDER_TIMEOUT: Simulated transient failure/
    )
  })

  it('disables fallback when fallback ID is malformed (missing slash)', async () => {
    process.env.TEST_FORCE_PRIMARY_FAILURE = 'true'
    process.env.OPENROUTER_FALLBACK_MODEL_ID = 'gpt-4o-mini-malformed' // malformed

    await expect(executeOpenRouterAnalysis('sys', 'user')).rejects.toThrow(
      /PROVIDER_TIMEOUT: Simulated transient failure/
    )
  })

  it('fails with double failure when both primary and fallback fail', async () => {
    process.env.TEST_FORCE_PRIMARY_FAILURE = 'true'
    process.env.TEST_FORCE_FALLBACK_FAILURE = 'true'

    await expect(executeOpenRouterAnalysis('sys', 'user')).rejects.toThrow(
      /PROVIDER_TIMEOUT: Simulated transient failure for fallback/
    )
  })
})
