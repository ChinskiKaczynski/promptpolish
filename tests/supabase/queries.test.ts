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
  disableShareLink
} from '@/lib/supabase/queries'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// Mock getSupabaseServerClient
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn()
}))

// Mock share token creator
vi.mock('@/lib/result-access/share-token', () => ({
  createShareToken: vi.fn(() => 'mocked-32-char-share-token-xyz-123')
}))

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

  const mockSupabaseClient = {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate
    }))
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup standard builder pattern chain
    const builder: Record<string, unknown> & {
      eq: typeof mockEq
      is: typeof mockIs
      or: typeof mockOr
      order: typeof mockOrder
      maybeSingle: typeof mockMaybeSingle
      single: typeof mockSingle
      select: ReturnType<typeof vi.fn>
    } = {
      eq: mockEq,
      is: mockIs,
      or: mockOr,
      order: mockOrder,
      maybeSingle: mockMaybeSingle,
      single: mockSingle,
      select: vi.fn(() => builder)
    }

    mockSelect.mockReturnValue(builder)
    mockInsert.mockReturnValue({
      select: vi.fn(() => builder)
    })
    mockUpdate.mockReturnValue(builder)

    mockEq.mockReturnValue(builder)
    mockIs.mockReturnValue(builder)
    mockOr.mockReturnValue(builder)
    mockOrder.mockReturnValue(builder)

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

      const profile = await getModelProfileBySlug('general-llm')
      expect(profile).toBeNull()
    })
  })

  describe('createPromptAnalysis', () => {
    it('creates a new prompt analysis and returns the row', async () => {
      const mockInput = {
        owner_anonymous_id: 'anonymous-owner-uuid',
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
        data: { id: 'analysis-uuid', ...mockInput },
        error: null
      })

      const result = await createPromptAnalysis(mockInput as unknown as Parameters<typeof createPromptAnalysis>[0])
      expect(result).toEqual({ id: 'analysis-uuid', ...mockInput })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prompt_analyses')
      expect(mockInsert).toHaveBeenCalledWith(mockInput)
    })
  })

  describe('getPromptAnalysisForOwner', () => {
    it('returns private prompt analysis when matching both ID and owner anonymous ID', async () => {
      const mockRecord = {
        id: 'analysis-uuid',
        owner_anonymous_id: 'owner-123',
        input_prompt: 'Secret prompt'
      }

      mockMaybeSingle.mockResolvedValue({
        data: mockRecord,
        error: null
      })

      const result = await getPromptAnalysisForOwner('analysis-uuid', 'owner-123')
      expect(result).toEqual(mockRecord)
      expect(mockEq).toHaveBeenCalledWith('id', 'analysis-uuid')
      expect(mockEq).toHaveBeenCalledWith('owner_anonymous_id', 'owner-123')
    })
  })

  describe('getSharedPromptAnalysis', () => {
    it('returns a scrubbed analysis payload when a valid share token is provided and is_share_enabled is true', async () => {
      const dbRecord = {
        input_prompt: 'My raw prompt',
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
      
      // Verification: Should return scrubbed payload (excluding is_share_enabled or private IDs)
      expect(result).toEqual({
        input_prompt: 'My raw prompt',
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
        owner_anonymous_id: 'owner-123',
        event_type: 'copy',
        metadata_json: { analysis_id: 'uuid' }
      }

      mockSingle.mockResolvedValue({ data: { id: 'event-uuid', ...mockEvent }, error: null })
      const result = await createUsageEvent(mockEvent as unknown as Parameters<typeof createUsageEvent>[0])
      expect(result).toEqual({ id: 'event-uuid', ...mockEvent })
    })

    it('creates copy event via telemetry helper', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'event-uuid',
          owner_anonymous_id: 'owner-123',
          event_type: 'copy',
          metadata_json: { analysis_id: 'analysis-123' }
        },
        error: null
      })

      const result = await createCopyEvent('owner-123', 'analysis-123')
      expect(result).toBeDefined()
      expect(result?.event_type).toBe('copy')
    })

    it('creates feedback event', async () => {
      const mockFeedback = {
        analysis_id: 'analysis-uuid',
        rating: 'up' as const,
        comment: 'Nice output'
      }

      mockSingle.mockResolvedValue({ data: { id: 'feedback-uuid', ...mockFeedback }, error: null })
      const result = await createFeedbackEvent(mockFeedback as unknown as Parameters<typeof createFeedbackEvent>[0])
      expect(result).toEqual({ id: 'feedback-uuid', ...mockFeedback })
    })
  })

  describe('createShareLink & disableShareLink', () => {
    it('enables sharing by generating share token and updating row', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { share_token: 'mocked-32-char-share-token-xyz-123' },
        error: null
      })

      const token = await createShareLink('analysis-uuid', 'owner-123')
      expect(token).toBe('mocked-32-char-share-token-xyz-123')
      expect(mockUpdate).toHaveBeenCalledWith({
        is_share_enabled: true,
        share_token: 'mocked-32-char-share-token-xyz-123'
      })
      expect(mockEq).toHaveBeenCalledWith('id', 'analysis-uuid')
      expect(mockEq).toHaveBeenCalledWith('owner_anonymous_id', 'owner-123')
    })

    it('disables public share by setting is_share_enabled=false and clearing token', async () => {
      // Fixed implementation: returns data with the updated row id to confirm ownership match
      mockMaybeSingle.mockResolvedValue({
        data: { id: 'analysis-uuid' },
        error: null
      })

      const success = await disableShareLink('analysis-uuid', 'owner-123')
      expect(success).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith({
        is_share_enabled: false,
        share_token: null
      })
      expect(mockEq).toHaveBeenCalledWith('id', 'analysis-uuid')
      expect(mockEq).toHaveBeenCalledWith('owner_anonymous_id', 'owner-123')
    })
  })
})
