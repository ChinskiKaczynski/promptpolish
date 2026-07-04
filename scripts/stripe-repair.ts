import fs from 'fs'
import path from 'path'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const match = line.match(/^\s*([^#\s=]+)\s*=\s*(.*)$/)
      if (match) {
        const key = match[1]
        let val = match[2].trim()
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1)
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1)
        }
        process.env[key] = val
      }
    }
  }
}

loadEnv()

async function main() {
  const userId = 'a2b3f340-0f7b-49ed-98a3-ce067860f9e0'
  const customerId = 'cus_UpF9NhpsOm3L3z'

  const stripeKey = process.env.STRIPE_SECRET_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY

  if (!stripeKey) {
    console.error('Missing STRIPE_SECRET_KEY in env')
    process.exit(1)
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in env')
    process.exit(1)
  }

  const stripe = new Stripe(stripeKey)
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log(`Checking Stripe subscriptions for customer: ${customerId}`)
  const subscriptionsList = await stripe.subscriptions.list({
    customer: customerId,
    limit: 5,
    status: 'all'
  })

  if (subscriptionsList.data.length === 0) {
    console.warn(`No subscriptions found in Stripe for customer ${customerId}`)
    process.exit(0)
  }

  const activeSub = subscriptionsList.data.find(s => ['active', 'trialing', 'past_due'].includes(s.status)) 
    || subscriptionsList.data[0]

  console.log(`Found subscription: ${activeSub.id} [status=${activeSub.status}]`)

  // 1. Upsert stripe_customers
  console.log(`Upserting stripe_customers mapping...`)
  const { error: custError } = await supabase
    .from('stripe_customers')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })

  if (custError) {
    console.error('Failed to upsert stripe_customer mapping:', custError)
    process.exit(1)
  }
  console.log(`Successfully mapped customer ${customerId} to user ${userId}.`)

  // 2. Upsert subscriptions
  const stripePriceId = activeSub.items.data[0]?.price.id || ''
  const isActivePro = ['active', 'trialing', 'past_due'].includes(activeSub.status)
  const planSlug = 'pro'

  console.log(`Upserting subscription ${activeSub.id} into database...`)
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: activeSub.id,
      stripe_price_id: stripePriceId,
      plan_slug: planSlug,
      status: activeSub.status,
      current_period_start: new Date((activeSub.items.data[0]?.current_period_start || activeSub.start_date || activeSub.created) * 1000).toISOString(),
      current_period_end: new Date((activeSub.items.data[0]?.current_period_end || activeSub.start_date || activeSub.created) * 1000).toISOString(),
      cancel_at_period_end: activeSub.cancel_at_period_end,
      last_event_created: new Date((activeSub.created || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
      last_event_id: `repair-initial-${activeSub.id}`,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'stripe_subscription_id'
    })

  if (subError) {
    console.error('Failed to upsert subscription:', subError)
    process.exit(1)
  }
  console.log(`Successfully upserted subscription record.`)

  // 3. Synchronize user profile plan_slug to pro or free
  const resolvedPlanSlug = isActivePro ? 'pro' : 'free'
  console.log(`Syncing user profile plan_slug to: ${resolvedPlanSlug}...`)
  const { error: profError } = await supabase
    .from('user_profiles')
    .update({
      plan_slug: resolvedPlanSlug,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (profError) {
    console.error('Failed to update user profile plan_slug:', profError)
    process.exit(1)
  }

  console.log(`Successfully completed repair script. User ${userId} is now ${resolvedPlanSlug}.`)
}

main().catch(err => {
  console.error('Fatal repair error:', err)
  process.exit(1)
})
