/* eslint-disable @typescript-eslint/no-require-imports, prefer-rest-params */
import fs from 'fs'
import path from 'path'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Mock 'server-only' to prevent it from throwing when imported in the node CLI script
const Module = require('module')
const originalRequire = Module.prototype.require
Module.prototype.require = function (id: string) {
  if (id === 'server-only') {
    return {}
  }
  return originalRequire.apply(this, arguments)
}

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

// 1. Load env before imports
loadEnv()

async function main() {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY
  const proPriceId = process.env.STRIPE_PRICE_ID_PRO

  if (!stripeKey) {
    console.error('Missing STRIPE_SECRET_KEY in env')
    process.exit(1)
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in env')
    process.exit(1)
  }
  if (!proPriceId) {
    console.error('Missing STRIPE_PRICE_ID_PRO in env')
    process.exit(1)
  }

  // Use command line argument or default test subscription
  const subscriptionId = process.argv[2] || 'sub_1TpagCKbdD0nmGG45s1Li6RE'
  console.log(`Starting subscription repair/sync for ID: ${subscriptionId}`)

  const stripe = new Stripe(stripeKey)
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // 2. Retrieve subscription from Stripe
  let subscription: Stripe.Subscription
  try {
    subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price']
    })
  } catch (err) {
    console.error(`Failed to retrieve subscription ${subscriptionId} from Stripe:`, err)
    process.exit(1)
  }

  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id

  console.log(`Retrieved subscription ${subscriptionId} (status=${subscription.status}, customer=${customerId})`)

  // 3. Resolve user_id from subscription metadata or stripe_customers table
  let userId = (subscription.metadata?.user_id as string) || null

  if (!userId) {
    console.log(`No user_id in subscription metadata. Querying stripe_customers for customer ID: ${customerId}...`)
    const { data: customerRow, error: customerError } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()

    if (customerError) {
      console.error('Failed to query stripe_customers:', customerError)
      process.exit(1)
    }

    if (customerRow?.user_id) {
      userId = customerRow.user_id
      console.log(`Resolved user_id ${userId} from stripe_customers mapping.`)
    }
  } else {
    console.log(`Resolved user_id ${userId} from subscription metadata.`)
  }

  if (!userId) {
    console.error(`Could not resolve user_id for customer ${customerId}. Sync aborted.`)
    process.exit(1)
  }

  // 4. Dynamically import database helpers to ensure environment variables are applied first
  console.log('Loading database billing helpers...')
  const { extractSubscriptionData, saveSubscription } = await import('../lib/supabase/billing')

  // 5. Extract and upsert subscription details
  const extracted = extractSubscriptionData(subscription, userId, proPriceId)

  // Use a repair marker as the event ID so real Stripe events can overwrite it
  const repairEventId = `repair-initial-${subscriptionId}`
  const repairEventCreated = new Date((subscription.created || Math.floor(Date.now() / 1000)) * 1000).toISOString()

  console.log(`Upserting subscription data into Supabase (userId: ${userId})...`)
  const result = await saveSubscription({
    ...extracted,
    last_event_id: repairEventId,
    last_event_created: repairEventCreated
  })

  if (!result) {
    console.error('Failed to upsert subscription in database.')
    process.exit(1)
  }

  console.log(`Sync completed successfully! Subscription status: ${result.status}, plan_slug: ${result.plan_slug}.`)
}

main().catch(err => {
  console.error('Fatal repair error:', err)
  process.exit(1)
})
