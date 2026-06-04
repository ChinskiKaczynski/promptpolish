import { describe, expect, it, vi, afterEach } from 'vitest'

// Mock server-only before import
vi.mock('server-only', () => ({}))

import { signId, verifyAndExtractId } from '../../lib/identity/anonymous'

describe('Anonymous Cookie Session Security', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = originalEnv
  })

  // Set environment variable fallback to ensure stable signing key for tests
  process.env.COOKIE_SIGNING_SECRET = 'test-signing-secret-key-1234567890abcdef'

  it('signs and verifies UUIDs correctly', () => {
    const uuid = '6048d0ec-57ae-4c1d-95e9-ae5dff15a360'
    const signedValue = signId(uuid)
    
    expect(signedValue).toContain(uuid)
    expect(signedValue.split('.')).toHaveLength(2)

    const extracted = verifyAndExtractId(signedValue)
    expect(extracted).toBe(uuid)
  })

  it('rejects tampered signatures or values', () => {
    const uuid = '6048d0ec-57ae-4c1d-95e9-ae5dff15a360'
    const signedValue = signId(uuid)
    
    // Attempt 1: Modify the UUID part
    const tamperedUuid = signedValue.replace('6048d0ec', '6048d0ed')
    expect(verifyAndExtractId(tamperedUuid)).toBeNull()

    // Attempt 2: Modify the signature portion
    const parts = signedValue.split('.')
    const tamperedSignature = parts[0] + '.' + parts[1].slice(0, -2) + 'XX'
    expect(verifyAndExtractId(tamperedSignature)).toBeNull()
  })

  it('rejects malformed non-UUID strings even if properly signed', () => {
    const badText = 'not-a-uuid-string-here'
    const signedValue = signId(badText)
    
    // Even if signature is mathematically valid for this text, it is not a valid UUIDv4
    expect(verifyAndExtractId(signedValue)).toBeNull()
  })
})
