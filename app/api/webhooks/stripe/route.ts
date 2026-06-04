import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getUserIdByStripeCustomerId, saveSubscription, cancelSubscriptionInDatabase } from '@/lib/supabase/billing'
import { recordStripeWebhookFailure } from '@/lib/monitoring/observability'
import { createUsageEvent } from '@/lib/supabase/queries'


export async function POST(request: Request) {
  if (process.env.STRIPE_ENABLED !== 'true') {
    return new NextResponse('Stripe webhook disabled', { status: 200 })
  }

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
    recordStripeWebhookFailure('signature_verification', err)
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error(`Webhook signature verification failed: ${errorMessage}`)
    return new NextResponse('Webhook signature verification failed', { status: 400 })
  }

  const eventType = event.type
  console.log(`Received Stripe Webhook Event: ${eventType} (ID: ${event.id})`)

  try {
    switch (eventType) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null
        const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : null

        if (!stripeCustomerId) {
          console.warn('[Stripe Webhook] checkout.session.completed missing customer ID. Acknowledging with 200 OK.');
          break
        }

        if (session.mode === 'subscription' && !stripeSubscriptionId) {
          console.warn('[Stripe Webhook] checkout.session.completed missing subscription ID for subscription mode. Acknowledging with 200 OK.');
          break
        }

        const userId = await getUserIdByStripeCustomerId(stripeCustomerId)

        if (!userId) {
          console.warn('[Stripe Webhook] Webhook received for unmapped customer ID during checkout.session.completed. Acknowledging event with 200 OK.');
          break
        }

        if (stripeSubscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
            const stripePriceId = subscription.items.data[0]?.price.id || ''
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

            // Telemetry: Log checkout success states with tightened privacy
            if (subscription.status === 'active') {
              await createUsageEvent({
                owner_anonymous_id: 'stripe_webhook',
                user_id: userId,
                event_type: 'subscription_activated',
                metadata_json: {
                  plan_slug: planSlug,
                  status: subscription.status
                }
              })
              await createUsageEvent({
                owner_anonymous_id: 'stripe_webhook',
                user_id: userId,
                event_type: 'checkout_completed',
                metadata_json: {
                  plan_slug: planSlug,
                  status: subscription.status
                }
              })
            }
            console.log(`Successfully synced subscription status ${subscription.status} for user_id ${userId} from checkout.session.completed`)
          } catch (err) {
            console.error('Failed to retrieve subscription during checkout session completion:', err)
          }
        } else {
          // Log checkout completed event without subscription metadata if non-subscription session mode
          await createUsageEvent({
            owner_anonymous_id: 'stripe_webhook',
            user_id: userId,
            event_type: 'checkout_completed',
            metadata_json: {
              plan_slug: 'free',
              status: 'completed'
            }
          })
          console.log(`Checkout session completed without subscription for user_id ${userId}`)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const stripeCustomerId = subscription.customer as string
        const stripeSubscriptionId = subscription.id
        const stripePriceId = subscription.items.data[0]?.price.id || ''

        // Resolve local user_id associated with customer ID
        const userId = await getUserIdByStripeCustomerId(stripeCustomerId)

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

        // Telemetry: Log subscription/checkout success states with tightened privacy
        if (subscription.status === 'active') {
          await createUsageEvent({
            owner_anonymous_id: 'stripe_webhook',
            user_id: userId,
            event_type: 'subscription_activated',
            metadata_json: {
              plan_slug: planSlug,
              status: subscription.status
            }
          })
          await createUsageEvent({
            owner_anonymous_id: 'stripe_webhook',
            user_id: userId,
            event_type: 'checkout_completed',
            metadata_json: {
              plan_slug: planSlug,
              status: subscription.status
            }
          })
        } else if (subscription.status === 'past_due') {
          await createUsageEvent({
            owner_anonymous_id: 'stripe_webhook',
            user_id: userId,
            event_type: 'subscription_past_due',
            metadata_json: {
              plan_slug: planSlug,
              status: subscription.status
            }
          })
        }

        console.log(`Successfully synced subscription status ${subscription.status} for user_id ${userId}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const stripeSubscriptionId = subscription.id
        const stripeCustomerId = subscription.customer as string

        const userId = await getUserIdByStripeCustomerId(stripeCustomerId)

        await cancelSubscriptionInDatabase(stripeSubscriptionId)
        console.log(`Successfully processed deleted subscription: ${stripeSubscriptionId}`)

        // Telemetry: Log subscription_canceled event with tightened privacy
        await createUsageEvent({
          owner_anonymous_id: 'stripe_webhook',
          user_id: userId || null,
          event_type: 'subscription_canceled',
          metadata_json: {
            plan_slug: 'free',
            status: 'canceled'
          }
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const stripeCustomerId = invoice.customer as string
        const userId = await getUserIdByStripeCustomerId(stripeCustomerId)

        // Telemetry: Log checkout_failed event with tightened privacy
        await createUsageEvent({
          owner_anonymous_id: 'stripe_webhook',
          user_id: userId || null,
          event_type: 'checkout_failed',
          metadata_json: {
            plan_slug: 'pro',
            status: 'unpaid'
          }
        })
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
    recordStripeWebhookFailure(eventType, error)
    console.error(`Error processing webhook event (${eventType}):`, error)
    return new NextResponse('Webhook processing error', { status: 500 })
  }
}
