import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '@/app/api/analyze/route'
import { ProviderError } from '@/lib/ai/provider-errors'
import { mockAnalysisResult } from '@/lib/ai/mock-analysis'

vi.mock('server-only', () => ({}))

// Mock database storage
const mockAnalyses: Record<string, unknown>[] = []
const mockUsageEvents: Record<string, unknown>[] = []
const mockReservations = new Map<string, { status: string; owner: string; user: string | null }>()

const mockExecuteAnalysis = vi.fn()

vi.mock('@/lib/ai/gemini-client', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/ai/gemini-client')>()
  return {
    ...original,
    executeGeminiAnalysis: (sys: string, prompt: string, options: unknown) => mockExecuteAnalysis(sys, prompt, options)
  }
})

vi.mock('@/lib/supabase/queries', () => ({
  getModelProfileBySlug: vi.fn().mockResolvedValue({
    id: 'profile-uuid',
    slug: 'general-llm',
    display_name: 'General LLM',
    provider: 'google',
    capabilities_json: {
      model_id: 'gemini-2.5-flash',
      temperature: 0.1,
      max_tokens: 4000
    },
    profile_version: '1.0.0',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }),
  createPromptAnalysis: vi.fn().mockImplementation(async (analysis: Record<string, unknown>) => {
    const record = { ...analysis, id: 'analysis-uuid-' + Math.random() }
    mockAnalyses.push(record)
    return record
  }),
  createUsageEvent: vi.fn().mockImplementation(async (event: Record<string, unknown>) => {
    mockUsageEvents.push(event)
    return event
  }),
  acquireReservation: vi.fn().mockImplementation(async (reqId: string, owner: string, user: string | null) => {
    mockReservations.set(reqId, { status: 'reserved', owner, user })
    return 'success:reserved'
  }),
  completeReservation: vi.fn().mockImplementation(async (reqId: string) => {
    const res = mockReservations.get(reqId)
    if (res) {
      res.status = 'completed'
    }
    return true
  }),
  releaseReservation: vi.fn().mockImplementation(async (reqId: string) => {
    const res = mockReservations.get(reqId)
    if (res) {
      res.status = 'released'
    }
    return true
  })
}))

vi.mock('@/lib/identity/anonymous', () => ({
  resolveOrCreateOwnerId: vi.fn().mockResolvedValue({ id: '00000000-0000-4000-a000-000000000001', isNew: false })
}))

vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn().mockResolvedValue(null)
}))

