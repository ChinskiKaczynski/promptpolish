import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

import {
  getPromptAnalysisForOwner,
  linkAnonymousAnalyses,
  getPromptAnalysesForUser,
  getUserProfile,
  createUserProfile
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
const MOCK_OTHER_OWNER_ID = '33333333-3333-3333-3333-333333333333'
const MOCK_DIFFERENT_OWNER_ID = '66666666-6666-6666-6666-666666666666'
const MOCK_DIFFERENT_USER_ID = '55555555-5555-5555-5555-555555555555'

describe('Supabase Authentication & History Linking Integration', () => {
  const mockSingle = vi.fn()
  const mockMaybeSingle = vi.fn()
  const mockSelect = vi.fn()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _mockInsert = vi.fn()
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
    builder['upsert'] = vi.fn(() => builder)
    builder['single'] = mockSingle
    builder['maybeSingle'] = mockMaybeSingle

    mockSupabaseClient.from.mockReturnValue(builder)
    mockRpc.mockResolvedValue({ data: [], error: null })
    vi.mocked(getSupabaseServerClient).mockReturnValue(mockSupabaseClient as unknown as ReturnType<typeof getSupabaseServerClient>)
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockSupabaseClient as unknown as ReturnType<typeof getSupabaseAdminClient>)
  })

  describe('getPromptAnalysisForOwner with Dual Ownership', () => {
    it('returns the analysis when owner anonymous ID matches and user_id is null', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { id: MOCK_ANALYSIS_ID, owner_anonymous_id: MOCK_OWNER_ID, user_id: null },
        error: null
      })

      const result = await getPromptAnalysisForOwner(MOCK_ANALYSIS_ID, MOCK_OWNER_ID)
      expect(result).toBeDefined()
      expect(result?.id).toBe(MOCK_ANALYSIS_ID)
      expect(mockEq).toHaveBeenCalledWith('id', MOCK_ANALYSIS_ID)
    })

    it('returns null when owner anonymous ID does not match and user_id is null', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { id: MOCK_ANALYSIS_ID, owner_anonymous_id: MOCK_OTHER_OWNER_ID, user_id: null },
        error: null
      })

      const result = await getPromptAnalysisForOwner(MOCK_ANALYSIS_ID, MOCK_OWNER_ID)
      expect(result).toBeNull()
    })

    it('returns the analysis when logged-in user_id matches, ignoring anonymous ID', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { id: MOCK_ANALYSIS_ID, owner_anonymous_id: MOCK_OWNER_ID, user_id: MOCK_USER_ID },
        error: null
      })

      const result = await getPromptAnalysisForOwner(MOCK_ANALYSIS_ID, MOCK_DIFFERENT_OWNER_ID, MOCK_USER_ID)
      expect(result).toBeDefined()
      expect(result?.user_id).toBe(MOCK_USER_ID)
    })

    it('returns null when logged-in user_id does not match, even if anonymous ID matches', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { id: MOCK_ANALYSIS_ID, owner_anonymous_id: MOCK_OWNER_ID, user_id: MOCK_USER_ID },
        error: null
      })

      const result = await getPromptAnalysisForOwner(MOCK_ANALYSIS_ID, MOCK_OWNER_ID, MOCK_DIFFERENT_USER_ID)
      expect(result).toBeNull()
    })
  })

  describe('linkAnonymousAnalyses history migration', () => {
    it('performs SQL update to map analyses to logged-in user', async () => {
      const result = await linkAnonymousAnalyses(MOCK_OWNER_ID, MOCK_USER_ID)
      expect(result).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prompt_analyses')
      expect(mockUpdate).toHaveBeenCalledWith({ user_id: MOCK_USER_ID })
      expect(mockEq).toHaveBeenCalledWith('owner_anonymous_id', MOCK_OWNER_ID)
      expect(mockIs).toHaveBeenCalledWith('user_id', null)
    })
  })

  describe('getPromptAnalysesForUser history combined fetch', () => {
    it('queries combined history sorted by creation date and filters out other users\' private data', async () => {
      const mockRows = [
        { id: '11111111-1111-1111-1111-111111111111', user_id: MOCK_USER_ID, owner_anonymous_id: MOCK_OWNER_ID },
        { id: '22222222-2222-2222-2222-222222222222', user_id: null, owner_anonymous_id: MOCK_OWNER_ID },
        { id: '33333333-3333-3333-3333-333333333333', user_id: MOCK_DIFFERENT_USER_ID, owner_anonymous_id: MOCK_OWNER_ID }
      ]
      mockRpc.mockResolvedValue({ data: mockRows, error: null })

      const result = await getPromptAnalysesForUser(MOCK_USER_ID, MOCK_OWNER_ID)
      expect(result).toHaveLength(2)
      expect(result.map(r => r.id)).toEqual(['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'])
      expect(mockRpc).toHaveBeenCalledWith('search_user_prompt_history', {
        p_user_id: MOCK_USER_ID,
        p_owner_anonymous_id: MOCK_OWNER_ID,
        p_search_term: '',
        p_lang: 'all',
        p_profile: 'all',
        p_task_type: 'all',
        p_is_favorite: null,
        p_sort_by: 'newest',
        p_limit: 100,
        p_offset: 0
      })
    })
  })

  describe('getUserProfile and createUserProfile sync', () => {
    it('getUserProfile fetches the correct user record', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { user_id: MOCK_USER_ID, email: 'test@email.com' },
        error: null
      })

      const profile = await getUserProfile(MOCK_USER_ID)
      expect(profile).toBeDefined()
      expect(mockEq).toHaveBeenCalledWith('user_id', MOCK_USER_ID)
    })

    it('createUserProfile inserts the profile correctly', async () => {
      const mockInsertProfile = { user_id: MOCK_USER_ID, email: 'test@email.com' }
      mockSingle.mockResolvedValue({
        data: mockInsertProfile,
        error: null
      })

      const result = await createUserProfile(mockInsertProfile)
      expect(result).toEqual(mockInsertProfile)
    })
  })
})
