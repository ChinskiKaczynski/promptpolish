import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { User } from '@supabase/supabase-js'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn(),
}))

vi.mock('@/lib/identity/anonymous', () => ({
  getOwnerIdFromCookies: vi.fn().mockResolvedValue('mock-anon-id'),
}))

vi.mock('@/lib/supabase/queries', () => ({
  ensureUserProfile: vi.fn(),
  createUsageEvent: vi.fn().mockResolvedValue(null),
  getUserProfile: vi.fn()
}))

import { ensureUserProfile, createUsageEvent, getUserProfile } from '@/lib/supabase/queries'

vi.mock('@/lib/supabase/billing', () => ({
  getSubscriptionByUserId: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/components/pricing/checkout-button', () => ({
  CheckoutButton: vi.fn(() => null),
}))

vi.mock('@/components/pricing/simulate-pro-button', () => ({
  SimulateProButton: vi.fn(() => null),
}))

vi.mock('@/components/pricing/waitlist-form', () => ({
  WaitlistForm: vi.fn(() => null),
}))

vi.mock('@/components/layout/app-header', () => ({
  AppHeader: vi.fn(() => null),
}))

vi.mock('@/components/layout/app-footer', () => ({
  AppFooter: vi.fn(() => null),
}))

import PricingPage from '@/app/pricing/page'
import { getAuthUser } from '@/lib/identity/auth'
import type { UserProfileRow } from '@/lib/supabase/types'

describe('PricingPage — pricing_viewed event & beta state', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(process.env as any).STRIPE_ENABLED = 'false'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  // ── pricing_viewed telemetry ─────────────────────────────────────────────

  it('fires pricing_viewed event for anonymous visitor (no user session)', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null)

    await PricingPage()

    expect(createUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'pricing_viewed',
        owner_anonymous_id: 'mock-anon-id',
        user_id: null,
        metadata_json: expect.objectContaining({
          stripe_enabled: false,
          plan_slug: null,
        }),
      })
    )
  })

  it('fires pricing_viewed event for authenticated Free user', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      id: 'user-123',
      email: 'user@test.com',
    } as User)

    vi.mocked(getUserProfile).mockResolvedValue({
      user_id: 'user-123',
      email: 'user@test.com',
      plan_slug: 'free',
      display_name: null,
      created_at: '',
      updated_at: '',
    } as UserProfileRow)

    vi.mocked(ensureUserProfile).mockResolvedValue({
      user_id: 'user-123',
      email: 'user@test.com',
      plan_slug: 'free',
      display_name: null,
      created_at: '',
      updated_at: '',
    } as UserProfileRow)

    await PricingPage()

    expect(createUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'pricing_viewed',
        user_id: 'user-123',
        owner_anonymous_id: 'mock-anon-id',
        metadata_json: expect.objectContaining({
          plan_slug: 'free',
        }),
      })
    )
  })

  it('fires pricing_viewed event for authenticated Pro user', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      id: 'user-pro',
      email: 'pro@test.com',
    } as User)

    vi.mocked(getUserProfile).mockResolvedValue({
      user_id: 'user-pro',
      email: 'pro@test.com',
      plan_slug: 'pro',
      display_name: null,
      created_at: '',
      updated_at: '',
    } as UserProfileRow)

    vi.mocked(ensureUserProfile).mockResolvedValue({
      user_id: 'user-pro',
      email: 'pro@test.com',
      plan_slug: 'pro',
      display_name: null,
      created_at: '',
      updated_at: '',
    } as UserProfileRow)

    await PricingPage()

    expect(createUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'pricing_viewed',
        user_id: 'user-pro',
        metadata_json: expect.objectContaining({
          plan_slug: 'pro',
          stripe_enabled: false,
        }),
      })
    )
  })

  // ── Stripe disabled beta state ───────────────────────────────────────────

  it('renders pricing page without throwing when STRIPE_ENABLED=false', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null)

    const result = await PricingPage()
    expect(result).toBeDefined()
  })

  it('renders pricing page without throwing when STRIPE_ENABLED=true', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(process.env as any).STRIPE_ENABLED = 'true'
    vi.mocked(getAuthUser).mockResolvedValue(null)

    const result = await PricingPage()
    expect(result).toBeDefined()
  })
})
