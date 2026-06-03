import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'
import type { User } from '@supabase/supabase-js'

// Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

// Mock identity, queries, billing
vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn(),
}))

vi.mock('@/lib/identity/anonymous', () => ({
  getOwnerIdFromCookies: vi.fn(),
}))

vi.mock('@/lib/supabase/queries', () => ({
  ensureUserProfile: vi.fn(),
  createUsageEvent: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/components/layout/app-header', () => ({
  AppHeader: vi.fn(() => React.createElement('header', null, 'AppHeader')),
}))

vi.mock('@/components/layout/app-footer', () => ({
  AppFooter: vi.fn(() => React.createElement('footer', null, 'AppFooter')),
}))

vi.mock('@/components/pricing/checkout-button', () => ({
  CheckoutButton: vi.fn(() => React.createElement('button', null, 'CheckoutButton')),
}))

vi.mock('@/components/pricing/simulate-pro-button', () => ({
  SimulateProButton: vi.fn(() => React.createElement('button', null, 'SimulateProButton')),
}))

vi.mock('@/components/pricing/waitlist-form', () => ({
  WaitlistForm: vi.fn(() => React.createElement('form', null, 'WaitlistForm')),
}))

import PricingPage from '@/app/pricing/page'
import { getAuthUser } from '@/lib/identity/auth'
import { ensureUserProfile } from '@/lib/supabase/queries'
import { WaitlistForm } from '@/components/pricing/waitlist-form'
import { CheckoutButton } from '@/components/pricing/checkout-button'

// Helper to extract text from React components
function extractAllText(node: unknown): string {
  if (!node) return ''
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map((n: unknown) => extractAllText(n)).join(' ')
  }
  if (typeof node === 'object' && node !== null && 'props' in node) {
    const obj = node as { props: { children?: unknown; label?: unknown; title?: unknown; placeholder?: unknown } }
    const parts = [
      extractAllText(obj.props.children),
      obj.props.label ? String(obj.props.label) : '',
      obj.props.title ? String(obj.props.title) : '',
      obj.props.placeholder ? String(obj.props.placeholder) : ''
    ]
    return parts.filter(Boolean).join(' ')
  }
  return ''
}

/**
 * Helper to check if a specific component is present in the tree.
 */
function hasComponent(node: unknown, target: unknown): boolean {
  if (!node || typeof node !== 'object') return false
  const el = node as React.ReactElement
  if (el.type === target) return true
  if (el.props?.children) {
    const children = Array.isArray(el.props.children)
      ? el.props.children
      : [el.props.children]
    for (const child of children) {
      if (hasComponent(child, target)) return true
    }
  }
  return false
}

describe('Pricing Page Beta States', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_ENABLED = 'false'
  })

  it('renders beta notice banner when Stripe is disabled', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null)
    const jsx = await PricingPage()
    const text = extractAllText(jsx)

    expect(text).toContain('Bramka płatności Stripe jest wyłączona')
    expect(text).toContain('Zakup Pro jest niedostępny')
  })

  it('renders waitlist form and not checkout button for logged-in user when Stripe is disabled', async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      id: 'user-123',
      email: 'user@test.com',
    } as unknown as User)
    vi.mocked(ensureUserProfile).mockResolvedValue({
      user_id: 'user-123',
      email: 'user@test.com',
      plan_slug: 'free',
      display_name: 'User',
      created_at: '',
      updated_at: '',
    })

    const jsx = await PricingPage()

    // Should render waitlist form
    expect(hasComponent(jsx, WaitlistForm)).toBe(true)

    // Should not render CheckoutButton
    expect(hasComponent(jsx, CheckoutButton)).toBe(false)
  })

  it('does not promise active PDF export and shows (w przygotowaniu)', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null)
    const jsx = await PricingPage()
    const text = extractAllText(jsx)

    // PDF export shouldn't look active
    expect(text).toContain('Eksport PDF *(w przygotowaniu)*')
    expect(text).not.toContain('Eksport PDF (Pro) – elegancki raport dla klienta')
  })

  it('renders Pro header without "Tier" suffix', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null)
    const jsx = await PricingPage()
    const text = extractAllText(jsx)

    // Pro limits name should render without "Tier"
    expect(text).toContain('Pro')
    expect(text).not.toContain('Pro Tier')
  })

  it('cleans FAQ of internal simulation details and active PDF promises', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null)
    const jsx = await PricingPage()
    const text = extractAllText(jsx)

    const faqIndex = text.indexOf('Najczęściej zadawane pytania')
    const faqText = faqIndex !== -1 ? text.substring(faqIndex) : text

    // FAQ must be scrubbed of internal simulate-pro triggers & PDF promises
    expect(faqText).toContain('Jeśli chcesz przetestować plan Pro, skontaktuj się z nami')
    expect(faqText).not.toContain('Aktywuj Symulację Pro')
    expect(faqText).not.toContain('PDF') // No PDF word inside the FAQs
  })
})
