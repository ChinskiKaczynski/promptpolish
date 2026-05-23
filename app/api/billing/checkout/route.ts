import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthUser } from '@/lib/identity/auth'
import { getStripeCustomer, saveStripeCustomer } from '@/lib/supabase/billing'
import { checkProductionEnv } from '@/lib/env/server'

export async function POST() {
  try {
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

    if (!stripeCustomerId) {
      try {
        const customer = await stripe.customers.create({
          email: user.email || '',
          metadata: { userId: user.id }
        })
        stripeCustomerId = customer.id
        await saveStripeCustomer(user.id, stripeCustomerId)
      } catch (err) {
        console.error('Failed to create Stripe customer:', err)
        return NextResponse.json(
          {
            error: 'stripe_error',
            message: 'Nie udało się zarejestrować klienta w systemie płatności.'
          },
          { status: 502 }
        )
      }
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1
        }
      ],
      success_url: `${appUrl}/pricing?session_id={CHECKOUT_SESSION_ID}&upgrade=success`,
      cancel_url: `${appUrl}/pricing?upgrade=cancel`
    })

    if (!session.url) {
      throw new Error('Stripe failed to return a valid Checkout redirect URL.')
    }

    return NextResponse.json({ checkoutUrl: session.url })

  } catch (error) {
    console.error('[POST /api/billing/checkout Error]:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie później.'
      },
      { status: 500 }
    )
  }
}
