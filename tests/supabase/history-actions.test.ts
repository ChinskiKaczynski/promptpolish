import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

import {
  toggleFavoriteAnalysis,
  softDeleteAnalysis,
  getSharedPromptAnalysis,
  getPromptAnalysesForUser
} from '@/lib/supabase/queries'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

// Mock getSupabaseServerClient and getSupabaseAdminClient
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn()
}))
vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: vi.fn()
}))

describe('Supabase Prompt History Actions & Filters Integration', () => {
  const mockSingle = vi.fn()
  const mockMaybeSingle = vi.fn()
  const mockSelect = vi.fn()
  const mockUpdate = vi.fn()
  const mockEq = vi.fn()
  const mockOr = vi.fn()
  const mockIs = vi.fn()
  const mockOrder = vi.fn()

  const mockSupabaseClient = {
    from: vi.fn()
  } as unknown as ReturnType<typeof getSupabaseServerClient>

  beforeEach(() => {
    vi.clearAllMocks()

    const builder: Record<string, unknown> = {}
    builder['select'] = mockSelect.mockReturnValue(builder)
    builder['update'] = mockUpdate.mockReturnValue(builder)
    builder['eq'] = mockEq.mockReturnValue(builder)
    builder['or'] = mockOr.mockReturnValue(builder)
    builder['is'] = mockIs.mockReturnValue(builder)
    builder['order'] = mockOrder.mockReturnValue(builder)
    builder['single'] = mockSingle
    builder['maybeSingle'] = mockMaybeSingle

    mockSupabaseClient.from.mockReturnValue(builder)
    vi.mocked(getSupabaseServerClient).mockReturnValue(mockSupabaseClient as unknown as ReturnType<typeof getSupabaseServerClient>)
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockSupabaseClient as unknown as ReturnType<typeof getSupabaseAdminClient>)
  })

  describe('toggleFavoriteAnalysis mutation', () => {
    it('performs SQL update to set is_favorite status under correct ownership', async () => {
      mockMaybeSingle
        .mockResolvedValueOnce({ data: { id: 'analysis-123', owner_anonymous_id: 'owner-123', user_id: 'user-789' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'analysis-123' }, error: null })

      const result = await toggleFavoriteAnalysis('analysis-123', 'owner-123', 'user-789', true)
      expect(result).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prompt_analyses')
      expect(mockUpdate).toHaveBeenCalledWith({ is_favorite: true })
      expect(mockEq).toHaveBeenNthCalledWith(1, 'id', 'analysis-123')
      expect(mockEq).toHaveBeenNthCalledWith(2, 'id', 'analysis-123')
    })
  })

  describe('softDeleteAnalysis mutation', () => {
    it('performs SQL update to set deleted_at status under correct ownership', async () => {
      mockMaybeSingle
        .mockResolvedValueOnce({ data: { id: 'analysis-123', owner_anonymous_id: 'owner-123', user_id: 'user-789' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'analysis-123' }, error: null })

      const result = await softDeleteAnalysis('analysis-123', 'owner-123', 'user-789')
      expect(result).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prompt_analyses')
      expect(mockUpdate).toHaveBeenCalledWith({ deleted_at: expect.any(String) })
      expect(mockEq).toHaveBeenNthCalledWith(1, 'id', 'analysis-123')
      expect(mockEq).toHaveBeenNthCalledWith(2, 'id', 'analysis-123')
    })
  })

  describe('getSharedPromptAnalysis soft-delete gate', () => {
    it('applies is deleted_at null query segment and returns data if not deleted', async () => {
      const mockResult = {
        input_prompt: 'Test shared prompt',
        working_language: 'en',
        selected_profile_slug: 'general-llm',
        overall_score: 95,
        score_level: 'excellent',
        analysis_json: {},
        improved_prompt: 'Polished',
        created_at: '2026-05-23T12:00:00Z',
        is_share_enabled: true
      }
      mockMaybeSingle.mockResolvedValue({ data: mockResult, error: null })

      const result = await getSharedPromptAnalysis('share-token-123')
      expect(result).toBeDefined()
      expect(mockEq).toHaveBeenCalledWith('share_token', 'share-token-123')
      expect(mockEq).toHaveBeenCalledWith('is_share_enabled', true)
      expect(mockIs).toHaveBeenCalledWith('deleted_at', null)
    })

    it('returns null if search query returns no record due to soft-delete filtering', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null })

      const result = await getSharedPromptAnalysis('deleted-share-token')
      expect(result).toBeNull()
    })
  })

  describe('getPromptAnalysesForUser filtering and search parameters', () => {
    it('applies language and profile filters to the query', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null })

      await getPromptAnalysesForUser('user-789', 'owner-123', {
        lang: 'pl',
        profile: 'openrouter-deepseek-v4-flash'
      })

      expect(mockIs).toHaveBeenCalledWith('deleted_at', null)
      expect(mockOr).toHaveBeenCalledWith('user_id.eq.user-789,owner_anonymous_id.eq.owner-123')
      expect(mockEq).toHaveBeenCalledWith('working_language', 'pl')
      expect(mockEq).toHaveBeenCalledWith('selected_profile_slug', 'openrouter-deepseek-v4-flash')
    })

    it('applies favorite and search phrase queries', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null })

      await getPromptAnalysesForUser('user-789', 'owner-123', {
        isFavorite: true,
        search: 'marketing'
      })

      expect(mockIs).toHaveBeenCalledWith('deleted_at', null)
      expect(mockEq).toHaveBeenCalledWith('is_favorite', true)
      expect(mockOr).toHaveBeenCalledWith('input_prompt.ilike.%marketing%,title.ilike.%marketing%')
    })

    it('applies oldest, highest_score, and lowest_score sorting', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null })

      await getPromptAnalysesForUser('user-789', 'owner-123', {
        sortBy: 'oldest'
      })
      expect(mockOrder).toHaveBeenLastCalledWith('created_at', { ascending: true })

      await getPromptAnalysesForUser('user-789', 'owner-123', {
        sortBy: 'highest_score'
      })
      expect(mockOrder).toHaveBeenLastCalledWith('overall_score', { ascending: false })

      await getPromptAnalysesForUser('user-789', 'owner-123', {
        sortBy: 'lowest_score'
      })
      expect(mockOrder).toHaveBeenLastCalledWith('overall_score', { ascending: true })
    })
  })
})
