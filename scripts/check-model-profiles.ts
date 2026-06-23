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

async function checkModelProfiles() {
  const { data, error } = await supabase
    .from('model_profiles')
    .select('*')

  if (error) {
    console.error('Error fetching model_profiles:', error)
    return
  }

  console.log('--- MODEL PROFILES IN DB ---')
  console.log(JSON.stringify(data, null, 2))
}

checkModelProfiles().catch(console.error)
