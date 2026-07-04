import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/identity/anonymous', () => ({
  resolveOrCreateOwnerId: vi.fn().mockResolvedValue({ id: 'mocked-owner-id', isNew: false })
}))

vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn().mockResolvedValue(null)
}))

vi.mock('@/lib/supabase/queries', () => ({
  getModelProfileBySlug: vi.fn(),
  createPromptAnalysis: vi.fn(),
  createUsageEvent: vi.fn().mockResolvedValue(null),
  getUserProfile: vi.fn().mockResolvedValue(null),
  getUsageCountTodayForUser: vi.fn().mockResolvedValue(0),
  getUsageCountThisMonthForUser: vi.fn().mockResolvedValue(0),
  acquireReservation: vi.fn().mockResolvedValue('success:reserved'),
  completeReservation: vi.fn().mockResolvedValue(true),
  releaseReservation: vi.fn().mockResolvedValue(true)
}))

vi.mock('@/lib/ai/analyze-prompt', () => ({
  analyzePrompt: vi.fn()
}))

vi.mock('@/lib/env/server', () => ({
  serverEnv: {
    AI_PROVIDER_TIMEOUT_MS: 100,
    MIN_PROMPT_CHARS: 20,
    SENSITIVE_DATA_BLOCK_HIGH_RISK: true
  },
  checkProductionEnv: () => ({ valid: true })
}))

import { POST } from '@/app/api/analyze/route'
import { getModelProfileBySlug, createPromptAnalysis, releaseReservation } from '@/lib/supabase/queries'
import { analyzePrompt } from '@/lib/ai/analyze-prompt'
import type { ModelProfileRow } from '@/lib/supabase/types'

describe('Analyze Route Timeout & Abort integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(getModelProfileBySlug).mockResolvedValue({
      id: 'profile-uuid',
      slug: 'general-llm',
      display_name: 'General LLM',
      provider: 'google',
      model_family: 'gemini',
      profile_type: 'provider_model',
      source_type: 'internal',
      verification_status: 'verified',
      confidence_level: 'high',
      stale_after_days: 30,
      capabilities_json: {
        timeout_ms: 100 // short timeout for testing!
      },
      profile_version: '1.0.0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as unknown as ModelProfileRow)
  })

  it('aborts the provider request, releases reservation, and skips DB persistence on timeout', async () => {
    // Mock analyzePrompt to block until aborted
    vi.mocked(analyzePrompt).mockImplementation(async (params, options) => {
      const signal = options?.abortSignal
      const timeoutMs = options?.timeoutMs || 100
      return new Promise((resolve, reject) => {
        if (signal?.aborted) {
          reject(new Error('PROVIDER_TIMEOUT'))
          return
        }
        const timer = setTimeout(() => {
          reject(new Error('PROVIDER_TIMEOUT'))
        }, timeoutMs)
        signal?.addEventListener('abort', () => {
          clearTimeout(timer)
          reject(new Error('CLIENT_CLOSED'))
        })
      })
    })

    const payload = {
      input_prompt: 'To jest w pełni poprawny prompt o minimalnej długości dwudziestu znaków.',
      working_language: 'pl',
      selected_profile_slug: 'general-llm'
    }

    const request = new Request('http://localhost/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(504)
    expect(data.error).toBe('provider_timeout')

    // DB persistence was not called
    expect(createPromptAnalysis).not.toHaveBeenCalled()

    // Reservation is released
    expect(releaseReservation).toHaveBeenCalled()
  })
})
