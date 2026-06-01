import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('server-only', () => ({}))

// Mock the Supabase admin client
const mockFrom = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: vi.fn(() => ({
    from: mockFrom
  }))
}))

import { fetchAggregatedMetrics } from '@/lib/admin/metrics'

describe('fetchAggregatedMetrics — Empty Database', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock all from() calls to return empty arrays
    const emptyResult = Promise.resolve({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ data: [], error: null }),
        eq: vi.fn().mockReturnValue({
          head: true,
          then: emptyResult.then.bind(emptyResult),
          catch: emptyResult.catch.bind(emptyResult),
          finally: emptyResult.finally.bind(emptyResult),
        }),
        then: emptyResult.then.bind(emptyResult),
        catch: emptyResult.catch.bind(emptyResult),
        finally: emptyResult.finally.bind(emptyResult),
      })
    })
  })

  it('returns zero completion rate when no events exist — no division by zero', async () => {
    const metrics = await fetchAggregatedMetrics('allTime')
    expect(metrics.coreFunnel.completion_rate).toBe(0)
    expect(metrics.coreFunnel.failure_rate).toBe(0)
    expect(Number.isFinite(metrics.coreFunnel.completion_rate)).toBe(true)
    expect(Number.isFinite(metrics.coreFunnel.failure_rate)).toBe(true)
  })

  it('returns zero copy rate when no events exist', async () => {
    const metrics = await fetchAggregatedMetrics('allTime')
    expect(metrics.valueMetrics.copy_rate).toBe(0)
    expect(Number.isFinite(metrics.valueMetrics.copy_rate)).toBe(true)
  })

  it('returns zero retention metrics without throwing', async () => {
    const metrics = await fetchAggregatedMetrics('allTime')
    expect(metrics.retentionProxy.returning_rate).toBe(0)
    expect(metrics.retentionProxy.unique_active_owners).toBe(0)
  })

  it('returns zero score metrics without throwing', async () => {
    const metrics = await fetchAggregatedMetrics('allTime')
    expect(metrics.promptCharacteristics.average_overall_score).toBe(0)
    expect(metrics.promptCharacteristics.median_overall_score).toBe(0)
  })

  it('returns unknown AI cost status', async () => {
    const metrics = await fetchAggregatedMetrics('allTime')
    expect(metrics.costUsage.ai_cost_status).toBe('unknown')
    expect(metrics.costUsage.total_tokens).toBeNull()
  })

  it('returns copy_rate_status=unknown when not enough data', async () => {
    const metrics = await fetchAggregatedMetrics('allTime')
    expect(metrics.productInterpretation.copy_rate_status).toBe('unknown')
  })

  it('returns feedback_status=unknown when not enough data', async () => {
    const metrics = await fetchAggregatedMetrics('allTime')
    expect(metrics.productInterpretation.feedback_status).toBe('unknown')
  })

  it('returns retention_status=unknown when not enough data', async () => {
    const metrics = await fetchAggregatedMetrics('allTime')
    expect(metrics.productInterpretation.retention_status).toBe('unknown')
  })

  it('returns reliability_status=unknown when no analyses started', async () => {
    const metrics = await fetchAggregatedMetrics('allTime')
    expect(metrics.productInterpretation.reliability_status).toBe('unknown')
  })

  it('does not expose raw prompt text as direct field values', async () => {
    const metrics = await fetchAggregatedMetrics('allTime')
    // Aggregate key names like 'average_input_prompt_length' are safe
    // We assert that no direct 'input_prompt' or 'improved_prompt' property exists on the result
    expect(metrics).not.toHaveProperty('input_prompt')
    expect(metrics).not.toHaveProperty('improved_prompt')
    // promptCharacteristics should only have aggregate stats, not raw fields
    expect(metrics.promptCharacteristics).not.toHaveProperty('input_prompt')
    expect(metrics.promptCharacteristics).not.toHaveProperty('improved_prompt')
  })

  it('does not include owner IDs in the result', async () => {
    const metrics = await fetchAggregatedMetrics('allTime')
    const flat = JSON.stringify(metrics)
    expect(flat).not.toMatch(/owner_anonymous_id/)
    expect(flat).not.toMatch(/"user_id"/)
  })

  it('does not include email fields', async () => {
    const metrics = await fetchAggregatedMetrics('allTime')
    const flat = JSON.stringify(metrics)
    expect(flat).not.toMatch(/"email"/)
  })

  it('does not include share_token', async () => {
    const metrics = await fetchAggregatedMetrics('allTime')
    const flat = JSON.stringify(metrics)
    expect(flat).not.toMatch(/share_token/)
  })

  it('returns the correct window in result', async () => {
    const metrics = await fetchAggregatedMetrics('last7d')
    expect(metrics.window).toBe('last7d')
  })

  it('sets startDate for bounded windows', async () => {
    const metrics30 = await fetchAggregatedMetrics('last30d')
    expect(metrics30.startDate).not.toBeNull()

    const metricsAll = await fetchAggregatedMetrics('allTime')
    expect(metricsAll.startDate).toBeNull()
  })
})

