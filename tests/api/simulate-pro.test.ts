import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn()
}))

// The route now uses getSupabaseAdminClient directly — mock it.
const mockSingle = vi.fn()
const mockSelect = vi.fn(() => ({ single: mockSingle }))
const mockUpsert = vi.fn(() => ({ select: mockSelect }))
const mockFrom = vi.fn(() => ({ upsert: mockUpsert }))

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: vi.fn(() => ({ from: mockFrom }))
}))

import { POST } from '@/app/api/entitlements/simulate-pro/route'
import { getAuthUser } from '@/lib/identity/auth'
import type { User } from '@supabase/supabase-js'

const makeRequest = () => new Request('http://localhost/api/entitlements/simulate-pro', { method: 'POST' })

describe('POST /api/entitlements/simulate-pro', () => {
  const originalEnv = process.env.NODE_ENV
  const originalAdminEmails = process.env.ADMIN_EMAILS

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NODE_ENV = 'production'
    process.env.ADMIN_EMAILS = 'admin1@test.com, admin2@test.com'

    // Default: successful upsert returning plan_slug = 'pro'
    mockSingle.mockResolvedValue({
      data: { user_id: 'user-123', email: 'admin1@test.com', plan_slug: 'pro' },
      error: null
    })
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    process.env.ADMIN_EMAILS = originalAdminEmails
  })

  // ── Auth / Access ──────────────────────────────────────────────────────────

  it('returns 401 JSON when user is not authenticated', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('returns 403 JSON in production when authenticated user is not in ADMIN_EMAILS', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'guest@test.com' } as User)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('returns 403 JSON in production when ADMIN_EMAILS env is empty or missing', async () => {
    process.env.ADMIN_EMAILS = ''
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'admin1@test.com' } as User)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  // ── Success ────────────────────────────────────────────────────────────────

  it('always sets plan to pro and returns { ok: true, plan: "pro" } for admin user', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'admin1@test.com' } as User)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.plan).toBe('pro')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-123', plan_slug: 'pro' }),
      { onConflict: 'user_id' }
    )
  })

  it('returns pro on second consecutive call — no toggle to free', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'admin1@test.com' } as User)
    // Simulate DB already having plan_slug='pro' and second upsert returning same
    mockSingle.mockResolvedValue({
      data: { user_id: 'user-123', email: 'admin1@test.com', plan_slug: 'pro' },
      error: null
    })

    const first = await (await POST()).json()
    const second = await (await POST()).json()

    expect(first.plan).toBe('pro')
    expect(second.plan).toBe('pro')
    // Both calls should have upserted plan_slug = 'pro'
    expect(mockUpsert).toHaveBeenCalledTimes(2)
    for (const call of mockUpsert.mock.calls) {
      expect(call[0]).toMatchObject({ plan_slug: 'pro' })
    }
  })

  it('allows case-insensitive trimmed admin emails in production', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: ' ADMIN1@TEST.COM ' } as User)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.plan).toBe('pro')
  })

  it('allows general access in development environment, bypassing admin config checks', async () => {
    process.env.NODE_ENV = 'development'
    process.env.ADMIN_EMAILS = ''
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-dev', email: 'any-user@test.com' } as User)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.plan).toBe('pro')
  })

  // ── DB Failure ─────────────────────────────────────────────────────────────

  it('returns 500 JSON if DB upsert returns an error', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'admin1@test.com' } as User)
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB timeout' } })

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Could not update entitlement')
  })

  it('returns 500 JSON if DB returns data but plan_slug is not "pro" (mismatch)', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'admin1@test.com' } as User)
    // Unexpected: DB row came back with plan_slug = 'free'
    mockSingle.mockResolvedValue({
      data: { user_id: 'user-123', email: 'admin1@test.com', plan_slug: 'free' },
      error: null
    })

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Could not update entitlement')
  })

  it('returns 500 JSON if DB upsert returns null data with no error', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'admin1@test.com' } as User)
    mockSingle.mockResolvedValue({ data: null, error: null })

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Could not update entitlement')
  })
})
