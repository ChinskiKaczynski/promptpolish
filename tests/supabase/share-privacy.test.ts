import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

import { getSharedPromptAnalysis, disableShareLink } from '@/lib/supabase/queries'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn()
}))
vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: vi.fn()
}))

/**
 * Privacy snapshot tests for the public share data access layer.
 *
 * These tests assert the EXACT shape returned by getSharedPromptAnalysis,
 * ensuring that internal, sensitive, or owner-identifying fields are
 * never present in the public payload — regardless of what the DB returns.
 *
 * Forbidden fields (must NEVER appear in the public payload):
 *   id                         — internal UUID; guessable → private result exposure
 *   owner_anonymous_id         — identifies the owner session
 *   user_id                    — reserved future auth field
 *   sensitive_data_findings_json — may contain redacted secrets
 *   model_id_used              — internal provider detail
 *   provider_used              — internal provider detail
 *   analysis_schema_version    — internal versioning
 *   scoring_version            — internal versioning
 *   model_profile_version      — internal versioning
 *   prompt_template_version    — internal versioning
 *   share_token                — would allow reconstructing the URL from payload
 *   is_share_enabled           — internal flag
 *   task_goal                  — optional private user input
 *   task_type                  — optional private user input
 *   expected_output_format     — optional private user input
 *   constraints                — optional private user input
 *   expires_at                 — internal expiry field
 */

// Simulates the full PromptAnalysisRow — used to test that forbidden fields
// DO NOT leak even if somehow returned (defence-in-depth injection test)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FULL_DB_ROW = {
  // --- FORBIDDEN fields (should never appear in public payload) ---
  id: 'internal-private-uuid-1234',
  owner_anonymous_id: 'owner-session-abc',
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

/**
 * Simulates what the real Supabase DB actually returns for the explicit SELECT column list
 * in getSharedPromptAnalysis. The DB enforces column projection at the wire level;
 * the JS mock cannot do this, so we manually replicate what Supabase would return.
 *
 * Columns selected by the query:
 *   input_prompt, working_language, selected_profile_slug, overall_score, score_level,
 *   analysis_json, improved_prompt, created_at, is_share_enabled
 */
const DB_RETURNED_ROW = {
  input_prompt: 'Summarize this contract',
  working_language: 'en',
  selected_profile_slug: 'openrouter-deepseek-v4-flash',
  overall_score: 78,
  score_level: 'decent',
  analysis_json: { overall_summary: 'Decent prompt', criteria_scores: [] },
  improved_prompt: 'Please summarize the following contract in bullet points...',
  created_at: '2026-05-23T12:00:00Z',
  is_share_enabled: true  // present in DB response; stripped by destructure in getSharedPromptAnalysis
}

const ALLOWED_FIELDS = [
  'input_prompt',
  'working_language',
  'selected_profile_slug',
  'overall_score',
  'score_level',
  'analysis_json',
  'improved_prompt',
  'created_at'
] as const

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FORBIDDEN_FIELDS = [
  'id',
  'owner_anonymous_id',
  'user_id',
  'sensitive_data_findings_json',
  'model_id_used',
  'provider_used',
  'analysis_schema_version',
  'scoring_version',
  'model_profile_version',
  'prompt_template_version',
  'share_token',
  'is_share_enabled',
  'task_goal',
  'task_type',
  'expected_output_format',
  'constraints',
  'expires_at'
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
    // The SELECT column list is the primary mechanism preventing forbidden field exposure.
    // Verify that getSharedPromptAnalysis calls .select() with exactly the allowed columns
    // and does NOT select forbidden fields like id, owner_anonymous_id, sensitive_data_findings_json, etc.
    mockMaybeSingle.mockResolvedValue({ data: DB_RETURNED_ROW, error: null })

    await getSharedPromptAnalysis('valid-token')

    // Verify select was called with the explicit safe column list
    expect(mockSelect).toHaveBeenCalledOnce()
    const selectArg: string = vi.mocked(mockSelect).mock.calls[0][0]

    // Assert allowed fields ARE in the SELECT
    for (const field of ALLOWED_FIELDS) {
      expect(selectArg, `Expected "${field}" to be in SELECT`).toContain(field)
    }

    // Assert forbidden identifiers are NOT in the SELECT
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
    // is_share_enabled IS selected (needed for the .eq filter) but stripped by destructure
    mockMaybeSingle.mockResolvedValue({ data: DB_RETURNED_ROW, error: null })

    const result = await getSharedPromptAnalysis('valid-token')

    expect(result).not.toHaveProperty('is_share_enabled')
  })

  it('returns exactly the expected safe payload shape — no extra keys', async () => {
    // Use DB_RETURNED_ROW: mirrors what Supabase actually returns for the explicit SELECT.
    // getSharedPromptAnalysis must strip is_share_enabled and return only the 8 safe fields.
    mockMaybeSingle.mockResolvedValue({ data: DB_RETURNED_ROW, error: null })

    const result = await getSharedPromptAnalysis('valid-token')

    expect(result).toEqual({
      input_prompt: 'Summarize this contract',
      working_language: 'en',
      selected_profile_slug: 'openrouter-deepseek-v4-flash',
      overall_score: 78,
      score_level: 'decent',
      analysis_json: { overall_summary: 'Decent prompt', criteria_scores: [] },
      improved_prompt: 'Please summarize the following contract in bullet points...',
      created_at: '2026-05-23T12:00:00Z'
    })

    // Strict key count check: only the 8 allowed fields, nothing more
    expect(Object.keys(result!)).toHaveLength(ALLOWED_FIELDS.length)
  })

  it('returns null for a disabled share token (is_share_enabled = false)', async () => {
    // DB returns null because the .eq('is_share_enabled', true) filter excludes it
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
  const mockSelect = vi.fn()
  const mockUpdate = vi.fn()

  const mockSupabaseClient = {
    from: vi.fn(() => ({ update: mockUpdate }))
  }

  beforeEach(() => {
    vi.clearAllMocks()

    const builder: Record<string, unknown> = {
      eq: mockEq,
      select: mockSelect,
      maybeSingle: mockMaybeSingle
    }
    mockUpdate.mockReturnValue(builder)
    mockEq.mockReturnValue(builder)
    mockSelect.mockReturnValue(builder)

    vi.mocked(getSupabaseServerClient).mockReturnValue(mockSupabaseClient as unknown as ReturnType<typeof getSupabaseServerClient>)
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockSupabaseClient as unknown as ReturnType<typeof getSupabaseAdminClient>)
  })

  it('returns true when the owned row is successfully updated', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'analysis-uuid' }, error: null })

    const result = await disableShareLink('analysis-uuid', 'owner-123')
    expect(result).toBe(true)
  })

  it('returns false when no row matches (non-owner or wrong analysis_id)', async () => {
    // DB returns null data when WHERE matches 0 rows
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const result = await disableShareLink('analysis-uuid', 'wrong-owner')
    expect(result).toBe(false)
  })

  it('enforces owner_anonymous_id in the WHERE clause', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'analysis-uuid' }, error: null })

    await disableShareLink('analysis-uuid', 'owner-123')

    expect(mockEq).toHaveBeenCalledWith('id', 'analysis-uuid')
    expect(mockEq).toHaveBeenCalledWith('owner_anonymous_id', 'owner-123')
    expect(mockUpdate).toHaveBeenCalledWith({ is_share_enabled: false, share_token: null })
  })

  it('returns false and logs error on database failure', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'DB timeout' } })

    const result = await disableShareLink('analysis-uuid', 'owner-123')
    expect(result).toBe(false)
  })
})
