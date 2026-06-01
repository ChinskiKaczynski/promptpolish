import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// 1. Manually parse .env.local to avoid next / dotenv external dependency issues
try {
  const envPath = path.resolve(__dirname, '../.env.local')
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8')
    for (const line of envConfig.split('\n')) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=')
        if (parts.length >= 2) {
          const key = parts[0].trim()
          let value = parts.slice(1).join('=').trim()
          // Strip enclosing quotes if any
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.substring(1, value.length - 1)
          }
          if (!(key in process.env)) {
            process.env[key] = value
          }
        }
      }
    }
  }
} catch (err) {
  console.warn('Warning: Could not load .env.local file:', err)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseSecretKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY is missing in process.env.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function runMetricsReport() {
  console.log('================================================')
  console.log('   PromptPolish MVP Private Beta Metrics        ')
  console.log(`   Generated on: ${new Date().toISOString()}   `)
  console.log('================================================\n')

  try {
    // 1. Total analyses completed
    const { count: completedCount, error: err1 } = await supabase
      .from('usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'analysis_completed')

    // 2. Total copy events
    const { count: copyCount, error: err2 } = await supabase
      .from('usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'copy_improved_prompt')

    // 3. Positive feedback
    const { count: positiveFeedback, error: err3 } = await supabase
      .from('feedback_events')
      .select('*', { count: 'exact', head: true })
      .eq('rating', 'up')

    // 4. Negative feedback
    const { count: negativeFeedback, error: err4 } = await supabase
      .from('feedback_events')
      .select('*', { count: 'exact', head: true })
      .eq('rating', 'down')

    // 5. Total share links enabled
    const { count: shareEnabled, error: err5 } = await supabase
      .from('prompt_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('is_share_enabled', true)

    // 6. Sensitive-data blocks
    const { count: sensitiveBlocks, error: err6 } = await supabase
      .from('usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'sensitive_data_blocked')

    // 7. Limit reached events
    const { count: limitReached, error: err7 } = await supabase
      .from('usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'limit_reached')

    // 8. Total analysis failures
    const { count: analysisFailures, error: err8 } = await supabase
      .from('usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'analysis_failed')

    // Check for errors
    const errors = [err1, err2, err3, err4, err5, err6, err7, err8].filter(Boolean)
    if (errors.length > 0) {
      console.error('Warning: One or more queries encountered errors:', errors)
    }

    console.log(`- Completed Analyses:     ${completedCount ?? 0}`)
    console.log(`- Copy Prompt Clicks:     ${copyCount ?? 0}`)
    console.log(`- Positive Feedbacks:     ${positiveFeedback ?? 0}`)
    console.log(`- Negative Feedbacks:     ${negativeFeedback ?? 0}`)
    console.log(`- Active Public Shares:   ${shareEnabled ?? 0}`)
    console.log(`- Sensitive Data Blocks:  ${sensitiveBlocks ?? 0}`)
    console.log(`- Usage Limit Reached:    ${limitReached ?? 0}`)
    console.log(`- Analysis Failures:      ${analysisFailures ?? 0}\n`)

    console.log('================================================')
  } catch (error) {
    console.error('Failed to run metrics report:', error)
  }
}

runMetricsReport()
