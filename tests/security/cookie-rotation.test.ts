import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

const mockGetUser = vi.fn()
const mockCreateServerClient = vi.fn()
let configCookiesCallback: ((cookies: unknown[]) => void) | null = null

vi.mock('@supabase/ssr', () => {
  return {
    createServerClient: (...args: unknown[]) => {
      mockCreateServerClient(...args)
      const options = args[2] as { cookies?: { setAll?: (cookies: unknown[]) => void } } | undefined
      if (options?.cookies?.setAll) {
        configCookiesCallback = options.cookies.setAll
      }
      return {
        auth: {
          getUser: mockGetUser
        }
      }
    }
  }
})

// Declare outer scope mock variables using vi.hoisted so they are available in vi.mock
const {
  mockMaybeSingle,
  mockSelect,
  mockUpdate,
  mockEq,
  mockIs,
  mockOr,
  mockInsert
} = vi.hoisted(() => {
  return {
    mockMaybeSingle: vi.fn(),
    mockSelect: vi.fn(),
    mockUpdate: vi.fn(),
    mockEq: vi.fn(),
    mockIs: vi.fn(),
    mockOr: vi.fn(),
    mockInsert: vi.fn()
  }
})

vi.mock('@/lib/supabase/admin', () => {
  const builder = {
    eq: mockEq,
    is: mockIs,
    or: mockOr,
    maybeSingle: mockMaybeSingle,
    select: vi.fn(),
    insert: mockInsert,
    single: vi.fn()
  }

  builder.select.mockImplementation(() => builder)
  builder.single.mockImplementation(() => builder)

  mockSelect.mockReturnValue(builder)
  mockUpdate.mockReturnValue(builder)
  mockEq.mockReturnValue(builder)
  mockIs.mockReturnValue(builder)
  mockOr.mockReturnValue(builder)
  mockInsert.mockReturnValue(builder)

  return {
    getSupabaseAdminClient: vi.fn(() => ({
      from: vi.fn(() => builder),
      rpc: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }
})

import { signId, verifyAndExtractId } from '@/lib/identity/anonymous'
import { middleware } from '@/middleware'
import {
  getPromptAnalysisForOwner,
  getUsageCountThisMonthForUser,
  createUsageEvent,
  softDeleteAnalysis,
  toggleFavoriteAnalysis,
  getPromptAnalysesForUser,
  createShareLink,
  disableShareLink,
  createFeedbackEvent,
  getRecentEventsCount,
  getRecentFeedbackCount,
  getUsageCountTodayForUser
} from '@/lib/supabase/queries'

describe('Identity & Cookie Security Integration Suite', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    configCookiesCallback = null
    process.env.COOKIE_SIGNING_SECRET = 'secret-a-1234567890-secret-a'
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
  })

  afterEach(() => {
    process.env = originalEnv
  })

  // 1. first anonymous visit with no cookie
  it('1. provisions a new signed cookie on first anonymous visit', async () => {
    const request = new NextRequest('http://localhost/')
    const response = await middleware(request)

    const cookie = response.cookies.get('owner_anonymous_id')
    expect(cookie).toBeDefined()
    expect(cookie?.value).toContain('.')
    
    const extracted = await verifyAndExtractId(cookie!.value)
    expect(extracted).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  // 2. valid signed cookie
  it('2. leaves a valid signed cookie intact', async () => {
    const originalId = '12345678-1234-4567-89ab-123456789012'
    const signedValue = await signId(originalId)
    
    const request = new NextRequest('http://localhost/')
    request.cookies.set('owner_anonymous_id', signedValue)
    
    const response = await middleware(request)
    const cookie = response.cookies.get('owner_anonymous_id')
    // Middleware should not set/overwrite the cookie if it is already valid
    expect(cookie).toBeUndefined()
  })

  // 3. invalid signature after secret rotation
  it('3. rotates and replaces cookie after COOKIE_SIGNING_SECRET rotation', async () => {
    const originalId = '12345678-1234-4567-89ab-123456789012'
    const signedWithOldSecret = await signId(originalId) // signed with secret-a
    
    // Rotate secret
    process.env.COOKIE_SIGNING_SECRET = 'secret-b-rotated-secret-key-123'
    
    const request = new NextRequest('http://localhost/')
    request.cookies.set('owner_anonymous_id', signedWithOldSecret)
    
    const response = await middleware(request)
    const cookie = response.cookies.get('owner_anonymous_id')
    expect(cookie).toBeDefined()
    
    // The new cookie must verify successfully with the new secret
    const newExtracted = await verifyAndExtractId(cookie!.value)
    expect(newExtracted).toBeDefined()
    expect(newExtracted).not.toBe(originalId) // rotated
    expect(newExtracted).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  // 4. malformed cookie
  it('4. replaces a malformed cookie with a new valid signed cookie', async () => {
    const request = new NextRequest('http://localhost/')
    request.cookies.set('owner_anonymous_id', 'not-a-valid-format-or-signature')
    
    const response = await middleware(request)
    const cookie = response.cookies.get('owner_anonymous_id')
    expect(cookie).toBeDefined()
    
    const extracted = await verifyAndExtractId(cookie!.value)
    expect(extracted).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  // 5. authenticated user without anonymous cookie
  it('5. authenticated user without anonymous cookie is provisioned and pages do not require anonymous ID', async () => {
    const mockUser = { id: '99999999-9999-9999-9999-999999999999', email: 'test@example.com' }
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    
    const request = new NextRequest('http://localhost/')
    const response = await middleware(request)
    
    const cookie = response.cookies.get('owner_anonymous_id')
    expect(cookie).toBeDefined() // still gets provisioned for RLS consistency!
    
    // Also, verify getPromptAnalysisForOwner doesn't require anonymous ID for authenticated users
    mockMaybeSingle.mockResolvedValue({
      data: { id: '11111111-1111-1111-1111-111111111111', user_id: mockUser.id, owner_anonymous_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' },
      error: null
    })
    
    const record = await getPromptAnalysisForOwner('11111111-1111-1111-1111-111111111111', null, mockUser.id)
    expect(record).toBeDefined()
    expect(record?.user_id).toBe(mockUser.id)
  })

  // 6. authenticated user with an old invalid anonymous cookie
  it('6. authenticated user with invalid anonymous cookie has it replaced and stays functional', async () => {
    const mockUser = { id: '99999999-9999-9999-9999-999999999999', email: 'test@example.com' }
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    
    const request = new NextRequest('http://localhost/')
    request.cookies.set('owner_anonymous_id', 'invalid-signature')
    
    const response = await middleware(request)
    const cookie = response.cookies.get('owner_anonymous_id')
    expect(cookie).toBeDefined()
    expect(await verifyAndExtractId(cookie!.value)).not.toBeNull()
  })

  // 7. no function receives "" as owner ID
  it('7. updated query functions throw validation errors when passed "" instead of a valid UUID or null', async () => {
    await expect(
      getPromptAnalysisForOwner('11111111-1111-1111-1111-111111111111', '')
    ).rejects.toThrow('Invalid UUID format for ownerAnonymousId: ""')

    await expect(
      getUsageCountThisMonthForUser('', '99999999-9999-9999-9999-999999999999')
    ).rejects.toThrow('Invalid UUID format for ownerAnonymousId: ""')

    await expect(
      softDeleteAnalysis('11111111-1111-1111-1111-111111111111', '')
    ).rejects.toThrow('Invalid UUID format for ownerAnonymousId: ""')

    await expect(
      toggleFavoriteAnalysis('11111111-1111-1111-1111-111111111111', '', '99999999-9999-9999-9999-999999999999', true)
    ).rejects.toThrow('Invalid UUID format for ownerAnonymousId: ""')

    await expect(
      getPromptAnalysesForUser('99999999-9999-9999-9999-999999999999', '')
    ).rejects.toThrow('Invalid UUID format for ownerAnonymousId: ""')

    await expect(
      createShareLink('11111111-1111-1111-1111-111111111111', '')
    ).rejects.toThrow('Invalid UUID format for ownerAnonymousId: ""')

    await expect(
      disableShareLink('11111111-1111-1111-1111-111111111111', '')
    ).rejects.toThrow('Invalid UUID format for ownerAnonymousId: ""')
  })

  // 8. createUsageEvent rejects empty or system sentinel owner_anonymous_id
  it('8. createUsageEvent rejects empty or system sentinel owner_anonymous_id', async () => {
    await expect(
      createUsageEvent({
        owner_anonymous_id: '',
        event_type: 'test_event',
        metadata_json: {}
      })
    ).rejects.toThrow('Invalid UUID format for owner_anonymous_id: ""')

    await expect(
      createUsageEvent({
        owner_anonymous_id: 'stripe_webhook',
        event_type: 'test_event',
        metadata_json: {}
      })
    ).rejects.toThrow('Invalid UUID format for owner_anonymous_id: "stripe_webhook"')

    await expect(
      createUsageEvent({
        owner_anonymous_id: 'system_webhook',
        event_type: 'test_event',
        metadata_json: {}
      })
    ).rejects.toThrow('Invalid UUID format for owner_anonymous_id: "system_webhook"')
  })

  // 8b. fail-closed authorization regression tests
  it('8b. all queries throw authorization errors when both identities are missing/null', async () => {
    const targetId = '11111111-1111-1111-1111-111111111111'

    await expect(
      getPromptAnalysisForOwner(targetId, null, undefined)
    ).rejects.toThrow('Anonymous access requires a valid owner UUID')

    await expect(
      getPromptAnalysesForUser(null, null)
    ).rejects.toThrow('Ownership identity missing')

    await expect(
      createShareLink(targetId, null, undefined)
    ).rejects.toThrow('Anonymous access requires a valid owner UUID')

    await expect(
      disableShareLink(targetId, null, undefined)
    ).rejects.toThrow('Anonymous access requires a valid owner UUID')

    await expect(
      softDeleteAnalysis(targetId, null, undefined)
    ).rejects.toThrow('Anonymous access requires a valid owner UUID')

    await expect(
      toggleFavoriteAnalysis(targetId, null, undefined, true)
    ).rejects.toThrow('Anonymous access requires a valid owner UUID')

    await expect(
      createFeedbackEvent({
        analysis_id: targetId,
        rating: 'up',
        comment: null,
        user_id: null,
        owner_anonymous_id: null
      })
    ).rejects.toThrow('Ownership identity missing')

    await expect(
      getRecentEventsCount(null, null, 60)
    ).rejects.toThrow('Anonymous access requires a valid owner UUID')

    await expect(
      getRecentFeedbackCount(null, null, 60)
    ).rejects.toThrow('Anonymous access requires a valid owner UUID')

    await expect(
      getUsageCountTodayForUser(null, null)
    ).rejects.toThrow('Anonymous access requires a valid owner UUID')

    await expect(
      getUsageCountThisMonthForUser(null, null)
    ).rejects.toThrow('Anonymous access requires a valid owner UUID')
  })

  // 9. Supabase SSR cookies are preserved when setting the anonymous cookie
  it('9. preserves Supabase auth cookies set during middleware cookie synchronization', async () => {
    const request = new NextRequest('http://localhost/')
    
    mockGetUser.mockImplementationOnce(async () => {
      if (configCookiesCallback) {
        configCookiesCallback([
          { name: 'sb-access-token', value: 'token-val', options: { path: '/' } }
        ])
      }
      return { data: { user: null }, error: null }
    })

    const response = await middleware(request)
    
    // Response should have BOTH owner_anonymous_id and sb-access-token
    expect(response.cookies.get('owner_anonymous_id')).toBeDefined()
    expect(response.cookies.get('sb-access-token')?.value).toBe('token-val')
  })

  // 10. non-owner access remains denied
  it('10. denies access to non-owners of analyses', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: '11111111-1111-1111-1111-111111111111',
        user_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        owner_anonymous_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
      },
      error: null
    })

    // Try to access it with a different anonymous owner UUID and no user ID
    const result = await getPromptAnalysisForOwner(
      '11111111-1111-1111-1111-111111111111',
      'cccccccc-cccc-cccc-cccc-cccccccccccc'
    )
    expect(result).toBeNull()
  })
})
