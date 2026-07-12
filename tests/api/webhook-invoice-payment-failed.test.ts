/**
 * Tests for invoice.payment_failed webhook policy — ACCEPTED_BILLING_POLICY (Variant A).
 *
 * Key assertions:
 *  - Pro entitlement is NOT immediately revoked on payment failure.
 *  - cancelSubscriptionInDatabase() is NOT called.
 *  - saveSubscription() is NOT called.
 *  - A console.warn telemetry message IS emitted.
 *  - The webhook returns 200 OK (Stripe should not retry our endpoint).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fakeStripeSecretKey } from '../helpers/fake-secrets'

vi.mock('server-only', () => ({}))

// Hoist mock refs so they can be used inside vi.mock factory and tests
const stripeMocks = vi.hoisted(() => ({
  webhooks: {
    constructEvent: vi.fn()
  },
  subscriptions: {
    retrieve: vi.fn()
  }
}))

vi.mock('stripe', () => {
  class MockStripe {
    webhooks = stripeMocks.webhooks
    subscriptions = stripeMocks.subscriptions
  }
  return { default: MockStripe }
})

// Mock billing DB functions
const billingMocks = vi.hoisted(() => ({
  getUserIdByStripeCustomerId: vi.fn(),
  saveSubscription: vi.fn(),
  cancelSubscriptionInDatabase: vi.fn(),
  claimWebhookEvent: vi.fn(),
  updateWebhookEventStatus: vi.fn(),
  completeCheckoutAttempt: vi.fn(),
  saveStripeCustomer: vi.fn(),
  extractSubscriptionData: vi.fn()
}))

vi.mock('@/lib/supabase/billing', () => billingMocks)

// Mock observability
vi.mock('@/lib/monitoring/observability', () => ({
  recordStripeWebhookFailure: vi.fn()
}))

import { POST } from '@/app/api/webhooks/stripe/route'
import type Stripe from 'stripe'

function makeInvoicePaymentFailedEvent(attemptCount = 1): Stripe.Event {
  return {
    id: 'evt_test_invoice_payment_failed',
    object: 'event',
    type: 'invoice.payment_failed',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    data: {
      object: {
        object: 'invoice',
        id: 'in_test_123',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        attempt_count: attemptCount
      }
    },
    api_version: '2022-11-15' as unknown as Stripe.Event['api_version'],
    pending_webhooks: 0,
    request: null
  } as unknown as Stripe.Event
}

function makeRequest(event: Stripe.Event): Request {
  return {
    text: vi.fn().mockResolvedValue(JSON.stringify(event)),
    headers: { get: (key: string) => key === 'stripe-signature' ? 'sig_test' : null }
  } as unknown as Request
}

describe('invoice.payment_failed webhook — ACCEPTED_BILLING_POLICY (Variant A)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    process.env.STRIPE_ENABLED = 'true'
    process.env.STRIPE_SECRET_KEY = fakeStripeSecretKey('test')
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_TestWebhookSecretDoNotReallyUse12345678'
    process.env.STRIPE_PRICE_ID_PRO = 'price_test_pro'

    // Default: claim succeeds
    billingMocks.claimWebhookEvent.mockResolvedValue('claimed')
    billingMocks.updateWebhookEventStatus.mockResolvedValue(undefined)
  })

  it('returns 200 OK and does NOT revoke Pro entitlement (no cancelSubscriptionInDatabase call)', async () => {
    const event = makeInvoicePaymentFailedEvent(1)
    stripeMocks.webhooks.constructEvent.mockReturnValue(event)

    const request = makeRequest(event)
    const response = await POST(request)

    expect(response.status).toBe(200)

    // CRITICAL: Pro entitlement must NOT be immediately revoked
    expect(billingMocks.cancelSubscriptionInDatabase).not.toHaveBeenCalled()
    expect(billingMocks.saveSubscription).not.toHaveBeenCalled()
  })

  it('emits a console.warn telemetry message with ACCEPTED_BILLING_POLICY label', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const event = makeInvoicePaymentFailedEvent(2)
    stripeMocks.webhooks.constructEvent.mockReturnValue(event)

    await POST(makeRequest(event))

    const calls = warnSpy.mock.calls.flat().join(' ')
    expect(calls).toContain('invoice.payment_failed')
    expect(calls).toContain('ACCEPTED_BILLING_POLICY')
    expect(calls).toContain('no immediate Pro revocation')

    warnSpy.mockRestore()
  })
})
