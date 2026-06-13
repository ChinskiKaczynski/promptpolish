import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

import {
  getModelProfileBySlug,
  createPromptAnalysis,
  getPromptAnalysisForOwner,
  getSharedPromptAnalysis,
  createUsageEvent,
  createFeedbackEvent,
  createCopyEvent,
  createShareLink,
  disableShareLink,
  acquireReservation,
  completeReservation,
  releaseReservation,
  getRecentFeedbackCount
} from '@/lib/supabase/queries'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

// Mock getSupabaseServerClient
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn()
}))
vi.mock('@/lib/supabase/admin', () => ({ getSupabaseAdminClient: vi.fn() }))

// Mock share token creator
vi.mock('@/lib/result-access/share-token', () => ({
  createShareToken: vi.fn(() => 'mocked-32-char-share-token-xyz-123')
}))

const MOCK_ANALYSIS_ID = '11111111-1111-1111-1111-111111111111'
const MOCK_OWNER_ID = '22222222-2222-2222-2222-222222222222'

describe('Supabase Data Access Layer - Mocked Integration', () => {
  const mockSingle = vi.fn()
  const mockMaybeSingle = vi.fn()
  const mockSelect = vi.fn()
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()
  const mockEq = vi.fn()
  const mockIs = vi.fn()
  const mockOr = vi.fn()
  const mockOrder = vi.fn()
  const mockRpc = vi.fn()
  const mockGte = vi.fn()

  const mockSupabaseClient = {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate
    })),
    rpc: mockRpc
  }

  const builder = {
    eq: mockEq,
    is: mockIs,
    or: mockOr,
    order: mockOrder,
    gte: mockGte,
    maybeSingle: mockMaybeSingle,
    single: mockSingle,
    select: vi.fn(),
    then: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getSupabaseAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseClient)
    // Setup standard builder pattern chain
    builder.then = vi.fn((onfulfilled) => Promise.resolve({ data: null, error: null, count: null }).then(onfulfilled))
    builder.select.mockReturnValue(builder)

    mockSelect.mockReturnValue(builder)
    mockInsert.mockReturnValue({
      select: vi.fn(() => builder)
    })
    mockUpdate.mockReturnValue(builder)

    mockEq.mockReturnValue(builder)
    mockIs.mockReturnValue(builder)
    mockOr.mockReturnValue(builder)
    mockOrder.mockReturnValue(builder)
    mockGte.mockReturnValue(builder)

    // Mock getSupabaseServerClient to return our builder mock client
    vi.mocked(getSupabaseServerClient).mockReturnValue(mockSupabaseClient as unknown as ReturnType<typeof getSupabaseServerClient>)
  })

  describe('getModelProfileBySlug', () => {
    it('returns the profile details on successful slug match', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { slug: 'general-llm', display_name: 'General LLM' },
        error: null
      })

      const profile = await getModelProfileBySlug('general-llm')
      expect(profile).toEqual({ slug: 'general-llm', display_name: 'General LLM' })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('model_profiles')
      expect(mockEq).toHaveBeenCalledWith('slug', 'general-llm')
    })

    it('returns null and logs error when database fetch fails', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      await expect(getModelProfileBySlug('general-llm')).rejects.toThrow('Database error')
    })
  })

  describe('createPromptAnalysis', () => {
    it('creates a new prompt analysis and returns the row', async () => {
      const mockInput = {
        owner_anonymous_id: MOCK_OWNER_ID,
        input_prompt: 'Test prompt',
        working_language: 'en' as const,
        selected_profile_slug: 'general-llm',
        overall_score: 85,
        score_level: 'strong' as const,
        analysis_json: {},
        improved_prompt: 'Improved test prompt',
        model_id_used: 'gemini-1.5-flash',
        provider_used: 'google',
        analysis_schema_version: '1.0.0',
        scoring_version: '1.0.0',
        model_profile_version: '1.0.0',
        prompt_template_version: '1.0.0'
      }

      mockSingle.mockResolvedValue({
        data: { id: MOCK_ANALYSIS_ID, ...mockInput },
        error: null
      })

      const result = await createPromptAnalysis(mockInput as unknown as Parameters<typeof createPromptAnalysis>[0])
      expect(result).toEqual({ id: MOCK_ANALYSIS_ID, ...mockInput })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prompt_analyses')
      expect(mockInsert).toHaveBeenCalledWith(mockInput)
    })
  })

  describe('getPromptAnalysisForOwner', () => {
    it('returns private prompt analysis when owner anonymous ID matches and user_id is null', async () => {
      const mockRecord = {
        id: MOCK_ANALYSIS_ID,
        owner_anonymous_id: MOCK_OWNER_ID,
        user_id: null,
        input_prompt: 'Secret prompt'
      }

      mockMaybeSingle.mockResolvedValue({
        data: mockRecord,
        error: null
      })

      const result = await getPromptAnalysisForOwner(MOCK_ANALYSIS_ID, MOCK_OWNER_ID)
      expect(result).toEqual(mockRecord)
      expect(mockEq).toHaveBeenCalledWith('id', MOCK_ANALYSIS_ID)
    })

    it('returns null when owner anonymous ID does not match and user_id is null', async () => {
      const mockRecord = {
        id: MOCK_ANALYSIS_ID,
        owner_anonymous_id: '33333333-3333-3333-3333-333333333333',
        user_id: null,
        input_prompt: 'Secret prompt'
      }

      mockMaybeSingle.mockResolvedValue({
        data: mockRecord,
        error: null
      })

      const result = await getPromptAnalysisForOwner(MOCK_ANALYSIS_ID, MOCK_OWNER_ID)
      expect(result).toBeNull()
    })
  })

  describe('getSharedPromptAnalysis', () => {
    it('returns a scrubbed analysis payload when a valid share token is provided and is_share_enabled is true', async () => {
      const dbRecord = {
        working_language: 'pl',
        selected_profile_slug: 'general-llm',
        overall_score: 92,
        score_level: 'excellent',
        analysis_json: { detailedCriteria: {} },
        improved_prompt: 'My polished prompt',
        created_at: '2026-05-23T12:00:00Z',
        is_share_enabled: true
      }

      mockMaybeSingle.mockResolvedValue({
        data: dbRecord,
        error: null
      })

      const result = await getSharedPromptAnalysis('valid-token')

      // Verification: Should return scrubbed payload (excluding is_share_enabled or private IDs or input_prompt)
      expect(result).toEqual({
        working_language: 'pl',
        selected_profile_slug: 'general-llm',
        overall_score: 92,
        score_level: 'excellent',
        analysis_json: { detailedCriteria: {} },
        improved_prompt: 'My polished prompt',
        created_at: '2026-05-23T12:00:00Z'
      })

      expect(mockEq).toHaveBeenCalledWith('share_token', 'valid-token')
      expect(mockEq).toHaveBeenCalledWith('is_share_enabled', true)
    })

    it('returns null when the share link does not exist or has is_share_enabled = false', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await getSharedPromptAnalysis('disabled-or-invalid-token')
      expect(result).toBeNull()
    })
  })

  describe('createUsageEvent & createFeedbackEvent', () => {
    it('creates usage event', async () => {
      const mockEvent = {
        owner_anonymous_id: MOCK_OWNER_ID,
        event_type: 'copy',
        metadata_json: { analysis_id: MOCK_ANALYSIS_ID }
      }

      mockSingle.mockResolvedValue({ data: { id: '00000000-0000-0000-0000-000000000000', ...mockEvent }, error: null })
      const result = await createUsageEvent(mockEvent as unknown as Parameters<typeof createUsageEvent>[0])
      expect(result).toEqual({ id: '00000000-0000-0000-0000-000000000000', ...mockEvent })
    })

    it('creates copy event via telemetry helper', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: '00000000-0000-0000-0000-000000000000',
          owner_anonymous_id: MOCK_OWNER_ID,
          event_type: 'copy',
          metadata_json: { analysis_id: MOCK_ANALYSIS_ID }
        },
        error: null
      })

      const result = await createCopyEvent(MOCK_OWNER_ID, MOCK_ANALYSIS_ID)
      expect(result).toBeDefined()
      expect(result?.event_type).toBe('copy')
    })

    it('creates feedback event', async () => {
      const mockFeedback = {
        analysis_id: MOCK_ANALYSIS_ID,
        rating: 'up' as const,
        comment: 'Nice output'
      }

      mockSingle.mockResolvedValue({ data: { id: 'efefefef-efef-efef-efef-efefefefefef', ...mockFeedback }, error: null })
      const result = await createFeedbackEvent(mockFeedback as unknown as Parameters<typeof createFeedbackEvent>[0])
      expect(result).toEqual({ id: 'efefefef-efef-efef-efef-efefefefefef', ...mockFeedback })
    })
  })

  describe('createShareLink & disableShareLink', () => {
    it('enables sharing by generating share token and updating row', async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: { share_token: 'mocked-32-char-share-token-xyz-123' },
        error: null
      })

      const token = await createShareLink(MOCK_ANALYSIS_ID, MOCK_OWNER_ID)
      expect(token).toBe('mocked-32-char-share-token-xyz-123')
      expect(mockUpdate).toHaveBeenCalledWith({
        is_share_enabled: true,
        share_token: 'mocked-32-char-share-token-xyz-123'
      })
      expect(mockEq).toHaveBeenCalledWith('id', MOCK_ANALYSIS_ID)
    })

    it('disables public share by setting is_share_enabled=false and clearing token', async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: { id: MOCK_ANALYSIS_ID },
        error: null
      })

      const success = await disableShareLink(MOCK_ANALYSIS_ID, MOCK_OWNER_ID)
      expect(success).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith({
        is_share_enabled: false,
        share_token: null
      })
      expect(mockEq).toHaveBeenCalledWith('id', MOCK_ANALYSIS_ID)
    })
  })

  describe('deleted_at blocking checks', () => {
    it('ensures getPromptAnalysisForOwner queries with is("deleted_at", null)', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null })
      await getPromptAnalysisForOwner(MOCK_ANALYSIS_ID, MOCK_OWNER_ID)
      expect(mockIs).toHaveBeenCalledWith('deleted_at', null)
    })

    it('ensures getSharedPromptAnalysis queries with is("deleted_at", null)', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null })
      await getSharedPromptAnalysis('share-token')
      expect(mockIs).toHaveBeenCalledWith('deleted_at', null)
    })
  })

  describe('Usage Reservations & Feedback Count', () => {
    it('acquireReservation invokes acquire_usage_reservation RPC and returns status', async () => {
      mockRpc.mockResolvedValue({ data: 'success:reserved', error: null })
      const status = await acquireReservation(MOCK_ANALYSIS_ID, MOCK_OWNER_ID, null)
      expect(status).toBe('success:reserved')
      expect(mockRpc).toHaveBeenCalledWith('acquire_usage_reservation', {
        p_reservation_id: MOCK_ANALYSIS_ID,
        p_owner_anonymous_id: MOCK_OWNER_ID,
        p_user_id: null
      })
    })

    it('completeReservation invokes complete_usage_reservation RPC', async () => {
      mockRpc.mockResolvedValue({ data: true, error: null })
      const res = await completeReservation(MOCK_ANALYSIS_ID)
      expect(res).toBe(true)
      expect(mockRpc).toHaveBeenCalledWith('complete_usage_reservation', {
        p_reservation_id: MOCK_ANALYSIS_ID
      })
    })

    it('releaseReservation invokes release_usage_reservation RPC', async () => {
      mockRpc.mockResolvedValue({ data: true, error: null })
      const res = await releaseReservation(MOCK_ANALYSIS_ID)
      expect(res).toBe(true)
      expect(mockRpc).toHaveBeenCalledWith('release_usage_reservation', {
        p_reservation_id: MOCK_ANALYSIS_ID
      })
    })

    it('getRecentFeedbackCount counts recent feedback_submitted events', async () => {
      builder.then = vi.fn((onfulfilled) => Promise.resolve({ count: 5, error: null }).then(onfulfilled))

      const count = await getRecentFeedbackCount(MOCK_OWNER_ID, null, 60)
      expect(count).toBe(5)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('usage_events')
      expect(mockSelect).toHaveBeenCalledWith('id', { count: 'exact' })
      expect(mockEq).toHaveBeenCalledWith('event_type', 'feedback_submitted')
      expect(mockGte).toHaveBeenCalledWith('created_at', expect.any(String))
    })
  })
})
