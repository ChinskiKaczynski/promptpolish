import 'server-only'
import type Stripe from 'stripe'
import { getSupabaseAdminClient } from './admin'
import { getUserProfile, setUserPlanSlug } from './queries'
import type { StripeCustomerRow, SubscriptionRow } from './types'
import { serializeDbError } from './error-serializer'

/**
 * Fetches the Stripe customer mapping for a user.
 */
export async function getStripeCustomer(
  userId: string,
): Promise<StripeCustomerRow | null> {
  if (process.env.STRIPE_ENABLED !== 'true') {
    return null
  }

  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from('stripe_customers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching Stripe customer:', serializeDbError(error))
    return null
  }

  return data ? (data as unknown as StripeCustomerRow) : null
}

/**
 * Saves a Stripe customer mapping for a user.
 * Bypasses RLS writes using the admin client.
 */
export async function saveStripeCustomer(
  userId: string,
  stripeCustomerId: string,
  customerIdempotencyKey?: string,
): Promise<StripeCustomerRow | null> {
  if (process.env.STRIPE_ENABLED !== 'true') {
    return null
  }

  const rawSupabase = getSupabaseAdminClient()
  const supabase = rawSupabase as unknown as {
    from: (table: string) => {
      upsert: (values: Record<string, unknown>, options?: { onConflict?: string }) => {
        select: () => {
          single: () => Promise<{ data: StripeCustomerRow | null; error: { message: string } | null }>
        }
      }
    }
  }

  const { data, error } = await supabase
    .from('stripe_customers')
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        customer_idempotency_key: customerIdempotencyKey || userId,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      },
    )
    .select()
    .single()

  if (error) {
    console.error('Error saving Stripe customer mapping:', serializeDbError(error))
    return null
  }

  return data ? (data as unknown as StripeCustomerRow) : null
}

/**
 * Maps a Stripe customer ID back to a Supabase user ID.
 */
export async function getUserIdByStripeCustomerId(
  stripeCustomerId: string,
): Promise<string | null> {
  if (process.env.STRIPE_ENABLED !== 'true') {
    return null
  }

  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle()

  if (error) {
    console.error('Error matching Stripe customer ID to user ID:', serializeDbError(error))
    return null
  }

  return data ? (data as { user_id: string }).user_id : null
}

/**
 * Fetches the subscription row for a user.
 */
export async function getSubscriptionByUserId(
  userId: string,
): Promise<SubscriptionRow | null> {
  if (process.env.STRIPE_ENABLED !== 'true') {
    return null
  }

  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching subscription by user ID:', serializeDbError(error))
    return null
  }

  return data ? (data as unknown as SubscriptionRow) : null
}

export class StaleEventError extends Error {
  code = 'STALE_EVENT'
  constructor(message: string) {
    super(message)
    this.name = 'StaleEventError'
  }
}

/**
 * Centralized helper to extract subscription details from a Stripe Subscription object.
 */
export function extractSubscriptionData(
  subscription: Stripe.Subscription,
  userId: string,
  proPriceId: string
) {
  const stripeSubscriptionId = subscription.id
  const stripeCustomerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id

  const stripePriceId = subscription.items?.data?.[0]?.price?.id || ''
  const isProPrice = stripePriceId === proPriceId
  const isActiveStatus = ['active', 'trialing', 'past_due'].includes(subscription.status) && !subscription.ended_at
  const planSlug = (isProPrice && isActiveStatus) ? 'pro' : 'free'
  const status = subscription.status

  const subRaw = subscription as unknown as Record<string, unknown>

  // Fallback order for current_period_start
  let currentPeriodStartRaw: number | null | undefined = subRaw.current_period_start as number | undefined
  if (currentPeriodStartRaw === undefined || currentPeriodStartRaw === null) {
    const item = subscription.items?.data?.[0] as unknown as Record<string, unknown> | undefined
    currentPeriodStartRaw = item?.current_period_start as number | undefined
  }

  // Fallback order for current_period_end
  let currentPeriodEndRaw: number | null | undefined = subRaw.current_period_end as number | undefined
  if (currentPeriodEndRaw === undefined || currentPeriodEndRaw === null) {
    const item = subscription.items?.data?.[0] as unknown as Record<string, unknown> | undefined
    currentPeriodEndRaw = item?.current_period_end as number | undefined
  }
  if (currentPeriodEndRaw === undefined || currentPeriodEndRaw === null) {
    currentPeriodEndRaw = subscription.cancel_at
  }

  const toISOStringOrNull = (timestamp: number | null | undefined): string | null => {
    if (timestamp === null || timestamp === undefined) return null
    return new Date(timestamp * 1000).toISOString()
  }

  const current_period_start = toISOStringOrNull(currentPeriodStartRaw) || new Date().toISOString()
  const current_period_end = toISOStringOrNull(currentPeriodEndRaw) || new Date().toISOString()

  const isScheduledToCancel =
    subscription.status === 'active' &&
    Boolean(subscription.cancel_at) &&
    !subscription.ended_at

  const effectiveCancelAtPeriodEnd =
    Boolean(subscription.cancel_at_period_end) || isScheduledToCancel

  const cancel_at = toISOStringOrNull(subscription.cancel_at)
  const canceled_at = toISOStringOrNull(subscription.canceled_at)
  const ended_at = toISOStringOrNull(subscription.ended_at)

  const cancellation_reason = subscription.cancellation_details?.reason ?? null
  const cancellation_feedback = subscription.cancellation_details?.feedback ?? null

  return {
    user_id: userId,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_price_id: stripePriceId,
    plan_slug: planSlug,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end: effectiveCancelAtPeriodEnd,
    cancel_at,
    canceled_at,
    ended_at,
    cancellation_reason,
    cancellation_feedback,
  }
}

