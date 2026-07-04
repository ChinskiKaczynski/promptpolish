import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthUser } from '@/lib/identity/auth'
import { 
  getStripeCustomer, 
  saveStripeCustomer, 
  getSubscriptionByUserId,
  claimCheckoutAttempt,
  updateCheckoutAttemptStatus
} from '@/lib/supabase/billing'
import { checkProductionEnv } from '@/lib/env/server'
import { createUsageEvent } from '@/lib/supabase/queries'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'

export async function POST() {
  try {

    const stripeEnabled =
      process.env.STRIPE_ENABLED === 'true' &&
      !!process.env.STRIPE_SECRET_KEY &&
      !!process.env.STRIPE_PRICE_ID_PRO

    if (!stripeEnabled) {
      return NextResponse.json(
        {
          error: 'billing_disabled',
          message: 'Płatności Stripe są wyłączone w trybie beta.'
        },
        { status: 403 }
      )
    }

    // Ensure production environment is correctly configured
    const envCheck = checkProductionEnv()
    if (!envCheck.valid) {
      return NextResponse.json(
        {
          error: 'configuration_error',
          message: envCheck.error
        },
        { status: 500 }
      )
    }

    // Check Stripe keys are present
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const stripePriceId = process.env.STRIPE_PRICE_ID_PRO
    const appUrl = process.env.APP_URL || 'http://localhost:3000'

    if (!stripeSecretKey || !stripePriceId) {
      return NextResponse.json(
        {
          error: 'configuration_error',
          message: 'Stripe configuration keys are missing on the server.'
        },
        { status: 500 }
      )
    }

    // Enforce authentication
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Musisz być zalogowany, aby rozpocząć proces płatności.'
        },
        { status: 401 }
      )
    }

    // Initialize Stripe client
    const stripe = new Stripe(stripeSecretKey)

    // Resolve or initialize customer mapping on the fly
    const customerRow = await getStripeCustomer(user.id)
    let stripeCustomerId = customerRow?.stripe_customer_id || null
    let isStaleCustomer = false
    let newCustomerCreated = false
    const oldCustomerIdExisted = !!stripeCustomerId

    if (stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(stripeCustomerId)
        if ('deleted' in customer && customer.deleted) {
          isStaleCustomer = true
        }
      } catch (err: unknown) {
        const errorObj = err as { code?: string; statusCode?: number; status?: number; message?: string }
        const isResourceMissing = 
          errorObj.code === 'resource_missing' || 
          errorObj.statusCode === 404 || 
          errorObj.status === 404 || 
          (errorObj.message && errorObj.message.includes('No such customer'))
        
        if (isResourceMissing) {
          isStaleCustomer = true
        } else {
          throw err
        }
      }
    }

    if (isStaleCustomer) {
      stripeCustomerId = null
      console.log(`[Stripe Checkout] Stale customer detected: true. Old customer ID existed: ${oldCustomerIdExisted}.`)
    }

    // Detect existing active-equivalent subscription
    const existingSub = await getSubscriptionByUserId(user.id)
    if (existingSub) {
      const isTrialing = existingSub.status === 'trialing'
      const isPastDue = existingSub.status === 'past_due'
      const isCanceledFuture = existingSub.status === 'canceled' && existingSub.cancel_at_period_end && new Date(existingSub.current_period_end) > new Date()
      const isActive = existingSub.status === 'active'

      if (isActive || isTrialing || isPastDue || isCanceledFuture) {
        // Return existing-subscription/billing-portal flow
        if (stripeCustomerId) {
          try {
            const portalSession = await stripe.billingPortal.sessions.create({
              customer: stripeCustomerId,
              return_url: `${appUrl}/pricing`
            })
            return NextResponse.json({
              status: 'existing_subscription',
              portalUrl: portalSession.url
            })
          } catch (portalErr) {
            console.error('Failed to create portal session for existing subscription:', portalErr)
          }
        }
        return NextResponse.json(
          {
            error: 'active_subscription_exists',
            message: 'Posiadasz już aktywną subskrypcję. Możesz nią zarządzać w panelu klienta.'
          },
          { status: 400 }
        )
      }
    }

    if (!stripeCustomerId) {
      try {
        const customer = await stripe.customers.create({
          email: user.email || '',
          metadata: { userId: user.id }
        }, {
          idempotencyKey: `stripe-customer-creation-${user.id}-${isStaleCustomer ? Date.now() : 'initial'}`
        })
        stripeCustomerId = customer.id
        newCustomerCreated = true
        
        // Persist and verify customer mapping in the local database before starting checkout
        const saved = await saveStripeCustomer(user.id, stripeCustomerId)
        if (!saved) {
          throw new Error('Failed to save Stripe customer mapping to local database.')
        }
      } catch (err) {
        console.error('Failed to create or save Stripe customer:', err)
        return NextResponse.json(
          {
            error: 'stripe_error',
            message: 'Nie udało się zarejestrować klienta w systemie płatności.'
          },
          { status: 502 }
        )
      }
    }

    // Claim or retrieve a server-side checkout attempt to deduplicate Checkout Sessions
    const claimAttempt = await claimCheckoutAttempt({
      user_id: user.id,
      price_id: stripePriceId,
      stripe_customer_id: stripeCustomerId
    })

    if (!claimAttempt) {
      return NextResponse.json(
        {
          error: 'internal_error',
          message: 'Wystąpił błąd przy inicjowaniu płatności. Spróbuj ponownie.'
        },
        { status: 500 }
      )
    }

    if (claimAttempt.status === 'checkout_in_progress') {
      return NextResponse.json(
        {
          error: 'checkout_in_progress',
          message: 'Inna transakcja jest w toku. Spróbuj ponownie za chwilę.'
        },
        { status: 409 }
      )
    }

    if (claimAttempt.status === 'ready' && claimAttempt.stripe_checkout_session_id) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(claimAttempt.stripe_checkout_session_id)
        if (existingSession && existingSession.url && existingSession.status === 'open') {
          return NextResponse.json({ checkoutUrl: existingSession.url })
        } else {
          // If expired or completed on Stripe side, mark it appropriately in the DB and fall through
          await updateCheckoutAttemptStatus({
            attempt_id: claimAttempt.attempt_id,
            status: existingSession.status === 'complete' ? 'completed' : 'expired'
          })
        }
      } catch (err) {
        console.warn('Failed to retrieve existing session from Stripe, marking as expired:', err)
        await updateCheckoutAttemptStatus({
          attempt_id: claimAttempt.attempt_id,
          status: 'expired'
        })
      }
    }

    // Re-verify checkout status after potential status updates
    const finalClaim = claimAttempt.status === 'ready' ? await claimCheckoutAttempt({
      user_id: user.id,
      price_id: stripePriceId,
      stripe_customer_id: stripeCustomerId
    }) : claimAttempt;

    if (!finalClaim || finalClaim.status === 'checkout_in_progress') {
      return NextResponse.json(
        {
          error: 'checkout_in_progress',
          message: 'Inna transakcja jest w toku. Spróbuj ponownie za chwilę.'
        },
        { status: 409 }
      )
    }

    let session: Stripe.Checkout.Session
    let checkoutRetriedOnce = false

    const createSessionHelper = async (customerIdToUse: string) => {
      const sessionOpts: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        customer: customerIdToUse,
        client_reference_id: user.id,
        metadata: {
          user_id: user.id,
          plan_slug: 'pro'
        },
        subscription_data: {
          metadata: {
            user_id: user.id,
            plan_slug: 'pro'
          }
        },
        line_items: [
          {
            price: stripePriceId,
            quantity: 1
          }
        ],
        success_url: `${appUrl}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/pricing?upgrade=cancel`
      }

      return await stripe.checkout.sessions.create(sessionOpts, {
        idempotencyKey: `checkout-session-${finalClaim.attempt_id}${checkoutRetriedOnce ? '-retry' : ''}`
      })
    }

    try {
      try {
        session = await createSessionHelper(stripeCustomerId)
      } catch (err: unknown) {
        const errorObj = err as { code?: string; statusCode?: number; status?: number; message?: string; param?: string }
        const isCustomerMissing = 
          errorObj.code === 'resource_missing' || 
          errorObj.statusCode === 404 || 
          (errorObj.message && errorObj.message.includes('No such customer')) ||
          errorObj.param === 'customer'

        if (isCustomerMissing && !checkoutRetriedOnce) {
          checkoutRetriedOnce = true
          isStaleCustomer = true
          console.warn(`[Stripe Checkout] Session creation failed for customer ${stripeCustomerId} (resource_missing). Recreating customer and retrying.`)

          const customer = await stripe.customers.create({
            email: user.email || '',
            metadata: { userId: user.id }
          }, {
            idempotencyKey: `stripe-customer-creation-retry-${user.id}-${Date.now()}`
          })
          stripeCustomerId = customer.id
          newCustomerCreated = true

          const saved = await saveStripeCustomer(user.id, stripeCustomerId)
          if (!saved) {
            throw new Error('Failed to save Stripe customer mapping to local database on retry.')
          }

          // Retry session creation once
          session = await createSessionHelper(stripeCustomerId)
        } else {
          throw err
        }
      }

      if (!session.url) {
        throw new Error('Stripe failed to return a valid Checkout redirect URL.')
      }

      // Mark the attempt as ready
      await updateCheckoutAttemptStatus({
        attempt_id: finalClaim.attempt_id,
        status: 'ready',
        session_id: session.id
      })

      console.log(`[Stripe Checkout] Session created successfully. Details: ` +
        `staleCustomerDetected=${isStaleCustomer}, ` +
        `oldCustomerIdExisted=${oldCustomerIdExisted}, ` +
        `newCustomerCreated=${newCustomerCreated}, ` +
        `checkoutRetriedOnce=${checkoutRetriedOnce}`)

    } catch (err: unknown) {
      // Release or fail the attempt in DB so user can retry
      await updateCheckoutAttemptStatus({
        attempt_id: finalClaim.attempt_id,
        status: 'failed',
        failure_code: err instanceof Error ? err.message : String(err)
      })

      console.error(`[Stripe Checkout] Session creation failed terminally. Details: ` +
        `staleCustomerDetected=${isStaleCustomer}, ` +
        `oldCustomerIdExisted=${oldCustomerIdExisted}, ` +
        `newCustomerCreated=${newCustomerCreated}, ` +
        `checkoutRetriedOnce=${checkoutRetriedOnce}`, err)

      throw err
    }

    // Resolve owner anonymous id for telemetry
    const ownerAnonymousId = await getOwnerIdFromCookies()
    if (ownerAnonymousId) {
      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId,
        user_id: user.id,
        event_type: 'checkout_started',
        metadata_json: {
          plan_slug: 'pro'
        }
      })
    }

    return NextResponse.json({ checkoutUrl: session.url })

  } catch (error: unknown) {
    console.error('[POST /api/billing/checkout Error]:', error)
    const errorObj = error as { type?: string; raw?: { type?: string }; statusCode?: number }
    const isStripeError = errorObj && (errorObj.type?.startsWith('Stripe') || errorObj.raw?.type?.startsWith('Stripe') || typeof errorObj.statusCode === 'number')
    return NextResponse.json(
      {
        error: isStripeError ? 'stripe_error' : 'internal_error',
        message: isStripeError 
          ? 'Nie udało się rozpocząć płatności w Stripe. Spróbuj ponownie za chwilę.' 
          : 'Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie później.'
      },
      { status: isStripeError ? 502 : 500 }
    )
  }
}
