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

const MOCK_ANALYSIS_ID = '11111111-1111-1111-1111-111111111111'
const MOCK_OWNER_ID = '22222222-2222-2222-2222-222222222222'
const MOCK_USER_ID = '44444444-4444-4444-4444-444444444444'

describe('Supabase Prompt History Actions & Filters Integration', () => {
  const mockSingle = vi.fn()
  const mockMaybeSingle = vi.fn()
  const mockSelect = vi.fn()
  const mockUpdate = vi.fn()
  const mockEq = vi.fn()
  const mockOr = vi.fn()
  const mockIs = vi.fn()
  const mockOrder = vi.fn()
  const mockRpc = vi.fn()

  const mockSupabaseClient = {
    from: vi.fn(),
    rpc: mockRpc
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
    mockRpc.mockResolvedValue({ data: [], error: null })
    vi.mocked(getSupabaseServerClient).mockReturnValue(mockSupabaseClient as unknown as ReturnType<typeof getSupabaseServerClient>)
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockSupabaseClient as unknown as ReturnType<typeof getSupabaseAdminClient>)
  })

  describe('input parameter UUID validations', () => {
    it('throws validation error if id/ownerAnonymousId/userId are malformed', async () => {
      await expect(
        toggleFavoriteAnalysis('invalid-uuid', MOCK_OWNER_ID, MOCK_USER_ID, true)
      ).rejects.toThrow('Invalid UUID format')

      await expect(
        softDeleteAnalysis(MOCK_ANALYSIS_ID, 'invalid-uuid', MOCK_USER_ID)
      ).rejects.toThrow('Invalid UUID format')

      await expect(
        softDeleteAnalysis(MOCK_ANALYSIS_ID, MOCK_OWNER_ID, 'invalid-uuid')
      ).rejects.toThrow('Invalid UUID format')
    })
  })

  describe('database error handling', () => {
    it('throws custom database error if database update fails in mutations', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'DB Connection Failure' } })

      await expect(
        toggleFavoriteAnalysis(MOCK_ANALYSIS_ID, MOCK_OWNER_ID, MOCK_USER_ID, true)
      ).rejects.toThrow('Database error: DB Connection Failure')
    })

    it('returns false (not error) if update succeeds but affects zero rows', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

      const result = await toggleFavoriteAnalysis(MOCK_ANALYSIS_ID, MOCK_OWNER_ID, MOCK_USER_ID, true)
      expect(result).toBe(false)
    })
  })

  describe('toggleFavoriteAnalysis mutation', () => {
    it('performs SQL update to set is_favorite status under correct ownership', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: MOCK_ANALYSIS_ID }, error: null })

      const result = await toggleFavoriteAnalysis(MOCK_ANALYSIS_ID, MOCK_OWNER_ID, MOCK_USER_ID, true)
      expect(result).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prompt_analyses')
      expect(mockUpdate).toHaveBeenCalledWith({ is_favorite: true })
      expect(mockEq).toHaveBeenCalledWith('id', MOCK_ANALYSIS_ID)
      expect(mockOr).toHaveBeenCalledWith(`user_id.eq.${MOCK_USER_ID},and(user_id.is.null,owner_anonymous_id.eq.${MOCK_OWNER_ID})`)
    })
  })

  describe('softDeleteAnalysis mutation', () => {
    it('performs SQL update to set deleted_at status under correct ownership', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: MOCK_ANALYSIS_ID }, error: null })

      const result = await softDeleteAnalysis(MOCK_ANALYSIS_ID, MOCK_OWNER_ID, MOCK_USER_ID)
      expect(result).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prompt_analyses')
      expect(mockUpdate).toHaveBeenCalledWith({ deleted_at: expect.any(String) })
      expect(mockEq).toHaveBeenCalledWith('id', MOCK_ANALYSIS_ID)
      expect(mockOr).toHaveBeenCalledWith(`user_id.eq.${MOCK_USER_ID},and(user_id.is.null,owner_anonymous_id.eq.${MOCK_OWNER_ID})`)
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
      mockRpc.mockResolvedValue({ data: [], error: null })

      await getPromptAnalysesForUser(MOCK_USER_ID, MOCK_OWNER_ID, {
        lang: 'pl',
        profile: 'openrouter-deepseek-v4-flash'
      })

      expect(mockRpc).toHaveBeenCalledWith('search_user_prompt_history', {
        p_user_id: MOCK_USER_ID,
        p_owner_anonymous_id: MOCK_OWNER_ID,
        p_search_term: '',
        p_lang: 'pl',
        p_profile: 'openrouter-deepseek-v4-flash',
        p_task_type: 'all',
        p_is_favorite: null,
        p_sort_by: 'newest',
        p_limit: 20,
        p_offset: 0
      })
    })

    it('applies favorite, search phrase, limit, and offset queries', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null })

      await getPromptAnalysesForUser(MOCK_USER_ID, MOCK_OWNER_ID, {
        isFavorite: true,
        search: 'marketing',
        limit: 50,
        offset: 10
      })

      expect(mockRpc).toHaveBeenCalledWith('search_user_prompt_history', {
        p_user_id: MOCK_USER_ID,
        p_owner_anonymous_id: MOCK_OWNER_ID,
        p_search_term: 'marketing',
        p_lang: 'all',
        p_profile: 'all',
        p_task_type: 'all',
        p_is_favorite: true,
        p_sort_by: 'newest',
        p_limit: 50,
        p_offset: 10
      })
    })

    it('applies oldest, highest_score, and lowest_score sorting', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null })

      await getPromptAnalysesForUser(MOCK_USER_ID, MOCK_OWNER_ID, {
        sortBy: 'oldest'
      })
      expect(mockRpc).toHaveBeenLastCalledWith('search_user_prompt_history', expect.objectContaining({
        p_sort_by: 'oldest'
      }))

      await getPromptAnalysesForUser(MOCK_USER_ID, MOCK_OWNER_ID, {
        sortBy: 'highest_score'
      })
      expect(mockRpc).toHaveBeenLastCalledWith('search_user_prompt_history', expect.objectContaining({
        p_sort_by: 'highest_score'
      }))

      await getPromptAnalysesForUser(MOCK_USER_ID, MOCK_OWNER_ID, {
        sortBy: 'lowest_score'
      })
      expect(mockRpc).toHaveBeenLastCalledWith('search_user_prompt_history', expect.objectContaining({
        p_sort_by: 'lowest_score'
      }))
    })

    it('safely handles special search query characters (passed as-is to parameterized RPC, including wildcards)', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null })

      const specialSearchTerms = [
        'normal text',
        'comma,text',
        '(test)',
        '"quoted"',
        '\'single quoted\'',
        '100%',
        'under_score',
        '\\escaped\\',
        '),title.ilike.%,(',
        'or(and)'
      ]

      for (const term of specialSearchTerms) {
        await getPromptAnalysesForUser(MOCK_USER_ID, MOCK_OWNER_ID, {
          search: term
        })
        expect(mockRpc).toHaveBeenLastCalledWith('search_user_prompt_history', expect.objectContaining({
          p_search_term: term
        }))
      }
    })

    describe('defensive pagination clamping', () => {
      it('clamps limit to 1 when limit is -1', async () => {
        await getPromptAnalysesForUser(MOCK_USER_ID, MOCK_OWNER_ID, { limit: -1 })
        expect(mockRpc).toHaveBeenLastCalledWith('search_user_prompt_history', expect.objectContaining({
          p_limit: 1
        }))
      })

      it('clamps limit to 1 when limit is 0', async () => {
        await getPromptAnalysesForUser(MOCK_USER_ID, MOCK_OWNER_ID, { limit: 0 })
        expect(mockRpc).toHaveBeenLastCalledWith('search_user_prompt_history', expect.objectContaining({
          p_limit: 1
        }))
      })

      it('retains limit of 1 when limit is 1', async () => {
        await getPromptAnalysesForUser(MOCK_USER_ID, MOCK_OWNER_ID, { limit: 1 })
        expect(mockRpc).toHaveBeenLastCalledWith('search_user_prompt_history', expect.objectContaining({
          p_limit: 1
        }))
      })

      it('retains limit of 100 when limit is 100', async () => {
        await getPromptAnalysesForUser(MOCK_USER_ID, MOCK_OWNER_ID, { limit: 100 })
        expect(mockRpc).toHaveBeenLastCalledWith('search_user_prompt_history', expect.objectContaining({
          p_limit: 100
        }))
      })

      it('clamps limit to 100 when limit is 101', async () => {
        await getPromptAnalysesForUser(MOCK_USER_ID, MOCK_OWNER_ID, { limit: 101 })
        expect(mockRpc).toHaveBeenLastCalledWith('search_user_prompt_history', expect.objectContaining({
          p_limit: 100
        }))
      })

      it('clamps offset to 0 when offset is negative', async () => {
        await getPromptAnalysesForUser(MOCK_USER_ID, MOCK_OWNER_ID, { offset: -5 })
        expect(mockRpc).toHaveBeenLastCalledWith('search_user_prompt_history', expect.objectContaining({
          p_offset: 0
        }))
      })
    })

    describe('sort parameter validation and strict allowlist', () => {
      it('uses safe default newest if sort value is unknown', async () => {
        await getPromptAnalysesForUser(MOCK_USER_ID, MOCK_OWNER_ID, {
          sortBy: 'unknown_sort_value' as unknown as 'newest'
        })
        expect(mockRpc).toHaveBeenLastCalledWith('search_user_prompt_history', expect.objectContaining({
          p_sort_by: 'newest'
        }))
      })
    })

    describe('ownership identification and security policies', () => {
      it('throws error if both user ID and anonymous ID are missing/empty', async () => {
        await expect(
          getPromptAnalysesForUser('', '')
        ).rejects.toThrow('Ownership identity missing: either userId or ownerAnonymousId must be provided')
      })

      it('supports authenticated identity only, calling RPC with null anonymous ID', async () => {
        await getPromptAnalysesForUser(MOCK_USER_ID, '')
        expect(mockRpc).toHaveBeenLastCalledWith('search_user_prompt_history', expect.objectContaining({
          p_user_id: MOCK_USER_ID,
          p_owner_anonymous_id: null
        }))
      })

      it('supports anonymous identity only, calling RPC with null user ID', async () => {
        await getPromptAnalysesForUser('', MOCK_OWNER_ID)
        expect(mockRpc).toHaveBeenLastCalledWith('search_user_prompt_history', expect.objectContaining({
          p_user_id: null,
          p_owner_anonymous_id: MOCK_OWNER_ID
        }))
      })

      it('supports linked authenticated and anonymous identities, calling RPC with both UUIDs', async () => {
        await getPromptAnalysesForUser(MOCK_USER_ID, MOCK_OWNER_ID)
        expect(mockRpc).toHaveBeenLastCalledWith('search_user_prompt_history', expect.objectContaining({
          p_user_id: MOCK_USER_ID,
          p_owner_anonymous_id: MOCK_OWNER_ID
        }))
      })
    })

    describe('PostgreSQL real-database UUID/null compatibility regression tests', () => {
      it('authenticated-only call passes p_owner_anonymous_id: null (never empty string)', async () => {
        await getPromptAnalysesForUser(MOCK_USER_ID, '')
        expect(mockRpc).toHaveBeenLastCalledWith('search_user_prompt_history', expect.objectContaining({
          p_user_id: MOCK_USER_ID,
          p_owner_anonymous_id: null
        }))

        const lastCallArgs = mockRpc.mock.calls[mockRpc.mock.calls.length - 1][1] as Record<string, unknown>
        expect(lastCallArgs['p_owner_anonymous_id']).not.toBe('')
      })

      it('anonymous-only call passes p_user_id: null (never empty string)', async () => {
        await getPromptAnalysesForUser('', MOCK_OWNER_ID)
        expect(mockRpc).toHaveBeenLastCalledWith('search_user_prompt_history', expect.objectContaining({
          p_user_id: null,
          p_owner_anonymous_id: MOCK_OWNER_ID
        }))

        const lastCallArgs = mockRpc.mock.calls[mockRpc.mock.calls.length - 1][1] as Record<string, unknown>
        expect(lastCallArgs['p_user_id']).not.toBe('')
      })

      it('both identities missing are rejected before the RPC call', async () => {
        mockRpc.mockClear()
        await expect(
          getPromptAnalysesForUser('', '')
        ).rejects.toThrow('Ownership identity missing')
        expect(mockRpc).not.toHaveBeenCalled()
      })
    })
  })
})
