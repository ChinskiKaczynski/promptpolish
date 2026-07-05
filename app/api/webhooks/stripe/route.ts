import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import {
  getUserIdByStripeCustomerId,
  saveSubscription,
  cancelSubscriptionInDatabase,
  claimWebhookEvent,
  updateWebhookEventStatus,
  completeCheckoutAttempt,
  saveStripeCustomer,
  extractSubscriptionData
} from '@/lib/supabase/billing'
import { recordStripeWebhookFailure } from '@/lib/monitoring/observability'

export async function POST(request: Request) {
  const stripeEnabled =
    process.env.STRIPE_ENABLED === 'true' &&
    !!process.env.STRIPE_SECRET_KEY &&
    !!process.env.STRIPE_PRICE_ID_PRO

  if (!stripeEnabled) {
    // Billing is intentionally disabled in this environment.
    // Acknowledge the event with 200 OK so Stripe does not repeatedly retry the webhook,
    // but discard it immediately without performing any signature verification, DB mutations, or logging.
    return new NextResponse('billing_disabled', { status: 200 })
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const stripePriceIdPro = process.env.STRIPE_PRICE_ID_PRO || ''

  if (!stripeSecretKey || !webhookSecret || !stripePriceIdPro) {
    console.error('Stripe secret, webhook key, or Pro Price ID is unconfigured on server.')
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

  const eventId = event.id
  const eventType = event.type
  const stripeCreated = new Date((event.created || Math.floor(Date.now() / 1000)) * 1000).toISOString()

  // Extract customer and subscription IDs depending on the event type
  let customerId: string | null = null
  let subscriptionId: string | null = null

  if (eventType === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    customerId = typeof session.customer === 'string' ? session.customer : null
    subscriptionId = typeof session.subscription === 'string' ? session.subscription : null
  } else if (eventType.startsWith('customer.subscription.')) {
    const subscription = event.data.object as Stripe.Subscription
    customerId = typeof subscription.customer === 'string' ? subscription.customer : null
    subscriptionId = subscription.id
  } else if (eventType === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
    customerId = typeof invoice.customer === 'string' ? invoice.customer : null
    if (typeof invoice.subscription === 'string') {
      subscriptionId = invoice.subscription
    } else if (invoice.subscription && typeof invoice.subscription === 'object' && 'id' in invoice.subscription) {
      subscriptionId = invoice.subscription.id
    } else {
      subscriptionId = null
    }
  }

  console.log(`[Stripe Webhook] Received event: eventId=${eventId}, eventType=${eventType}, customerId=${customerId}, subscriptionId=${subscriptionId}`)

  try {
    // Atomically claim the event in the webhook inbox
    const claimResult = await claimWebhookEvent({
      event_id: eventId,
      event_type: eventType,
      stripe_created: stripeCreated,
      customer_id: customerId,
      subscription_id: subscriptionId
    })

    if (claimResult === 'duplicate_success') {
      console.log(`[Stripe Webhook] Duplicate delivery of already processed event: ${eventId}`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    if (claimResult === 'processing') {
      console.log(`[Stripe Webhook] Event is currently being processed by another worker: ${eventId}`)
      return new NextResponse('Event is currently being processed', { status: 409 })
    }

    if (claimResult === 'unknown') {
      console.error(`[Stripe Webhook] Failed to claim event in database: ${eventId}`)
      return new NextResponse('Database claim error', { status: 500 })
    }

    // Define list of supported events
    const supportedEvents = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_failed'
    ]

    if (!supportedEvents.includes(eventType)) {
      console.log(`[Stripe Webhook] Unsupported event type ignored: ${eventType}`)
      await updateWebhookEventStatus({ event_id: eventId, status: 'ignored' })
      return NextResponse.json({ received: true, ignored: true })
    }
    let hasUserId = false
    let customerUpsertSuccess = false
    let subscriptionUpsertSuccess = false
    let resolvedPlanSlug = 'free'
    let resolvedStatus = 'inactive'

    switch (eventType) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id || session.client_reference_id || null

        console.log(`[Stripe Webhook] processing checkout.session.completed: eventId=${eventId}, customerId=${customerId}, subscriptionId=${subscriptionId}, userIdFound=${!!userId}`)

        if (!userId) {
          console.warn(`[Stripe Webhook] checkout.session.completed event ${eventId} is missing user_id in metadata and client_reference_id. customer: ${customerId}, subscription: ${subscriptionId}`)
          await updateWebhookEventStatus({
            event_id: eventId,
            status: 'failed_terminal',
            failure_message: 'Missing user_id in checkout session metadata and client_reference_id.'
          })
          return NextResponse.json({ received: true, error: 'missing_user_id' })
        }

        if (!customerId) {
          console.warn(`[Stripe Webhook] checkout.session.completed event ${eventId} missing customer ID.`);
          await updateWebhookEventStatus({
            event_id: eventId,
            status: 'failed_terminal',
            failure_message: 'Missing customer ID in checkout session.'
          })
          return new NextResponse('Missing customer ID', { status: 400 })
        }

        if (!subscriptionId) {
          console.warn(`[Stripe Webhook] checkout.session.completed event ${eventId} missing subscription ID.`);
          await updateWebhookEventStatus({
            event_id: eventId,
            status: 'failed_terminal',
            failure_message: 'Missing subscription ID in checkout session.'
          })
          return new NextResponse('Missing subscription ID', { status: 400 })
        }

        // Upsert stripe_customers mapping
        const customerUpsert = await saveStripeCustomer(userId, customerId)
        const customerUpsertSuccessVar = !!customerUpsert
        console.log(`[Stripe Webhook] saveStripeCustomer upsert completed: success=${customerUpsertSuccessVar}, userId=${userId}, customerId=${customerId}`)

        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['items.data.price']
        })

        const extracted = extractSubscriptionData(subscription, userId, stripePriceIdPro)

        const saved = await saveSubscription({
          ...extracted,
          last_event_created: stripeCreated,
          last_event_id: eventId
        })

        const saveSubscriptionSuccess = !!saved
        console.log(`[Stripe Webhook] saveSubscription completed: success=${saveSubscriptionSuccess}, userId=${userId}, subscriptionId=${subscriptionId}`)

        if (!saved) {
          throw new Error('Database write failed inside saveSubscription.')
        }

        hasUserId = !!userId
        customerUpsertSuccess = customerUpsertSuccessVar
        subscriptionUpsertSuccess = saveSubscriptionSuccess
        resolvedPlanSlug = extracted.plan_slug
        resolvedStatus = subscription.status

        // Mark checkout attempt completed
        await completeCheckoutAttempt(session.id)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        if (!subscriptionId) {
          await updateWebhookEventStatus({
            event_id: eventId,
            status: 'failed_terminal',
            failure_message: 'Missing subscription ID in subscription event.'
          })
          return new NextResponse('Missing subscription ID', { status: 400 })
        }

        if (!customerId) {
          await updateWebhookEventStatus({
            event_id: eventId,
            status: 'failed_terminal',
            failure_message: 'Missing customer ID in subscription event.'
          })
          return new NextResponse('Missing customer ID', { status: 400 })
        }

        // Try to map by stripe_customer_id in stripe_customers
        let userId = await getUserIdByStripeCustomerId(customerId)

        // Retrieve current subscription object from Stripe using stripe.subscriptions.retrieve
        let subscription: Stripe.Subscription
        try {
          subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['items.data.price']
          })
        } catch (err: unknown) {
          const errorObj = err as {
            code?: string
            statusCode?: number
            status?: number
            message?: string
            type?: string
            rawType?: string
          }

          const isResourceMissing = 
            errorObj.code === 'resource_missing' || 
            errorObj.statusCode === 404 || 
            errorObj.status === 404 || 
            (errorObj.message && errorObj.message.includes('No such subscription'))

          if (isResourceMissing) {
            console.log(`[Stripe Webhook] Subscription ${subscriptionId} missing on Stripe, handling as canceled.`);
            const ok = await cancelSubscriptionInDatabase(subscriptionId, stripeCreated, eventId)
            const cancelSuccess = !!ok
            console.log(`[Stripe Webhook] cancelSubscriptionInDatabase completed: success=${cancelSuccess}, subscriptionId=${subscriptionId}`)
            if (!ok) {
              throw new Error('Database write failed inside cancelSubscriptionInDatabase for missing resource.')
            }

            hasUserId = false
            customerUpsertSuccess = false
            subscriptionUpsertSuccess = cancelSuccess
            resolvedPlanSlug = 'free'
            resolvedStatus = 'canceled'

            await updateWebhookEventStatus({ event_id: eventId, status: 'processed' })

            console.log(`[Stripe Webhook Logs] Processing finished successfully: ` +
              `eventType=${eventType}, ` +
              `eventId=${eventId}, ` +
              `hasUserId=${hasUserId}, ` +
              `customerId=${customerId || 'none'}, ` +
              `subscriptionId=${subscriptionId || 'none'}, ` +
              `customerUpsertSuccess=${customerUpsertSuccess}, ` +
              `subscriptionUpsertSuccess=${subscriptionUpsertSuccess}, ` +
              `resolvedPlanSlug=${resolvedPlanSlug}, ` +
              `resolvedStatus=${resolvedStatus}`
            )
            return NextResponse.json({ received: true })
          } else {
            const errorCategory = errorObj.type || errorObj.rawType || 'StripeRetrievalError'
            console.error(`[Stripe Webhook] Failed to retrieve subscription ${subscriptionId} for event ${eventId}. Error category: ${errorCategory}`);
            await updateWebhookEventStatus({
              event_id: eventId,
              status: 'failed_retryable',
              failure_message: `Stripe retrieve failed: ${errorObj.message || String(err)}`
            })
            return new NextResponse('Stripe retrieval failed, retry scheduled', { status: 503 })
          }
        }

        // If mapping does not exist, use subscription.metadata.user_id if available
        if (!userId) {
          userId = (subscription.metadata?.user_id as string) || null
          if (userId) {
            const customerUpsert = await saveStripeCustomer(userId, customerId)
            customerUpsertSuccess = !!customerUpsert
          }
        } else {
          customerUpsertSuccess = true
        }

        console.log(`[Stripe Webhook] processing subscription event (${eventType}): eventId=${eventId}, customerId=${customerId}, subscriptionId=${subscriptionId}, userIdFound=${!!userId}`)

        if (!userId) {
          console.warn(`[Stripe Webhook] Unmapped customer ID ${customerId} in subscription event and no user_id in metadata. Skipping permanent entitlement grant/drop.`);
          await updateWebhookEventStatus({
            event_id: eventId,
            status: 'failed_retryable',
            failure_message: 'Unmapped customer ID and missing user_id in subscription metadata.'
          })
          return new NextResponse('Unmapped customer ID and missing user_id in metadata', { status: 502 })
        }

        const extracted = extractSubscriptionData(subscription, userId, stripePriceIdPro)

        const saved = await saveSubscription({
          ...extracted,
          last_event_created: stripeCreated,
          last_event_id: eventId
        })

        const saveSuccess = !!saved
        console.log(`[Stripe Webhook] saveSubscription completed: success=${saveSuccess}, userId=${userId}, subscriptionId=${subscriptionId}`)

        if (!saved) {
          throw new Error('Database write failed inside saveSubscription.')
        }

        hasUserId = !!userId
        subscriptionUpsertSuccess = saveSuccess
        resolvedPlanSlug = extracted.plan_slug
        resolvedStatus = subscription.status
        break
      }

      case 'customer.subscription.deleted': {
        if (!subscriptionId) {
          await updateWebhookEventStatus({
            event_id: eventId,
            status: 'failed_terminal',
            failure_message: 'Missing subscription ID.'
          })
          return new NextResponse('Missing subscription ID', { status: 400 })
        }

        if (!customerId) {
          await updateWebhookEventStatus({
            event_id: eventId,
            status: 'failed_terminal',
            failure_message: 'Missing customer ID.'
          })
          return new NextResponse('Missing customer ID', { status: 400 })
        }

        const subscription = event.data.object as Stripe.Subscription

        // Resolve user ID by customer ID or fallback to metadata
        let userId = await getUserIdByStripeCustomerId(customerId)
        if (!userId) {
          userId = (subscription.metadata?.user_id as string) || null
        }

        if (!userId) {
          console.warn(`[Stripe Webhook] Unmapped customer ID ${customerId} in subscription deletion event and no user_id in metadata.`);
          await updateWebhookEventStatus({
            event_id: eventId,
            status: 'failed_retryable',
            failure_message: 'Unmapped customer ID and missing user_id in subscription metadata.'
          })
          return new NextResponse('Unmapped customer ID and missing user_id in metadata', { status: 502 })
        }

        const extracted = extractSubscriptionData(subscription, userId, stripePriceIdPro)

        const saved = await saveSubscription({
          ...extracted,
          last_event_created: stripeCreated,
          last_event_id: eventId
        })

        const saveSuccess = !!saved
        console.log(`[Stripe Webhook] customer.subscription.deleted saveSubscription completed: success=${saveSuccess}, userId=${userId}, subscriptionId=${subscriptionId}`)

        if (!saved) {
          throw new Error('Database write failed inside saveSubscription.')
        }

        hasUserId = true
        customerUpsertSuccess = false
        subscriptionUpsertSuccess = saveSuccess
        resolvedPlanSlug = 'free'
        resolvedStatus = subscription.status
        break
      }

      case 'invoice.payment_failed': {
        break
      }
    }

    // Mark event processed successfully
    await updateWebhookEventStatus({ event_id: eventId, status: 'processed' })

    console.log(`[Stripe Webhook Logs] Processing finished successfully: ` +
      `eventType=${eventType}, ` +
      `eventId=${eventId}, ` +
      `hasUserId=${hasUserId}, ` +
      `customerId=${customerId || 'none'}, ` +
      `subscriptionId=${subscriptionId || 'none'}, ` +
      `customerUpsertSuccess=${customerUpsertSuccess}, ` +
      `subscriptionUpsertSuccess=${subscriptionUpsertSuccess}, ` +
      `resolvedPlanSlug=${resolvedPlanSlug}, ` +
      `resolvedStatus=${resolvedStatus}`
    )

    return NextResponse.json({ received: true })

  } catch (error) {
    recordStripeWebhookFailure(eventType, error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`Error processing webhook event (${eventType}):`, errorMsg)

    const isStale = error && typeof error === 'object' && 'code' in error && error.code === 'STALE_EVENT'

    try {
      await updateWebhookEventStatus({
        event_id: eventId,
        status: isStale ? 'ignored' : 'failed_retryable',
        failure_message: errorMsg
      })
    } catch (statusErr) {
      console.error('Failed to update webhook event status in database:', statusErr)
    }

    if (isStale) {
      // Stale updates are ignored/skipped successfully, so return 200 to Stripe
      return NextResponse.json({ received: true, ignored: true, reason: 'stale' })
    }

    return new NextResponse('Webhook processing error', { status: 500 })
  }
}
