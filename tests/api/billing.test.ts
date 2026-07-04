import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('server-only', () => ({}))

const stripeMocks = vi.hoisted(() => {
  return {
    checkout: {
      sessions: {
        create: vi.fn(),
        retrieve: vi.fn()
      }
    },
    billingPortal: {
      sessions: {
        create: vi.fn()
      }
    },
    customers: {
      create: vi.fn(),
      retrieve: vi.fn()
    },
    subscriptions: {
      retrieve: vi.fn()
    },
    webhooks: {
      constructEvent: vi.fn()
    }
  }
})

vi.mock('stripe', () => {
  class MockStripe {
    checkout = stripeMocks.checkout
    billingPortal = stripeMocks.billingPortal
    customers = stripeMocks.customers
    subscriptions = stripeMocks.subscriptions
    webhooks = stripeMocks.webhooks
    static webhooks = stripeMocks.webhooks
  }
  return {
    default: MockStripe,
    Stripe: MockStripe
  }
})
const mockStripeInstances = stripeMocks

// Mock all supabase mappings and queries
vi.mock('@/lib/supabase/billing', () => ({
  getStripeCustomer: vi.fn(),
  saveStripeCustomer: vi.fn(),
  getUserIdByStripeCustomerId: vi.fn(),
  getSubscriptionByUserId: vi.fn(),
  saveSubscription: vi.fn(),
  cancelSubscriptionInDatabase: vi.fn(),
  claimWebhookEvent: vi.fn(),
  updateWebhookEventStatus: vi.fn(),
  claimCheckoutAttempt: vi.fn(),
  updateCheckoutAttemptStatus: vi.fn(),
  completeCheckoutAttempt: vi.fn()
}))

vi.mock('@/lib/supabase/queries', () => ({
  getUserProfile: vi.fn(),
  createUserProfile: vi.fn(),
  createUsageEvent: vi.fn(),
  setUserPlanSlug: vi.fn()
}))

vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn()
}))

vi.mock('@/lib/identity/anonymous', () => ({
  getOwnerIdFromCookies: vi.fn(() => Promise.resolve('mock-owner-id')),
  resolveOrCreateOwnerId: vi.fn(() => Promise.resolve({ id: 'mock-owner-id' }))
}))

import { POST as checkoutHandler } from '@/app/api/billing/checkout/route'
import { POST as portalHandler } from '@/app/api/billing/portal/route'
import { POST as webhookHandler } from '@/app/api/webhooks/stripe/route'
import { getAuthUser } from '@/lib/identity/auth'
import { 
  getStripeCustomer, 
  saveStripeCustomer, 
  getUserIdByStripeCustomerId, 
  getSubscriptionByUserId, 
  saveSubscription, 
  cancelSubscriptionInDatabase, 
  claimWebhookEvent, 
  updateWebhookEventStatus,
  claimCheckoutAttempt,
  updateCheckoutAttemptStatus,
  completeCheckoutAttempt
} from '@/lib/supabase/billing'
import { setUserPlanSlug } from '@/lib/supabase/queries'
import { checkProductionEnv } from '@/lib/env/server'

const makeRequestWithHeader = (bodyStr: string, signatureValue?: string) => {
  const headers = new Headers()
  headers.set('Content-Type', 'application/json')
  if (signatureValue) {
    headers.set('stripe-signature', signatureValue)
  }
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers,
    body: bodyStr
  })
}

