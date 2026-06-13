import { createHmac } from 'node:crypto'

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
 */
export function getClientIp(headers: Headers): string | null {
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    const parts = forwardedFor.split(',')
    const firstIp = parts[0]?.trim()
    if (firstIp) return firstIp
  }
  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return null
}
