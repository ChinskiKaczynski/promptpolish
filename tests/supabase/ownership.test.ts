import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

import {
  getPromptAnalysisForOwner,
  createShareLink,
  disableShareLink
} from '@/lib/supabase/queries'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: vi.fn()
}))

vi.mock('@/lib/result-access/share-token', () => ({
  createShareToken: vi.fn(() => 'mocked-32-char-share-token-xyz-123')
}))

describe('Supabase Data Access Layer - Canonical Ownership & Access Control', () => {
  const mockMaybeSingle = vi.fn()
  const mockSelect = vi.fn()
  const mockUpdate = vi.fn()
  const mockEq = vi.fn()
  const mockIs = vi.fn()

  const mockSupabaseClient = {
    from: vi.fn(() => ({
      select: mockSelect,
      update: mockUpdate
    }))
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getSupabaseAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseClient)

    const builder: Record<string, unknown> & {
      eq: typeof mockEq
      is: typeof mockIs
      maybeSingle: typeof mockMaybeSingle
      select: ReturnType<typeof vi.fn>
    } = {
      eq: mockEq,
      is: mockIs,
      maybeSingle: mockMaybeSingle,
      select: vi.fn(() => builder)
    }

    mockSelect.mockReturnValue(builder)
    mockUpdate.mockReturnValue(builder)
    mockEq.mockReturnValue(builder)
    mockIs.mockReturnValue(builder)
  })

  describe('Rule 1: Anonymous owner access', () => {
    it('grants access when user_id IS NULL and owner_anonymous_id matches', async () => {
      const record = {
        id: 'analysis-uuid',
        user_id: null,
        owner_anonymous_id: 'anon-owner-123',
        deleted_at: null
      }
      mockMaybeSingle.mockResolvedValue({ data: record, error: null })

      const result = await getPromptAnalysisForOwner('analysis-uuid', 'anon-owner-123')
      expect(result).toEqual(record)
    })

    it('denies access when user_id IS NULL and owner_anonymous_id does not match', async () => {
      const record = {
        id: 'analysis-uuid',
        user_id: null,
        owner_anonymous_id: 'anon-owner-abc',
        deleted_at: null
      }
      mockMaybeSingle.mockResolvedValue({ data: record, error: null })

      const result = await getPromptAnalysisForOwner('analysis-uuid', 'anon-owner-123')
      expect(result).toBeNull()
    })
  })

  describe('Rule 2: Authenticated user access', () => {
    it('grants access when user_id matches authenticated user_id', async () => {
      const record = {
        id: 'analysis-uuid',
        user_id: 'user-auth-123',
        owner_anonymous_id: 'anon-owner-123',
        deleted_at: null
      }
      mockMaybeSingle.mockResolvedValue({ data: record, error: null })

      const result = await getPromptAnalysisForOwner('analysis-uuid', 'anon-owner-different', 'user-auth-123')
      expect(result).toEqual(record)
    })

    it('denies access when user_id does not match authenticated user_id', async () => {
      const record = {
        id: 'analysis-uuid',
        user_id: 'user-auth-abc',
        owner_anonymous_id: 'anon-owner-123',
        deleted_at: null
      }
      mockMaybeSingle.mockResolvedValue({ data: record, error: null })

      const result = await getPromptAnalysisForOwner('analysis-uuid', 'anon-owner-123', 'user-auth-123')
      expect(result).toBeNull()
    })
  })

  describe('Rule 3: Priority of user_id over owner_anonymous_id', () => {
    it('denies access to anonymous owner after the record is bound to a different user_id', async () => {
      const record = {
        id: 'analysis-uuid',
        user_id: 'user-auth-xyz',
        owner_anonymous_id: 'anon-owner-123',
        deleted_at: null
      }
      mockMaybeSingle.mockResolvedValue({ data: record, error: null })

      // Requester has matching owner_anonymous_id but no userId (anonymous request)
      const result = await getPromptAnalysisForOwner('analysis-uuid', 'anon-owner-123')
      expect(result).toBeNull()
    })

    it('grants access to authenticated user even if their anonymous cookie is changed or missing', async () => {
      const record = {
        id: 'analysis-uuid',
        user_id: 'user-auth-123',
        owner_anonymous_id: 'anon-owner-abc',
        deleted_at: null
      }
      mockMaybeSingle.mockResolvedValue({ data: record, error: null })

      // Requester has matching user_id but a different owner_anonymous_id
      const result = await getPromptAnalysisForOwner('analysis-uuid', 'anon-owner-different', 'user-auth-123')
      expect(result).toEqual(record)
    })
  })

  describe('Rule 4: deleted_at != null blocks normal access', () => {
    it('returns null if record has a non-null deleted_at timestamp', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null }) // mock DB filter returning null for .is('deleted_at', null)

      const result = await getPromptAnalysisForOwner('analysis-uuid', 'anon-owner-123', 'user-auth-123')
      expect(result).toBeNull()
      expect(mockIs).toHaveBeenCalledWith('deleted_at', null)
    })
  })

  describe('Share Management Enforcement (createShareLink & disableShareLink)', () => {
    const activeRecord = {
      id: 'analysis-uuid',
      user_id: 'user-auth-123',
      owner_anonymous_id: 'anon-owner-123',
      deleted_at: null
    }

    it('allows logged-in user to create share link even if anonymous cookie changed', async () => {
      mockMaybeSingle
        .mockResolvedValueOnce({ data: activeRecord, error: null }) // getPromptAnalysisForOwner check
        .mockResolvedValueOnce({ data: { share_token: 'mocked-32-char-share-token-xyz-123' }, error: null }) // update response

      const token = await createShareLink('analysis-uuid', 'anon-cookie-different', 'user-auth-123')
      expect(token).toBe('mocked-32-char-share-token-xyz-123')
      expect(mockUpdate).toHaveBeenCalledWith({
        is_share_enabled: true,
        share_token: 'mocked-32-char-share-token-xyz-123'
      })
    })

    it('allows logged-in user to disable share link even if anonymous cookie changed', async () => {
      mockMaybeSingle
        .mockResolvedValueOnce({ data: activeRecord, error: null }) // getPromptAnalysisForOwner check
        .mockResolvedValueOnce({ data: { id: 'analysis-uuid' }, error: null }) // update response

      const success = await disableShareLink('analysis-uuid', 'anon-cookie-different', 'user-auth-123')
      expect(success).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith({
        is_share_enabled: false,
        share_token: null
      })
    })

    it('prevents anonymous guest from managing user-bound analysis', async () => {
      mockMaybeSingle.mockResolvedValue({ data: activeRecord, error: null }) // getPromptAnalysisForOwner check will return null because userId is undefined

      const token = await createShareLink('analysis-uuid', 'anon-owner-123') // anonymous request
      expect(token).toBeNull()

      const success = await disableShareLink('analysis-uuid', 'anon-owner-123') // anonymous request
      expect(success).toBe(false)
    })

    it('prevents non-owner from enabling share', async () => {
      mockMaybeSingle.mockResolvedValue({ data: activeRecord, error: null }) // getPromptAnalysisForOwner returns null for wrong userId

      const token = await createShareLink('analysis-uuid', 'anon-owner-123', 'wrong-user-id')
      expect(token).toBeNull()
    })

    it('prevents non-owner from disabling share', async () => {
      mockMaybeSingle.mockResolvedValue({ data: activeRecord, error: null }) // getPromptAnalysisForOwner returns null for wrong userId

      const success = await disableShareLink('analysis-uuid', 'anon-owner-123', 'wrong-user-id')
      expect(success).toBe(false)
    })

    it('prevents deleted analysis from being shared', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null }) // getPromptAnalysisForOwner returns null for deleted analyses

      const token = await createShareLink('analysis-uuid', 'anon-owner-123', 'user-auth-123')
      expect(token).toBeNull()
    })
  })
})
