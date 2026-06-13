import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/identity/anonymous', () => ({
  getOwnerIdFromCookies: vi.fn()
}))

vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn()
}))

vi.mock('@/lib/supabase/queries', () => ({
  createShareLink: vi.fn(),
  createUsageEvent: vi.fn()
}))

import type { User } from '@supabase/supabase-js'

import { POST } from '@/app/api/share/route'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import { createShareLink, createUsageEvent } from '@/lib/supabase/queries'

const ANALYSIS_ID = 'a1b2c3d4-e5f6-4789-abcd-ef1234567890'
const OWNER_ANON_ID = 'owner-anon-uuid'
const USER_ID = 'user-auth-uuid'

const makeRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

describe('POST /api/share', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getOwnerIdFromCookies).mockResolvedValue(OWNER_ANON_ID)
    vi.mocked(getAuthUser).mockResolvedValue(null)
    vi.mocked(createShareLink).mockResolvedValue('mocked-share-token')
    vi.mocked(createUsageEvent).mockResolvedValue(null)
  })

  describe('Validation', () => {
    it('returns 400 when body is malformed JSON', async () => {
      const request = new Request('http://localhost/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json'
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
      expect((await response.json()).error).toBe('invalid_input')
    })

    it('returns 400 when analysis_id is not a UUID', async () => {
      const response = await POST(makeRequest({ analysis_id: 'not-a-uuid' }))
      expect(response.status).toBe(400)
      expect((await response.json()).error).toBe('invalid_input')
    })
  })

  describe('Authentication & Authorization', () => {
    it('returns 401 when neither user session nor anonymous cookie is present', async () => {
      vi.mocked(getOwnerIdFromCookies).mockResolvedValue(null)
      vi.mocked(getAuthUser).mockResolvedValue(null)

      const response = await POST(makeRequest({ analysis_id: ANALYSIS_ID }))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('unauthorized')
      expect(createShareLink).not.toHaveBeenCalled()
    })

    it('allows anonymous user (cookie only) to share their own analysis', async () => {
      const response = await POST(makeRequest({ analysis_id: ANALYSIS_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.share_token).toBe('mocked-share-token')
      expect(createShareLink).toHaveBeenCalledWith(ANALYSIS_ID, OWNER_ANON_ID, undefined)
      expect(createUsageEvent).toHaveBeenCalledWith({
        owner_anonymous_id: OWNER_ANON_ID,
        user_id: null,
        event_type: 'share_link_created',
        metadata_json: { analysis_id: ANALYSIS_ID }
      })
    })

    it('allows free plan user to share their own analysis', async () => {
      vi.mocked(getAuthUser).mockResolvedValue({ id: USER_ID, email: 'user@test.com' } as unknown as User)

      const response = await POST(makeRequest({ analysis_id: ANALYSIS_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(createShareLink).toHaveBeenCalledWith(ANALYSIS_ID, OWNER_ANON_ID, USER_ID)
    })

    it('denies sharing when caller does not own the analysis (createShareLink returns null)', async () => {
      vi.mocked(createShareLink).mockResolvedValue(null)

      const response = await POST(makeRequest({ analysis_id: ANALYSIS_ID }))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('forbidden')
      expect(createUsageEvent).not.toHaveBeenCalled()
    })
  })
})
