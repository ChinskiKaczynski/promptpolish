import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock server-only sentinel
vi.mock('server-only', () => ({}))

// Mock dependencies
vi.mock('@/lib/supabase/queries', () => ({
  getUsageCountToday: vi.fn(),
  createUsageEvent: vi.fn()
}))

vi.mock('@/lib/env/server', () => ({
  serverEnv: {
    ANONYMOUS_DAILY_LIMIT: 3
  }
}))

import { checkAnonymousLimit } from '@/lib/rate-limit/check-limit'
import { getUsageCountToday, createUsageEvent } from '@/lib/supabase/queries'

describe('checkAnonymousLimit', () => {
  const OWNER_ID = 'test-owner-uuid'
  const IP_HASH = 'abc123hashed'
  const UA_HASH = 'ua456hashed'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createUsageEvent).mockResolvedValue(null)
  })

  it('allows the request when usage count is below the daily limit', async () => {
    vi.mocked(getUsageCountToday).mockResolvedValue(2) // 2 < 3

    const result = await checkAnonymousLimit(OWNER_ID, IP_HASH, UA_HASH)

    expect(result.allowed).toBe(true)
    expect(result.count).toBe(2)
    expect(result.limit).toBe(3)

    // No limit_reached event should be written
    expect(createUsageEvent).not.toHaveBeenCalled()
  })

  it('blocks the request and saves a limit_reached event when count equals the limit', async () => {
    vi.mocked(getUsageCountToday).mockResolvedValue(3) // 3 >= 3

    const result = await checkAnonymousLimit(OWNER_ID, IP_HASH, UA_HASH)

    expect(result.allowed).toBe(false)
    expect(result.count).toBe(3)
    expect(result.limit).toBe(3)

    // Wait for the fire-and-forget promise to settle
    await vi.waitFor(() => expect(createUsageEvent).toHaveBeenCalledTimes(1))

    expect(createUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_anonymous_id: OWNER_ID,
        event_type: 'limit_reached',
        metadata_json: { count: 3, limit: 3 },
        ip_hash: IP_HASH,
        user_agent_hash: UA_HASH
      })
    )
  })

  it('blocks the request and saves a limit_reached event when count exceeds the limit', async () => {
    vi.mocked(getUsageCountToday).mockResolvedValue(10) // 10 > 3

    const result = await checkAnonymousLimit(OWNER_ID, null, null)

    expect(result.allowed).toBe(false)
    expect(result.count).toBe(10)

    await vi.waitFor(() => expect(createUsageEvent).toHaveBeenCalledTimes(1))

    expect(createUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_anonymous_id: OWNER_ID,
        event_type: 'limit_reached',
        ip_hash: null,
        user_agent_hash: null
      })
    )
  })
})
