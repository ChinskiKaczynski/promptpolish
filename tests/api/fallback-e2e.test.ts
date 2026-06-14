import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '@/app/api/analyze/route'

vi.mock('server-only', () => ({}))

// Mock only the database client, so we do not hit production Supabase
const mockAnalyses: Record<string, unknown>[] = []
const mockUsageEvents: Record<string, unknown>[] = []
const mockReservations = new Map<string, { status: string; owner: string; user: string | null }>()

vi.mock('@/lib/supabase/queries', () => ({
  getModelProfileBySlug: vi.fn().mockResolvedValue({
    id: 'profile-uuid',
    slug: 'openrouter-deepseek-v4-flash',
    display_name: 'DeepSeek v4 Flash Profile',
    provider: 'openrouter',
    model_family: 'deepseek',
    profile_type: 'provider_model',
    source_type: 'internal',
    verification_status: 'verified',
    confidence_level: 'high',
    stale_after_days: 30,
    capabilities_json: {},
    prompting_recommendations_json: {},
    known_limitations_json: {},
    profile_version: '1.0.0',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }),
  createPromptAnalysis: vi.fn().mockImplementation(async (analysis) => {
    const record = { ...analysis, id: 'analysis-uuid-' + Math.random() }
    mockAnalyses.push(record)
    return record
  }),
  createUsageEvent: vi.fn().mockImplementation(async (event) => {
    mockUsageEvents.push(event)
    return event
  }),
  acquireReservation: vi.fn().mockImplementation(async (reqId, owner, user) => {
    mockReservations.set(reqId, { status: 'reserved', owner, user })
    return 'success:reserved'
  }),
  completeReservation: vi.fn().mockImplementation(async (reqId) => {
    const res = mockReservations.get(reqId)
    if (res) {
      res.status = 'completed'
    }
    return true
  }),
  releaseReservation: vi.fn().mockImplementation(async (reqId) => {
    const res = mockReservations.get(reqId)
    if (res) {
      res.status = 'released'
    }
    return true
  })
}))

// Mock identity calls to avoid cookie validation issues in test environment
vi.mock('@/lib/identity/anonymous', () => ({
  resolveOrCreateOwnerId: vi.fn().mockResolvedValue({ id: '00000000-0000-4000-a000-000000000001', isNew: false })
}))

vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn().mockResolvedValue(null)
}))

describe('E2E Provider Fallback Route Handler Integration', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    mockAnalyses.length = 0
    mockUsageEvents.length = 0
    mockReservations.clear()

    process.env = { ...originalEnv }
    process.env.NODE_ENV = 'development'
    process.env.OPENROUTER_FALLBACK_MODEL_ID = 'openai/gpt-4o-mini'
    process.env.AI_MOCK_MODE = 'false'
    process.env.NEXT_PUBLIC_ENABLE_MOCK_RESULT = 'false'
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  it('runs successful E2E fallback call: primary timeout triggers real OpenRouter fallback call and succeeds', async () => {
    // 1. Force primary model transient timeout
    process.env.TEST_FORCE_PRIMARY_FAILURE = 'true'

    const req = new Request('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1'
      },
      body: JSON.stringify({
        input_prompt: 'This is a synthetic prompt for E2E validation. Please analyze it.',
        working_language: 'en',
        selected_profile_slug: 'openrouter-deepseek-v4-flash',
        audit_mode: 'universal'
      })
    })

    console.log('[E2E Test] Sending HTTP request to Route Handler...')
    const startTime = Date.now()
    const res = await POST(req)
    console.log(`[E2E Test] Response received in ${Date.now() - startTime}ms. Status: ${res.status}`)

    const data = await res.json()

    // 2. Validate HTTP result
    expect(res.status).toBe(200)
    expect(data.id).toBeDefined()
    expect(data.overall_score).toBeDefined()
    expect(data.improved_prompt).toBeDefined()

    // 3. Validate database inserts
    expect(mockAnalyses.length).toBe(1)
    expect(mockAnalyses[0].provider_used).toBe('openrouter')
    expect(mockAnalyses[0].model_id_used).toBe('openai/gpt-4o-mini') // Verifies fallback model was used!

    // 4. Validate usage events (started and completed)
    const started = mockUsageEvents.filter(e => e.event_type === 'analysis_started')
    const completed = mockUsageEvents.filter(e => e.event_type === 'analysis_completed')
    expect(started.length).toBe(1)
    expect(completed.length).toBe(1)

    // 5. Validate reservation states
    expect(mockReservations.size).toBe(1)
    const [reservation] = Array.from(mockReservations.values())
    expect(reservation.status).toBe('completed')
  }, 30000) // 30s timeout for live API call

  it('runs double failure: primary and fallback both fail transiently, reservation rolled back, no record created', async () => {
    // 1. Force both primary and fallback failures
    process.env.TEST_FORCE_PRIMARY_FAILURE = 'true'
    process.env.TEST_FORCE_FALLBACK_FAILURE = 'true'

    const req = new Request('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1'
      },
      body: JSON.stringify({
        input_prompt: 'This is a synthetic prompt for double failure validation.',
        working_language: 'en',
        selected_profile_slug: 'openrouter-deepseek-v4-flash',
        audit_mode: 'universal'
      })
    })

    const res = await POST(req)
    const data = await res.json()

    // 2. Validate HTTP result
    expect(res.status).toBe(504)
    expect(data.error).toBe('upstream_provider_error')

    // 3. Validate database inserts
    expect(mockAnalyses.length).toBe(0)

    // 4. Validate usage events
    const completed = mockUsageEvents.filter(e => e.event_type === 'analysis_completed')
    const failed = mockUsageEvents.filter(e => e.event_type === 'analysis_failed')
    expect(completed.length).toBe(0)
    expect(failed.length).toBe(1)
    expect(failed[0].metadata_json.error_code).toBe('UPSTREAM_PROVIDER_ERROR')

    // 5. Validate reservation released
    expect(mockReservations.size).toBe(1)
    const [reservation] = Array.from(mockReservations.values())
    expect(reservation.status).toBe('released')
  })
})
