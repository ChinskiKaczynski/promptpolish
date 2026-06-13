import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/identity/anonymous', () => ({
  getOwnerIdFromCookies: vi.fn()
}))

vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn()
}))

vi.mock('@/lib/supabase/queries', () => ({
  getPromptAnalysisForOwner: vi.fn(),
  createFeedbackEvent: vi.fn(),
  createUsageEvent: vi.fn(),
  getRecentFeedbackCount: vi.fn()
}))

import { POST } from '@/app/api/feedback/route'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import { getPromptAnalysisForOwner, createFeedbackEvent, getRecentFeedbackCount } from '@/lib/supabase/queries'
import type { PromptAnalysisRow, FeedbackEventRow } from '@/lib/supabase/types'
import type { User } from '@supabase/supabase-js'

const ANALYSIS_ID = 'a1b2c3d4-e5f6-4789-abcd-ef1234567890'
const OWNER_ID = 'owner-anon-uuid'

const makeRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

const validPayload = { analysis_id: ANALYSIS_ID, rating: 'up' as const }

const mockRecord = { id: ANALYSIS_ID, owner_anonymous_id: OWNER_ID } as unknown as PromptAnalysisRow
const mockFeedback = { id: 'fb-uuid', analysis_id: ANALYSIS_ID, rating: 'up', comment: null } as FeedbackEventRow

describe('POST /api/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getOwnerIdFromCookies).mockResolvedValue(OWNER_ID)
    vi.mocked(getAuthUser).mockResolvedValue(null)
    vi.mocked(getPromptAnalysisForOwner).mockResolvedValue(mockRecord)
    vi.mocked(createFeedbackEvent).mockResolvedValue(mockFeedback)
    vi.mocked(getRecentFeedbackCount).mockResolvedValue(0)
  })

  describe('Validation', () => {
    it('returns 400 when body is invalid JSON', async () => {
      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json'
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
      expect((await response.json()).error).toBe('invalid_input')
    })

    it('returns 400 when analysis_id is not a UUID', async () => {
      const response = await POST(makeRequest({ analysis_id: 'not-a-uuid', rating: 'up' }))
      expect(response.status).toBe(400)
      expect((await response.json()).error).toBe('invalid_input')
    })

    it('returns 400 when rating is not up or down', async () => {
      const response = await POST(makeRequest({ analysis_id: ANALYSIS_ID, rating: 'meh' }))
      expect(response.status).toBe(400)
      expect((await response.json()).error).toBe('invalid_input')
    })

    it('returns 400 when comment exceeds 500 characters', async () => {
      const response = await POST(makeRequest({
        ...validPayload,
        comment: 'x'.repeat(501)
      }))
      expect(response.status).toBe(400)
      expect((await response.json()).error).toBe('invalid_input')
    })
  })

  describe('Authentication & Ownership', () => {
    it('returns 401 when neither user session nor anonymous cookie is present', async () => {
      vi.mocked(getOwnerIdFromCookies).mockResolvedValue(null)
      vi.mocked(getAuthUser).mockResolvedValue(null)

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('unauthorized')
      expect(getPromptAnalysisForOwner).not.toHaveBeenCalled()
      expect(createFeedbackEvent).not.toHaveBeenCalled()
    })

    it('allows anonymous owner to submit feedback', async () => {
      vi.mocked(getOwnerIdFromCookies).mockResolvedValue(OWNER_ID)
      vi.mocked(getAuthUser).mockResolvedValue(null)
      vi.mocked(getPromptAnalysisForOwner).mockResolvedValue({
        id: ANALYSIS_ID,
        owner_anonymous_id: OWNER_ID,
        user_id: null
      } as PromptAnalysisRow)

      const response = await POST(makeRequest(validPayload))
      expect(response.status).toBe(200)
      expect(getPromptAnalysisForOwner).toHaveBeenCalledWith(ANALYSIS_ID, OWNER_ID, undefined)
    })

    it('allows logged-in owner to submit feedback for historical linked report', async () => {
      vi.mocked(getOwnerIdFromCookies).mockResolvedValue(OWNER_ID)
      vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-789', email: 'test@user.com' } as User)
      vi.mocked(getPromptAnalysisForOwner).mockResolvedValue({
        id: ANALYSIS_ID,
        owner_anonymous_id: OWNER_ID,
        user_id: 'user-789'
      } as PromptAnalysisRow)

      const response = await POST(makeRequest(validPayload))
      expect(response.status).toBe(200)
      expect(getPromptAnalysisForOwner).toHaveBeenCalledWith(ANALYSIS_ID, OWNER_ID, 'user-789')
    })

    it('returns 403 when logged-in user tries to submit feedback for another user\'s report', async () => {
      vi.mocked(getOwnerIdFromCookies).mockResolvedValue(OWNER_ID)
      vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-789', email: 'test@user.com' } as User)
      // Mock getPromptAnalysisForOwner returning null because user-789 doesn't own it
      vi.mocked(getPromptAnalysisForOwner).mockResolvedValue(null)

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('forbidden')
      expect(createFeedbackEvent).not.toHaveBeenCalled()
    })

    it('returns 403 when anonymous cookie tries to submit feedback for a report that has already been linked to a user', async () => {
      vi.mocked(getOwnerIdFromCookies).mockResolvedValue('owner-anon-uuid')
      vi.mocked(getAuthUser).mockResolvedValue(null)
      // Mock getPromptAnalysisForOwner returning null because user_id is set but userId is undefined
      vi.mocked(getPromptAnalysisForOwner).mockResolvedValue(null)

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('forbidden')
      expect(createFeedbackEvent).not.toHaveBeenCalled()
    })
  })

  describe('Successful Persistence', () => {
    it('saves feedback and returns success for a rating-only request (no comment)', async () => {
      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      expect(getPromptAnalysisForOwner).toHaveBeenCalledWith(ANALYSIS_ID, OWNER_ID, undefined)
      expect(createFeedbackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          analysis_id: ANALYSIS_ID,
          rating: 'up',
          comment: null
        })
      )
    })

    it('saves feedback with an optional comment', async () => {
      const response = await POST(makeRequest({ ...validPayload, rating: 'down', comment: 'Could be clearer.' }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      expect(createFeedbackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: 'down',
          comment: 'Could be clearer.'
        })
      )
    })
  })

  describe('Database Failures', () => {
    it('returns 500 when createFeedbackEvent returns null (DB error)', async () => {
      vi.mocked(createFeedbackEvent).mockResolvedValue(null)

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('database_error')
    })
  })

  describe('Rate Limiting', () => {
    it('returns 429 when feedback rate limit is exceeded', async () => {
      vi.mocked(getRecentFeedbackCount).mockResolvedValue(10)

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('rate_limit_exceeded')
      expect(createFeedbackEvent).not.toHaveBeenCalled()
    })
  })
})
