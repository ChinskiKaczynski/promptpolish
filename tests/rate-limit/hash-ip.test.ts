import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { hashValue, getClientIp } from '@/lib/rate-limit/hash-ip'

describe('HMAC Fingerprinting & Client IP Normalization', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('hashValue', () => {
    it('appends the v1: prefix to the hashed output in test mode', () => {
      process.env.NODE_ENV = 'test'
      delete process.env.RATE_LIMIT_HMAC_SECRET

      const val = '127.0.0.1'
      const hashed = hashValue(val)
      expect(hashed).toBeDefined()
      expect(hashed.startsWith('v1:')).toBe(true)
      // SHA-256 is 64 hex chars, plus 3 chars for "v1:"
      expect(hashed.length).toBe(67)
    })

    it('uses the RATE_LIMIT_HMAC_SECRET when configured', () => {
      process.env.NODE_ENV = 'test'
      process.env.RATE_LIMIT_HMAC_SECRET = 'my-secret-key-for-hashing-ip-and-ua'

      const val = '192.168.1.1'
      const hash1 = hashValue(val)
      expect(hash1.startsWith('v1:')).toBe(true)

      // Changing secret changes hash
      process.env.RATE_LIMIT_HMAC_SECRET = 'different-secret-key'
      const hash2 = hashValue(val)
      expect(hash2).not.toBe(hash1)
    })

    it('throws a critical security error in production mode if RATE_LIMIT_HMAC_SECRET is missing', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.RATE_LIMIT_HMAC_SECRET

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
})
