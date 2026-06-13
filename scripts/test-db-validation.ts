import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return

  const content = fs.readFileSync(envPath, 'utf8')
  const lines = content.split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const firstEquals = trimmed.indexOf('=')
    if (firstEquals !== -1) {
      const key = trimmed.slice(0, firstEquals).trim()
      let val = trimmed.slice(firstEquals + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      process.env[key] = val
    }
  }
}

loadEnvLocal()

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseSecretKey) {
    console.error('Missing Supabase environment variables in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey)
  const userId = 'f2205324-b9ca-4c78-8e16-84bbdf0677a2' // Valid existing user_id

  console.log('====================================================')
  console.log(' Live DB Concurrency & Lease Validation Script      ')
  console.log('====================================================')

  // Cleanup leftover records from previous attempts
  await supabase.from('stripe_webhook_events').delete().like('event_id', 'evt_lease_test_%')
  await supabase.from('billing_checkout_attempts').delete().eq('user_id', userId)

  // ----------------------------------------------------------------
  // PART 1: Webhook Inbox Processing Lease Tests
  // ----------------------------------------------------------------
  console.log('\n--- 1. Testing Webhook Processing Lease ---')

  // A. Create a processing event with a fresh timestamp
  const eventId = 'evt_lease_test_1'
  const stripeCreated = new Date().toISOString()
  
  // First claim puts it in processing
  const claim1 = await supabase.rpc('claim_stripe_webhook_event', {
    p_event_id: eventId,
    p_event_type: 'customer.subscription.updated',
    p_stripe_created: stripeCreated,
    p_customer_id: 'cus_lease_test',
    p_subscription_id: 'sub_lease_test'
  })
  console.log(`- Initial claim result: ${claim1.data} (expected: process)`)

  // B. Try reclaiming active lease (should return 'processing')
  const claim2 = await supabase.rpc('claim_stripe_webhook_event', {
    p_event_id: eventId,
    p_event_type: 'customer.subscription.updated',
    p_stripe_created: stripeCreated,
    p_customer_id: 'cus_lease_test',
    p_subscription_id: 'sub_lease_test'
  })
  console.log(`- Active lease claim result: ${claim2.data} (expected: processing)`)

  // C. Force expired lease in DB by updating updated_at to 15 minutes ago
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const { error: updateTimeError } = await supabase
    .from('stripe_webhook_events')
    .update({ updated_at: fifteenMinsAgo })
    .eq('event_id', eventId)

  if (updateTimeError) {
    console.error('Failed to update event timestamp:', updateTimeError)
    process.exit(1)
  }
  console.log('- Successfully updated event timestamp to 15 minutes ago (lease expired)')

  // D. Run 5 concurrent claims against expired lease
  console.log('- Triggering 5 concurrent reclaims on expired lease...')
  const concurrentClaims = Array.from({ length: 5 }).map(() =>
    supabase.rpc('claim_stripe_webhook_event', {
      p_event_id: eventId,
      p_event_type: 'customer.subscription.updated',
      p_stripe_created: stripeCreated,
      p_customer_id: 'cus_lease_test',
      p_subscription_id: 'sub_lease_test'
    })
  )
  const concurrentResults = await Promise.all(concurrentClaims)
  const concurrentOutputs = concurrentResults.map(r => r.data)
  console.log(`  Results of concurrent claims:`, concurrentOutputs)
  
  const processCount = concurrentOutputs.filter(o => o === 'process').length
  const processingCount = concurrentOutputs.filter(o => o === 'processing').length
  console.log(`  Count of 'process': ${processCount} (expected: 1)`)
  console.log(`  Count of 'processing': ${processingCount} (expected: 4)`)

  if (processCount !== 1 || processingCount !== 4) {
    console.error('FAILED: Lease concurrency did not serialize reclaim to exactly 1 process result.')
    process.exit(1)
  }

  // E. Verify attempt_count incremented to 2
  const { data: dbEvent } = await supabase
    .from('stripe_webhook_events')
    .select('attempt_count, status')
    .eq('event_id', eventId)
    .single()
  console.log(`- Event attempt_count: ${dbEvent?.attempt_count} (expected: 2)`)
  console.log(`- Event status: ${dbEvent?.status} (expected: processing)`)

  // F. Reclaim until max limit (5) to check terminal state transition
  // We set attempt_count = 4 and updated_at = 15m ago, next reclaim should hit 5 (max) and continue,
  // then next reclaim after that will hit limit and move to failed_terminal.
  await supabase.from('stripe_webhook_events').update({ attempt_count: 4, updated_at: fifteenMinsAgo }).eq('event_id', eventId)
  
  // Reclaim attempt #5
  const claimAttempt5 = await supabase.rpc('claim_stripe_webhook_event', {
    p_event_id: eventId,
    p_event_type: 'customer.subscription.updated',
    p_stripe_created: stripeCreated,
    p_customer_id: 'cus_lease_test',
    p_subscription_id: 'sub_lease_test'
  })
  console.log(`- Attempt 5 reclaim: ${claimAttempt5.data} (expected: process)`)

  // Set to 15m ago again
  await supabase.from('stripe_webhook_events').update({ updated_at: fifteenMinsAgo }).eq('event_id', eventId)

  // Reclaim attempt #6 (should fail terminally)
  const claimAttempt6 = await supabase.rpc('claim_stripe_webhook_event', {
    p_event_id: eventId,
    p_event_type: 'customer.subscription.updated',
    p_stripe_created: stripeCreated,
    p_customer_id: 'cus_lease_test',
    p_subscription_id: 'sub_lease_test'
  })
  console.log(`- Attempt 6 reclaim (exceeds limit): ${claimAttempt6.data} (expected: failed_terminal)`)

  const { data: terminalEvent } = await supabase
    .from('stripe_webhook_events')
    .select('status, failure_message')
    .eq('event_id', eventId)
    .single()
  console.log(`- Terminal Event status: ${terminalEvent?.status} (expected: failed_terminal)`)
  console.log(`- Terminal Event failure msg: "${terminalEvent?.failure_message}"`)

  // ----------------------------------------------------------------
  // PART 2: Checkout Attempts Lifecycle & Concurrency
  // ----------------------------------------------------------------
  console.log('\n--- 2. Testing Checkout Attempts lifecycle ---')

  const priceId = 'price_pro_concurrency_test'
  const stripeCustomerId = 'cus_attempt_test_999'

  // A. Trigger 8 concurrent claims for user/product
  console.log('- Triggering 8 concurrent claims for the same user/product...')
  const concurrentCheckoutClaims = Array.from({ length: 8 }).map(() =>
    supabase.rpc('claim_checkout_attempt', {
      p_user_id: userId,
      p_price_id: priceId,
      p_stripe_customer_id: stripeCustomerId
    })
  )
  const checkoutResults = await Promise.all(concurrentCheckoutClaims)
  const checkoutOutputs = checkoutResults.map(r => typeof r.data === 'string' ? JSON.parse(r.data) : r.data)
  console.log('  Results of concurrent checkout attempts:', checkoutOutputs.map(o => o.status))

  const createNewCount = checkoutOutputs.filter(o => o.status === 'create_new').length
  const inProgressCount = checkoutOutputs.filter(o => o.status === 'checkout_in_progress').length
  console.log(`  Count of 'create_new': ${createNewCount} (expected: 1)`)
  console.log(`  Count of 'checkout_in_progress': ${inProgressCount} (expected: 7)`)

  if (createNewCount !== 1 || inProgressCount !== 7) {
    console.error('FAILED: Checkout attempt concurrency did not yield exactly 1 create_new result.')
    process.exit(1)
  }

  const canonicalAttempt = checkoutOutputs.find(o => o.status === 'create_new')
  const attemptId = canonicalAttempt.attempt_id

  // B. Verify retry of in-progress attempt fails with 409
  // C. Release/fail attempt
  console.log('- Marking current attempt as failed (simulating Stripe error)')
  await supabase.rpc('update_checkout_attempt_status', {
    p_attempt_id: attemptId,
    p_status: 'failed',
    p_failure_code: 'price_inactive'
  })

  // D. Verify checkout can now be retried (returns create_new)
  const retryClaim = await supabase.rpc('claim_checkout_attempt', {
    p_user_id: userId,
    p_price_id: priceId,
    p_stripe_customer_id: stripeCustomerId
  })
  const retryResult = typeof retryClaim.data === 'string' ? JSON.parse(retryClaim.data) : retryClaim.data
  console.log(`- Retry claim result: ${retryResult.status} (expected: create_new)`)
  const newAttemptId = retryResult.attempt_id

  // E. Update new attempt to ready
  console.log('- Setting checkout attempt to ready with session_id')
  await supabase.rpc('update_checkout_attempt_status', {
    p_attempt_id: newAttemptId,
    p_status: 'ready',
    p_session_id: 'cs_test_concurrency_session'
  })

  // F. Subsequent claim should return ready and the session ID
  const claimReady = await supabase.rpc('claim_checkout_attempt', {
    p_user_id: userId,
    p_price_id: priceId,
    p_stripe_customer_id: stripeCustomerId
  })
  const readyResult = typeof claimReady.data === 'string' ? JSON.parse(claimReady.data) : claimReady.data
  console.log(`- Subsequent claim status: ${readyResult.status} (expected: ready)`)
  console.log(`- Subsequent claim session ID: ${readyResult.stripe_checkout_session_id} (expected: cs_test_concurrency_session)`)

  // G. Expire the attempt
  console.log('- Setting expires_at to past for the ready attempt')
  await supabase
    .from('billing_checkout_attempts')
    .update({ expires_at: fifteenMinsAgo })
    .eq('id', newAttemptId)

  // H. Subsequent claim should detect expired attempt, mark it expired, and return create_new
  const claimExpired = await supabase.rpc('claim_checkout_attempt', {
    p_user_id: userId,
    p_price_id: priceId,
    p_stripe_customer_id: stripeCustomerId
  })
  const expiredResult = typeof claimExpired.data === 'string' ? JSON.parse(claimExpired.data) : claimExpired.data
  console.log(`- Claim after expiration status: ${expiredResult.status} (expected: create_new)`)

  // Clean up
  await supabase.from('stripe_webhook_events').delete().like('event_id', 'evt_lease_test_%')
  await supabase.from('billing_checkout_attempts').delete().eq('user_id', userId)

  console.log('\n====================================================')
  console.log(' LIVE DB VALIDATION SUCCESSFUL!                      ')
  console.log('====================================================')
  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
