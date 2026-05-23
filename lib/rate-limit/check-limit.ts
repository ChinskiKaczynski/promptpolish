import 'server-only'
import { getUsageCountToday, createUsageEvent } from '@/lib/supabase/queries'
import { serverEnv } from '@/lib/env/server'

export interface LimitCheckResult {
  allowed: boolean
  count: number
  limit: number
}

/**
 * Checks whether the owner has exceeded their anonymous daily analysis limit.
 *
 * If the limit is reached, writes a `limit_reached` usage_event to the database
 * so abuse patterns can be monitored without storing personally identifiable data.
 *
 * Privacy note: ipHash and userAgentHash must be SHA-256 hashes (salted with
 * APP_URL via `hashValue`) derived server-side from request headers. Raw IP
 * addresses and user-agent strings are NEVER passed here or stored anywhere.
 *
 * @param ownerAnonymousId - Verified UUID from signed session cookie (never client-supplied)
 * @param ipHash            - Optional SHA-256 hash of the client IP (or null if header absent)
 * @param userAgentHash     - Optional SHA-256 hash of the User-Agent header (or null if absent)
 */
export async function checkAnonymousLimit(
  ownerAnonymousId: string,
  ipHash: string | null = null,
  userAgentHash: string | null = null
): Promise<LimitCheckResult> {
  const limit = serverEnv.ANONYMOUS_DAILY_LIMIT
  const count = await getUsageCountToday(ownerAnonymousId)

  if (count >= limit) {
    // Fire-and-forget — do not block the 429 response on this write.
    // Failures here are non-critical; the limit is still enforced.
    createUsageEvent({
      owner_anonymous_id: ownerAnonymousId,
      event_type: 'limit_reached',
      metadata_json: { count, limit },
      ip_hash: ipHash,
      user_agent_hash: userAgentHash
    }).catch((err: unknown) => {
      console.error('[checkAnonymousLimit] Failed to save limit_reached event:', err)
    })

    return { allowed: false, count, limit }
  }

  return { allowed: true, count, limit }
}
