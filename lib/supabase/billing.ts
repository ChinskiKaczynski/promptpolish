import 'server-only'
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
): Promise<StripeCustomerRow | null> {
  if (process.env.STRIPE_ENABLED !== 'true') {
    return null
  }

  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from('stripe_customers')
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
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
  last_event_created?: string
  last_event_id?: string
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
    if (insertData.last_event_created && existingRow.last_event_created) {
      const existingTime = new Date(existingRow.last_event_created).getTime()
      const incomingTime = new Date(insertData.last_event_created).getTime()
      
      // Idempotency: exact same event ID is skipped
      if (insertData.last_event_id && existingRow.last_event_id && insertData.last_event_id === existingRow.last_event_id) {
        console.log(`[Stripe Webhook] Idempotent update skipped for subscription ${insertData.stripe_subscription_id}`)
        return existingRow
      }

      if (existingRow.status === 'canceled') {
        if (incomingTime < existingTime) {
          console.log(`[Stripe Webhook] Stale update skipped for canceled subscription ${insertData.stripe_subscription_id}`)
          return existingRow
        }
        if (incomingTime === existingTime) {
          console.log(`[Stripe Webhook] Canceled subscription cannot be reactivated by same-second event ${insertData.stripe_subscription_id}`)
          return existingRow
        }
      }

      if (incomingTime < existingTime) {
        console.log(`[Stripe Webhook] Stale update skipped for subscription ${insertData.stripe_subscription_id}`)
        return existingRow
      }
      
      // Removed lexical comparison on last_event_id. Same-timestamp created/updated events will win and proceed.
    }
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .upsert(
      {
        ...insertData,
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

  const isActivePro =
    insertData.plan_slug === 'pro' &&
    ['active', 'trialing', 'past_due'].includes(insertData.status)

  const resolvedPlanSlug = isActivePro ? 'pro' : 'free'
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

  if (eventCreated && existing.last_event_created) {
    const existingTime = new Date(existing.last_event_created).getTime()
    const incomingTime = new Date(eventCreated).getTime()

    // Idempotency: exact same event ID is skipped
    if (eventId && existing.last_event_id && eventId === existing.last_event_id) {
      console.log(`[Stripe Webhook] Idempotent cancel skipped for subscription ${stripeSubscriptionId}`)
      return true
    }

    if (incomingTime < existingTime) {
      console.log(`[Stripe Webhook] Stale cancel skipped for subscription ${stripeSubscriptionId}`)
      return true
    }
    if (incomingTime === existingTime) {
      if (existing.status === 'canceled') {
        console.log(`[Stripe Webhook] Subscription is already canceled at same timestamp ${stripeSubscriptionId}`)
        return true
      }
      // Removed lexical comparison on eventId.
    }
  }

  const { user_id } = existing

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
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

  const { data, error } = await supabase
    .from('billing_checkout_attempts')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('stripe_checkout_session_id', stripeSessionId)
    .select()

  if (error) {
    console.error('Error completing checkout attempt:', serializeDbError(error))
    return false
  }

  return !!data
}