describe('fetchAggregatedMetrics — STRIPE_ENABLED guard', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }

    const emptyResult = Promise.resolve({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ data: [], error: null }),
        eq: vi.fn().mockReturnValue({
          then: emptyResult.then.bind(emptyResult),
          catch: emptyResult.catch.bind(emptyResult),
          finally: emptyResult.finally.bind(emptyResult),
        }),
        then: emptyResult.then.bind(emptyResult),
        catch: emptyResult.catch.bind(emptyResult),
        finally: emptyResult.finally.bind(emptyResult),
      })
    })
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('does not query subscriptions table when STRIPE_ENABLED=false', async () => {
    process.env.STRIPE_ENABLED = 'false'
    await fetchAggregatedMetrics('allTime')

    const calledTables = mockFrom.mock.calls.map((call) => call[0])
    expect(calledTables).not.toContain('subscriptions')
  })

  it('does not query subscriptions table when STRIPE_ENABLED is missing', async () => {
    delete process.env.STRIPE_ENABLED
    await fetchAggregatedMetrics('allTime')

    const calledTables = mockFrom.mock.calls.map((call) => call[0])
    expect(calledTables).not.toContain('subscriptions')
  })
})

describe('fetchAggregatedMetrics — Event Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const emptyResult = Promise.resolve({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ data: [], error: null }),
        eq: vi.fn().mockReturnValue({
          head: true,
          then: emptyResult.then.bind(emptyResult),
          catch: emptyResult.catch.bind(emptyResult),
          finally: emptyResult.finally.bind(emptyResult),
        }),
        then: emptyResult.then.bind(emptyResult),
        catch: emptyResult.catch.bind(emptyResult),
        finally: emptyResult.finally.bind(emptyResult),
      })
    })
  })

  it('includes an entry for every expected event type', async () => {
    const metrics = await fetchAggregatedMetrics('allTime')

    const covered = metrics.eventCoverage.map((e) => e.eventType)
    expect(covered).toContain('analysis_started')
    expect(covered).toContain('analysis_completed')
    expect(covered).toContain('analysis_failed')
    expect(covered).toContain('copy_improved_prompt')
    expect(covered).toContain('feedback_submitted')
    expect(covered).toContain('share_link_created')
    expect(covered).toContain('limit_reached')
    expect(covered).toContain('sensitive_data_blocked')
    expect(covered).toContain('provider_error')
  })

  it('marks events with zero count as no_events_yet', async () => {
    const metrics = await fetchAggregatedMetrics('allTime')

    metrics.eventCoverage.forEach((entry) => {
      if (entry.countAllTime === 0) {
        expect(entry.status).toBe('no_events_yet')
      }
    })
  })
})
