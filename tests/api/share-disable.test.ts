import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/identity/anonymous', () => ({
  getOwnerIdFromCookies: vi.fn()
}))

vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn()
}))

vi.mock('@/lib/supabase/queries', () => ({
  disableShareLink: vi.fn(),
  createUsageEvent: vi.fn()
}))

import type { User } from '@supabase/supabase-js'

import { POST } from '@/app/api/share/disable/route'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import { disableShareLink, createUsageEvent } from '@/lib/supabase/queries'

const ANALYSIS_ID = 'a1b2c3d4-e5f6-4789-abcd-ef1234567890'
const OWNER_ID = 'owner-anon-uuid'
const USER_ID = 'user-auth-uuid'

const makeRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/share/disable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

describe('POST /api/share/disable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getOwnerIdFromCookies).mockResolvedValue(OWNER_ID)
    vi.mocked(getAuthUser).mockResolvedValue(null)
    vi.mocked(disableShareLink).mockResolvedValue(true)
    vi.mocked(createUsageEvent).mockResolvedValue(null)
  })

  describe('Validation', () => {
    it('returns 400 when body is malformed JSON', async () => {
      const request = new Request('http://localhost/api/share/disable', {
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

  describe('Authentication', () => {
    it('returns 401 when neither user session nor anonymous cookie is present', async () => {
      vi.mocked(getOwnerIdFromCookies).mockResolvedValue(null)
      vi.mocked(getAuthUser).mockResolvedValue(null)

      const response = await POST(makeRequest({ analysis_id: ANALYSIS_ID }))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('unauthorized')
      expect(disableShareLink).not.toHaveBeenCalled()
      expect(createUsageEvent).not.toHaveBeenCalled()
    })
  })

  describe('Ownership enforcement', () => {
    it('returns 403 when caller does not own the analysis (non-owner cannot disable)', async () => {
      vi.mocked(disableShareLink).mockResolvedValue(false)

      const response = await POST(makeRequest({ analysis_id: ANALYSIS_ID }))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('forbidden')
      expect(createUsageEvent).not.toHaveBeenCalled()
    })
  })

  describe('Successful disable', () => {
    it('disables the share link for guest owner, logs event, and returns success', async () => {
      const response = await POST(makeRequest({ analysis_id: ANALYSIS_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      expect(disableShareLink).toHaveBeenCalledWith(ANALYSIS_ID, OWNER_ID, undefined)

      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_anonymous_id: OWNER_ID,
          user_id: null,
          event_type: 'share_link_disabled',
          metadata_json: { analysis_id: ANALYSIS_ID }
        })
      )
    })

    it('disables the share link for authenticated user, logs event, and returns success', async () => {
      vi.mocked(getAuthUser).mockResolvedValue({ id: USER_ID, email: 'user@test.com' } as unknown as User)

      const response = await POST(makeRequest({ analysis_id: ANALYSIS_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      expect(disableShareLink).toHaveBeenCalledWith(ANALYSIS_ID, OWNER_ID, USER_ID)

      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_anonymous_id: OWNER_ID,
          user_id: USER_ID,
          event_type: 'share_link_disabled',
          metadata_json: { analysis_id: ANALYSIS_ID }
        })
      )
    })

    it('disabled token does not produce a subsequent valid response (disableShareLink returns false on retry)', async () => {
      vi.mocked(disableShareLink).mockResolvedValueOnce(true)
      const first = await POST(makeRequest({ analysis_id: ANALYSIS_ID }))
      expect(first.status).toBe(200)

      vi.mocked(disableShareLink).mockResolvedValueOnce(false)
      const second = await POST(makeRequest({ analysis_id: ANALYSIS_ID }))
      expect(second.status).toBe(403)
      expect((await second.json()).error).toBe('forbidden')
    })
  })
})
