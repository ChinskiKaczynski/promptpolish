import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { hashValue, getClientIp, checkGlobalDailyCostLimit } from '@/lib/rate-limit/hash-ip'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: vi.fn()
}))

describe('HMAC Fingerprinting & Client IP Normalization', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('hashValue', () => {
    it('appends the v1: prefix to the hashed output in test mode', () => {
      vi.stubEnv('NODE_ENV', 'test')
      vi.stubEnv('RATE_LIMIT_HMAC_SECRET', '')

      const val = '127.0.0.1'
      const hashed = hashValue(val)
      expect(hashed).toBeDefined()
      expect(hashed.startsWith('v1:')).toBe(true)
      // SHA-256 is 64 hex chars, plus 3 chars for "v1:"
      expect(hashed.length).toBe(67)
    })

    it('uses the RATE_LIMIT_HMAC_SECRET when configured', () => {
      vi.stubEnv('NODE_ENV', 'test')
      vi.stubEnv('RATE_LIMIT_HMAC_SECRET', 'my-secret-key-for-hashing-ip-and-ua')

      const val = '192.168.1.1'
      const hash1 = hashValue(val)
      expect(hash1.startsWith('v1:')).toBe(true)

      // Changing secret changes hash
      vi.stubEnv('RATE_LIMIT_HMAC_SECRET', 'different-secret-key')
      const hash2 = hashValue(val)
      expect(hash2).not.toBe(hash1)
    })

    it('throws a critical security error in production mode if RATE_LIMIT_HMAC_SECRET is missing', () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('RATE_LIMIT_HMAC_SECRET', '')

      expect(() => hashValue('127.0.0.1')).toThrowError('CRITICAL SECURITY ERROR')
    })
  })

  describe('getClientIp', () => {
    it('returns the first IP in the x-forwarded-for header list', () => {
      const headers = new Headers({
        'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178'
      })
      const ip = getClientIp(headers)
      expect(ip).toBe('203.0.113.195')
    })

    it('falls back to x-real-ip if x-forwarded-for is missing', () => {
      const headers = new Headers({
        'x-real-ip': ' 203.0.113.196 '
      })
      const ip = getClientIp(headers)
      expect(ip).toBe('203.0.113.196')
    })

    it('returns null if no ip headers are present', () => {
      const headers = new Headers()
      const ip = getClientIp(headers)
      expect(ip).toBeNull()
    })
  })

  describe('checkGlobalDailyCostLimit', () => {
    it('returns true if the total cost is below the limit', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({
              data: [
                { metadata_json: { input_tokens: 1000000, output_tokens: 2000000 } }
              ],
              error: null
            })
          })
        })
      })

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom
      } as unknown as ReturnType<typeof getSupabaseAdminClient>)

      const result = await checkGlobalDailyCostLimit(1.00)
      expect(result).toBe(true)
    })

    it('returns false if the total cost exceeds the limit', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({
              data: [
                { metadata_json: { input_tokens: 10000000, output_tokens: 20000000 } }
              ],
              error: null
            })
          })
        })
      })

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom
      } as unknown as ReturnType<typeof getSupabaseAdminClient>)

      const result = await checkGlobalDailyCostLimit(5.00)
      expect(result).toBe(false)
    })
  })
})
