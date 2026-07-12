import { createHmac } from 'node:crypto'
import { getSupabaseAdminClient } from '../supabase/admin'

/**
 * Hash client IP or User-Agent using HMAC-SHA256 with server secret.
 * Requires RATE_LIMIT_HMAC_SECRET outside of test mode.
 */
export function hashValue(value: string): string {
  const secret = process.env.RATE_LIMIT_HMAC_SECRET
  const isTestOrDev = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development'

  if (!secret) {
    if (!isTestOrDev) {
      throw new Error('CRITICAL SECURITY ERROR: RATE_LIMIT_HMAC_SECRET is not configured.')
    }
    // Fallback secret for tests/dev to pass without throwing
    const fallbackSecret = 'test-fallback-rate-limit-hmac-secret-key-123456789'
    const digest = createHmac('sha256', fallbackSecret).update(value).digest('hex')
    return `v1:${digest}`
  }

  const digest = createHmac('sha256', secret).update(value).digest('hex')
  return `v1:${digest}`
}

/**
 * Safely normalizes and extracts the client IP address from trusted proxy headers.
 * Prioritizes Vercel's x-real-ip header for security.
 */
export function getClientIp(headers: Headers): string | null {
  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    const parts = forwardedFor.split(',')
    const firstIp = parts[0]?.trim()
    if (firstIp) return firstIp
  }
  return null
}

/**
 * Checks the database for the number of analyses started by this IP hash in the last 24 hours.
 */
export async function checkIpRateLimit(ipHash: string | null, limit = 15): Promise<{ allowed: boolean; count: number }> {
  if (!ipHash) return { allowed: true, count: 0 }
  const supabase = getSupabaseAdminClient()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count, error } = await supabase
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .eq('event_type', 'analysis_started')
    .gte('created_at', oneDayAgo)

  if (error) {
    console.error('Error checking IP rate limit:', error)
    return { allowed: true, count: 0 } // Fail open on DB error
  }

  const currentCount = count ?? 0
  return {
    allowed: currentCount < limit,
    count: currentCount
  }
}

/**
 * Checks the database for the global total of completed analyses in the last 24 hours.
 */
export async function checkGlobalDailyLimit(limit = 1000): Promise<boolean> {
  const supabase = getSupabaseAdminClient()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count, error } = await supabase
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'analysis_completed')
    .gte('created_at', oneDayAgo)

  if (error) {
    console.error('Error checking global rate limit:', error)
    return true // Fail open on DB error
  }

  return (count ?? 0) < limit
}

/**
 * Checks the database for the total estimated AI provider cost in the last 24 hours.
 * Default budget limit is $10.00.
 */
export async function checkGlobalDailyCostLimit(limitUsd = 10.00): Promise<boolean> {
  const envLimit = process.env.GLOBAL_DAILY_COST_LIMIT
  const maxCost = envLimit ? parseFloat(envLimit) : limitUsd

  const supabase = getSupabaseAdminClient()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('usage_events')
    .select('metadata_json')
    .eq('event_type', 'analysis_completed')
    .gte('created_at', oneDayAgo)

  if (error) {
    console.error('Error checking global daily cost limit:', error)
    return true // Fail open on DB error
  }

  let totalCost = 0
  if (data) {
    for (const event of data) {
      const meta = event.metadata_json as Record<string, unknown> | null
      const input = Number(meta?.input_tokens ?? 0)
      const output = Number(meta?.output_tokens ?? 0)
      // Gemini 2.5 Flash pricing: $0.075 per 1M input, $0.30 per 1M output
      const cost = (input * 0.075 / 1000000) + (output * 0.30 / 1000000)
      totalCost += cost
    }
  }

  return totalCost < maxCost
}


/**
 * Verifies a Cloudflare Turnstile CAPTCHA token using the challenges API.
 */
export async function verifyTurnstileToken(token: string | null | undefined): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) {
    return false // Turnstile verification defaults to blocking if key is missing
  }
  if (!token) return false

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`
    })
    const data = await res.json()
    return !!data.success
  } catch (err) {
    console.error('Cloudflare Turnstile verification error:', err)
    return false
  }
}
