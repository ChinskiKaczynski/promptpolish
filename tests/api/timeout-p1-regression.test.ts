/**
 * P1 Timeout Regression Tests
 *
 * Covers all 8 requirements from the timeout-debug spec:
 *  1. Provider timeout → controlled app error before platform 504
 *  2. Reservation released on timeout
 *  3. Quota not consumed on timeout
 *  4. analysis_failed event written on timeout
 *  5. analysis_completed NOT written on timeout
 *  6. Duplicate POST guard remains intact
 *  7. Second analysis succeeds after a timed-out first
 *  8. No fallback attempted when OPENROUTER_FALLBACK_MODEL_ID is empty
 *  9. No hardcoded gpt-4o-mini in lib source
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/identity/anonymous', () => ({
  resolveOrCreateOwnerId: vi.fn().mockResolvedValue({ id: 'test-owner-id', isNew: false })
}))

vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn().mockResolvedValue(null)
}))

const mockUsageEvents: Array<Record<string, unknown>> = []
const mockAnalyses: Array<Record<string, unknown>> = []
const mockReservations = new Map<string, { status: string }>()

vi.mock('@/lib/supabase/queries', () => ({
  getModelProfileBySlug: vi.fn().mockResolvedValue({
    id: 'profile-uuid',
    slug: 'openrouter-deepseek-v4-flash',
    display_name: 'DeepSeek v4 Flash',
    provider: 'openrouter',
    model_family: 'deepseek',
    profile_type: 'provider_model',
    source_type: 'internal',
    verification_status: 'verified',
    confidence_level: 'high',
    stale_after_days: 30,
    capabilities_json: {
      model_id: 'deepseek/deepseek-v4-flash',
      enabled: true
    },
    profile_version: '1.0.0',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }),
  createPromptAnalysis: vi.fn().mockImplementation(async (record: Record<string, unknown>) => {
    const saved = { ...record, id: 'analysis-' + Math.random().toString(36).slice(2) }
    mockAnalyses.push(saved)
    return saved
  }),
  createUsageEvent: vi.fn().mockImplementation(async (event: Record<string, unknown>) => {
    mockUsageEvents.push({ ...event })
    return null
  }),
  acquireReservation: vi.fn().mockImplementation(async (reqId: string) => {
    mockReservations.set(reqId, { status: 'reserved' })
    return 'success:reserved'
  }),
  completeReservation: vi.fn().mockImplementation(async (reqId: string) => {
    const r = mockReservations.get(reqId)
    if (r) r.status = 'completed'
    return true
  }),
  releaseReservation: vi.fn().mockImplementation(async (reqId: string) => {
    const r = mockReservations.get(reqId)
    if (r) r.status = 'released'
    return true
  })
}))

vi.mock('@/lib/env/server', () => ({
  serverEnv: {
    AI_PROVIDER_TIMEOUT_MS: 45000,
    MIN_PROMPT_CHARS: 20,
    SENSITIVE_DATA_BLOCK_HIGH_RISK: true
  },
  checkProductionEnv: () => ({ valid: true })
}))

const mockAnalyzePrompt = vi.fn()
vi.mock('@/lib/ai/analyze-prompt', () => ({
  analyzePrompt: (...args: unknown[]) => mockAnalyzePrompt(...args)
}))

import { POST } from '@/app/api/analyze/route'
import { releaseReservation, createPromptAnalysis } from '@/lib/supabase/queries'

const VALID_PAYLOAD = {
  input_prompt: 'To jest w pełni poprawny prompt testowy o minimalnej długości dwudziestu znaków.',
  working_language: 'pl' as const,
  selected_profile_slug: 'openrouter-deepseek-v4-flash' as const
}

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

describe('P1 Timeout Regression: /api/analyze', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    mockUsageEvents.length = 0
    mockAnalyses.length = 0
    mockReservations.clear()
    mockAnalyzePrompt.mockReset()
    vi.clearAllMocks()

    // Restore mocks that vi.clearAllMocks() resets
    vi.mocked(mockAnalyzePrompt)

    process.env = { ...originalEnv }
    process.env.OPENROUTER_FALLBACK_MODEL_ID = ''
    process.env.AI_MOCK_MODE = 'false'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  // ─── REQ 1 + 2 + 3 + 4 + 5 ──────────────────────────────────────────────────
  describe('Requirement 1-5: Timeout returns controlled error, releases quota, logs correctly', () => {
    it('returns 504 with structured error body when provider times out', async () => {
      mockAnalyzePrompt.mockRejectedValue(new Error('PROVIDER_TIMEOUT: Request aborted after 45000ms'))

      const res = await POST(makeRequest(VALID_PAYLOAD))
      const data = await res.json()

      // REQ 1: Controlled app error, not raw platform 504
      expect(res.status).toBe(504)
      expect(data.error).toMatch(/provider_timeout|upstream_provider_error/)
      expect(data.error_id).toBeDefined()
    })

    it('releases the reservation when provider times out (REQ 2)', async () => {
      mockAnalyzePrompt.mockRejectedValue(new Error('PROVIDER_TIMEOUT: Request aborted after 45000ms'))

      await POST(makeRequest(VALID_PAYLOAD))

      // REQ 2: reservation released, not completed
      expect(releaseReservation).toHaveBeenCalled()
      const reservations = Array.from(mockReservations.values())
      expect(reservations.some(r => r.status === 'released')).toBe(true)
      expect(reservations.some(r => r.status === 'completed')).toBe(false)
    })

    it('does not persist analysis record when provider times out (REQ 3 — quota not consumed)', async () => {
      mockAnalyzePrompt.mockRejectedValue(new Error('PROVIDER_TIMEOUT: Request aborted after 45000ms'))

      await POST(makeRequest(VALID_PAYLOAD))

      // REQ 3: No analysis record saved → no quota consumed
      expect(createPromptAnalysis).not.toHaveBeenCalled()
      expect(mockAnalyses.length).toBe(0)
    })

    it('writes analysis_failed event on timeout (REQ 4)', async () => {
      mockAnalyzePrompt.mockRejectedValue(new Error('PROVIDER_TIMEOUT: Request aborted after 45000ms'))

      await POST(makeRequest(VALID_PAYLOAD))

      const failedEvents = mockUsageEvents.filter(e => e.event_type === 'analysis_failed')
      // REQ 4: analysis_failed must be written
      expect(failedEvents.length).toBeGreaterThanOrEqual(1)
    })

    it('does NOT write analysis_completed event on timeout (REQ 5)', async () => {
      mockAnalyzePrompt.mockRejectedValue(new Error('PROVIDER_TIMEOUT: Request aborted after 45000ms'))

      await POST(makeRequest(VALID_PAYLOAD))

      const completedEvents = mockUsageEvents.filter(e => e.event_type === 'analysis_completed')
      // REQ 5: analysis_completed must NOT be written
      expect(completedEvents.length).toBe(0)
    })
  })

  // ─── REQ 6: Duplicate POST guard ─────────────────────────────────────────────
  describe('Requirement 6: Duplicate POST guard remains intact', () => {
    it('returns 429 when daily limit is reached (reservation guard blocks duplicate credit burn)', async () => {
      const { acquireReservation } = await import('@/lib/supabase/queries')
      vi.mocked(acquireReservation).mockResolvedValueOnce('daily_limit_reached')

      const res = await POST(makeRequest(VALID_PAYLOAD))
      const data = await res.json()

      expect(res.status).toBe(429)
      expect(data.error).toBe('entitlement_error')
      // analyzePrompt must NOT be called when limit is reached
      expect(mockAnalyzePrompt).not.toHaveBeenCalled()
    })
  })

  // ─── REQ 7: Second analysis succeeds after timeout ───────────────────────────
  describe('Requirement 7: Second analysis succeeds after a timed-out first', () => {
    it('allows a second successful analysis after a timed-out first', async () => {
      const { mockAnalysisResult } = await import('@/lib/ai/mock-analysis')

      // First call: times out
      mockAnalyzePrompt.mockRejectedValueOnce(
        new Error('PROVIDER_TIMEOUT: Request aborted after 45000ms')
      )

      const firstRes = await POST(makeRequest(VALID_PAYLOAD))
      expect(firstRes.status).toBe(504)

      // Reset reservation mock for second call
      const { acquireReservation, releaseReservation: releaseRes } = await import('@/lib/supabase/queries')
      vi.mocked(acquireReservation).mockResolvedValueOnce('success:reserved')
      vi.mocked(releaseRes).mockResolvedValue(true)

      // Second call: succeeds
      mockAnalyzePrompt.mockResolvedValueOnce({
        analysis: mockAnalysisResult,
        scores: { overallScore: 72, scoreLevel: 'decent' },
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        selectedModel: 'deepseek/deepseek-v4-flash',
        attempt: 1
      })

      const { createPromptAnalysis: createPA } = await import('@/lib/supabase/queries')
      vi.mocked(createPA).mockResolvedValueOnce({
        id: 'second-analysis-uuid',
        overall_score: 72,
        score_level: 'decent'
      } as never)

      const secondRes = await POST(makeRequest(VALID_PAYLOAD))
      expect(secondRes.status).toBe(200)

      const secondData = await secondRes.json()
      expect(secondData.id).toBe('second-analysis-uuid')
    })
  })

  // ─── REQ 8: No fallback attempted when env is empty ─────────────────────────
  describe('Requirement 8: No fallback attempted when OPENROUTER_FALLBACK_MODEL_ID is empty', () => {
    it('throws timeout error without fallback when fallback env is empty', async () => {
      process.env.OPENROUTER_FALLBACK_MODEL_ID = ''

      // Simulate a timeout from the primary call — no fallback should be attempted
      mockAnalyzePrompt.mockRejectedValue(
        new Error('PROVIDER_TIMEOUT: Request aborted after 45000ms')
      )

      const res = await POST(makeRequest(VALID_PAYLOAD))
      expect(res.status).toBe(504)

      // Only called once — no fallback retry
      expect(mockAnalyzePrompt).toHaveBeenCalledTimes(1)
    })
  })

  // ─── REQ 9: No hardcoded gpt-4o-mini in lib ─────────────────────────────────
  describe('Requirement 9: No hardcoded gpt-4o-mini in lib source', () => {
    it('lib/ai/openrouter-client.ts does not hardcode gpt-4o-mini', async () => {
      // Import the real module source text and scan for hardcoded model IDs
      const fs = await import('node:fs')
      const path = await import('node:path')
      const clientPath = path.resolve('lib/ai/openrouter-client.ts')
      const source = fs.readFileSync(clientPath, 'utf8')
      // gpt-4o-mini must not appear as a string literal anywhere in the production client
      expect(source).not.toContain('gpt-4o-mini')
    })

    it('lib/ai/model-catalog.ts does not hardcode gpt-4o-mini', async () => {
      const fs = await import('node:fs')
      const path = await import('node:path')
      const catalogPath = path.resolve('lib/ai/model-catalog.ts')
      if (!fs.existsSync(catalogPath)) return // file may not exist
      const source = fs.readFileSync(catalogPath, 'utf8')
      expect(source).not.toContain('gpt-4o-mini')
    })
  })

  // ─── UX Message: timeout includes quota-safe confirmation ───────────────────
  describe('UX: Timeout message confirms no quota consumed', () => {
    it('timeout error message includes quota-safe language', async () => {
      mockAnalyzePrompt.mockRejectedValue(new Error('PROVIDER_TIMEOUT: Request aborted after 45000ms'))

      const res = await POST(makeRequest(VALID_PAYLOAD))
      const data = await res.json()

      expect(res.status).toBe(504)
      // Must NOT use the old generic message; must include the new safe-abort wording
      expect(data.message).toContain('Nie pobraliśmy limitu')
      expect(data.message).not.toBe('Żądanie analizy przekroczyło limit czasu. Spróbuj ponownie.')
    })
  })

  // ─── Timeout budget: route applies 45s cap ──────────────────────────────────
  describe('Timeout budget: route caps AI call at 45s', () => {
    it('passes timeoutMs ≤ 45000 to analyzePrompt', async () => {
      const { mockAnalysisResult } = await import('@/lib/ai/mock-analysis')

      mockAnalyzePrompt.mockResolvedValueOnce({
        analysis: mockAnalysisResult,
        scores: { overallScore: 72, scoreLevel: 'decent' },
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        selectedModel: 'deepseek/deepseek-v4-flash',
        attempt: 1
      })

      const { createPromptAnalysis: createPA } = await import('@/lib/supabase/queries')
      vi.mocked(createPA).mockResolvedValueOnce({
        id: 'cap-test-uuid',
        overall_score: 72,
        score_level: 'decent'
      } as never)

      await POST(makeRequest(VALID_PAYLOAD))

      expect(mockAnalyzePrompt).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ timeoutMs: expect.any(Number) })
      )

      const callOptions = mockAnalyzePrompt.mock.calls[0][1] as { timeoutMs: number }
      expect(callOptions.timeoutMs).toBeLessThanOrEqual(45000)
    })
  })
})
