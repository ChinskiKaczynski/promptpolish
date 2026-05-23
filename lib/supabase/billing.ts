import 'server-only'
import { getSupabaseAdminClient } from './admin'
import { getSupabaseServerClient } from './server'
import { getUserProfile, createUserProfile } from './queries'
import type { StripeCustomerRow, SubscriptionRow } from './types'

/**
 * Fetches the Stripe customer mapping for a user.
 */
export async function getStripeCustomer(userId: string): Promise<StripeCustomerRow | null> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('stripe_customers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching Stripe customer:', error)
    return null
  }
  return data ? (data as unknown as StripeCustomerRow) : null
}

/**
 * Saves a Stripe customer mapping for a user.
 * Bypasses RLS writes using the admin client.
 */
export async function saveStripeCustomer(userId: string, stripeCustomerId: string): Promise<StripeCustomerRow | null> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('stripe_customers')
    .upsert({
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving Stripe customer mapping:', error)
    return null
  }
  return data ? (data as unknown as StripeCustomerRow) : null
}

/**
 * Maps a Stripe customer ID back to a Supabase user ID.
 */
export async function getUserIdByStripeCustomerId(stripeCustomerId: string): Promise<string | null> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle()

  if (error) {
    console.error('Error matching Stripe customer ID to user ID:', error)
    return null
  }
  return data ? (data as { user_id: string }).user_id : null
}

/**
 * Fetches the subscription row for a user.
 */
export async function getSubscriptionByUserId(userId: string): Promise<SubscriptionRow | null> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching subscription by user ID:', error)
    return null
  }
  return data ? (data as unknown as SubscriptionRow) : null
}

/**
 * Upserts a subscription record and automatically synchronizes the plan_slug
 * in the user's profile. Bypasses client-side RLS write restrictions using the admin client.
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
}): Promise<SubscriptionRow | null> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .upsert({
      ...insertData,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'stripe_subscription_id'
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving subscription record:', error)
    return null
  }

  // Update user_profiles plan slug immediately
  const isActive = insertData.status === 'active' || insertData.status === 'trialing'
  const planSlug = isActive ? 'pro' : 'free'

  const currentProfile = await getUserProfile(insertData.user_id)
  await createUserProfile({
    user_id: insertData.user_id,
    email: currentProfile?.email || '',
    display_name: currentProfile?.display_name || null,
    plan_slug: planSlug
  })

  return data ? (data as unknown as SubscriptionRow) : null
}

/**
 * Updates a subscription record to 'canceled' and demotes the user to 'free' tier.
 */
export async function cancelSubscriptionInDatabase(stripeSubscriptionId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient()
  
  // Locate the user_id associated with this subscription
  const { data: subData, error: subError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle()

  if (subError || !subData) {
    console.error('Error finding subscription for cancel mapping:', subError)
    return false
  }

  const { user_id } = subData as { user_id: string }

  // Update status field to 'canceled' in database
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', stripeSubscriptionId)

  if (updateError) {
    console.error('Error cancelling subscription in database:', updateError)
    return false
  }

  // Demote user profile back to free plan
  const currentProfile = await getUserProfile(user_id)
  await createUserProfile({
    user_id,
    email: currentProfile?.email || '',
    display_name: currentProfile?.display_name || null,
    plan_slug: 'free'
  })

  return true
}