/**
 * Upserts a subscription record and synchronizes the user's plan.
 * This function should only run when Stripe is enabled.
 */
export async function saveSubscription(insertData: {
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  stripe_price_id: string
  plan_slug: string
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end?: boolean
  cancel_at?: string | null
  canceled_at?: string | null
  ended_at?: string | null
  cancellation_reason?: string | null
  cancellation_feedback?: string | null
  last_event_created?: string | null
  last_event_id?: string | null
}): Promise<SubscriptionRow | null> {
  if (process.env.STRIPE_ENABLED !== 'true') {
    return null
  }

  const supabase = getSupabaseAdminClient()

  // Out-of-order protection check
  const { data: existing, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', insertData.stripe_subscription_id)
    .maybeSingle()

  if (fetchError) {
    console.error('Error fetching existing subscription:', serializeDbError(fetchError))
    return null
  }

  if (existing) {
    const existingRow = existing as unknown as SubscriptionRow

    // Check if the existing record has a real Stripe event ID (starts with "evt_")
    const existingIsReal = typeof existingRow.last_event_id === 'string' && existingRow.last_event_id.startsWith('evt_')
    const incomingIsReal = typeof insertData.last_event_id === 'string' && insertData.last_event_id.startsWith('evt_')

    // If the incoming event is a real Stripe event:
    if (incomingIsReal) {
      // If the existing record is NOT a real Stripe event (i.e. null or repair marker),
      // we allow the update unconditionally. Otherwise, we enforce out-of-order protection.
      if (existingIsReal && existingRow.last_event_created && insertData.last_event_created) {
        const existingTime = new Date(existingRow.last_event_created).getTime()
        const incomingTime = new Date(insertData.last_event_created).getTime()
        
        // Idempotency: exact same event ID is skipped
        if (insertData.last_event_id === existingRow.last_event_id) {
          console.log(`[Stripe Webhook] Idempotent update skipped for subscription ${insertData.stripe_subscription_id}`)
          return existingRow
        }

        if (existingRow.status === 'canceled') {
          if (incomingTime < existingTime) {
            console.log(`[Stripe Webhook] Stale update skipped for canceled subscription ${insertData.stripe_subscription_id}`)
            throw new StaleEventError(`Stale update skipped for canceled subscription ${insertData.stripe_subscription_id}`)
          }
          if (incomingTime === existingTime) {
            console.log(`[Stripe Webhook] Canceled subscription cannot be reactivated by same-second event ${insertData.stripe_subscription_id}`)
            return existingRow
          }
        }

        if (incomingTime < existingTime) {
          console.log(`[Stripe Webhook] Stale update skipped for subscription ${insertData.stripe_subscription_id}`)
          throw new StaleEventError(`Stale update skipped for subscription ${insertData.stripe_subscription_id}`)
        }
      }
    }
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .upsert(
      {
        ...insertData,
        last_event_created: insertData.last_event_created || null,
        last_event_id: insertData.last_event_id || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'stripe_subscription_id',
      },
    )
    .select()
    .single()

  if (error) {
    console.error('Error saving subscription record:', serializeDbError(error))
    return null
  }

  // A user has Pro when:
  // - subscription.user_id matches current user
  // - plan_slug = "pro"
  // - status is "active" or "trialing"
  // - ended_at is null
  const hasPro =
    insertData.plan_slug === 'pro' &&
    ['active', 'trialing', 'past_due'].includes(insertData.status) &&
    !insertData.ended_at

  const resolvedPlanSlug = hasPro ? 'pro' : 'free'
  const currentProfile = await getUserProfile(insertData.user_id)

  const updatedProfile = await setUserPlanSlug({
    user_id: insertData.user_id,
    email: currentProfile?.email || '',
    display_name: currentProfile?.display_name || null,
    plan_slug: resolvedPlanSlug,
  })

  if (!updatedProfile || updatedProfile.plan_slug !== resolvedPlanSlug) {
    console.error('Error syncing user profile plan from subscription.')
    return null
  }

  return data ? (data as unknown as SubscriptionRow) : null
}

/**
 * Updates a subscription record to canceled and demotes the user to Free.
 * This function should only run when Stripe is enabled.
 */
export async function cancelSubscriptionInDatabase(
  stripeSubscriptionId: string,
  eventCreated?: string,
  eventId?: string
): Promise<boolean> {
  if (process.env.STRIPE_ENABLED !== 'true') {
    return false
  }

  const supabase = getSupabaseAdminClient()

  const { data: subData, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle()

  if (subError || !subData) {
    console.error('Error finding subscription for cancel mapping:', serializeDbError(subError))
    return false
  }

  const existing = subData as unknown as SubscriptionRow

  const existingIsReal = typeof existing.last_event_id === 'string' && existing.last_event_id.startsWith('evt_')
  const incomingIsReal = typeof eventId === 'string' && eventId.startsWith('evt_')

  if (incomingIsReal) {
    if (existingIsReal && existing.last_event_created && eventCreated) {
      const existingTime = new Date(existing.last_event_created).getTime()
      const incomingTime = new Date(eventCreated).getTime()

      // Idempotency: exact same event ID is skipped
      if (eventId === existing.last_event_id) {
        console.log(`[Stripe Webhook] Idempotent cancel skipped for subscription ${stripeSubscriptionId}`)
        return true
      }

      if (incomingTime < existingTime) {
        console.log(`[Stripe Webhook] Stale cancel skipped for subscription ${stripeSubscriptionId}`)
        throw new StaleEventError(`Stale cancel skipped for subscription ${stripeSubscriptionId}`)
      }
      if (incomingTime === existingTime) {
        if (existing.status === 'canceled') {
          console.log(`[Stripe Webhook] Subscription is already canceled at same timestamp ${stripeSubscriptionId}`)
          return true
        }
      }
    }
  }

  const { user_id } = existing

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      ended_at: eventCreated || new Date().toISOString(),
      canceled_at: eventCreated || new Date().toISOString(),
      last_event_created: eventCreated || new Date().toISOString(),
      last_event_id: eventId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', stripeSubscriptionId)

  if (updateError) {
    console.error('Error cancelling subscription in database:', serializeDbError(updateError))
    return false
  }

  const currentProfile = await getUserProfile(user_id)

  const updatedProfile = await setUserPlanSlug({
    user_id,
    email: currentProfile?.email || '',
    display_name: currentProfile?.display_name || null,
    plan_slug: 'free',
  })

  if (!updatedProfile || updatedProfile.plan_slug !== 'free') {
    console.error('Error demoting user profile after subscription cancellation.')
    return false
  }

  return true
}

/**
 * Atomically claims a webhook event in the database inbox using an RPC.
 */
export async function claimWebhookEvent(params: {
  event_id: string
  event_type: string
  stripe_created: string
  customer_id: string | null
  subscription_id: string | null
}): Promise<'process' | 'duplicate_success' | 'processing' | 'failed_retryable' | 'failed_terminal' | 'ignored' | 'unknown'> {
  if (process.env.STRIPE_ENABLED !== 'true') {
    return 'process'
  }

  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase.rpc('claim_stripe_webhook_event', {
    p_event_id: params.event_id,
    p_event_type: params.event_type,
    p_stripe_created: params.stripe_created,
    p_customer_id: params.customer_id,
    p_subscription_id: params.subscription_id
  })

  if (error) {
    console.error('Error claiming webhook event via RPC:', serializeDbError(error))
    return 'unknown'
  }

  return data as 'duplicate_success' | 'process' | 'processing' | 'unknown'
}

/**
 * Updates a claimed webhook event's status in the database inbox using an RPC.
 */
export async function updateWebhookEventStatus(params: {
  event_id: string
  status: 'received' | 'processing' | 'processed' | 'failed_retryable' | 'failed_terminal' | 'ignored'
  failure_message?: string | null
}): Promise<boolean> {
  if (process.env.STRIPE_ENABLED !== 'true') {
    return true
  }

  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase.rpc('update_stripe_webhook_event_status', {
    p_event_id: params.event_id,
    p_status: params.status,
    p_failure_message: params.failure_message || null
  })

  if (error) {
    console.error('Error updating webhook event status via RPC:', serializeDbError(error))
    return false
  }

  return !!data
}

/**
 * Claims or retrieves a server-side checkout attempt for a user and price ID.
 */
export async function claimCheckoutAttempt(params: {
  user_id: string
  price_id: string
  stripe_customer_id: string
}): Promise<{
  status: 'create_new' | 'checkout_in_progress' | 'ready'
  attempt_id: string
  stripe_checkout_session_id: string | null
} | null> {
  if (process.env.STRIPE_ENABLED !== 'true') {
    return {
      status: 'create_new',
      attempt_id: '00000000-0000-0000-0000-000000000000',
      stripe_checkout_session_id: null
    }
  }

  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase.rpc('claim_checkout_attempt', {
    p_user_id: params.user_id,
    p_price_id: params.price_id,
    p_stripe_customer_id: params.stripe_customer_id
  })

  if (error) {
    console.error('Error claiming checkout attempt via RPC:', serializeDbError(error))
    return null
  }

  // Parse result json
  const result = typeof data === 'string' ? JSON.parse(data) : data
  return result as {
    status: 'create_new' | 'checkout_in_progress' | 'ready'
    attempt_id: string
    stripe_checkout_session_id: string | null
  }
}

/**
 * Updates a checkout attempt's status, session ID, or failure code.
 */
export async function updateCheckoutAttemptStatus(params: {
  attempt_id: string
  status: 'creating' | 'ready' | 'completed' | 'failed' | 'expired'
  session_id?: string | null
  failure_code?: string | null
}): Promise<boolean> {
  if (process.env.STRIPE_ENABLED !== 'true') {
    return true
  }

  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase.rpc('update_checkout_attempt_status', {
    p_attempt_id: params.attempt_id,
    p_status: params.status,
    p_session_id: params.session_id || null,
    p_failure_code: params.failure_code || null
  })

  if (error) {
    console.error('Error updating checkout attempt status via RPC:', serializeDbError(error))
    return false
  }

  return !!data
}

/**
 * Marks a checkout attempt as completed by Stripe Checkout Session ID.
 */
export async function completeCheckoutAttempt(stripeSessionId: string): Promise<boolean> {
  if (process.env.STRIPE_ENABLED !== 'true') {
    return true
  }

  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from('billing_checkout_attempts')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('stripe_checkout_session_id', stripeSessionId)

  if (error) {
    console.error('Error completing checkout attempt:', serializeDbError(error))
    return false
  }

  return true
}

export async function acquireStripeLock(key: string): Promise<void> {
  const supabase = getSupabaseAdminClient()
  const rpcFn = supabase.rpc as unknown as (
    fnName: string,
    args: Record<string, unknown>
  ) => Promise<{ error: { message: string } | null }>

  const { error } = await rpcFn('acquire_stripe_lock', { p_key: key })
  if (error) {
    console.error('Error acquiring Stripe lock:', serializeDbError(error))
    throw new Error(`Lock acquisition failed: ${error.message}`)
  }
}

/**
 * Releases a Postgres session-level advisory lock based on a text key.
 */
export async function releaseStripeLock(key: string): Promise<void> {
  const supabase = getSupabaseAdminClient()
  const rpcFn = supabase.rpc as unknown as (
    fnName: string,
    args: Record<string, unknown>
  ) => Promise<{ error: { message: string } | null }>

  const { error } = await rpcFn('release_stripe_lock', { p_key: key })
  if (error) {
    console.error('Error releasing Stripe lock:', serializeDbError(error))
  }
}