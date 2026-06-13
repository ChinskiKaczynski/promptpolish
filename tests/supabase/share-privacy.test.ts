import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

import { getSharedPromptAnalysis, disableShareLink } from '@/lib/supabase/queries'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

// Mock getSupabaseServerClient and getSupabaseAdminClient
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn()
}))
vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: vi.fn()
}))

const MOCK_ANALYSIS_ID = '11111111-1111-1111-1111-111111111111'
const MOCK_OWNER_ID = '22222222-2222-2222-2222-222222222222'

/**
 * Privacy snapshot tests for the public share data access layer.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FULL_DB_ROW = {
  // --- FORBIDDEN fields (should never appear in public payload) ---
  id: MOCK_ANALYSIS_ID,
  owner_anonymous_id: MOCK_OWNER_ID,
  user_id: null,
  sensitive_data_findings_json: [{ type: 'api_key', riskLevel: 'high', redactedValue: 'sk-***' }],
  model_id_used: 'gemini-2.0-flash',
  provider_used: 'google',
  analysis_schema_version: '1.0.0',
  scoring_version: '1.0.0',
  model_profile_version: '1.0.0',
  prompt_template_version: '1.0.0',
  share_token: 'mocked-share-token-xyz-abc',
  is_share_enabled: true,
  task_goal: 'Summarize legal documents',
  task_type: 'summarization',
  expected_output_format: 'bullet points',
  constraints: 'max 200 words',
  expires_at: null,
  // --- ALLOWED fields (safe to expose publicly) ---
  input_prompt: 'Summarize this contract',
  working_language: 'en',
  selected_profile_slug: 'openrouter-deepseek-v4-flash',
  overall_score: 78,
  score_level: 'decent',
  analysis_json: { overall_summary: 'Decent prompt', criteria_scores: [] },
  improved_prompt: 'Please summarize the following contract in bullet points...',
  created_at: '2026-05-23T12:00:00Z'
}

const DB_RETURNED_ROW = {
  working_language: 'en',
  selected_profile_slug: 'openrouter-deepseek-v4-flash',
  overall_score: 78,
  score_level: 'decent',
  analysis_json: { overall_summary: 'Decent prompt', criteria_scores: [] },
  improved_prompt: 'Please summarize the following contract in bullet points...',
  created_at: '2026-05-23T12:00:00Z',
  is_share_enabled: true
}

const ALLOWED_FIELDS = [
  'working_language',
  'selected_profile_slug',
  'overall_score',
  'score_level',
  'analysis_json',
  'improved_prompt',
  'created_at'
] as const

describe('getSharedPromptAnalysis — Public Share Privacy Snapshot', () => {
  const mockMaybeSingle = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockIs = vi.fn()

  const mockSupabaseClient = {
    from: vi.fn(() => ({ select: mockSelect }))
  }

  beforeEach(() => {
    vi.clearAllMocks()

    const builder: Record<string, unknown> = {
      eq: mockEq,
      is: mockIs,
      maybeSingle: mockMaybeSingle
    }
    mockSelect.mockReturnValue(builder)
    mockEq.mockReturnValue(builder)
    mockIs.mockReturnValue(builder)

    vi.mocked(getSupabaseServerClient).mockReturnValue(mockSupabaseClient as unknown as ReturnType<typeof getSupabaseServerClient>)
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockSupabaseClient as unknown as ReturnType<typeof getSupabaseAdminClient>)
  })

  it('returns all allowed public fields when share is enabled', async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_RETURNED_ROW, error: null })

    const result = await getSharedPromptAnalysis('valid-token')

    expect(result).not.toBeNull()

    for (const field of ALLOWED_FIELDS) {
      expect(result).toHaveProperty(field)
    }
  })

  it('queries ONLY the safe public columns in the SELECT — primary DB-level privacy guard', async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_RETURNED_ROW, error: null })

    await getSharedPromptAnalysis('valid-token')

    expect(mockSelect).toHaveBeenCalledOnce()
    const selectArg: string = vi.mocked(mockSelect).mock.calls[0][0]

    for (const field of ALLOWED_FIELDS) {
      expect(selectArg, `Expected "${field}" to be in SELECT`).toContain(field)
    }

    const criticalForbidden = [
      'owner_anonymous_id',
      'sensitive_data_findings_json',
      'model_id_used',
      'provider_used',
      'user_id'
    ]
    for (const field of criticalForbidden) {
      expect(selectArg, `"${field}" must NOT be in the SELECT column list`).not.toContain(field)
    }
  })

  it('strips is_share_enabled from the JS output (JS-layer scrub)', async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_RETURNED_ROW, error: null })

    const result = await getSharedPromptAnalysis('valid-token')

    expect(result).not.toHaveProperty('is_share_enabled')
  })

  it('returns exactly the expected safe payload shape — no extra keys', async () => {
    mockMaybeSingle.mockResolvedValue({ data: DB_RETURNED_ROW, error: null })

    const result = await getSharedPromptAnalysis('valid-token')

    expect(result).toEqual({
      working_language: 'en',
      selected_profile_slug: 'openrouter-deepseek-v4-flash',
      overall_score: 78,
      score_level: 'decent',
      analysis_json: { overall_summary: 'Decent prompt', criteria_scores: [] },
      improved_prompt: 'Please summarize the following contract in bullet points...',
      created_at: '2026-05-23T12:00:00Z'
    })

    expect(Object.keys(result!)).toHaveLength(ALLOWED_FIELDS.length)
  })

  it('returns null for a disabled share token (is_share_enabled = false)', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const result = await getSharedPromptAnalysis('disabled-token')
    expect(result).toBeNull()
  })

  it('returns null for a nonexistent token', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const result = await getSharedPromptAnalysis('nonexistent-token')
    expect(result).toBeNull()
  })

  it('queries with is_share_enabled = true filter, preventing disabled link exposure', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    await getSharedPromptAnalysis('some-token')

    expect(mockEq).toHaveBeenCalledWith('share_token', 'some-token')
    expect(mockEq).toHaveBeenCalledWith('is_share_enabled', true)
  })
})

describe('disableShareLink — Ownership Verification', () => {
  const mockMaybeSingle = vi.fn()
  const mockEq = vi.fn()
  const mockIs = vi.fn()
  const mockSelect = vi.fn()
  const mockUpdate = vi.fn()

  const mockSupabaseClient = {
    from: vi.fn(() => ({
      select: mockSelect,
      update: mockUpdate
    }))
  }

  beforeEach(() => {
    vi.clearAllMocks()

    const builder: Record<string, unknown> = {
      eq: mockEq,
      is: mockIs,
      select: mockSelect,
      maybeSingle: mockMaybeSingle
    }
    mockUpdate.mockReturnValue(builder)
    mockEq.mockReturnValue(builder)
    mockIs.mockReturnValue(builder)
    mockSelect.mockReturnValue(builder)
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    vi.mocked(getSupabaseServerClient).mockReturnValue(mockSupabaseClient as unknown as ReturnType<typeof getSupabaseServerClient>)
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockSupabaseClient as unknown as ReturnType<typeof getSupabaseAdminClient>)
  })

  it('returns true when the owned row is successfully updated', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: MOCK_ANALYSIS_ID }, error: null })

    const result = await disableShareLink(MOCK_ANALYSIS_ID, MOCK_OWNER_ID)
    expect(result).toBe(true)
  })

  it('returns false when no row matches (non-owner or wrong analysis_id)', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const result = await disableShareLink(MOCK_ANALYSIS_ID, MOCK_OWNER_ID)
    expect(result).toBe(false)
  })

  it('enforces ownership checks and performs the correct update', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: MOCK_ANALYSIS_ID }, error: null })

    await disableShareLink(MOCK_ANALYSIS_ID, MOCK_OWNER_ID)

    expect(mockEq).toHaveBeenCalledWith('id', MOCK_ANALYSIS_ID)
    expect(mockUpdate).toHaveBeenCalledWith({ is_share_enabled: false, share_token: null })
  })

  it('throws custom database error on database failure', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'DB timeout' } })

    await expect(
      disableShareLink(MOCK_ANALYSIS_ID, MOCK_OWNER_ID)
    ).rejects.toThrow('Database error: DB timeout')
  })
})
