import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { User } from '@supabase/supabase-js'

// 1. Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

// 2. Mock next/navigation redirect
vi.mock('next/navigation', () => ({
  redirect: vi.fn((path) => {
    const err = new Error(`REDIRECT:${path}`) as Error & { digest: string }
    err.digest = `REDIRECT:${path}`
    throw err
  })
}))

// 3. Mock identity, queries, billing
vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn()
}))

vi.mock('@/lib/identity/anonymous', () => ({
  getOwnerIdFromCookies: vi.fn()
}))

vi.mock('@/lib/supabase/queries', () => ({
  getUserProfile: vi.fn(),
  ensureUserProfile: vi.fn(),
  getPromptAnalysesForUser: vi.fn(),
  createUsageEvent: vi.fn().mockResolvedValue({}),
  getUsageCountThisMonthForUser: vi.fn()
}))

vi.mock('@/lib/supabase/billing', () => ({
  getSubscriptionByUserId: vi.fn()
}))

vi.mock('@/components/layout/app-header', () => ({
  AppHeader: vi.fn(() => null)
}))

vi.mock('@/components/layout/app-footer', () => ({
  AppFooter: vi.fn(() => null)
}))

vi.mock('@/components/billing/portal-button', () => ({
  PortalButton: vi.fn(() => null)
}))

import AccountPage from '@/app/account/page'
import { getAuthUser } from '@/lib/identity/auth'
import { getUserProfile, getUsageCountThisMonthForUser, createUsageEvent, getPromptAnalysesForUser } from '@/lib/supabase/queries'
import { redirect } from 'next/navigation'

describe('AccountPage Beta & Plan Limitations UI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_ENABLED = 'false' // default for beta tests
    vi.mocked(getPromptAnalysesForUser).mockResolvedValue([])
  })

  it('redirects to /login if there is no authenticated user session', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null)

    await expect(AccountPage()).rejects.toThrow('REDIRECT:/login')
    expect(redirect).toHaveBeenCalledWith('/login')
  })

  it('renders usage limits, beta warning and links to history when Stripe is disabled', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-789', email: 'user@test.com' } as unknown as User)
    vi.mocked(getUserProfile).mockResolvedValue({
      user_id: 'user-789',
      email: 'user@test.com',
      display_name: 'Test Tester',
      plan_slug: 'free',
      created_at: '',
      updated_at: ''
    })
    vi.mocked(getUsageCountThisMonthForUser).mockResolvedValue(5) // 5 analyses done
    
    const jsx = await AccountPage()
    expect(jsx).toBeDefined()

    expect(createUsageEvent).toHaveBeenCalledWith(expect.objectContaining({
      event_type: 'account_viewed',
      user_id: 'user-789'
    }))

    const mainElement = jsx.props.children[1]
    expect(mainElement.type).toBe('main')

    // Inspect Usage Stats Card (second child in main space-y-8)
    const usageStatsCard = mainElement.props.children[1]
    const usageBlocks = usageStatsCard.props.children[1].props.children // Grid items
    
    // First stat block: usage this month
    const usageThisMonth = usageBlocks[0].props.children[1]
    expect(usageThisMonth.props.children[0]).toBe(5) // monthlyCount
    expect(usageThisMonth.props.children[2].props.children[1]).toBe(20) // Free plan limit

    // Billing status card (third child)
    const billingCard = mainElement.props.children[2]
    const betaBanner = billingCard.props.children[1]
    expect(betaBanner.props.children[0].props.children).toBe('Beta Info:')
    expect(betaBanner.props.children[1]).toContain('Bramka płatności Stripe jest obecnie wyłączona')

    // Check full history link shortcut (fourth child)
    const historyShortcut = mainElement.props.children[3]
    const historyLink = historyShortcut.props.children[1].props.children[1]
    expect(historyLink.props.href).toBe('/history')
  })
})
