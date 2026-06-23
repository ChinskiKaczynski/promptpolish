import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local')
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SECRET_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const errorIds = [
  '015f3cee-40f9-49ec-9240-1bedb79c3621', // Audit 1 (failed second run)
  'd0dbefe5-da97-45f0-bf4b-6eda45800874'  // Long Audit (failed second run)
]

async function checkLogs() {
  console.log(`Querying Supabase for error_ids: ${JSON.stringify(errorIds)}...`)
  
  const { data: events, error: eError } = await supabase
    .from('usage_events')
    .select('*')
    .eq('event_type', 'analysis_failed')

  if (eError) {
    console.error('Error fetching usage_events:', eError)
    return
  }

  const matchingEvents = (events || []).filter(evt => {
    const meta = evt.metadata_json as Record<string, unknown>
    return meta && typeof meta.error_id === 'string' && errorIds.includes(meta.error_id)
  })

  console.log(`Found ${matchingEvents.length} matching failure events.`)
  for (const evt of matchingEvents) {
    console.log(`\nEvent ID: ${evt.id}`)
    console.log(`Owner Anon ID: ${evt.owner_anonymous_id}`)
    console.log(`Event Type: ${evt.event_type}`)
    console.log(`Created At: ${evt.created_at}`)
    console.log(`Metadata: ${JSON.stringify(evt.metadata_json, null, 2)}`)
  }
}

checkLogs().catch(console.error)