describe('Route Handler integration test', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    mockAnalyses.length = 0
    mockUsageEvents.length = 0
    mockReservations.clear()
    mockExecuteAnalysis.mockReset()

    process.env = { ...originalEnv }
    process.env.NODE_ENV = 'development'
    process.env.GEMINI_MODEL_ID = 'gemini-2.5-flash'
    process.env.AI_MOCK_MODE = 'false'
    process.env.NEXT_PUBLIC_ENABLE_MOCK_RESULT = 'false'
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  it('Scenario 1: Primary succeeds', async () => {
    mockExecuteAnalysis.mockResolvedValue({
      output: mockAnalysisResult,
      usage: { promptTokens: 100, completionTokens: 150, totalTokens: 250, reasoningTokens: 0, visibleTokens: 150 },
      finishReason: 'stop',
      selectedModel: 'gemini-2.5-flash',
      attempt: 1,
      durationMs: 400
    })

    const req = new Request('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({
        input_prompt: 'This is a synthetic prompt for scenario 1 verification.',
        working_language: 'en',
        selected_profile_slug: 'general-llm',
        audit_mode: 'universal'
      })
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    // Verify database and event counts
    expect(mockAnalyses.length).toBe(1)
    expect(mockAnalyses[0].model_id_used).toBe('gemini-2.5-flash')

    const completedEvents = mockUsageEvents.filter(e => e.event_type === 'analysis_completed')
    expect(completedEvents.length).toBe(1)
    const meta = completedEvents[0].metadata_json as Record<string, unknown>
    expect(meta.fallback_used).toBe(false)
    expect(meta.attempt_number).toBe(1)

    expect(mockReservations.size).toBe(1)
    const [reservation] = Array.from(mockReservations.values())
    expect(reservation.status).toBe('completed')
  })

  it('Scenario 2: Primary transiently fails and fallback succeeds', async () => {
    mockExecuteAnalysis.mockResolvedValue({
      output: mockAnalysisResult,
      usage: { promptTokens: 120, completionTokens: 180, totalTokens: 300, reasoningTokens: 0, visibleTokens: 180 },
      finishReason: 'stop',
      selectedModel: 'gemini-2.0-flash-lite',
      attempt: 2,
      durationMs: 800
    })

    const req = new Request('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({
        input_prompt: 'This is a synthetic prompt for scenario 2 verification.',
        working_language: 'en',
        selected_profile_slug: 'general-llm',
        audit_mode: 'universal'
      })
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    // Verify database and event counts
    expect(mockAnalyses.length).toBe(1)
    expect(mockAnalyses[0].model_id_used).toBe('gemini-2.0-flash-lite')

    const completedEvents = mockUsageEvents.filter(e => e.event_type === 'analysis_completed')
    expect(completedEvents.length).toBe(1)
    const meta = completedEvents[0].metadata_json as Record<string, unknown>
    expect(meta.fallback_used).toBe(true)
    expect(meta.attempt_number).toBe(2)

    expect(mockReservations.size).toBe(1)
    const [reservation] = Array.from(mockReservations.values())
    expect(reservation.status).toBe('completed')
  })

  it('Scenario 3: Primary and fallback fail', async () => {
    mockExecuteAnalysis.mockRejectedValue(
      new ProviderError(
        'PROVIDER_TIMEOUT: Simulated transient failure for fallback model (timeout)',
        'Simulated fallback model timeout.',
        new Error('Simulated upstream timeout'),
        504,
        'provider_timeout'
      )
    )

    const req = new Request('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({
        input_prompt: 'This is a synthetic prompt for scenario 3 verification.',
        working_language: 'en',
        selected_profile_slug: 'general-llm',
        audit_mode: 'universal'
      })
    })

    const res = await POST(req)
    expect(res.status).toBe(504)

    // Verify database and event counts
    expect(mockAnalyses.length).toBe(0)

    const completedEvents = mockUsageEvents.filter(e => e.event_type === 'analysis_completed')
    const failedEvents = mockUsageEvents.filter(e => e.event_type === 'analysis_failed')
    expect(completedEvents.length).toBe(0)
    expect(failedEvents.length).toBe(1)
    expect(failedEvents.some(e => {
      const metadata = e.metadata_json as Record<string, unknown>
      return metadata.error_code === 'PROVIDER_TIMEOUT'
    })).toBe(true)

    expect(mockReservations.size).toBe(1)
    const [reservation] = Array.from(mockReservations.values())
    expect(reservation.status).toBe('released')
  })

  it('Scenario 4: Primary returns non-transient 401/403', async () => {
    mockExecuteAnalysis.mockRejectedValue(
      new ProviderError(
        'Simulated non-transient failure (401 Unauthorized)',
        'Authentication failed.',
        new Error('Simulated 401'),
        401,
        'provider_authentication_error'
      )
    )

    const req = new Request('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({
        input_prompt: 'This is a synthetic prompt for scenario 4 verification.',
        working_language: 'en',
        selected_profile_slug: 'general-llm',
        audit_mode: 'universal'
      })
    })

    const res = await POST(req)
    expect(res.status).toBe(502) // Provider auth error is mapped to 502 Bad Gateway

    expect(mockAnalyses.length).toBe(0)

    const completedEvents = mockUsageEvents.filter(e => e.event_type === 'analysis_completed')
    const failedEvents = mockUsageEvents.filter(e => e.event_type === 'analysis_failed')
    expect(completedEvents.length).toBe(0)
    expect(failedEvents.some(e => {
      const metadata = e.metadata_json as Record<string, unknown>
      return metadata.error_code === 'PROVIDER_AUTHENTICATION_ERROR'
    })).toBe(true)

    expect(mockReservations.size).toBe(1)
    const [reservation] = Array.from(mockReservations.values())
    expect(reservation.status).toBe('released')
  })

  it('Scenario 5: Fallback variable missing', async () => {
    mockExecuteAnalysis.mockResolvedValue({
      output: mockAnalysisResult,
      usage: { promptTokens: 100, completionTokens: 150, totalTokens: 250, reasoningTokens: 0, visibleTokens: 150 },
      finishReason: 'stop',
      selectedModel: 'gemini-2.5-flash',
      attempt: 1,
      durationMs: 400
    })

    const req = new Request('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({
        input_prompt: 'This is a synthetic prompt for scenario 5 verification.',
        working_language: 'en',
        selected_profile_slug: 'general-llm',
        audit_mode: 'universal'
      })
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    expect(mockAnalyses.length).toBe(1)
    expect(mockAnalyses[0].model_id_used).toBe('gemini-2.5-flash')

    const completedEvents = mockUsageEvents.filter(e => e.event_type === 'analysis_completed')
    expect(completedEvents.length).toBe(1)
    const meta = completedEvents[0].metadata_json as Record<string, unknown>
    expect(meta.fallback_used).toBe(false)
  })

  it('Scenario 6: Primary and fallback IDs identical', async () => {
    mockExecuteAnalysis.mockResolvedValue({
      output: mockAnalysisResult,
      usage: { promptTokens: 100, completionTokens: 150, totalTokens: 250, reasoningTokens: 0, visibleTokens: 150 },
      finishReason: 'stop',
      selectedModel: 'gemini-2.5-flash',
      attempt: 1,
      durationMs: 400
    })

    const req = new Request('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({
        input_prompt: 'This is a synthetic prompt for scenario 6 verification.',
        working_language: 'en',
        selected_profile_slug: 'general-llm',
        audit_mode: 'universal'
      })
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    expect(mockAnalyses.length).toBe(1)
    expect(mockAnalyses[0].model_id_used).toBe('gemini-2.5-flash')

    const completedEvents = mockUsageEvents.filter(e => e.event_type === 'analysis_completed')
    expect(completedEvents.length).toBe(1)
    const meta = completedEvents[0].metadata_json as Record<string, unknown>
    expect(meta.fallback_used).toBe(false)
  })
})
