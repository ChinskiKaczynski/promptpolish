import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn()
}))

vi.mock('@/lib/admin/metrics', () => ({
  fetchAggregatedMetrics: vi.fn()
}))

import { GET } from '@/app/api/admin/metrics/route'
import { getAuthUser } from '@/lib/identity/auth'
import { fetchAggregatedMetrics } from '@/lib/admin/metrics'
import type { User } from '@supabase/supabase-js'
import type { AggregatedMetrics } from '@/lib/admin/metrics'
import { NextRequest } from 'next/server'

function makeRequest(window = 'allTime') {
  return new NextRequest(`http://localhost/api/admin/metrics?window=${window}`)
}

const SAFE_METRICS: AggregatedMetrics = {
  window: 'allTime',
  startDate: null,
  endDate: new Date().toISOString(),
  coreFunnel: {
    analysis_started: 100,
    analysis_completed: 80,
    analysis_failed: 5,
    completion_rate: 80,
    failure_rate: 5,
    average_analyses_per_day: 2.5,
    latest_analysis_at: null
  },
  valueMetrics: {
    copy_improved_prompt: 40,
    copy_rate: 50,
    feedback_submitted: 20,
    feedback_rate: 25,
    feedback_up: 18,
    feedback_down: 2,
    feedback_up_down_ratio: '18/2',
    positive_feedback_ratio: 90,
    share_link_created: 10,
    share_link_disabled: 0,
    share_rate: 12.5,
    active_public_shares: 8,
    export_markdown: 3,
    export_txt: 1
  },
  retentionProxy: {
    unique_active_owners: 30,
    unique_owners_with_completed_analysis: 25,
    returning_owners_count: 10,
    returning_rate: 40,
    average_completed_analyses_per_owner: 3.2,
    median_completed_analyses_per_owner: 2,
    owner_usage_buckets: { one_analysis: 10, two_to_three: 8, four_to_ten: 5, more_than_ten: 2 }
  },
  plans: {
    free_users_count: 28,
    pro_users_count: 2,
    analyses_by_plan: { free: 70, pro: 10 }
  },
  reliability: {
    analysis_failed: 5,
    provider_error: 2,
    invalid_structured_output: 1,
    api_error: 0,
    failure_rate: 5,
    common_error_codes: []
  },
  limits: {
    limit_reached: 3,
    limit_reached_rate: 10,
    owners_hitting_limit_count: 2,
    average_limit_reached_per_limited_owner: 1.5
  },
  sensitiveDataSafety: {
    sensitive_data_warning_shown: 4,
    sensitive_data_blocked: 2,
    sensitive_warning_rate: 4,
    sensitive_block_rate: 2,
    risk_level_counts: { none: 70, low: 5, medium: 3, high: 2 },
    finding_type_counts: { 'api-key': 2, 'password': 1 }
  },
  promptCharacteristics: {
    total_prompt_analyses: 80,
    analyses_by_working_language: { en: 60, pl: 20 },
    analyses_by_selected_profile_slug: { 'general-llm': 80 },
    analyses_by_score_level: { decent: 40, strong: 25, excellent: 10, needs_work: 4, weak: 1 },
    average_overall_score: 72.5,
    median_overall_score: 74,
    score_distribution: { weak_0_39: 1, needs_work_40_59: 4, decent_60_74: 40, strong_75_89: 25, excellent_90_100: 10 },
    average_input_prompt_length: 350,
    average_improved_prompt_length: 520,
    prompt_length_buckets: { short: 5, medium: 45, long: 25, very_long: 5 }
  },
  costUsage: {
    ai_cost_status: 'unknown',
    ai_cost_reason: 'Reliable token/cost metadata not found',
    total_input_tokens: null,
    total_output_tokens: null,
    total_tokens: null,
    average_tokens_per_completed_analysis: null,
    estimated_total_cost: null,
    estimated_cost_per_analysis: null
  },
  eventCoverage: [
    { eventType: 'analysis_started', countAllTime: 100, status: 'present' },
    { eventType: 'export_txt', countAllTime: 0, status: 'no_events_yet' }
  ],
  productInterpretation: {
    copy_rate_status: 'strong',
    feedback_status: 'strong',
    retention_status: 'strong',
    reliability_status: 'strong',
    paid_readiness: 'consider_export_pro_value_layer_later',
    beta_signal: 'STRONG_SIGNAL'
  }
}

