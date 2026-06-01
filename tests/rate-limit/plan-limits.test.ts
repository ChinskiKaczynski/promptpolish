import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

// Mock server-only sentinel
vi.mock('server-only', () => ({}))

// Mock queries
vi.mock('@/lib/supabase/queries', () => ({
  getUserProfile: vi.fn(),
  getUsageCountTodayForUser: vi.fn(),
  getUsageCountThisMonthForUser: vi.fn(),
  createUsageEvent: vi.fn()
}))

import { PLAN_LIMITS, canAnalyzePrompt, canExportMarkdown, canExportPdf, canUseBatchAudit, getPlanSlugForUser } from '@/lib/plans/config'
import { getUserProfile } from '@/lib/supabase/queries'
import type { UserProfileRow } from '@/lib/supabase/types'

describe('Plan Entitlements Logic', () => {
  it('has correct static limits configured', () => {
    expect(PLAN_LIMITS.free.monthlyAnalyses).toBe(20)
    expect(PLAN_LIMITS.free.dailyAbuseLimit).toBe(5)
    expect(PLAN_LIMITS.free.exportMarkdown).toBe(false)
    expect(PLAN_LIMITS.free.exportPdf).toBe(false)
    
    expect(PLAN_LIMITS.pro.monthlyAnalyses).toBe(500)
    expect(PLAN_LIMITS.pro.dailyAbuseLimit).toBe(100)
    expect(PLAN_LIMITS.pro.exportMarkdown).toBe(true)
    expect(PLAN_LIMITS.pro.exportPdf).toBe(true)
  })

  it('correctly returns export and batch entitlements', () => {
    expect(canExportMarkdown('free')).toBe(false)
    expect(canExportMarkdown('pro')).toBe(true)

    expect(canExportPdf('free')).toBe(false)
    expect(canExportPdf('pro')).toBe(true)

    expect(canUseBatchAudit('free')).toBe(false)
    expect(canUseBatchAudit('pro')).toBe(true)
  })

  describe('canAnalyzePrompt', () => {
    it('allows active analysis when counts are within limits', () => {
      const freeResult = canAnalyzePrompt('free', 10, 2)
      expect(freeResult.allowed).toBe(true)

      const proResult = canAnalyzePrompt('pro', 400, 50)
      expect(proResult.allowed).toBe(true)
    })

    it('blocks free users when daily limit is reached', () => {
      const result = canAnalyzePrompt('free', 10, 5)
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('daily_abuse_limit_reached')
      expect(result.limit).toBe(5)
    })

    it('blocks free users when monthly limit is reached', () => {
      const result = canAnalyzePrompt('free', 20, 2)
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('monthly_limit_reached')
      expect(result.limit).toBe(20)
    })

    it('blocks pro users when daily limit is reached', () => {
      const result = canAnalyzePrompt('pro', 400, 100)
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('daily_abuse_limit_reached')
      expect(result.limit).toBe(100)
    })

    it('blocks pro users when monthly limit is reached', () => {
      const result = canAnalyzePrompt('pro', 500, 50)
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('monthly_limit_reached')
      expect(result.limit).toBe(500)
    })
  })
})

describe('getPlanSlugForUser — STRIPE_ENABLED behaviour', () => {
  const originalStripeEnabled = process.env.STRIPE_ENABLED

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env.STRIPE_ENABLED = originalStripeEnabled
  })

  it('returns "anonymous" when userId is null', async () => {
    const result = await getPlanSlugForUser(null)
    expect(result).toBe('anonymous')
    expect(getUserProfile).not.toHaveBeenCalled()
  })

  it('returns "free" when user profile does not exist (no profile row)', async () => {
    vi.mocked(getUserProfile).mockResolvedValue(null)

    const result = await getPlanSlugForUser('user-123')
    expect(result).toBe('free')
  })

  it('STRIPE_ENABLED=false + user_profiles.plan_slug=pro → returns "pro"', async () => {
    process.env.STRIPE_ENABLED = 'false'
    vi.mocked(getUserProfile).mockResolvedValue({
      user_id: 'user-123',
      plan_slug: 'pro',
      email: 'user@test.com',
      display_name: null,
      created_at: '',
      updated_at: ''
    } as UserProfileRow)

    const result = await getPlanSlugForUser('user-123')

    expect(result).toBe('pro')
    // Should only call getUserProfile — no subscription lookup
    expect(getUserProfile).toHaveBeenCalledOnce()
    expect(getUserProfile).toHaveBeenCalledWith('user-123')
  })

  it('STRIPE_ENABLED=false + user_profiles.plan_slug=free → returns "free"', async () => {
    process.env.STRIPE_ENABLED = 'false'
    vi.mocked(getUserProfile).mockResolvedValue({
      user_id: 'user-456',
      plan_slug: 'free',
      email: 'user@test.com',
      display_name: null,
      created_at: '',
      updated_at: ''
    } as UserProfileRow)

    const result = await getPlanSlugForUser('user-456')

    expect(result).toBe('free')
    expect(getUserProfile).toHaveBeenCalledOnce()
  })

  it('STRIPE_ENABLED=false + profile missing → returns "free" without crashing (no PGRST205)', async () => {
    process.env.STRIPE_ENABLED = 'false'
    // Simulate what happens if subscriptions table is absent — getUserProfile still works, subscriptions are never queried
    vi.mocked(getUserProfile).mockResolvedValue(null)

    const result = await getPlanSlugForUser('user-789')

    expect(result).toBe('free')
    // No call to getSubscriptionByUserId — it is never imported/called from config.ts
    expect(getUserProfile).toHaveBeenCalledOnce()
  })

  it('STRIPE_ENABLED=true + user_profiles.plan_slug=pro → returns "pro" (profile is source of truth)', async () => {
    process.env.STRIPE_ENABLED = 'true'
    vi.mocked(getUserProfile).mockResolvedValue({
      user_id: 'user-pro',
      plan_slug: 'pro',
      email: 'pro@test.com',
      display_name: null,
      created_at: '',
      updated_at: ''
    } as UserProfileRow)

    const result = await getPlanSlugForUser('user-pro')

    expect(result).toBe('pro')
  })

  it('STRIPE_ENABLED=true + user_profiles.plan_slug=free → returns "free"', async () => {
    process.env.STRIPE_ENABLED = 'true'
    vi.mocked(getUserProfile).mockResolvedValue({
      user_id: 'user-free',
      plan_slug: 'free',
      email: 'free@test.com',
      display_name: null,
      created_at: '',
      updated_at: ''
    } as UserProfileRow)

    const result = await getPlanSlugForUser('user-free')

    expect(result).toBe('free')
  })

  it('simulate-pro: profile updated to pro → getPlanSlugForUser returns "pro"', async () => {
    // After simulate-pro runs, user_profiles.plan_slug is 'pro'
    process.env.STRIPE_ENABLED = 'false'
    vi.mocked(getUserProfile).mockResolvedValue({
      user_id: 'admin-user',
      plan_slug: 'pro',
      email: 'admin@test.com',
      display_name: null,
      created_at: '',
      updated_at: ''
    } as UserProfileRow)

    const plan = await getPlanSlugForUser('admin-user')

    expect(plan).toBe('pro')
    // Confirm canExportMarkdown correctly returns true for this simulated pro user
    expect(canExportMarkdown(plan)).toBe(true)
    expect(canExportPdf(plan)).toBe(true)
  })
})


