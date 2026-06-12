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

const MOCK_ANALYSIS_ID = '11111111-1111-1111-1111-111111111111'
const MOCK_OWNER_ID = '22222222-2222-2222-2222-222222222222'
const MOCK_OTHER_OWNER_ID = '33333333-3333-3333-3333-333333333333'
const MOCK_USER_ID = '44444444-4444-4444-4444-444444444444'
const MOCK_OTHER_USER_ID = '55555555-5555-5555-5555-555555555555'
const MOCK_DIFFERENT_OWNER_ID = '66666666-6666-6666-6666-666666666666'
const MOCK_DIFFERENT_USER_ID = '77777777-7777-7777-7777-777777777777'
const MOCK_COOKIE_DIFFERENT_ID = '88888888-8888-8888-8888-888888888888'
const MOCK_WRONG_USER_ID = '99999999-9999-9999-9999-999999999999'

describe('Supabase Data Access Layer - Canonical Ownership & Access Control', () => {
  const mockMaybeSingle = vi.fn()
  const mockSelect = vi.fn()
  const mockUpdate = vi.fn()
  const mockEq = vi.fn()
  const mockIs = vi.fn()
  const mockOr = vi.fn()

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
      or: typeof mockOr
      maybeSingle: typeof mockMaybeSingle
      select: ReturnType<typeof vi.fn>
    } = {
      eq: mockEq,
      is: mockIs,
      or: mockOr,
      maybeSingle: mockMaybeSingle,
      select: vi.fn(() => builder)
    }

    mockSelect.mockReturnValue(builder)
    mockUpdate.mockReturnValue(builder)
    mockEq.mockReturnValue(builder)
    mockIs.mockReturnValue(builder)
    mockOr.mockReturnValue(builder)
  })

  describe('Rule 1: Anonymous owner access', () => {
    it('grants access when user_id IS NULL and owner_anonymous_id matches', async () => {
      const record = {
        id: MOCK_ANALYSIS_ID,
        user_id: null,
        owner_anonymous_id: MOCK_OWNER_ID,
        deleted_at: null
      }
      mockMaybeSingle.mockResolvedValue({ data: record, error: null })

      const result = await getPromptAnalysisForOwner(MOCK_ANALYSIS_ID, MOCK_OWNER_ID)
      expect(result).toEqual(record)
    })

    it('denies access when user_id IS NULL and owner_anonymous_id does not match', async () => {
      const record = {
        id: MOCK_ANALYSIS_ID,
        user_id: null,
        owner_anonymous_id: MOCK_OTHER_OWNER_ID,
        deleted_at: null
      }
      mockMaybeSingle.mockResolvedValue({ data: record, error: null })

      const result = await getPromptAnalysisForOwner(MOCK_ANALYSIS_ID, MOCK_OWNER_ID)
      expect(result).toBeNull()
    })
  })

  describe('Rule 2: Authenticated user access', () => {
    it('grants access when user_id matches authenticated user_id', async () => {
      const record = {
        id: MOCK_ANALYSIS_ID,
        user_id: MOCK_USER_ID,
        owner_anonymous_id: MOCK_OWNER_ID,
        deleted_at: null
      }
      mockMaybeSingle.mockResolvedValue({ data: record, error: null })

      const result = await getPromptAnalysisForOwner(MOCK_ANALYSIS_ID, MOCK_DIFFERENT_OWNER_ID, MOCK_USER_ID)
      expect(result).toEqual(record)
    })

    it('denies access when user_id does not match authenticated user_id', async () => {
      const record = {
        id: MOCK_ANALYSIS_ID,
        user_id: MOCK_OTHER_USER_ID,
        owner_anonymous_id: MOCK_OWNER_ID,
        deleted_at: null
      }
      mockMaybeSingle.mockResolvedValue({ data: record, error: null })

      const result = await getPromptAnalysisForOwner(MOCK_ANALYSIS_ID, MOCK_OWNER_ID, MOCK_USER_ID)
      expect(result).toBeNull()
    })
  })

  describe('Rule 3: Priority of user_id over owner_anonymous_id', () => {
    it('denies access to anonymous owner after the record is bound to a different user_id', async () => {
      const record = {
        id: MOCK_ANALYSIS_ID,
        user_id: MOCK_DIFFERENT_USER_ID,
        owner_anonymous_id: MOCK_OWNER_ID,
        deleted_at: null
      }
      mockMaybeSingle.mockResolvedValue({ data: record, error: null })

      // Requester has matching owner_anonymous_id but no userId (anonymous request)
      const result = await getPromptAnalysisForOwner(MOCK_ANALYSIS_ID, MOCK_OWNER_ID)
      expect(result).toBeNull()
    })

    it('grants access to authenticated user even if their anonymous cookie is changed or missing', async () => {
      const record = {
        id: MOCK_ANALYSIS_ID,
        user_id: MOCK_USER_ID,
        owner_anonymous_id: MOCK_OTHER_OWNER_ID,
        deleted_at: null
      }
      mockMaybeSingle.mockResolvedValue({ data: record, error: null })

      // Requester has matching user_id but a different owner_anonymous_id
      const result = await getPromptAnalysisForOwner(MOCK_ANALYSIS_ID, MOCK_DIFFERENT_OWNER_ID, MOCK_USER_ID)
      expect(result).toEqual(record)
    })
  })

  describe('Rule 4: deleted_at != null blocks normal access', () => {
    it('returns null if record has a non-null deleted_at timestamp', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null }) // mock DB filter returning null for .is('deleted_at', null)

      const result = await getPromptAnalysisForOwner(MOCK_ANALYSIS_ID, MOCK_OWNER_ID, MOCK_USER_ID)
      expect(result).toBeNull()
      expect(mockIs).toHaveBeenCalledWith('deleted_at', null)
    })
  })

  describe('Share Management Enforcement (createShareLink & disableShareLink)', () => {
    it('allows logged-in user to create share link even if anonymous cookie changed', async () => {
      mockMaybeSingle.mockResolvedValue({ data: { share_token: 'mocked-32-char-share-token-xyz-123' }, error: null })

      const token = await createShareLink(MOCK_ANALYSIS_ID, MOCK_COOKIE_DIFFERENT_ID, MOCK_USER_ID)
      expect(token).toBe('mocked-32-char-share-token-xyz-123')
      expect(mockUpdate).toHaveBeenCalledWith({
        is_share_enabled: true,
        share_token: 'mocked-32-char-share-token-xyz-123'
      })
      expect(mockEq).toHaveBeenCalledWith('id', MOCK_ANALYSIS_ID)
      expect(mockOr).toHaveBeenCalledWith(`user_id.eq.${MOCK_USER_ID},and(user_id.is.null,owner_anonymous_id.eq.${MOCK_COOKIE_DIFFERENT_ID})`)
    })

    it('allows logged-in user to disable share link even if anonymous cookie changed', async () => {
      mockMaybeSingle.mockResolvedValue({ data: { id: MOCK_ANALYSIS_ID }, error: null })

      const success = await disableShareLink(MOCK_ANALYSIS_ID, MOCK_COOKIE_DIFFERENT_ID, MOCK_USER_ID)
      expect(success).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith({
        is_share_enabled: false,
        share_token: null
      })
      expect(mockEq).toHaveBeenCalledWith('id', MOCK_ANALYSIS_ID)
      expect(mockOr).toHaveBeenCalledWith(`user_id.eq.${MOCK_USER_ID},and(user_id.is.null,owner_anonymous_id.eq.${MOCK_COOKIE_DIFFERENT_ID})`)
    })

    it('prevents anonymous guest from managing user-bound analysis (update matches 0 rows)', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null })

      const token = await createShareLink(MOCK_ANALYSIS_ID, MOCK_OWNER_ID) // anonymous request
      expect(token).toBeNull()
      expect(mockIs).toHaveBeenCalledWith('user_id', null)
      expect(mockEq).toHaveBeenCalledWith('owner_anonymous_id', MOCK_OWNER_ID)

      const success = await disableShareLink(MOCK_ANALYSIS_ID, MOCK_OWNER_ID) // anonymous request
      expect(success).toBe(false)
    })

    it('prevents non-owner from enabling share (update matches 0 rows)', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null })

      const token = await createShareLink(MOCK_ANALYSIS_ID, MOCK_OWNER_ID, MOCK_WRONG_USER_ID)
      expect(token).toBeNull()
    })

    it('prevents non-owner from disabling share (update matches 0 rows)', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null })

      const success = await disableShareLink(MOCK_ANALYSIS_ID, MOCK_OWNER_ID, MOCK_WRONG_USER_ID)
      expect(success).toBe(false)
    })

    it('prevents deleted analysis from being shared (update matches 0 rows)', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null })

      const token = await createShareLink(MOCK_ANALYSIS_ID, MOCK_OWNER_ID, MOCK_USER_ID)
      expect(token).toBeNull()
    })
  })
})
