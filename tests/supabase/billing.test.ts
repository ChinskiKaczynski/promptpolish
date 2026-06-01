import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

import { saveSubscription, cancelSubscriptionInDatabase } from '@/lib/supabase/billing'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getUserProfile, setUserPlanSlug } from '@/lib/supabase/queries'

// Mock admin client
vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: vi.fn()
}))

// Mock query helpers
vi.mock('@/lib/supabase/queries', () => ({
  getUserProfile: vi.fn(),
  setUserPlanSlug: vi.fn()
}))

describe('Supabase Billing & Entitlement Layer Unit Tests', () => {
  const mockSingle = vi.fn()
  const mockSelect = vi.fn()
  const mockUpsert = vi.fn()
  const mockUpdate = vi.fn()
  const mockEq = vi.fn()
  const mockMaybeSingle = vi.fn()

  const mockSupabaseAdmin = {
    from: vi.fn(() => ({
      select: mockSelect,
      upsert: mockUpsert,
      update: mockUpdate
    }))
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default implementation for setUserPlanSlug mock to prevent failures in saveSubscription check
    vi.mocked(setUserPlanSlug).mockImplementation(async (profile) => ({
      user_id: profile.user_id,
      email: profile.email,
      display_name: profile.display_name ?? null,
      plan_slug: profile.plan_slug,
      created_at: '',
      updated_at: '',
    }))

    const builder: Record<string, unknown> & {
      single: typeof mockSingle
      maybeSingle: typeof mockMaybeSingle
      eq: typeof mockEq
    } = {
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      eq: mockEq
    }

    mockSelect.mockReturnValue(builder)
    mockUpsert.mockReturnValue({
      select: vi.fn(() => builder)
    })
    mockUpdate.mockReturnValue(builder)
    mockEq.mockReturnValue(builder)

    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockSupabaseAdmin as unknown as ReturnType<typeof getSupabaseAdminClient>)

    // Ensure STRIPE_ENABLED is active for the test suite to execute queries
    process.env.STRIPE_ENABLED = 'true'
  })

  describe('saveSubscription Entitlement Mappings', () => {
    const mockInputBase = {
      user_id: 'user-uuid-123',
      stripe_customer_id: 'cus_test_123',
      stripe_subscription_id: 'sub_test_123',
      stripe_price_id: 'price_pro_123',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date().toISOString(),
      cancel_at_period_end: false
    }

    it('grants Pro plan when subscription is active and plan is pro', async () => {
      mockSingle.mockResolvedValue({
        data: { stripe_subscription_id: 'sub_test_123' },
        error: null
      })
      vi.mocked(getUserProfile).mockResolvedValue({
        user_id: 'user-uuid-123',
        email: 'pro@promptpolish.com',
        display_name: 'Pro User',
        plan_slug: 'free',
        created_at: '',
        updated_at: ''
      })

      await saveSubscription({
        ...mockInputBase,
        plan_slug: 'pro',
        status: 'active'
      })

      // Must sync to 'pro' on user profile
      expect(setUserPlanSlug).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-uuid-123',
          plan_slug: 'pro'
        })
      )
    })

    it('grants Pro plan when subscription is trialing and plan is pro', async () => {
      mockSingle.mockResolvedValue({ data: {}, error: null })
      await saveSubscription({
        ...mockInputBase,
        plan_slug: 'pro',
        status: 'trialing'
      })

      expect(setUserPlanSlug).toHaveBeenCalledWith(
        expect.objectContaining({
          plan_slug: 'pro'
        })
      )
    })

    it('grants Pro plan when subscription is past_due (grace period policy) and plan is pro', async () => {
      mockSingle.mockResolvedValue({ data: {}, error: null })
      await saveSubscription({
        ...mockInputBase,
        plan_slug: 'pro',
        status: 'past_due'
      })

      expect(setUserPlanSlug).toHaveBeenCalledWith(
        expect.objectContaining({
          plan_slug: 'pro'
        })
      )
    })

    it('degrades plan to free when subscription is unpaid and plan is pro', async () => {
      mockSingle.mockResolvedValue({ data: {}, error: null })
      await saveSubscription({
        ...mockInputBase,
        plan_slug: 'pro',
        status: 'unpaid'
      })

      expect(setUserPlanSlug).toHaveBeenCalledWith(
        expect.objectContaining({
          plan_slug: 'free'
        })
      )
    })

    it('degrades plan to free when subscription is canceled and plan is pro', async () => {
      mockSingle.mockResolvedValue({ data: {}, error: null })
      await saveSubscription({
        ...mockInputBase,
        plan_slug: 'pro',
        status: 'canceled'
      })

      expect(setUserPlanSlug).toHaveBeenCalledWith(
        expect.objectContaining({
          plan_slug: 'free'
        })
      )
    })

    it('degrades plan to free when status is active but plan is free (e.g. unapproved tier)', async () => {
      mockSingle.mockResolvedValue({ data: {}, error: null })
      await saveSubscription({
        ...mockInputBase,
        plan_slug: 'free',
        status: 'active'
      })

      expect(setUserPlanSlug).toHaveBeenCalledWith(
        expect.objectContaining({
          plan_slug: 'free'
        })
      )
    })
  })

  describe('cancelSubscriptionInDatabase', () => {
    it('updates status to canceled and demotes user profile', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { user_id: 'user-uuid-123' },
        error: null
      })
      mockSingle.mockResolvedValue({
        data: {},
        error: null
      })

      await cancelSubscriptionInDatabase('sub_test_123')

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('subscriptions')
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'canceled'
        })
      )
      expect(setUserPlanSlug).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-uuid-123',
          plan_slug: 'free'
        })
      )
    })
  })
})
