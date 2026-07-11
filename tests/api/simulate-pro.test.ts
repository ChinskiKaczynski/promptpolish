import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn()
}))

vi.mock('@/lib/supabase/queries', () => ({
  setUserPlanSlug: vi.fn(),
  createUsageEvent: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/identity/anonymous', () => ({
  getOwnerIdFromCookies: vi.fn().mockResolvedValue('mock-owner-id'),
}))

import { POST } from '@/app/api/entitlements/simulate-pro/route'
import { getAuthUser } from '@/lib/identity/auth'
import { setUserPlanSlug, createUsageEvent } from '@/lib/supabase/queries'
import type { User } from '@supabase/supabase-js'

describe('POST /api/entitlements/simulate-pro', () => {
  const originalEnv = process.env.NODE_ENV
  const originalStripe = process.env.STRIPE_ENABLED
  const originalSimulation = process.env.ENABLE_DEV_PRO_SIMULATION
  const originalAdminEmails = process.env.ADMIN_EMAILS

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NODE_ENV = 'development'
    process.env.STRIPE_ENABLED = 'false'
    process.env.ENABLE_DEV_PRO_SIMULATION = 'true'
    process.env.ADMIN_EMAILS = 'user@test.com,admin1@test.com'

    // Default: successful upsert returning plan_slug = 'pro'
    vi.mocked(setUserPlanSlug).mockResolvedValue({
      user_id: 'user-123',
      email: 'user@test.com',
      plan_slug: 'pro',
      display_name: 'user',
      created_at: '',
      updated_at: ''
    })
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    process.env.STRIPE_ENABLED = originalStripe
    process.env.ENABLE_DEV_PRO_SIMULATION = originalSimulation
    process.env.ADMIN_EMAILS = originalAdminEmails
  })

  // ── Auth / Access ──────────────────────────────────────────────────────────

  it('returns 401 JSON when user is not authenticated', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(setUserPlanSlug).not.toHaveBeenCalled()
  })

  it('returns 403 JSON in production mode for any user', async () => {
    process.env.NODE_ENV = 'production'
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'admin1@test.com' } as User)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
    expect(setUserPlanSlug).not.toHaveBeenCalled()
  })

  it('returns 403 JSON when STRIPE_ENABLED is true even in development', async () => {
    process.env.STRIPE_ENABLED = 'true'
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'admin1@test.com' } as User)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
    expect(setUserPlanSlug).not.toHaveBeenCalled()
  })

  it('returns 403 JSON when ENABLE_DEV_PRO_SIMULATION is false or absent', async () => {
    process.env.ENABLE_DEV_PRO_SIMULATION = 'false'
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'admin1@test.com' } as User)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
    expect(setUserPlanSlug).not.toHaveBeenCalled()
  })

  it('returns 403 JSON when user email is not listed in ADMIN_EMAILS', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'non-admin@test.com' } as User)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
    expect(setUserPlanSlug).not.toHaveBeenCalled()
  })

  // ── Success ────────────────────────────────────────────────────────────────

  it('always sets plan to pro and returns { ok: true, plan: "pro" } for authenticated user in dev', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'user@test.com' } as User)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.plan).toBe('pro')
    expect(setUserPlanSlug).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-123', plan_slug: 'pro' })
    )
  })

  it('returns pro on second consecutive call — no toggle to free', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'user@test.com' } as User)
    // Simulate DB already having plan_slug='pro' and second upsert returning same
    vi.mocked(setUserPlanSlug).mockResolvedValue({
      user_id: 'user-123',
      email: 'user@test.com',
      plan_slug: 'pro',
      display_name: 'user',
      created_at: '',
      updated_at: ''
    })

    const first = await (await POST()).json()
    const second = await (await POST()).json()

    expect(first.plan).toBe('pro')
    expect(second.plan).toBe('pro')
    // Both calls should have upserted plan_slug = 'pro'
    expect(setUserPlanSlug).toHaveBeenCalledTimes(2)
    for (const call of vi.mocked(setUserPlanSlug).mock.calls) {
      expect(call[0]).toMatchObject({ plan_slug: 'pro' })
    }
  })

  // ── DB Failure ─────────────────────────────────────────────────────────────

  it('returns 500 JSON if DB upsert returns an error', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'admin1@test.com' } as User)
    vi.mocked(setUserPlanSlug).mockResolvedValue(null)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Could not update entitlement')
  })

  it('returns 500 JSON if DB returns data but plan_slug is not "pro" (mismatch)', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'admin1@test.com' } as User)
    // Unexpected: DB row came back with plan_slug = 'free'
    vi.mocked(setUserPlanSlug).mockResolvedValue({
      user_id: 'user-123',
      email: 'admin1@test.com',
      plan_slug: 'free',
      display_name: 'admin1',
      created_at: '',
      updated_at: ''
    })

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Could not update entitlement')
  })

  it('returns 500 JSON if DB upsert returns null data with no error', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'admin1@test.com' } as User)
    vi.mocked(setUserPlanSlug).mockResolvedValue(null)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Could not update entitlement')
  })

  // ── Telemetry ──────────────────────────────────────────────────────────────

  it('fires simulate_pro_enabled usage event after successful plan update', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-123', email: 'admin1@test.com' } as User)

    await POST()

    expect(createUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        event_type: 'simulate_pro_enabled',
        metadata_json: expect.objectContaining({
          triggered_by: 'simulate-pro-api',
        }),
      })
    )
  })

  it('does NOT fire simulate_pro_enabled when user is unauthorized', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null)

    await POST()

    expect(createUsageEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ event_type: 'simulate_pro_enabled' })
    )
  })
})
