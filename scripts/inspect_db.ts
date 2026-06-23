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
    console.error('Missing Supabase variables')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey)

  console.log('Querying recent limit_reached usage_events...')
  const { data: eventData, error: eventError } = await supabase
    .from('usage_events')
    .select('*')
    .in('event_type', ['limit_reached', 'analysis_failed', 'analysis_started', 'sensitive_data_blocked'])
    .order('created_at', { ascending: false })
    .limit(30)

  if (eventError) {
    console.error('Error fetching usage events:', eventError)
  } else {
    console.log('Recent usage events:')
    console.log(eventData.map(e => ({
      event_type: e.event_type,
      owner_anonymous_id: e.owner_anonymous_id,
      user_id: e.user_id,
      metadata: e.metadata_json,
      created_at: e.created_at
    })))
  }

  // Count by distinct owner_anonymous_id
  const { data: groupData, error: groupError } = await supabase
    .from('usage_reservations')
    .select('owner_anonymous_id, status')

  if (groupError) {
    console.error('Error grouping:', groupError)
  } else {
    const counts: Record<string, number> = {}
    for (const row of groupData) {
      const id = row.owner_anonymous_id
      counts[id] = (counts[id] || 0) + 1
    }
    console.log('\nTop owner_anonymous_id counts in DB:')
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10)
    console.log(sorted)
  }

  process.exit(0)
}

main().catch(console.error)
