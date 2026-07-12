import { describe, expect, it, vi, beforeEach, afterEach, type Mock, type MockInstance } from 'vitest'
import { validateLiveAiEnvironment } from '../../scripts/live-ai/live-guard'
import * as geminiClient from '@/lib/ai/gemini-client'

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: vi.fn(() => ({
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      })),
      insert: vi.fn(),
      update: vi.fn()
    }))
  }))
}))

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn()
}))

describe('Live Scripts Environment Validation Unit Tests', () => {
  const baseEnv = {
    RUN_LIVE_AI_TESTS: 'true',
    NODE_ENV: 'development',
    GOOGLE_GENERATIVE_AI_API_KEY: 'mock-google-key',
    APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_SUPABASE_URL: 'https://local-supabase.supabase.co'
  }

  it('allows valid environment parameters', () => {
    const res = validateLiveAiEnvironment(baseEnv)
    expect(res.allowed).toBe(true)
    expect(res.reasons).toHaveLength(0)
  })

  it('blocks if NODE_ENV=production', () => {
    const res = validateLiveAiEnvironment({ ...baseEnv, NODE_ENV: 'production' })
    expect(res.allowed).toBe(false)
    expect(res.reasons).toContain('NODE_ENV is production')
  })

  it('blocks if RUN_LIVE_AI_TESTS is not true', () => {
    const res = validateLiveAiEnvironment({ ...baseEnv, RUN_LIVE_AI_TESTS: 'false' })
    expect(res.allowed).toBe(false)
    expect(res.reasons).toContain('RUN_LIVE_AI_TESTS is not true')

    const res2 = validateLiveAiEnvironment({ ...baseEnv, RUN_LIVE_AI_TESTS: undefined })
    expect(res2.allowed).toBe(false)
    expect(res2.reasons).toContain('RUN_LIVE_AI_TESTS is not true')
  })

  it('blocks if GOOGLE_GENERATIVE_AI_API_KEY is missing or empty', () => {
    const res = validateLiveAiEnvironment({ ...baseEnv, GOOGLE_GENERATIVE_AI_API_KEY: '' })
    expect(res.allowed).toBe(false)
    expect(res.reasons).toContain('GOOGLE_GENERATIVE_AI_API_KEY is missing')

    const res2 = validateLiveAiEnvironment({ ...baseEnv, GOOGLE_GENERATIVE_AI_API_KEY: undefined })
    expect(res2.allowed).toBe(false)
    expect(res2.reasons).toContain('GOOGLE_GENERATIVE_AI_API_KEY is missing')
  })

  it('blocks if APP_URL is a production URL', () => {
    const res = validateLiveAiEnvironment({ ...baseEnv, APP_URL: 'https://promptpolish-seven.vercel.app' })
    expect(res.allowed).toBe(false)
    expect(res.reasons).toContain('App URL points to production')

    const res2 = validateLiveAiEnvironment({ ...baseEnv, APP_URL: 'https://mycustomdomain.com' })
    expect(res2.allowed).toBe(false)
    expect(res2.reasons).toContain('App URL points to production')
  })

  it('blocks if NEXT_PUBLIC_SUPABASE_URL points to production database reference', () => {
    const res = validateLiveAiEnvironment({ ...baseEnv, NEXT_PUBLIC_SUPABASE_URL: 'https://uddpuxpdoctgaqabenol.supabase.co' })
    expect(res.allowed).toBe(false)
    expect(res.reasons).toContain('Supabase URL points to production')
  })
})

