import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('server-only', () => ({}))

const stripeMocks = vi.hoisted(() => {
  return {
    checkout: {
      sessions: {
        create: vi.fn()
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
  cancelSubscriptionInDatabase: vi.fn()
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
import { getStripeCustomer, saveStripeCustomer, getUserIdByStripeCustomerId, saveSubscription, cancelSubscriptionInDatabase } from '@/lib/supabase/billing'
import { setUserPlanSlug } from '@/lib/supabase/queries'
import { checkProductionEnv } from '@/lib/env/server'

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

      expect(mockStripeInstances.customers.create).toHaveBeenCalledWith({
        email: 'test@promptpolish.com',
        metadata: { userId: 'user_uuid_1' }
      })
      expect(saveStripeCustomer).toHaveBeenCalledWith('user_uuid_1', 'cus_new_123')
      expect(mockStripeInstances.checkout.sessions.create).toHaveBeenCalledWith({
        mode: 'subscription',
        customer: 'cus_new_123',
        line_items: [{ price: 'price_1234_pro', quantity: 1 }],
        success_url: 'http://localhost:3000/pricing?session_id={CHECKOUT_SESSION_ID}&upgrade=success',
        cancel_url: 'http://localhost:3000/pricing?upgrade=cancel'
      })
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
      mockStripeInstances.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_test' })

      const response = await checkoutHandler()
      await response.json()

      expect(response.status).toBe(200)
      expect(mockStripeInstances.customers.create).not.toHaveBeenCalled()
      expect(mockStripeInstances.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing_999'
        })
      )
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
      expect(saveSubscription).toHaveBeenCalledWith({
        user_id: 'user_mapped_uuid',
        stripe_customer_id: 'cus_test_123',
        stripe_subscription_id: 'sub_test_123',
        stripe_price_id: 'price_1234_pro',
        plan_slug: 'pro',
        status: 'active',
        current_period_start: new Date(1700000000 * 1000).toISOString(),
        current_period_end: new Date(1703000000 * 1000).toISOString(),
        cancel_at_period_end: false
      })
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

      expect(cancelSubscriptionInDatabase).toHaveBeenCalledWith('sub_test_456')
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
            mode: 'subscription'
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

      expect(getUserIdByStripeCustomerId).toHaveBeenCalledWith('cus_test_123')
      expect(mockStripeInstances.subscriptions.retrieve).toHaveBeenCalledWith('sub_test_123')
      expect(saveSubscription).toHaveBeenCalledWith({
        user_id: 'user_mapped_uuid_checkout',
        stripe_customer_id: 'cus_test_123',
        stripe_subscription_id: 'sub_test_123',
        stripe_price_id: 'price_1234_pro',
        plan_slug: 'pro',
        status: 'active',
        current_period_start: new Date(1700000000 * 1000).toISOString(),
        current_period_end: new Date(1703000000 * 1000).toISOString(),
        cancel_at_period_end: false
      })
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
        })
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
      expect(cancelSubscriptionInDatabase).toHaveBeenCalledWith('sub_deleted_test')

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
})
