import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

const mockGetUser = vi.fn()
const mockSignOut = vi.fn()
const mockCreateServerClient = vi.fn()

vi.mock('@supabase/ssr', () => {
  return {
    createBrowserClient: vi.fn(),
    createServerClient: (...args: unknown[]) => {
      mockCreateServerClient(...args)
      const options = args[2] as { cookies?: { setAll?: (cookies: unknown[]) => void } } | undefined
      return {
        auth: {
          getUser: async () => {
            // Mimic refresh during execution if requested
            if (mockGetUser.mock.calls.length === 0 && options?.cookies?.setAll) {
              options.cookies.setAll([
                { name: 'sb-ref-auth-token', value: 'refreshed-token', options: { path: '/' } }
              ])
            }
            return mockGetUser()
          },
          signOut: mockSignOut
        }
      }
    }
  }
})

// Mock next/headers cookies
const mockSet = vi.fn()
const mockDelete = vi.fn()
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    get: () => undefined,
    set: mockSet,
    delete: mockDelete
  }))
}))

// Mock queries since they are called in route handlers
vi.mock('@/lib/supabase/queries', () => ({
  ensureUserProfile: vi.fn().mockResolvedValue({}),
  linkAnonymousAnalyses: vi.fn().mockResolvedValue(true)
}))

vi.mock('@/lib/identity/anonymous', () => ({
  getOwnerIdFromCookies: vi.fn().mockResolvedValue('anonymous-owner-id'),
  verifyAndExtractId: vi.fn().mockResolvedValue('anonymous-owner-id'),
  signId: vi.fn().mockImplementation(async (id) => `${id}.signed`)
}))

import { getAuthUser } from '@/lib/identity/auth'
import { middleware } from '@/middleware'
import { POST as sessionPOST, DELETE as sessionDELETE } from '@/app/api/auth/session/route'

describe('Supabase Auth SSR & Route/Middleware Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Auth Resolver (getAuthUser)
  describe('getAuthUser resolver', () => {
    it('handles "no session" state by returning null', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const user = await getAuthUser()
      expect(user).toBeNull()
    })

    it('handles "expired/invalid session" state safely', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token', status: 401 }
      })

      const user = await getAuthUser()
      expect(user).toBeNull()
    })

    it('handles "authenticated session" correctly', async () => {
      const mockUserObj = { id: 'user-123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue({
        data: { user: mockUserObj },
        error: null
      })

      const user = await getAuthUser()
      expect(user).toEqual(mockUserObj)
    })

    it('detects Supabase auth network/database failure and throws TransientAuthError', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Failed to fetch', status: 500 }
      })

      await expect(getAuthUser()).rejects.toThrow('Supabase auth service transient failure')
    })
  })

  // 2. Session API Route Behavior (POST / DELETE)
  describe('/api/auth/session route handlers', () => {
    it('POST resolves user server-side and performs sync/link, returning 200', async () => {
      const mockUserObj = { id: 'user-123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue({
        data: { user: mockUserObj },
        error: null
      })

      const response = await sessionPOST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.id).toBe('user-123')
    })

    it('POST returns 401 when no session exists', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const response = await sessionPOST()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid session token.')
    })

    it('DELETE triggers signOut to clear official auth cookies', async () => {
      mockSignOut.mockResolvedValue({ error: null })

      const response = await sessionDELETE()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  // 3. Middleware Refresh Behavior
  describe('middleware refresh', () => {
    it('calls getUser to refresh session and passes cookies to response', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: {} },
        error: null
      })

      const request = new NextRequest('http://localhost/')
      const response = await middleware(request)

      expect(response.cookies.get('sb-ref-auth-token')?.value).toBe('refreshed-token')
    })
  })
})