describe('Live Scripts Script-Load Guard Integration Tests', () => {
  const originalEnv = { ...process.env }
  const originalExit = process.exit
  let processExitSpy: Mock
  let providerExecutorSpy: MockInstance
  let fetchSpy: MockInstance

  beforeEach(() => {
    process.env = { ...originalEnv }
    processExitSpy = vi.fn() as unknown as Mock
    process.exit = processExitSpy as unknown as (code?: number | string | null) => never
    providerExecutorSpy = vi.spyOn(geminiClient, 'executeGeminiAnalysis').mockImplementation(async () => {
      return {
        output: {
          analysis_schema_version: '1.0.0',
          overall_summary: 'mock summary',
          detected_task_type: 'mock type',
          criteria_scores: [
            { criterion: 'goal_clarity', raw_score_0_10: 10, rationale: 'ok', improvement_suggestion: 'ok' },
            { criterion: 'context_completeness', raw_score_0_10: 10, rationale: 'ok', improvement_suggestion: 'ok' },
            { criterion: 'structure', raw_score_0_10: 10, rationale: 'ok', improvement_suggestion: 'ok' },
            { criterion: 'constraints', raw_score_0_10: 10, rationale: 'ok', improvement_suggestion: 'ok' },
            { criterion: 'output_format', raw_score_0_10: 10, rationale: 'ok', improvement_suggestion: 'ok' },
            { criterion: 'model_profile_fit', raw_score_0_10: 10, rationale: 'ok', improvement_suggestion: 'ok' },
            { criterion: 'resistance_to_misinterpretation', raw_score_0_10: 10, rationale: 'ok', improvement_suggestion: 'ok' },
            { criterion: 'cost_efficiency', raw_score_0_10: 10, rationale: 'ok', improvement_suggestion: 'ok' },
            { criterion: 'safety', raw_score_0_10: 10, rationale: 'ok', improvement_suggestion: 'ok' },
            { criterion: 'testability', raw_score_0_10: 10, rationale: 'ok', improvement_suggestion: 'ok' }
          ],
          top_weaknesses: ['mock weakness'],
          improvement_plan: ['mock plan'],
          improved_prompt: 'mocked',
          change_explanations: ['mock explanation'],
          model_fit_notes: [],
          uncertainty_warnings: [],
          safety_notes: []
        },
        finishReason: 'stop',
        selectedModel: 'mock-model',
        attempt: 1,
        durationMs: 1
      }
    })
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    process.env = originalEnv
    process.exit = originalExit
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  const testCases = [
    {
      name: 'exits if RUN_LIVE_AI_TESTS is not true for calibration',
      env: { RUN_LIVE_AI_TESTS: 'false', NODE_ENV: 'development' },
      script: '../../scripts/live-ai/run-calibration.live.test'
    },
    {
      name: 'exits if NODE_ENV is production for calibration',
      env: { RUN_LIVE_AI_TESTS: 'true', NODE_ENV: 'production' },
      script: '../../scripts/live-ai/run-calibration.live.test'
    },
    {
      name: 'exits if GOOGLE_GENERATIVE_AI_API_KEY is missing for calibration',
      env: { RUN_LIVE_AI_TESTS: 'true', NODE_ENV: 'development', GOOGLE_GENERATIVE_AI_API_KEY: '' },
      script: '../../scripts/live-ai/run-calibration.live.test'
    },
    {
      name: 'exits if APP_URL is production for calibration',
      env: { RUN_LIVE_AI_TESTS: 'true', NODE_ENV: 'development', APP_URL: 'https://promptpolish-seven.vercel.app' },
      script: '../../scripts/live-ai/run-calibration.live.test'
    },
    {
      name: 'exits if Supabase URL is production for calibration',
      env: { RUN_LIVE_AI_TESTS: 'true', NODE_ENV: 'development', NEXT_PUBLIC_SUPABASE_URL: 'https://uddpuxpdoctgaqabenol.supabase.co' },
      script: '../../scripts/live-ai/run-calibration.live.test'
    },
    {
      name: 'exits if RUN_LIVE_AI_TESTS is not true for route check',
      env: { RUN_LIVE_AI_TESTS: 'false', NODE_ENV: 'development' },
      script: '../../scripts/live-ai/run-fallback-route-check.live.test'
    },
    {
      name: 'exits if NODE_ENV is production for route check',
      env: { RUN_LIVE_AI_TESTS: 'true', NODE_ENV: 'production' },
      script: '../../scripts/live-ai/run-fallback-route-check.live.test'
    }
  ]

  for (const tc of testCases) {
    it(tc.name, async () => {
      // Set the test environment variables
      Object.assign(process.env, tc.env)

      vi.resetModules()
      try {
        await import(tc.script)
      } catch (err) {
        console.error('IMPORT ERROR:', err)
      }

      // Assert controlled blocking and zero execution
      expect(processExitSpy).toHaveBeenCalledWith(1)
      expect(providerExecutorSpy).not.toHaveBeenCalled()
      expect(fetchSpy).not.toHaveBeenCalled()
    })
  }
})
