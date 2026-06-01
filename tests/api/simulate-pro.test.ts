import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn()
}))

vi.mock('@/lib/supabase/queries', () => ({
  getUserProfile: vi.fn(),
  createUserProfile: vi.fn()
}))

import { POST } from '@/app/api/entitlements/simulate-pro/route'
import { getAuthUser } from '@/lib/identity/auth'
import { getUserProfile, createUserProfile } from '@/lib/supabase/queries'
import type { User } from '@supabase/supabase-js'
import type { UserProfileRow } from '@/lib/supabase/types'

const makeRequest = () => new Request('http://localhost/api/entitlements/simulate-pro', { method: 'POST' })

describe('POST /api/entitlements/simulate-pro', () => {
  const originalEnv = process.env.NODE_ENV
  const originalAdminEmails = process.env.ADMIN_EMAILS

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NODE_ENV = 'production'
    process.env.ADMIN_EMAILS = 'admin1@test.com, admin2@test.com'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    process.env.ADMIN_EMAILS = originalAdminEmails
  })

  it('returns 401 JSON when user is not authenticated', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(createUserProfile).not.toHaveBeenCalled()
  })

  it('returns 403 JSON in production when authenticated user is not in ADMIN_EMAILS', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'guest@test.com' } as User)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
    expect(createUserProfile).not.toHaveBeenCalled()
  })

  it('returns 403 JSON in production when ADMIN_EMAILS env is empty or missing', async () => {
    process.env.ADMIN_EMAILS = ''
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'admin1@test.com' } as User)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
    expect(createUserProfile).not.toHaveBeenCalled()
  })

  it('allows case-insensitive trimmed admin emails in production and returns 200 JSON toggling status', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: ' ADMIN1@TEST.COM ' } as User)
    vi.mocked(getUserProfile).mockResolvedValue({ user_id: 'user-123', plan_slug: 'free', email: 'admin1@test.com' } as UserProfileRow)
    vi.mocked(createUserProfile).mockResolvedValue({ user_id: 'user-123', plan_slug: 'pro' } as UserProfileRow)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.plan).toBe('pro')
    expect(createUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        plan_slug: 'pro'
      })
    )
  })

  it('allows simulation toggle back to free when admin is already pro', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'admin1@test.com' } as User)
    vi.mocked(getUserProfile).mockResolvedValue({ user_id: 'user-123', plan_slug: 'pro', email: 'admin1@test.com' } as UserProfileRow)
    vi.mocked(createUserProfile).mockResolvedValue({ user_id: 'user-123', plan_slug: 'free' } as UserProfileRow)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.plan).toBe('free')
    expect(createUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        plan_slug: 'free'
      })
    )
  })

  it('allows general access to toggle plan in development environment, bypassing admin config checks', async () => {
    process.env.NODE_ENV = 'development'
    process.env.ADMIN_EMAILS = '' // Empty
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'any-user@test.com' } as User)
    vi.mocked(getUserProfile).mockResolvedValue({ user_id: 'user-123', plan_slug: 'free', email: 'any-user@test.com' } as UserProfileRow)
    vi.mocked(createUserProfile).mockResolvedValue({ user_id: 'user-123', plan_slug: 'pro' } as UserProfileRow)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.plan).toBe('pro')
  })

  it('returns 500 JSON if database profile updates fail', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'admin1@test.com' } as User)
    vi.mocked(getUserProfile).mockResolvedValue({ user_id: 'user-123', plan_slug: 'free', email: 'admin1@test.com' } as UserProfileRow)
    vi.mocked(createUserProfile).mockResolvedValue(null) // DB Failure

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Could not update entitlement')
  })
})