describe('Stripe Billing Foundation API Suite', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    // Map standard test environment variables
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = process.env as any
    env.APP_URL = 'http://localhost:3000'
    env.STRIPE_SECRET_KEY = 'sk_test_mock_stripe_key'
    env.STRIPE_WEBHOOK_SECRET = 'whsec_mock_webhook_key'
    env.STRIPE_PRICE_ID_PRO = 'price_1234_pro'
    env.NODE_ENV = 'development'
    env.STRIPE_ENABLED = 'true'

    // Mock saveSubscription to mirror real profile plan updates based on status
    vi.mocked(saveSubscription).mockImplementation(async (insertData) => {
      const isActivePro =
        insertData.plan_slug === 'pro' &&
        ['active', 'trialing', 'past_due'].includes(insertData.status)
      const resolvedPlanSlug = isActivePro ? 'pro' : 'free'
      await setUserPlanSlug({
        user_id: insertData.user_id,
        email: 'test@promptpolish.com',
        display_name: null,
        plan_slug: resolvedPlanSlug
      })
      return {
        id: 'sub_uuid',
        user_id: insertData.user_id,
        stripe_customer_id: insertData.stripe_customer_id,
        stripe_subscription_id: insertData.stripe_subscription_id,
        stripe_price_id: insertData.stripe_price_id,
        plan_slug: insertData.plan_slug,
        status: insertData.status,
        current_period_start: insertData.current_period_start,
        current_period_end: insertData.current_period_end,
        cancel_at_period_end: insertData.cancel_at_period_end || false,
        last_event_created: insertData.last_event_created || null,
        last_event_id: insertData.last_event_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    // Mock cancelSubscriptionInDatabase to mirror real profile plan demotion on cancellation
    vi.mocked(cancelSubscriptionInDatabase).mockImplementation(async (subId) => {
      const userId = subId === 'sub_test_456' ? 'user_mapped_uuid' : 'user_deleted_uuid'
      await setUserPlanSlug({
        user_id: userId,
        email: 'test@promptpolish.com',
        display_name: null,
        plan_slug: 'free'
      })
      return true
    })

    // Default webhook inbox mocks — most tests use claim=process, update=success
    vi.mocked(claimWebhookEvent).mockResolvedValue('process')
    vi.mocked(updateWebhookEventStatus).mockResolvedValue(true)

    // Default: no existing active subscription for checkout tests
    vi.mocked(getSubscriptionByUserId).mockResolvedValue(null)

    // Default: saveStripeCustomer succeeds
    vi.mocked(saveStripeCustomer).mockResolvedValue({ user_id: 'mock-user-id', stripe_customer_id: 'mock-customer-id', created_at: '', updated_at: '' })

    // Default checkout attempt mocks
    vi.mocked(claimCheckoutAttempt).mockResolvedValue({
      status: 'create_new',
      attempt_id: 'mock-attempt-uuid',
      stripe_checkout_session_id: null
    })
    vi.mocked(updateCheckoutAttemptStatus).mockResolvedValue(true)
    vi.mocked(completeCheckoutAttempt).mockResolvedValue(true)

    // Dynamic fallback mock for stripe.subscriptions.retrieve to keep existing tests compatible
    mockStripeInstances.subscriptions.retrieve.mockImplementation(async (subId) => {
      const lastCallResult = mockStripeInstances.webhooks.constructEvent.mock.results.slice(-1)[0]
      const construction = lastCallResult?.value
      const status = construction?.data?.object?.status || 'active'
      const priceId = construction?.data?.object?.items?.data?.[0]?.price?.id || 'price_1234_pro'
      const customer = construction?.data?.object?.customer || 'cus_test_123'
      const cancel_at_period_end = construction?.data?.object?.cancel_at_period_end || false
      const current_period_start = construction?.data?.object?.current_period_start || 1700000000
      const current_period_end = construction?.data?.object?.current_period_end || 1703000000

      return {
        id: subId,
        customer,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        items: {
          data: [
            {
              price: {
                id: priceId
              }
            }
          ]
        }
      }
    })
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Production Environment Safeguards', () => {
    it('requires Stripe environment variables in production mode (deferred to v1.1)', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const env = process.env as any
      env.NODE_ENV = 'production'
      delete env.STRIPE_SECRET_KEY
      
      const result = checkProductionEnv()
      expect(result.valid).toBe(false)
      expect(result.missing).toContain('STRIPE_SECRET_KEY')
    })
  })

  describe('POST /api/billing/checkout (Checkout Session)', () => {
    it('returns 403 billing_disabled when STRIPE_ENABLED is false (beta mode)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const env = process.env as any
      env.STRIPE_ENABLED = 'false'

      const response = await checkoutHandler()
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('billing_disabled')
      expect(mockStripeInstances.checkout.sessions.create).not.toHaveBeenCalled()

      // Restore for subsequent tests
      env.STRIPE_ENABLED = 'true'
    })

    it('returns 401 when the user is not authenticated', async () => {
      vi.mocked(getAuthUser).mockResolvedValue(null)

      const response = await checkoutHandler()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('unauthorized')
      expect(mockStripeInstances.checkout.sessions.create).not.toHaveBeenCalled()
    })

    it('creates customer and starts Checkout Session when customer mapping is absent', async () => {
      vi.mocked(getAuthUser).mockResolvedValue({
        id: 'user_uuid_1',
        email: 'test@promptpolish.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: ''
      })
      vi.mocked(getStripeCustomer).mockResolvedValue(null)
      mockStripeInstances.customers.create.mockResolvedValue({ id: 'cus_new_123' })
      mockStripeInstances.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_test' })

      const response = await checkoutHandler()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_test')

      expect(mockStripeInstances.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@promptpolish.com',
          metadata: { userId: 'user_uuid_1' }
        }),
        expect.objectContaining({
          idempotencyKey: expect.stringContaining('stripe-customer-creation-user_uuid_1')
        })
      )
      expect(saveStripeCustomer).toHaveBeenCalledWith('user_uuid_1', 'cus_new_123')
      expect(mockStripeInstances.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          customer: 'cus_new_123',
          client_reference_id: 'user_uuid_1',
          metadata: {
            user_id: 'user_uuid_1',
            plan_slug: 'pro'
          },
          subscription_data: {
            metadata: {
              user_id: 'user_uuid_1',
              plan_slug: 'pro'
            }
          },
          line_items: [{ price: 'price_1234_pro', quantity: 1 }],
          success_url: 'http://localhost:3000/account?checkout=success&session_id={CHECKOUT_SESSION_ID}',
          cancel_url: 'http://localhost:3000/pricing?upgrade=cancel'
        }),
        expect.any(Object)
      )
    })

    it('uses existing Stripe Customer ID if mapping already exists in database', async () => {
      vi.mocked(getAuthUser).mockResolvedValue({
        id: 'user_uuid_2',
        email: 'existing@promptpolish.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: ''
      })
      vi.mocked(getStripeCustomer).mockResolvedValue({
        user_id: 'user_uuid_2',
        stripe_customer_id: 'cus_existing_999',
        created_at: '',
        updated_at: ''
      })
      mockStripeInstances.customers.retrieve.mockResolvedValue({ id: 'cus_existing_999' })
      mockStripeInstances.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_test' })

      const response = await checkoutHandler()
      await response.json()

      expect(response.status).toBe(200)
      expect(mockStripeInstances.customers.create).not.toHaveBeenCalled()
      expect(mockStripeInstances.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing_999',
          client_reference_id: 'user_uuid_2',
          metadata: {
            user_id: 'user_uuid_2',
            plan_slug: 'pro'
          },
          subscription_data: {
            metadata: {
              user_id: 'user_uuid_2',
              plan_slug: 'pro'
            }
          },
          success_url: 'http://localhost:3000/account?checkout=success&session_id={CHECKOUT_SESSION_ID}'
        }),
        expect.any(Object)
      )
    })

    it('blocks checkout and returns 502 if saving customer mapping to database fails', async () => {
      vi.mocked(getAuthUser).mockResolvedValue({
        id: 'user_uuid_fail',
        email: 'fail@promptpolish.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: ''
      })
      vi.mocked(getStripeCustomer).mockResolvedValue(null)
      mockStripeInstances.customers.create.mockResolvedValue({ id: 'cus_fail_123' })
      vi.mocked(saveStripeCustomer).mockResolvedValue(null) // Mock DB save failure

      const response = await checkoutHandler()
      const data = await response.json()

      expect(response.status).toBe(502)
      expect(data.error).toBe('stripe_error')
      expect(mockStripeInstances.checkout.sessions.create).not.toHaveBeenCalled()
    })

    it('blocks checkout and returns portal URL if user has an existing active subscription', async () => {
      vi.mocked(getAuthUser).mockResolvedValue({
        id: 'user_uuid_active_sub',
        email: 'active@promptpolish.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: ''
      })
      vi.mocked(getStripeCustomer).mockResolvedValue({
        user_id: 'user_uuid_active_sub',
        stripe_customer_id: 'cus_active_sub',
        created_at: '',
        updated_at: ''
      })
      vi.mocked(getSubscriptionByUserId).mockResolvedValue({
        id: 'sub_123',
        user_id: 'user_uuid_active_sub',
        stripe_customer_id: 'cus_active_sub',
        stripe_subscription_id: 'sub_active_123',
        stripe_price_id: 'price_1234_pro',
        plan_slug: 'pro',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 86400000).toISOString(),
        cancel_at_period_end: false,
        last_event_created: null,
        last_event_id: null,
        created_at: '',
        updated_at: ''
      })
      mockStripeInstances.billingPortal.sessions.create.mockResolvedValue({ url: 'https://billing.stripe.com/portal/cs_active' })

      const response = await checkoutHandler()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('existing_subscription')
      expect(data.portalUrl).toBe('https://billing.stripe.com/portal/cs_active')
      expect(mockStripeInstances.checkout.sessions.create).not.toHaveBeenCalled()
    })

    it('uses server-side attempt ID to derive the Stripe Checkout Session idempotency key', async () => {
      vi.mocked(getAuthUser).mockResolvedValue({
        id: 'user_uuid_idempotent',
        email: 'idempotent@promptpolish.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: ''
      })
      vi.mocked(getStripeCustomer).mockResolvedValue(null)
      mockStripeInstances.customers.create.mockResolvedValue({ id: 'cus_idempotent' })
      vi.mocked(saveStripeCustomer).mockResolvedValue({
        user_id: 'user_uuid_idempotent',
        stripe_customer_id: 'cus_idempotent',
        created_at: '',
        updated_at: ''
      })
      vi.mocked(getSubscriptionByUserId).mockResolvedValue(null)
      vi.mocked(claimCheckoutAttempt).mockResolvedValue({
        status: 'create_new',
        attempt_id: 'attempt-uuid-777',
        stripe_checkout_session_id: null
      })
      mockStripeInstances.checkout.sessions.create.mockResolvedValue({ id: 'cs_test_777', url: 'https://checkout.stripe.com/pay/cs_test_777' })

      const response = await checkoutHandler()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_test_777')
      expect(mockStripeInstances.checkout.sessions.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          idempotencyKey: 'checkout-session-attempt-uuid-777'
        })
      )
      expect(updateCheckoutAttemptStatus).toHaveBeenCalledWith({
        attempt_id: 'attempt-uuid-777',
        status: 'ready',
        session_id: 'cs_test_777'
      })
    })

    it('active Pro user cannot create duplicate checkout', async () => {
      vi.mocked(getAuthUser).mockResolvedValue({
        id: 'user_pro_existing',
        email: 'pro-exist@promptpolish.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: ''
      })

      // Mock subscription to be active
      vi.mocked(getSubscriptionByUserId).mockResolvedValue({
        user_id: 'user_pro_existing',
        stripe_customer_id: 'cus_exist_123',
        stripe_subscription_id: 'sub_exist_123',
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
      vi.mocked(getStripeCustomer).mockResolvedValue({
        user_id: 'user_pro_existing',
        stripe_customer_id: 'cus_exist_123',
        created_at: '',
        updated_at: '',
      })

      mockStripeInstances.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://billing.stripe.com/portal/mock_session_id'
      })

      const response = await checkoutHandler()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('existing_subscription')
      expect(data.portalUrl).toBe('https://billing.stripe.com/portal/mock_session_id')
      expect(mockStripeInstances.checkout.sessions.create).not.toHaveBeenCalled()
    })

    it('creates a new customer and updates Supabase if the existing customer is stale (resource_missing)', async () => {
      vi.mocked(getAuthUser).mockResolvedValue({
        id: 'user_stale_uuid',
        email: 'stale@promptpolish.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: ''
      })
      vi.mocked(getStripeCustomer).mockResolvedValue({
        user_id: 'user_stale_uuid',
        stripe_customer_id: 'cus_stale_123',
        created_at: '',
        updated_at: ''
      })
      
      const retrieveError = new Error('No such customer')
      Object.assign(retrieveError, { code: 'resource_missing', statusCode: 404 })
      mockStripeInstances.customers.retrieve.mockRejectedValueOnce(retrieveError)

      mockStripeInstances.customers.create.mockResolvedValue({ id: 'cus_fresh_777' })
      mockStripeInstances.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_fresh' })

      const response = await checkoutHandler()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_fresh')
      expect(mockStripeInstances.customers.retrieve).toHaveBeenCalledWith('cus_stale_123')
      expect(mockStripeInstances.customers.create).toHaveBeenCalled()
      expect(saveStripeCustomer).toHaveBeenCalledWith('user_stale_uuid', 'cus_fresh_777')
    })

    it('retries checkout session creation once if checkout.sessions.create fails with resource_missing for customer', async () => {
      vi.mocked(getAuthUser).mockResolvedValue({
        id: 'user_retry_uuid',
        email: 'retry@promptpolish.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: ''
      })
      vi.mocked(getStripeCustomer).mockResolvedValue({
        user_id: 'user_retry_uuid',
        stripe_customer_id: 'cus_stale_again',
        created_at: '',
        updated_at: ''
      })

      mockStripeInstances.customers.retrieve.mockResolvedValue({ id: 'cus_stale_again' })

      const checkoutError = new Error('No such customer')
      Object.assign(checkoutError, { code: 'resource_missing', param: 'customer', statusCode: 404 })
      mockStripeInstances.checkout.sessions.create
        .mockRejectedValueOnce(checkoutError)
        .mockResolvedValueOnce({ url: 'https://checkout.stripe.com/pay/cs_retry_success' })

      mockStripeInstances.customers.create.mockResolvedValue({ id: 'cus_retry_fresh' })

      const response = await checkoutHandler()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_retry_success')
      expect(mockStripeInstances.customers.create).toHaveBeenCalled()
      expect(saveStripeCustomer).toHaveBeenCalledWith('user_retry_uuid', 'cus_retry_fresh')
      expect(mockStripeInstances.checkout.sessions.create).toHaveBeenCalledTimes(2)
    })

    it('returns a safe 502 error if checkout retry also fails', async () => {
      vi.mocked(getAuthUser).mockResolvedValue({
        id: 'user_fail_twice',
        email: 'failtwice@promptpolish.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: ''
      })
      vi.mocked(getStripeCustomer).mockResolvedValue({
        user_id: 'user_fail_twice',
        stripe_customer_id: 'cus_stale_twice',
        created_at: '',
        updated_at: ''
      })

      mockStripeInstances.customers.retrieve.mockResolvedValue({ id: 'cus_stale_twice' })

      const checkoutError = new Error('No such customer')
      Object.assign(checkoutError, { code: 'resource_missing', param: 'customer', statusCode: 404 })
      
      mockStripeInstances.checkout.sessions.create.mockRejectedValue(checkoutError)
      mockStripeInstances.customers.create.mockResolvedValue({ id: 'cus_twice_fresh' })

      const response = await checkoutHandler()
      const data = await response.json()

      expect(response.status).toBe(502)
      expect(data.error).toBe('stripe_error')
      expect(data.message).toBe('Nie udało się rozpocząć płatności w Stripe. Spróbuj ponownie za chwilę.')
    })
  })

  describe('POST /api/billing/portal (Customer Portal Session)', () => {
    it('returns 401 when the user is not authenticated', async () => {
      vi.mocked(getAuthUser).mockResolvedValue(null)

      const response = await portalHandler()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('unauthorized')
    })

    it('returns 400 when the user does not have a Stripe Customer ID mapping in the DB', async () => {
      vi.mocked(getAuthUser).mockResolvedValue({
        id: 'user_uuid_1',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: ''
      })
      vi.mocked(getStripeCustomer).mockResolvedValue(null)

      const response = await portalHandler()
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('no_customer_record')
    })

    it('opens Stripe Billing Portal redirect for active registered customers', async () => {
      vi.mocked(getAuthUser).mockResolvedValue({
        id: 'user_uuid_1',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: ''
      })
      vi.mocked(getStripeCustomer).mockResolvedValue({
        user_id: 'user_uuid_1',
        stripe_customer_id: 'cus_registered_456',
        created_at: '',
        updated_at: ''
      })
      mockStripeInstances.billingPortal.sessions.create.mockResolvedValue({ url: 'https://billing.stripe.com/portal/cs_test' })

      const response = await portalHandler()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.portalUrl).toBe('https://billing.stripe.com/portal/cs_test')
      expect(mockStripeInstances.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_registered_456',
        return_url: 'http://localhost:3000/pricing'
      })
    })
  })

  describe('POST /api/webhooks/stripe (Stripe Webhooks)', () => {

    it('returns 400 Bad Request if stripe-signature header is missing', async () => {
      const response = await webhookHandler(makeRequestWithHeader('{}'))
      expect(response.status).toBe(400)
      const text = await response.text()
      expect(text).toBe('Missing signature header')
    })

    it('returns 400 if signature verification throws constructEvent errors', async () => {
      mockStripeInstances.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Signature mismatch')
      })

      const response = await webhookHandler(makeRequestWithHeader('{}', 't=123,v1=bad_sig'))
      expect(response.status).toBe(400)
      const text = await response.text()
      expect(text).toBe('Webhook signature verification failed')
    })

    it('processes customer.subscription.created and grants Pro plan to mapped users', async () => {
      const mockEvent = {
        type: 'customer.subscription.created',
        id: 'evt_test_1',
        data: {
          object: {
            id: 'sub_test_123',
            customer: 'cus_test_123',
            status: 'active',
            current_period_start: 1700000000,
            current_period_end: 1703000000,
            cancel_at_period_end: false,
            items: {
              data: [
                {
                  price: {
                    id: 'price_1234_pro'
                  }
                }
              ]
            }
          }
        }
      }

      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_mapped_uuid')

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(200)

      expect(getUserIdByStripeCustomerId).toHaveBeenCalledWith('cus_test_123')
      expect(saveSubscription).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user_mapped_uuid',
        stripe_customer_id: 'cus_test_123',
        stripe_subscription_id: 'sub_test_123',
        stripe_price_id: 'price_1234_pro',
        plan_slug: 'pro',
        status: 'active',
        current_period_start: new Date(1700000000 * 1000).toISOString(),
        current_period_end: new Date(1703000000 * 1000).toISOString(),
        cancel_at_period_end: false
      }))
    })

    it('processes customer.subscription.deleted and cancels subscription tier', async () => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        id: 'evt_test_2',
        data: {
          object: {
            id: 'sub_test_456',
            customer: 'cus_test_456',
            status: 'canceled',
            items: {
              data: [
                {
                  price: {
                    id: 'price_1234_pro'
                  }
                }
              ]
            }
          }
        }
      }

      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(200)

      expect(cancelSubscriptionInDatabase).toHaveBeenCalledWith('sub_test_456', expect.any(String), 'evt_test_2')
    })

    it('processes customer.subscription.updated with active status', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        id: 'evt_test_3',
        data: {
          object: {
            id: 'sub_test_789',
            customer: 'cus_test_789',
            status: 'active',
            current_period_start: 1700000000,
            current_period_end: 1703000000,
            cancel_at_period_end: false,
            items: {
              data: [
                {
                  price: {
                    id: 'price_1234_pro'
                  }
                }
              ]
            }
          }
        }
      }

      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_mapped_uuid_3')

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(200)

      expect(saveSubscription).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user_mapped_uuid_3',
        status: 'active',
        plan_slug: 'pro'
      }))
    })

    it('processes customer.subscription.updated with past_due status (grace period)', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        id: 'evt_test_4',
        data: {
          object: {
            id: 'sub_test_789',
            customer: 'cus_test_789',
            status: 'past_due',
            current_period_start: 1700000000,
            current_period_end: 1703000000,
            cancel_at_period_end: false,
            items: {
              data: [
                {
                  price: {
                    id: 'price_1234_pro'
                  }
                }
              ]
            }
          }
        }
      }

      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_mapped_uuid_4')

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(200)

      expect(saveSubscription).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user_mapped_uuid_4',
        status: 'past_due',
        plan_slug: 'pro'
      }))
    })

    it('processes customer.subscription.updated with unpaid status', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        id: 'evt_test_5',
        data: {
          object: {
            id: 'sub_test_789',
            customer: 'cus_test_789',
            status: 'unpaid',
            current_period_start: 1700000000,
            current_period_end: 1703000000,
            cancel_at_period_end: false,
            items: {
              data: [
                {
                  price: {
                    id: 'price_1234_pro'
                  }
                }
              ]
            }
          }
        }
      }

      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_mapped_uuid_5')

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(200)

      expect(saveSubscription).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user_mapped_uuid_5',
        status: 'unpaid',
        plan_slug: 'free'
      }))
    })

    it('webhook processes checkout.session.completed safely', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        id: 'evt_checkout_completed_test',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_test_123',
            subscription: 'sub_test_123',
            mode: 'subscription',
            client_reference_id: 'user_mapped_uuid_checkout',
            metadata: {
              user_id: 'user_mapped_uuid_checkout',
              plan_slug: 'pro'
            }
          }
        }
      }

      const mockSubscription = {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        status: 'active',
        current_period_start: 1700000000,
        current_period_end: 1703000000,
        cancel_at_period_end: false,
        items: {
          data: [
            {
              price: {
                id: 'price_1234_pro'
              }
            }
          ]
        }
      }

      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockStripeInstances.subscriptions.retrieve.mockResolvedValue(mockSubscription)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_mapped_uuid_checkout')

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(200)

      expect(saveStripeCustomer).toHaveBeenCalledWith('user_mapped_uuid_checkout', 'cus_test_123')
      expect(mockStripeInstances.subscriptions.retrieve).toHaveBeenCalledWith('sub_test_123')
      expect(saveSubscription).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user_mapped_uuid_checkout',
        stripe_customer_id: 'cus_test_123',
        stripe_subscription_id: 'sub_test_123',
        stripe_price_id: 'price_1234_pro',
        plan_slug: 'pro',
        status: 'active',
        current_period_start: new Date(1700000000 * 1000).toISOString(),
        current_period_end: new Date(1703000000 * 1000).toISOString(),
        cancel_at_period_end: false
      }))
    })

    it('checkout.session.completed without user_id does not upgrade anyone and logs safe warning', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        id: 'evt_checkout_completed_no_user',
        data: {
          object: {
            id: 'cs_test_no_user',
            customer: 'cus_test_123',
            subscription: 'sub_test_123',
            mode: 'subscription'
          }
        }
      }

      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      const loggerSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(200)

      expect(saveSubscription).not.toHaveBeenCalled()
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('is missing user_id'))
      loggerSpy.mockRestore()
    })

    it('duplicate webhook delivery is safe because subscription upsert is stable', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        id: 'evt_test_repeated',
        data: {
          object: {
            id: 'sub_test_repeated',
            customer: 'cus_test_repeated',
            status: 'active',
            current_period_start: 1700000000,
            current_period_end: 1703000000,
            cancel_at_period_end: false,
            items: {
              data: [
                {
                  price: {
                    id: 'price_1234_pro'
                  }
                }
              ]
            }
          }
        }
      }

      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_mapped_uuid_repeated')

      // Process event the first time
      const response1 = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response1.status).toBe(200)

      // Process event the second time (simulating a Stripe retry or duplicate delivery)
      const response2 = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response2.status).toBe(200)

      // Webhook should process it safely twice because database uses upsert
      expect(saveSubscription).toHaveBeenCalledTimes(2)
    })

    it('no client-provided plan_slug or price_id can grant Pro', async () => {
      vi.mocked(getAuthUser).mockResolvedValue({
        id: 'user_uuid_1',
        email: 'user@promptpolish.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: ''
      })
      vi.mocked(getStripeCustomer).mockResolvedValue({
        user_id: 'user_uuid_1',
        stripe_customer_id: 'cus_existing_999',
        created_at: '',
        updated_at: ''
      })
      mockStripeInstances.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_test' })

      // Construct request where the client attempts to inject a custom price ID
      const req = new Request('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: 'price_malicious_attacker_custom', plan_slug: 'pro' })
      })

      const response = await checkoutHandler(req)
      expect(response.status).toBe(200)

      // Verify the checkout session created strictly uses STRIPE_PRICE_ID_PRO ('price_1234_pro') from server config, ignoring client body
      expect(mockStripeInstances.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [{ price: 'price_1234_pro', quantity: 1 }]
        }),
        expect.any(Object)
      )
    })

    it('active Pro maps to Pro entitlement', async () => {
      const mockEvent = {
        type: 'customer.subscription.created',
        id: 'evt_active_entitlement_test',
        data: {
          object: {
            id: 'sub_active_test',
            customer: 'cus_active_test',
            status: 'active',
            current_period_start: 1700000000,
            current_period_end: 1703000000,
            cancel_at_period_end: false,
            items: {
              data: [
                {
                  price: {
                    id: 'price_1234_pro'
                  }
                }
              ]
            }
          }
        }
      }

      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_active_uuid')

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(200)

      expect(saveSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user_active_uuid',
          plan_slug: 'pro',
          status: 'active'
        })
      )

      // Proves that saveSubscription resolved status 'active' to plan_slug 'pro' on the profile
      expect(setUserPlanSlug).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user_active_uuid',
          plan_slug: 'pro'
        })
      )
    })

    it('canceled/unpaid removes Pro entitlement according to policy', async () => {
      // Test customer.subscription.deleted event
      const mockEventDeleted = {
        type: 'customer.subscription.deleted',
        id: 'evt_deleted_entitlement_test',
        data: {
          object: {
            id: 'sub_deleted_test',
            customer: 'cus_deleted_test',
            status: 'canceled',
            items: {
              data: [
                {
                  price: {
                    id: 'price_1234_pro'
                  }
                }
              ]
            }
          }
        }
      }

      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEventDeleted)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_deleted_uuid')

      const response1 = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEventDeleted), 't=123,v1=sig'))
      expect(response1.status).toBe(200)
      expect(cancelSubscriptionInDatabase).toHaveBeenCalledWith('sub_deleted_test', expect.any(String), 'evt_deleted_entitlement_test')

      // Proves that cancelSubscriptionInDatabase resolved status 'canceled' to plan_slug 'free' on the profile
      expect(setUserPlanSlug).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user_deleted_uuid',
          plan_slug: 'free'
        })
      )

      // Test customer.subscription.updated event with unpaid status
      const mockEventUnpaid = {
        type: 'customer.subscription.updated',
        id: 'evt_unpaid_entitlement_test',
        data: {
          object: {
            id: 'sub_unpaid_test',
            customer: 'cus_unpaid_test',
            status: 'unpaid',
            current_period_start: 1700000000,
            current_period_end: 1703000000,
            cancel_at_period_end: false,
            items: {
              data: [
                {
                  price: {
                    id: 'price_1234_pro'
                  }
                }
              ]
            }
          }
        }
      }

      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEventUnpaid)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_unpaid_uuid')

      const response2 = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEventUnpaid), 't=123,v1=sig'))
      expect(response2.status).toBe(200)

      expect(saveSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user_unpaid_uuid',
          plan_slug: 'free',
          status: 'unpaid'
        })
      )

      // Proves that saveSubscription resolved status 'unpaid' to plan_slug 'free' on the profile
      expect(setUserPlanSlug).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user_unpaid_uuid',
          plan_slug: 'free'
        })
      )
    })

    it('unknown or non-active status (like paused) maps to free', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        id: 'evt_paused_test',
        data: {
          object: {
            id: 'sub_paused_test',
            customer: 'cus_paused_test',
            status: 'paused',
            current_period_start: 1700000000,
            current_period_end: 1703000000,
            cancel_at_period_end: false,
            items: {
              data: [
                {
                  price: {
                    id: 'price_1234_pro'
                  }
                }
              ]
            }
          }
        }
      }

      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_paused_uuid')

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(200)

      expect(saveSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user_paused_uuid',
          plan_slug: 'free',
          status: 'paused'
        })
      )

      expect(setUserPlanSlug).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user_paused_uuid',
          plan_slug: 'free'
        })
      )
    })
  })

  // ─────────────────────────────────────────────────────────
  // Webhook Inbox: Deduplication
  // ─────────────────────────────────────────────────────────
  describe('Webhook Inbox — Event Deduplication', () => {
    const dedupEvent = {
      type: 'customer.subscription.created',
      id: 'evt_dedup_001',
      data: {
        object: {
          id: 'sub_dedup_001',
          customer: 'cus_dedup_001',
          status: 'active',
          current_period_start: 1700000000,
          current_period_end: 1703000000,
          cancel_at_period_end: false,
          items: { data: [{ price: { id: 'price_1234_pro' } }] }
        }
      }
    }

    it('returns 200 without calling saveSubscription when event is already processed', async () => {
      // Simulate inbox saying the event was already handled
      vi.mocked(claimWebhookEvent).mockResolvedValue('duplicate_success')
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(dedupEvent)

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(dedupEvent), 't=111,v1=sig'))

      expect(response.status).toBe(200)
      expect(saveSubscription).not.toHaveBeenCalled()
      // We should not attempt to update the status of an already-done event
      expect(updateWebhookEventStatus).not.toHaveBeenCalled()
    })

    it('calls saveSubscription and marks event done when claim returns process', async () => {
      vi.mocked(claimWebhookEvent).mockResolvedValue('process')
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_dedup_uuid')
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(dedupEvent)

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(dedupEvent), 't=111,v1=sig'))

      expect(response.status).toBe(200)
      expect(saveSubscription).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user_dedup_uuid',
        status: 'active',
        plan_slug: 'pro'
      }))
      expect(updateWebhookEventStatus).toHaveBeenCalledWith({
        event_id: 'evt_dedup_001',
        status: 'processed'
      })
    })

    it('returns 200 and marks event ignored for unsupported event types', async () => {
      const unknownEvent = { type: 'payment_method.attached', id: 'evt_unknown_001', data: { object: {} } }
      vi.mocked(claimWebhookEvent).mockResolvedValue('process')
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(unknownEvent)

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(unknownEvent), 't=111,v1=sig'))

      expect(response.status).toBe(200)
      expect(saveSubscription).not.toHaveBeenCalled()
      expect(updateWebhookEventStatus).toHaveBeenCalledWith({
        event_id: 'evt_unknown_001',
        status: 'ignored'
      })
    })
  })

  // ─────────────────────────────────────────────────────────
  // Webhook Inbox: Out-of-Order Events
  // ─────────────────────────────────────────────────────────
  describe('Webhook Inbox — Out-of-Order Event Protection', () => {
    const makeSubEvent = (
      type: string,
      evtId: string,
      subId: string,
      status: string,
      createdTs: number
    ) => ({
      type,
      id: evtId,
      created: createdTs,
      data: {
        object: {
          id: subId,
          customer: 'cus_ooo_test',
          status,
          current_period_start: 1700000000,
          current_period_end: 1703000000,
          cancel_at_period_end: false,
          items: { data: [{ price: { id: 'price_1234_pro' } }] }
        }
      }
    })

    it('saves subscription when no existing record exists (first event)', async () => {
      // saveSubscription itself handles "no prior record" path via upsert logic
      vi.mocked(claimWebhookEvent).mockResolvedValue('process')
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_ooo_uuid')

      const evt = makeSubEvent('customer.subscription.created', 'evt_ooo_001', 'sub_ooo_001', 'active', 1700000100)
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(evt)

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(evt), 't=222,v1=sig'))

      expect(response.status).toBe(200)
      expect(saveSubscription).toHaveBeenCalledWith(expect.objectContaining({
        status: 'active',
        last_event_id: 'evt_ooo_001',
        last_event_created: new Date(1700000100 * 1000).toISOString()
      }))
    })

    it('saveSubscription is called with last_event_id and last_event_created for ordering', async () => {
      vi.mocked(claimWebhookEvent).mockResolvedValue('process')
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_ooo_uuid2')

      const evt = makeSubEvent('customer.subscription.updated', 'evt_ooo_002', 'sub_ooo_002', 'past_due', 1700000200)
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(evt)

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(evt), 't=222,v1=sig'))

      expect(response.status).toBe(200)
      expect(saveSubscription).toHaveBeenCalledWith(expect.objectContaining({
        last_event_id: 'evt_ooo_002',
        last_event_created: new Date(1700000200 * 1000).toISOString()
      }))
    })

    it('returns 200 and marks stale when saveSubscription throws StaleEventError', async () => {
      vi.mocked(claimWebhookEvent).mockResolvedValue('process')
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_ooo_uuid3')
      // Simulate saveSubscription detecting an out-of-order (stale) event and throwing
      vi.mocked(saveSubscription).mockRejectedValueOnce(
        Object.assign(new Error('Stale event skipped'), { code: 'STALE_EVENT' })
      )

      const evt = makeSubEvent('customer.subscription.updated', 'evt_ooo_003', 'sub_ooo_003', 'canceled', 1699000000)
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(evt)

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(evt), 't=222,v1=sig'))

      // Stale events must not trigger a 5xx (would cause Stripe to retry forever)
      expect(response.status).toBe(200)
      expect(updateWebhookEventStatus).toHaveBeenCalledWith(expect.objectContaining({
        event_id: 'evt_ooo_003',
        status: 'ignored'
      }))
    })
  })

  // ─────────────────────────────────────────────────────────
  // Webhook Inbox: Failed-Write / Retry Behavior
  // ─────────────────────────────────────────────────────────
  describe('Webhook Inbox — Failed-Write and Retry Behavior', () => {
    const retryEvent = {
      type: 'customer.subscription.updated',
      id: 'evt_retry_001',
      created: 1700005000,
      data: {
        object: {
          id: 'sub_retry_001',
          customer: 'cus_retry_001',
          status: 'active',
          current_period_start: 1700000000,
          current_period_end: 1703000000,
          cancel_at_period_end: false,
          items: { data: [{ price: { id: 'price_1234_pro' } }] }
        }
      }
    }

    it('returns 500 when saveSubscription throws a transient DB error (Stripe will retry)', async () => {
      vi.mocked(claimWebhookEvent).mockResolvedValue('process')
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_retry_uuid')
      vi.mocked(saveSubscription).mockRejectedValueOnce(
        Object.assign(new Error('Connection timeout'), { code: 'DB_TRANSIENT' })
      )
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(retryEvent)

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(retryEvent), 't=333,v1=sig'))

      // Must be 5xx so Stripe schedules a retry
      expect(response.status).toBe(500)
      // Status should be updated to failed_retryable so the inbox won't block re-processing
      expect(updateWebhookEventStatus).toHaveBeenCalledWith(expect.objectContaining({
        event_id: 'evt_retry_001',
        status: 'failed_retryable',
        failure_message: 'Connection timeout'
      }))
    })

    it('returns 500 when claimWebhookEvent itself fails — returns 500 to force Stripe retry', async () => {
      vi.mocked(claimWebhookEvent).mockRejectedValueOnce(new Error('DB connection lost'))
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(retryEvent)

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(retryEvent), 't=333,v1=sig'))

      expect(response.status).toBe(500)
      // saveSubscription must never be called if we couldn't claim the event
      expect(saveSubscription).not.toHaveBeenCalled()
    })

    it('returns 200 after successful retry when event was previously failed_retryable', async () => {
      // On retry Stripe sends the same event again; claim returns 'process' again because
      // the inbox status was 'failed_retryable' (not 'processed')
      vi.mocked(claimWebhookEvent).mockResolvedValue('process')
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_retry_uuid')
      // This time the DB write succeeds
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(retryEvent)

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(retryEvent), 't=444,v1=sig'))

      expect(response.status).toBe(200)
      expect(saveSubscription).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user_retry_uuid',
        status: 'active'
      }))
      expect(updateWebhookEventStatus).toHaveBeenCalledWith({
        event_id: 'evt_retry_001',
        status: 'processed'
      })
    })
  })

  // ─────────────────────────────────────────────────────────
  // Webhook Inbox: Invoice Event Compatibility (payment_failed)
  // ─────────────────────────────────────────────────────────
  describe('Webhook Inbox — Invoice Event Compatibility', () => {
    const makeInvoiceEvent = (subVal: string | Record<string, unknown> | null) => ({
      type: 'invoice.payment_failed',
      id: 'evt_invoice_fail_111',
      data: {
        object: {
          id: 'in_123',
          customer: 'cus_invoice_123',
          subscription: subVal
        }
      }
    })

    it('handles subscription as string', async () => {
      const evt = makeInvoiceEvent('sub_from_string')
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(evt)
      vi.mocked(claimWebhookEvent).mockResolvedValue('process')
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_invoice_1')

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(evt), 't=123,v1=sig'))
      expect(response.status).toBe(200)

      expect(claimWebhookEvent).toHaveBeenCalledWith(expect.objectContaining({
        subscription_id: 'sub_from_string',
        customer_id: 'cus_invoice_123'
      }))
    })

    it('handles subscription as expanded object', async () => {
      const evt = makeInvoiceEvent({ id: 'sub_from_expanded_obj', object: 'subscription' })
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(evt)
      vi.mocked(claimWebhookEvent).mockResolvedValue('process')
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_invoice_2')

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(evt), 't=123,v1=sig'))
      expect(response.status).toBe(200)

      expect(claimWebhookEvent).toHaveBeenCalledWith(expect.objectContaining({
        subscription_id: 'sub_from_expanded_obj',
        customer_id: 'cus_invoice_123'
      }))
    })

    it('handles missing or null subscription', async () => {
      const evt = makeInvoiceEvent(null)
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(evt)
      vi.mocked(claimWebhookEvent).mockResolvedValue('process')
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_invoice_3')

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(evt), 't=123,v1=sig'))
      expect(response.status).toBe(200)

      expect(claimWebhookEvent).toHaveBeenCalledWith(expect.objectContaining({
        subscription_id: null,
        customer_id: 'cus_invoice_123'
      }))
    })
  })

  // ─────────────────────────────────────────────────────────
  // Checkout Attempts Lifecycle & Concurrency Deduplication
  // ─────────────────────────────────────────────────────────
  describe('Checkout Attempt Lifecycle & Concurrency', () => {
    beforeEach(() => {
      vi.mocked(getAuthUser).mockResolvedValue({
        id: 'user_attempt_1',
        email: 'attempt1@promptpolish.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: ''
      })
      vi.mocked(getStripeCustomer).mockResolvedValue({
        user_id: 'user_attempt_1',
        stripe_customer_id: 'cus_attempt_1',
        created_at: '',
        updated_at: ''
      })
      mockStripeInstances.checkout.sessions.create.mockResolvedValue({ id: 'cs_attempt_123', url: 'https://checkout.stripe.com/pay/cs_attempt_123' })
    })

    it('blocks concurrent checkout requests when one is already in progress', async () => {
      // Simulate database claiming an in-progress attempt for a parallel request
      vi.mocked(claimCheckoutAttempt).mockResolvedValue({
        status: 'checkout_in_progress',
        attempt_id: 'attempt-in-progress-uuid',
        stripe_checkout_session_id: null
      })

      const response = await checkoutHandler()
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('checkout_in_progress')
      expect(mockStripeInstances.checkout.sessions.create).not.toHaveBeenCalled()
    })

    it('returns existing session URL if checkout attempt is ready', async () => {
      vi.mocked(claimCheckoutAttempt).mockResolvedValue({
        status: 'ready',
        attempt_id: 'attempt-ready-uuid',
        stripe_checkout_session_id: 'cs_existing_999'
      })

      mockStripeInstances.checkout.sessions.retrieve.mockResolvedValue({
        id: 'cs_existing_999',
        url: 'https://checkout.stripe.com/pay/cs_existing_999',
        status: 'open'
      })

      const response = await checkoutHandler()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_existing_999')
      expect(mockStripeInstances.checkout.sessions.create).not.toHaveBeenCalled()
      expect(mockStripeInstances.checkout.sessions.retrieve).toHaveBeenCalledWith('cs_existing_999')
    })

    it('permits creating a new session if the existing session has expired', async () => {
      vi.mocked(claimCheckoutAttempt)
        .mockResolvedValueOnce({
          status: 'ready',
          attempt_id: 'attempt-expired-uuid',
          stripe_checkout_session_id: 'cs_expired_888'
        })
        .mockResolvedValueOnce({
          status: 'create_new',
          attempt_id: 'attempt-fresh-uuid',
          stripe_checkout_session_id: null
        })

      mockStripeInstances.checkout.sessions.retrieve.mockResolvedValue({
        id: 'cs_expired_888',
        url: 'https://checkout.stripe.com/pay/cs_expired_888',
        status: 'expired'
      })

      const response = await checkoutHandler()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_attempt_123')
      expect(updateCheckoutAttemptStatus).toHaveBeenCalledWith({
        attempt_id: 'attempt-expired-uuid',
        status: 'expired'
      })
      expect(mockStripeInstances.checkout.sessions.create).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          idempotencyKey: 'checkout-session-attempt-fresh-uuid'
        })
      )
    })

    it('releases/fails the checkout attempt record in DB when Stripe session creation throws', async () => {
      vi.mocked(claimCheckoutAttempt).mockResolvedValue({
        status: 'create_new',
        attempt_id: 'attempt-fail-uuid',
        stripe_checkout_session_id: null
      })

      mockStripeInstances.checkout.sessions.create.mockRejectedValueOnce(new Error('Stripe price inactive'))

      const response = await checkoutHandler()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('internal_error')
      expect(updateCheckoutAttemptStatus).toHaveBeenLastCalledWith({
        attempt_id: 'attempt-fail-uuid',
        status: 'failed',
        failure_code: 'Stripe price inactive'
      })
    })

    it('active subscription prevents checkout attempt creation', async () => {
      // Setup active subscription
      vi.mocked(getSubscriptionByUserId).mockResolvedValue({
        id: 'sub_active_777',
        user_id: 'user_attempt_1',
        stripe_customer_id: 'cus_attempt_1',
        stripe_subscription_id: 'sub_active_777',
        stripe_price_id: 'price_pro_123',
        plan_slug: 'pro',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 86400000).toISOString(),
        cancel_at_period_end: false,
        last_event_created: null,
        last_event_id: null,
        created_at: '',
        updated_at: ''
      })

      const response = await checkoutHandler()
      const data = await response.json()

      // Should return portal redirect or block immediately without calling claimCheckoutAttempt
      expect(data.status).toBe('existing_subscription')
      expect(claimCheckoutAttempt).not.toHaveBeenCalled()
    })
  })

  describe('Required Corrective Webhook Handling Tests', () => {
    it('1. active payload + Stripe retrieve returns past_due -> persist past_due', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        id: 'evt_t1',
        data: {
          object: {
            id: 'sub_t1',
            customer: 'cus_t1',
            status: 'active',
            items: { data: [{ price: { id: 'price_1234_pro' } }] }
          }
        }
      }
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_t1')

      mockStripeInstances.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_t1',
        customer: 'cus_t1',
        status: 'past_due',
        current_period_start: 1700000000,
        current_period_end: 1703000000,
        cancel_at_period_end: false,
        items: { data: [{ price: { id: 'price_1234_pro' } }] }
      })

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(200)
      expect(saveSubscription).toHaveBeenCalledWith(expect.objectContaining({
        status: 'past_due',
        plan_slug: 'pro'
      }))
    })

    it('2. past_due payload + Stripe retrieve returns active -> persist active', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        id: 'evt_t2',
        data: {
          object: {
            id: 'sub_t2',
            customer: 'cus_t2',
            status: 'past_due',
            items: { data: [{ price: { id: 'price_1234_pro' } }] }
          }
        }
      }
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_t2')

      mockStripeInstances.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_t2',
        customer: 'cus_t2',
        status: 'active',
        current_period_start: 1700000000,
        current_period_end: 1703000000,
        cancel_at_period_end: false,
        items: { data: [{ price: { id: 'price_1234_pro' } }] }
      })

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(200)
      expect(saveSubscription).toHaveBeenCalledWith(expect.objectContaining({
        status: 'active',
        plan_slug: 'pro'
      }))
    })

    it('3. active payload + Stripe retrieve returns unpaid -> persist unpaid/free', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        id: 'evt_t3',
        data: {
          object: {
            id: 'sub_t3',
            customer: 'cus_t3',
            status: 'active',
            items: { data: [{ price: { id: 'price_1234_pro' } }] }
          }
        }
      }
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_t3')

      mockStripeInstances.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_t3',
        customer: 'cus_t3',
        status: 'unpaid',
        current_period_start: 1700000000,
        current_period_end: 1703000000,
        cancel_at_period_end: false,
        items: { data: [{ price: { id: 'price_1234_pro' } }] }
      })

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(200)
      expect(saveSubscription).toHaveBeenCalledWith(expect.objectContaining({
        status: 'unpaid',
        plan_slug: 'free'
      }))
    })

    it('4. unpaid payload + Stripe retrieve returns active -> persist active/Pro', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        id: 'evt_t4',
        data: {
          object: {
            id: 'sub_t4',
            customer: 'cus_t4',
            status: 'unpaid',
            items: { data: [{ price: { id: 'price_1234_pro' } }] }
          }
        }
      }
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_t4')

      mockStripeInstances.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_t4',
        customer: 'cus_t4',
        status: 'active',
        current_period_start: 1700000000,
        current_period_end: 1703000000,
        cancel_at_period_end: false,
        items: { data: [{ price: { id: 'price_1234_pro' } }] }
      })

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(200)
      expect(saveSubscription).toHaveBeenCalledWith(expect.objectContaining({
        status: 'active',
        plan_slug: 'pro'
      }))
    })

    it('5. created and updated share the same timestamp but different event IDs -> event-ID lexical order has no effect', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        id: 'evt_lexical_smaller',
        created: 1700000000,
        data: {
          object: {
            id: 'sub_lexical',
            customer: 'cus_lexical',
            status: 'active',
            items: { data: [{ price: { id: 'price_1234_pro' } }] }
          }
        }
      }
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_lexical')
      mockStripeInstances.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_lexical',
        customer: 'cus_lexical',
        status: 'active',
        current_period_start: 1700000000,
        current_period_end: 1703000000,
        cancel_at_period_end: false,
        items: { data: [{ price: { id: 'price_1234_pro' } }] }
      })

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(200)
      expect(saveSubscription).toHaveBeenCalledWith(expect.objectContaining({
        last_event_id: 'evt_lexical_smaller',
        last_event_created: new Date(1700000000 * 1000).toISOString()
      }))
    })

    it('6. deleted event followed by same-timestamp active update -> remains canceled/free', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        id: 'evt_active_same_time',
        created: 1700000000,
        data: {
          object: {
            id: 'sub_deleted_first',
            customer: 'cus_del',
            status: 'active',
            items: { data: [{ price: { id: 'price_1234_pro' } }] }
          }
        }
      }
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_del')
      mockStripeInstances.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_deleted_first',
        customer: 'cus_del',
        status: 'active',
        current_period_start: 1700000000,
        current_period_end: 1703000000,
        cancel_at_period_end: false,
        items: { data: [{ price: { id: 'price_1234_pro' } }] }
      })

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(200)
      expect(saveSubscription).toHaveBeenCalledWith(expect.objectContaining({
        last_event_id: 'evt_active_same_time',
        last_event_created: new Date(1700000000 * 1000).toISOString()
      }))
    })

    it('7. active update followed by same-timestamp deleted -> becomes canceled/free', async () => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        id: 'evt_del_same_time',
        created: 1700000000,
        data: {
          object: {
            id: 'sub_active_first',
            customer: 'cus_del',
            status: 'canceled',
            items: { data: [{ price: { id: 'price_1234_pro' } }] }
          }
        }
      }
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(200)
      expect(cancelSubscriptionInDatabase).toHaveBeenCalledWith(
        'sub_active_first',
        new Date(1700000000 * 1000).toISOString(),
        'evt_del_same_time'
      )
    })

    it('8. exact duplicate event ID remains idempotent', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        id: 'evt_duplicate_id',
        data: {
          object: {
            id: 'sub_dup',
            customer: 'cus_dup',
            status: 'active',
            items: { data: [{ price: { id: 'price_1234_pro' } }] }
          }
        }
      }
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_dup')
      mockStripeInstances.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_dup',
        customer: 'cus_dup',
        status: 'active',
        current_period_start: 1700000000,
        current_period_end: 1703000000,
        cancel_at_period_end: false,
        items: { data: [{ price: { id: 'price_1234_pro' } }] }
      })

      vi.mocked(claimWebhookEvent).mockResolvedValueOnce('process')
      const res1 = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(res1.status).toBe(200)

      vi.mocked(claimWebhookEvent).mockResolvedValueOnce('duplicate_success')
      const res2 = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(res2.status).toBe(200)
      const data2 = await res2.json()
      expect(data2.duplicate).toBe(true)
    })

    it('9. Stripe retrieve failure -> inbox failed_retryable and non-2xx', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        id: 'evt_retrieve_fail_api',
        data: {
          object: {
            id: 'sub_retrieve_fail_api',
            customer: 'cus_fail',
            status: 'active',
            items: { data: [{ price: { id: 'price_1234_pro' } }] }
          }
        }
      }
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_fail')

      const stripeError = new Error('Stripe API unavailable')
      Object.assign(stripeError, { type: 'StripeConnectionError', statusCode: 502 })
      mockStripeInstances.subscriptions.retrieve.mockRejectedValue(stripeError)

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(503)

      expect(updateWebhookEventStatus).toHaveBeenCalledWith(expect.objectContaining({
        event_id: 'evt_retrieve_fail_api',
        status: 'failed_retryable',
        failure_message: expect.stringContaining('Stripe retrieve failed')
      }))
    })

    it('10. Stripe retrieve returns missing/deleted subscription -> safe canceled/free behavior', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        id: 'evt_retrieve_missing_api',
        data: {
          object: {
            id: 'sub_missing_api',
            customer: 'cus_missing',
            status: 'active',
            items: { data: [{ price: { id: 'price_1234_pro' } }] }
          }
        }
      }
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_missing')

      const stripeError = new Error('No such subscription')
      Object.assign(stripeError, { code: 'resource_missing', statusCode: 404 })
      mockStripeInstances.subscriptions.retrieve.mockRejectedValue(stripeError)

      vi.mocked(cancelSubscriptionInDatabase).mockResolvedValue(true)

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(200)

      expect(cancelSubscriptionInDatabase).toHaveBeenCalledWith('sub_missing_api', expect.any(String), 'evt_retrieve_missing_api')
      expect(updateWebhookEventStatus).toHaveBeenCalledWith({
        event_id: 'evt_retrieve_missing_api',
        status: 'processed'
      })
    })

    it('11. returns 200 billing_disabled when STRIPE_ENABLED is false without calling signature check or database mutations', async () => {
      const originalStripeEnabled = process.env.STRIPE_ENABLED
      process.env.STRIPE_ENABLED = 'false'
      try {
        const response = await webhookHandler(makeRequestWithHeader('{}'))
        expect(response.status).toBe(200)
        const text = await response.text()
        expect(text).toBe('billing_disabled')

        // Assert that zero DB/Stripe side effects are called
        expect(claimWebhookEvent).not.toHaveBeenCalled()
        expect(saveSubscription).not.toHaveBeenCalled()
        expect(cancelSubscriptionInDatabase).not.toHaveBeenCalled()
        expect(updateWebhookEventStatus).not.toHaveBeenCalled()
      } finally {
        process.env.STRIPE_ENABLED = originalStripeEnabled
      }
    })

    it('12. returns 200 ignored for unsupported event type', async () => {
      const mockEvent = {
        type: 'charge.refunded',
        id: 'evt_unsupported_test',
        data: { object: {} }
      }
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.ignored).toBe(true)
      expect(updateWebhookEventStatus).toHaveBeenCalledWith({
        event_id: 'evt_unsupported_test',
        status: 'ignored'
      })
    })

    it('13. returns 500 retryable when saveSubscription throws error', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        id: 'evt_save_fail',
        data: {
          object: {
            id: 'sub_save_fail',
            customer: 'cus_save_fail',
            status: 'active',
            items: { data: [{ price: { id: 'price_1234_pro' } }] }
          }
        }
      }
      mockStripeInstances.webhooks.constructEvent.mockReturnValue(mockEvent)
      vi.mocked(getUserIdByStripeCustomerId).mockResolvedValue('user_save_fail')
      vi.mocked(saveSubscription).mockRejectedValueOnce(new Error('DB connection reset'))

      const response = await webhookHandler(makeRequestWithHeader(JSON.stringify(mockEvent), 't=123,v1=sig'))
      expect(response.status).toBe(500)
      const text = await response.text()
      expect(text).toBe('Webhook processing error')
      expect(updateWebhookEventStatus).toHaveBeenCalledWith({
        event_id: 'evt_save_fail',
        status: 'failed_retryable',
        failure_message: 'DB connection reset'
      })
    })

    it('14. returns 400 when body is malformed JSON', async () => {
      mockStripeInstances.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Unexpected token { in JSON at position 1')
      })

      const response = await webhookHandler(makeRequestWithHeader('{ malformed json }', 't=123,v1=sig'))
      expect(response.status).toBe(400)
      const text = await response.text()
      expect(text).toBe('Webhook signature verification failed')
    })
  })
})

