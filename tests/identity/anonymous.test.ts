import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

const mockGet = vi.fn()
const mockSet = vi.fn()

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: mockGet,
    set: mockSet
  }))
}))

import {
  signId,
  verifyAndExtractId,
  getOwnerIdFromCookies,
  setOwnerIdCookie,
  resolveOrCreateOwnerId
} from '@/lib/identity/anonymous'

describe('Anonymous Owner Identity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.COOKIE_SIGNING_SECRET = 'test-signing-secret-1234567890-test'
  })

  describe('signId & verifyAndExtractId', () => {
    it('signs a standard UUID and successfully verifies it', () => {
      const originalUuid = '4a8a9a6b-d3c2-48e2-b1db-f5c6d7e8a9b0'
      const signedValue = signId(originalUuid)
      
      expect(signedValue).toContain(originalUuid)
      expect(signedValue).toContain('.')

      const verifiedUuid = verifyAndExtractId(signedValue)
      expect(verifiedUuid).toBe(originalUuid)
    })

    it('rejects an invalid signature or tampered value', () => {
      const originalUuid = '4a8a9a6b-d3c2-48e2-b1db-f5c6d7e8a9b0'
      const signedValue = signId(originalUuid)

      // Tamper signature
      const tamperedValue = signedValue + 'a'
      expect(verifyAndExtractId(tamperedValue)).toBeNull()

      // Tamper ID
      const tamperedId = signedValue.replace('4a8a9a6b', '4a8a9a6c')
      expect(verifyAndExtractId(tamperedId)).toBeNull()
    })

    it('rejects values without correct signed separator format', () => {
      expect(verifyAndExtractId('just-a-plain-uuid-string')).toBeNull()
      expect(verifyAndExtractId('uuid.too.many.separators')).toBeNull()
    })

    it('rejects non-UUID formats even with valid HMAC formats', () => {
      const badId = 'not-a-uuid-format'
      const signedValue = signId(badId)
      expect(verifyAndExtractId(signedValue)).toBeNull()
    })
  })

  describe('getOwnerIdFromCookies & setOwnerIdCookie', () => {
    it('returns null if cookie is missing', async () => {
      mockGet.mockReturnValue(undefined)

      const result = await getOwnerIdFromCookies()
      expect(result).toBeNull()
      expect(mockGet).toHaveBeenCalledWith('owner_anonymous_id')
    })

    it('returns verified ID if cookie is present and valid', async () => {
      const uuid = '5f4e3d2c-1b0a-4c5d-8e9f-a0b1c2d3e4f5'
      const signed = signId(uuid)
      mockGet.mockReturnValue({ value: signed })

      const result = await getOwnerIdFromCookies()
      expect(result).toBe(uuid)
    })

    it('returns null if cookie is present but invalid', async () => {
      mockGet.mockReturnValue({ value: 'invalid-signed-cookie-payload' })

      const result = await getOwnerIdFromCookies()
      expect(result).toBeNull()
    })

    it('sets cookie correctly with secure options', async () => {
      const uuid = '5f4e3d2c-1b0a-4c5d-8e9f-a0b1c2d3e4f5'
      await setOwnerIdCookie(uuid)

      expect(mockSet).toHaveBeenCalledWith(
        'owner_anonymous_id',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 365
        })
      )
    })
  })

  describe('resolveOrCreateOwnerId', () => {
    it('reuses existing verified owner identity', async () => {
      const existingUuid = '5f4e3d2c-1b0a-4c5d-8e9f-a0b1c2d3e4f5'
      const signed = signId(existingUuid)
      mockGet.mockReturnValue({ value: signed })

      const result = await resolveOrCreateOwnerId()
      expect(result).toEqual({ id: existingUuid, isNew: false })
      expect(mockSet).not.toHaveBeenCalled()
    })

    it('creates a new signed identity when cookie is missing', async () => {
      mockGet.mockReturnValue(undefined)

      const result = await resolveOrCreateOwnerId()
      
      expect(result.isNew).toBe(true)
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      expect(mockSet).toHaveBeenCalledWith('owner_anonymous_id', expect.any(String), expect.any(Object))
    })

    it('creates a new signed identity when cookie signature is invalid', async () => {
      mockGet.mockReturnValue({ value: 'tampered-signature.abc' })

      const result = await resolveOrCreateOwnerId()

      expect(result.isNew).toBe(true)
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      expect(mockSet).toHaveBeenCalledWith('owner_anonymous_id', expect.any(String), expect.any(Object))
    })
  })
})
