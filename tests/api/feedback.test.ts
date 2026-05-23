import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/identity/anonymous', () => ({
  getOwnerIdFromCookies: vi.fn()
}))

vi.mock('@/lib/supabase/queries', () => ({
  getPromptAnalysisForOwner: vi.fn(),
  createFeedbackEvent: vi.fn(),
  createUsageEvent: vi.fn()
}))

import { POST } from '@/app/api/feedback/route'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getPromptAnalysisForOwner, createFeedbackEvent } from '@/lib/supabase/queries'
import type { PromptAnalysisRow, FeedbackEventRow } from '@/lib/supabase/types'

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
    vi.mocked(getPromptAnalysisForOwner).mockResolvedValue(mockRecord)
    vi.mocked(createFeedbackEvent).mockResolvedValue(mockFeedback)
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
    it('returns 401 when no anonymous session cookie is present', async () => {
      vi.mocked(getOwnerIdFromCookies).mockResolvedValue(null)

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('unauthorized')
      expect(getPromptAnalysisForOwner).not.toHaveBeenCalled()
      expect(createFeedbackEvent).not.toHaveBeenCalled()
    })

    it('returns 403 when caller does not own the analysis', async () => {
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

      expect(getPromptAnalysisForOwner).toHaveBeenCalledWith(ANALYSIS_ID, OWNER_ID)
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
})
