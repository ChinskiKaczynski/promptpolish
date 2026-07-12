import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthUser } from '@/lib/identity/auth'
import { getStripeCustomer } from '@/lib/supabase/billing'
import { checkProductionEnv } from '@/lib/env/server'
import { createUsageEvent } from '@/lib/supabase/queries'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { validateSameOrigin } from '@/lib/security/csrf'

export async function POST() {
  try {
    // CSRF Same-Origin validation
    if (!(await validateSameOrigin())) {
      return NextResponse.json({ error: 'CSRF validation failed.' }, { status: 403 })
    }

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

    // Check Stripe secret key
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const appUrl = process.env.APP_URL || 'http://localhost:3000'

    if (!stripeSecretKey) {
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
          message: 'Musisz być zalogowany, aby zarządzać rozliczeniami.'
        },
        { status: 401 }
      )
    }

    // Retrieve active Stripe customer mapping
    const customerRow = await getStripeCustomer(user.id)
    const stripeCustomerId = customerRow?.stripe_customer_id || null

    if (!stripeCustomerId) {
      return NextResponse.json(
        {
          error: 'no_customer_record',
          message: 'Nie znaleziono aktywnego rekordu płatności w profilu. Musisz najpierw aktywować subskrypcję.'
        },
        { status: 400 }
      )
    }

    // Initialize Stripe client
    const stripe = new Stripe(stripeSecretKey)

    // Create Customer Portal Session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/pricing`
    })

    if (!session.url) {
      throw new Error('Stripe failed to return a valid Billing Portal redirect URL.')
    }

    // Resolve owner anonymous id for telemetry
    const ownerAnonymousId = await getOwnerIdFromCookies()
    if (ownerAnonymousId) {
      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId,
        user_id: user.id,
        event_type: 'customer_portal_opened',
        metadata_json: {
          plan_slug: 'pro'
        }
      })
    }

    return NextResponse.json({ portalUrl: session.url })

  } catch (error) {
    console.error('[POST /api/billing/portal Error]:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie później.'
      },
      { status: 500 }
    )
  }
}