describe('GET /api/admin/metrics — Access Control', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    process.env.ADMIN_EMAILS = 'nupharizar@gmail.com, admin2@test.com'
    vi.mocked(fetchAggregatedMetrics).mockResolvedValue(SAFE_METRICS)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns 401 when the request is not authenticated', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null)
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBeTruthy()
  })

  it('returns 403 when authenticated user is not in ADMIN_EMAILS', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      id: 'user-123',
      email: 'notadmin@test.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: ''
    } as User)
    const res = await GET(makeRequest())
    expect(res.status).toBe(403)
  })

  it('returns 403 when ADMIN_EMAILS is empty', async () => {
    process.env.ADMIN_EMAILS = ''
    vi.mocked(getAuthUser).mockResolvedValue({
      id: 'user-123',
      email: 'nupharizar@gmail.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: ''
    } as User)
    const res = await GET(makeRequest())
    expect(res.status).toBe(403)
  })

  it('returns 200 for a valid admin email in ADMIN_EMAILS', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      id: 'admin-uuid',
      email: 'nupharizar@gmail.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: ''
    } as User)
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
  })

  it('admin access is case-insensitive for ADMIN_EMAILS', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      id: 'admin-uuid',
      email: 'NUPHARIZAR@GMAIL.COM',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: ''
    } as User)
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
  })
})

describe('GET /api/admin/metrics — Privacy Safety', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    process.env.ADMIN_EMAILS = 'nupharizar@gmail.com'
    vi.mocked(getAuthUser).mockResolvedValue({
      id: 'admin-uuid',
      email: 'nupharizar@gmail.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: ''
    } as User)
    vi.mocked(fetchAggregatedMetrics).mockResolvedValue(SAFE_METRICS)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('does not expose raw input_prompt or improved_prompt as direct field keys', async () => {
    const res = await GET(makeRequest())
    const json = await res.json()
    // Verify the top-level structure has no raw prompt fields
    // Key names like "average_input_prompt_length" are safe aggregates — we only disallow raw string values
    expect(json).not.toHaveProperty('input_prompt')
    expect(json).not.toHaveProperty('improved_prompt')
    // Also confirm the promptCharacteristics section does not expose raw prompt text as a property
    if (json.promptCharacteristics) {
      expect(json.promptCharacteristics).not.toHaveProperty('input_prompt')
      expect(json.promptCharacteristics).not.toHaveProperty('improved_prompt')
    }
  })

  it('does not return user_id fields in the response', async () => {
    const res = await GET(makeRequest())
    const body = JSON.stringify(await res.json())
    // user_id should not appear as a key at root or nested
    const json = JSON.parse(body)
    expect(JSON.stringify(json)).not.toMatch(/"user_id"/)
  })

  it('does not return owner_anonymous_id in the response', async () => {
    const res = await GET(makeRequest())
    const body = JSON.stringify(await res.json())
    expect(body).not.toMatch(/owner_anonymous_id/)
  })

  it('does not return email fields in the response', async () => {
    const res = await GET(makeRequest())
    const body = JSON.stringify(await res.json())
    expect(body).not.toMatch(/"email"/)
  })

  it('does not return share_token in the response', async () => {
    const res = await GET(makeRequest())
    const body = JSON.stringify(await res.json())
    expect(body).not.toMatch(/share_token/)
  })
})

describe('GET /api/admin/metrics — STRIPE_ENABLED guard', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    process.env.ADMIN_EMAILS = 'nupharizar@gmail.com'
    process.env.STRIPE_ENABLED = 'false'
    vi.mocked(getAuthUser).mockResolvedValue({
      id: 'admin-uuid',
      email: 'nupharizar@gmail.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: ''
    } as User)
    vi.mocked(fetchAggregatedMetrics).mockResolvedValue(SAFE_METRICS)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns 200 and calls fetchAggregatedMetrics even when STRIPE_ENABLED=false', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    expect(fetchAggregatedMetrics).toHaveBeenCalled()
  })
})

describe('GET /api/admin/metrics — Window parameter', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    process.env.ADMIN_EMAILS = 'nupharizar@gmail.com'
    vi.mocked(getAuthUser).mockResolvedValue({
      id: 'admin-uuid',
      email: 'nupharizar@gmail.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: ''
    } as User)
    vi.mocked(fetchAggregatedMetrics).mockResolvedValue(SAFE_METRICS)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it.each(['allTime', 'last30d', 'last7d', 'last24h'])('accepts valid window=%s', async (w) => {
    const res = await GET(makeRequest(w))
    expect(res.status).toBe(200)
    expect(fetchAggregatedMetrics).toHaveBeenCalledWith(w)
  })

  it('defaults to allTime for an invalid window parameter', async () => {
    const res = await GET(makeRequest('invalid_window'))
    expect(res.status).toBe(200)
    expect(fetchAggregatedMetrics).toHaveBeenCalledWith('allTime')
  })
})
