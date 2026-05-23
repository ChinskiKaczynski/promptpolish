import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getUserIdByStripeCustomerId, saveStripeCustomer, saveSubscription, cancelSubscriptionInDatabase } from '@/lib/supabase/billing'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'


export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const stripePriceIdPro = process.env.STRIPE_PRICE_ID_PRO

  if (!stripeSecretKey || !webhookSecret) {
    console.error('Stripe secret or webhook key is unconfigured on server.')
    return new NextResponse('Server configuration error', { status: 500 })
  }

  // Retrieve raw body and stripe-signature header
  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('Missing stripe-signature header in webhook call.')
    return new NextResponse('Missing signature header', { status: 400 })
  }

  // Initialize Stripe client
  const stripe = new Stripe(stripeSecretKey)

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error(`Webhook signature verification failed: ${errorMessage}`)
    return new NextResponse('Webhook signature verification failed', { status: 400 })
  }

  const eventType = event.type
  console.log(`Received Stripe Webhook Event: ${eventType} (ID: ${event.id})`)

  try {
    switch (eventType) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const stripeCustomerId = subscription.customer as string
        const stripeSubscriptionId = subscription.id
        const stripePriceId = subscription.items.data[0]?.price.id || ''

        // Resolve local user_id associated with customer ID
        let userId = await getUserIdByStripeCustomerId(stripeCustomerId)

        if (!userId) {
          // Defensive fallback: Retrieve customer from Stripe to find email
          try {
            const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId)
            const email = 'email' in stripeCustomer ? stripeCustomer.email : null
            if (email) {
              const supabase = getSupabaseAdminClient()
              const { data } = await supabase
                .from('user_profiles')
                .select('user_id')
                .eq('email', email)
                .maybeSingle()

              if (data) {
                userId = (data as { user_id: string }).user_id
                await saveStripeCustomer(userId, stripeCustomerId)
                console.log(`Fallback resolved customer for email: ${email} -> user_id: ${userId}`)
              }
            }
          } catch (err) {
            console.error('Fallback customer resolution crashed:', err)
          }
        }

        if (!userId) {
          console.warn(`Webhook received for unmapped customer ID ${stripeCustomerId}. Acknowledging event with 200 OK.`);
          break
        }

        // Entitlement mapping: Only price IDs matching allowlisted STRIPE_PRICE_ID_PRO unlock Pro
        const planSlug = stripePriceId === stripePriceIdPro ? 'pro' : 'free'

        const subscriptionRaw = subscription as unknown as {
          current_period_start: number
          current_period_end: number
        }

        await saveSubscription({
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_price_id: stripePriceId,
          plan_slug: planSlug,
          status: subscription.status,
          current_period_start: new Date(subscriptionRaw.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscriptionRaw.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end
        })

        console.log(`Successfully synced subscription status ${subscription.status} for user_id ${userId}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const stripeSubscriptionId = subscription.id

        await cancelSubscriptionInDatabase(stripeSubscriptionId)
        console.log(`Successfully processed deleted subscription: ${stripeSubscriptionId}`)
        break
      }

      default:
        console.log(`Unhandled webhook event type: ${eventType}`)
    }

    return new NextResponse(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error(`Error processing webhook event (${eventType}):`, error)
    return new NextResponse('Webhook processing error', { status: 500 })
  }
}
