import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/identity/anonymous', () => ({
  getOwnerIdFromCookies: vi.fn()
}))

vi.mock('@/lib/supabase/queries', () => ({
  createUsageEvent: vi.fn(),
  getPromptAnalysisForOwner: vi.fn(),
  getRecentEventsCount: vi.fn()
}))

import { POST } from '@/app/api/events/route'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { createUsageEvent, getPromptAnalysisForOwner, getRecentEventsCount } from '@/lib/supabase/queries'
import type { UsageEventRow, PromptAnalysisRow } from '@/lib/supabase/types'

const ANALYSIS_ID = 'a1b2c3d4-e5f6-4789-abcd-ef1234567890'
const OWNER_ID = 'owner-anon-uuid'

const makeRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

const validPayload = { event_type: 'copy_improved_prompt', analysis_id: ANALYSIS_ID }

describe('POST /api/events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getOwnerIdFromCookies).mockResolvedValue(OWNER_ID)
    vi.mocked(getRecentEventsCount).mockResolvedValue(0)
    vi.mocked(getPromptAnalysisForOwner).mockResolvedValue({ id: ANALYSIS_ID, owner_anonymous_id: OWNER_ID, user_id: null } as unknown as PromptAnalysisRow)
    vi.mocked(createUsageEvent).mockResolvedValue({
      id: 'evt-uuid',
      owner_anonymous_id: OWNER_ID,
      event_type: 'copy_improved_prompt',
      metadata_json: { analysis_id: ANALYSIS_ID },
      user_id: null,
      ip_hash: null,
      user_agent_hash: null,
      created_at: new Date().toISOString()
    } as UsageEventRow)
  })

  describe('Validation', () => {
    it('returns 400 when event_type is not in the allowlist', async () => {
      const response = await POST(makeRequest({ event_type: 'arbitrary_event', analysis_id: ANALYSIS_ID }))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('invalid_input')
      expect(createUsageEvent).not.toHaveBeenCalled()
    })

    it('returns 400 when analysis_id is not a valid UUID', async () => {
      const response = await POST(makeRequest({ event_type: 'copy_improved_prompt', analysis_id: 'not-a-uuid' }))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('invalid_input')
    })
  })

  describe('Authentication', () => {
    it('returns 401 when no anonymous session cookie is present', async () => {
      vi.mocked(getOwnerIdFromCookies).mockResolvedValue(null)

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('unauthorized')
      expect(createUsageEvent).not.toHaveBeenCalled()
    })
  })

  describe('Successful Persistence', () => {
    it('saves copy_improved_prompt event and returns success', async () => {
      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_anonymous_id: OWNER_ID,
          event_type: 'copy_improved_prompt',
          metadata_json: { analysis_id: ANALYSIS_ID }
        })
      )

      // Verify prompt content is NOT in metadata
      const callArgs = vi.mocked(createUsageEvent).mock.calls[0][0]
      expect(callArgs.metadata_json).not.toHaveProperty('prompt')
      expect(callArgs.metadata_json).not.toHaveProperty('improved_prompt')
    })
  })

  describe('Rate Limiting & Ownership Hardening', () => {
    it('returns 403 Forbidden when trying to submit event for non-owned analysis', async () => {
      vi.mocked(getPromptAnalysisForOwner).mockResolvedValue(null) // Mock non-owned analysis

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('forbidden')
      expect(createUsageEvent).not.toHaveBeenCalled()
    })

    it('returns 429 Too Many Requests when events rate limit is exceeded', async () => {
      vi.mocked(getRecentEventsCount).mockResolvedValue(30) // Exceeded

      const response = await POST(makeRequest({ event_type: 'upgrade_cta_clicked' }))
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('rate_limit_exceeded')
      expect(createUsageEvent).not.toHaveBeenCalled()
    })
  })
})
