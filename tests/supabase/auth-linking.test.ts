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

// Mock getSupabaseServerClient
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn()
}))

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

  const mockSupabaseClient = {
    from: vi.fn(() => ({
      select: mockSelect,
      update: mockUpdate,
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: mockSingle
        }))
      }))
    }))
  }

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
    vi.mocked(getSupabaseServerClient).mockReturnValue(mockSupabaseClient as unknown as ReturnType<typeof getSupabaseServerClient>)
  })

  describe('getPromptAnalysisForOwner with Dual Ownership', () => {
    it('queries by owner_anonymous_id only if userId is not provided', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { id: 'analysis-123', owner_anonymous_id: 'owner-123' },
        error: null
      })

      const result = await getPromptAnalysisForOwner('analysis-123', 'owner-123')
      expect(result).toBeDefined()
      expect(mockEq).toHaveBeenCalledWith('id', 'analysis-123')
      expect(mockEq).toHaveBeenCalledWith('owner_anonymous_id', 'owner-123')
    })

    it('queries with OR criteria if userId is provided', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { id: 'analysis-123', owner_anonymous_id: 'owner-123', user_id: 'user-789' },
        error: null
      })

      const result = await getPromptAnalysisForOwner('analysis-123', 'owner-123', 'user-789')
      expect(result).toBeDefined()
      expect(mockEq).toHaveBeenCalledWith('id', 'analysis-123')
      expect(mockOr).toHaveBeenCalledWith('owner_anonymous_id.eq.owner-123,user_id.eq.user-789')
    })
  })

  describe('linkAnonymousAnalyses history migration', () => {
    it('performs SQL update to map analyses to logged-in user', async () => {
      const result = await linkAnonymousAnalyses('owner-123', 'user-789')
      expect(result).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('prompt_analyses')
      expect(mockUpdate).toHaveBeenCalledWith({ user_id: 'user-789' })
      expect(mockEq).toHaveBeenCalledWith('owner_anonymous_id', 'owner-123')
      expect(mockIs).toHaveBeenCalledWith('user_id', null)
    })
  })

  describe('getPromptAnalysesForUser history combined fetch', () => {
    it('queries combined history sorted by creation date', async () => {
      const mockRows = [
        { id: '1', user_id: 'user-789', owner_anonymous_id: 'owner-123' },
        { id: '2', user_id: null, owner_anonymous_id: 'owner-123' }
      ]
      mockOrder.mockResolvedValue({ data: mockRows, error: null })

      const result = await getPromptAnalysesForUser('user-789', 'owner-123')
      expect(result).toHaveLength(2)
      expect(mockOr).toHaveBeenCalledWith('user_id.eq.user-789,owner_anonymous_id.eq.owner-123')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    })
  })

  describe('getUserProfile and createUserProfile sync', () => {
    it('getUserProfile fetches the correct user record', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { user_id: 'user-789', email: 'test@email.com' },
        error: null
      })

      const profile = await getUserProfile('user-789')
      expect(profile).toBeDefined()
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-789')
    })

    it('createUserProfile inserts the profile correctly', async () => {
      const mockInsertProfile = { user_id: 'user-789', email: 'test@email.com' }
      mockSingle.mockResolvedValue({
        data: mockInsertProfile,
        error: null
      })

      const result = await createUserProfile(mockInsertProfile)
      expect(result).toEqual(mockInsertProfile)
    })
  })
})
