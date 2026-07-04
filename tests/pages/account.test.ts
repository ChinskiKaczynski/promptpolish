import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { User } from '@supabase/supabase-js'
import React from 'react'

// 1. Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

// 2. Mock next/navigation redirect
vi.mock('next/navigation', () => ({
  redirect: vi.fn((path) => {
    const err = new Error(`REDIRECT:${path}`) as Error & { digest: string }
    err.digest = `REDIRECT:${path}`
    throw err
  }),
}))

// 3. Mock identity, queries, billing
vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn(),
}))

vi.mock('@/lib/identity/anonymous', () => ({
  getOwnerIdFromCookies: vi.fn(),
}))

vi.mock('@/lib/supabase/queries', () => ({
  getUserProfile: vi.fn(),
  ensureUserProfile: vi.fn(),
  getPromptAnalysesForUser: vi.fn(),
  createUsageEvent: vi.fn().mockResolvedValue({}),
  getUsageCountThisMonthForUser: vi.fn(),
}))

vi.mock('@/lib/supabase/billing', () => ({
  getSubscriptionByUserId: vi.fn(),
}))

vi.mock('@/components/layout/app-header', () => ({
  AppHeader: vi.fn(() => null),
}))

vi.mock('@/components/layout/app-footer', () => ({
  AppFooter: vi.fn(() => null),
}))

vi.mock('@/components/billing/portal-button', () => ({
  PortalButton: vi.fn(() => null),
}))

vi.mock('@/components/plans/usage-meter', () => ({
  UsageMeter: vi.fn(() => null),
}))

import AccountPage from '@/app/account/page'
import { getAuthUser } from '@/lib/identity/auth'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import {
  getUserProfile,
  getUsageCountThisMonthForUser,
  createUsageEvent,
  getPromptAnalysesForUser,
} from '@/lib/supabase/queries'
import { redirect } from 'next/navigation'
import { UsageMeter } from '@/components/plans/usage-meter'

/**
 * Recursively searches a React element tree for a node whose type matches the
 * given component reference and returns its props.
 */
function findElementProps(
  node: unknown,
  target: React.ComponentType<unknown>
): Record<string, unknown> | null {
  if (!node || typeof node !== 'object') return null
  const el = node as React.ReactElement
  if (el.type === target) return el.props as Record<string, unknown>
  if (el.props?.children) {
    const children = Array.isArray(el.props.children)
      ? el.props.children
      : [el.props.children]
    for (const child of children) {
      const found = findElementProps(child, target)
      if (found) return found
    }
  }
  return null
}

describe('AccountPage Beta & Plan Limitations UI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_ENABLED = 'false' // default for beta tests
    vi.mocked(getPromptAnalysesForUser).mockResolvedValue([])
    vi.mocked(getOwnerIdFromCookies).mockResolvedValue('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
  })

  it('redirects to /login if there is no authenticated user session', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null)

    await expect(AccountPage()).rejects.toThrow('REDIRECT:/login')
    expect(redirect).toHaveBeenCalledWith('/login')
  })

  it('renders usage limits via UsageMeter, fires account_viewed event, and links to history when Stripe is disabled', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      id: 'user-789',
      email: 'user@test.com',
    } as unknown as User)
    vi.mocked(getUserProfile).mockResolvedValue({
      user_id: 'user-789',
      email: 'user@test.com',
      display_name: 'Test Tester',
      plan_slug: 'free',
      created_at: '',
      updated_at: '',
    })
    vi.mocked(getUsageCountThisMonthForUser).mockResolvedValue(5) // 5 analyses done

    const jsx = await AccountPage()
    expect(jsx).toBeDefined()

    // account_viewed event should be fired
    expect(createUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'account_viewed',
        user_id: 'user-789',
      })
    )

    // UsageMeter element should exist in the JSX tree with correct props
    const usageMeterProps = findElementProps(jsx, UsageMeter as unknown as React.ComponentType<unknown>)
    expect(usageMeterProps).not.toBeNull()
    expect(usageMeterProps?.planSlug).toBe('free')
    expect(usageMeterProps?.monthlyCount).toBe(5)
    expect(usageMeterProps?.monthlyLimit).toBe(20) // PLAN_LIMITS.free.monthlyAnalyses
    expect(usageMeterProps?.variant).toBe('inline')
    expect(usageMeterProps?.isSimulatedPro).toBe(false) // free plan, not simulated pro
    const mainElement = jsx.props.children[1]
    // History shortcut link present
    const historyShortcut = mainElement.props.children[3]
    const historyLink = historyShortcut.props.children[1].props.children[1]
    expect(historyLink.props.href).toBe('/history')
  })

  it('passes isSimulatedPro=true to UsageMeter when plan is pro and Stripe is disabled', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      id: 'user-pro',
      email: 'pro@test.com',
    } as unknown as User)
    vi.mocked(getUserProfile).mockResolvedValue({
      user_id: 'user-pro',
      email: 'pro@test.com',
      display_name: 'Pro User',
      plan_slug: 'pro',
      created_at: '',
      updated_at: '',
    })
    vi.mocked(getUsageCountThisMonthForUser).mockResolvedValue(10)

    const jsx = await AccountPage()

    const usageMeterProps = findElementProps(jsx, UsageMeter as unknown as React.ComponentType<unknown>)
    expect(usageMeterProps).not.toBeNull()
    expect(usageMeterProps?.planSlug).toBe('pro')
    expect(usageMeterProps?.monthlyLimit).toBe(500) // PLAN_LIMITS.pro.monthlyAnalyses
    expect(usageMeterProps?.isSimulatedPro).toBe(true) // pro plan + Stripe disabled = simulated
  })

  it('active subscription makes /account show Pro and displays subscription details', async () => {
    process.env.STRIPE_ENABLED = 'true'
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
    process.env.STRIPE_PRICE_ID_PRO = 'price_1234_pro'

    vi.mocked(getAuthUser).mockResolvedValue({
      id: 'user-pro-sub',
      email: 'pro-sub@test.com',
    } as unknown as User)
    vi.mocked(getUserProfile).mockResolvedValue({
      user_id: 'user-pro-sub',
      email: 'pro-sub@test.com',
      display_name: 'Pro Sub User',
      plan_slug: 'pro',
      created_at: '',
      updated_at: '',
    })

    const { getSubscriptionByUserId } = await import('@/lib/supabase/billing')
    vi.mocked(getSubscriptionByUserId).mockResolvedValue({
      user_id: 'user-pro-sub',
      stripe_customer_id: 'cus_test_pro',
      stripe_subscription_id: 'sub_test_pro',
      stripe_price_id: 'price_1234_pro',
      plan_slug: 'pro',
      status: 'active',
      current_period_start: '2026-07-01T00:00:00Z',
      current_period_end: '2026-08-01T00:00:00Z',
      cancel_at_period_end: false,
      created_at: '',
      updated_at: '',
      last_event_created: null,
      last_event_id: null,
    })

    const jsx = await AccountPage()
    expect(jsx).toBeDefined()

    const usageMeterProps = findElementProps(jsx, UsageMeter as unknown as React.ComponentType<unknown>)
    expect(usageMeterProps).not.toBeNull()
    expect(usageMeterProps?.planSlug).toBe('pro')
    expect(usageMeterProps?.isSimulatedPro).toBe(false)
  })
})
