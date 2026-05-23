import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// 1. Manually parse .env.local
const envPath = path.join(__dirname, '../.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}

envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return
  const index = trimmed.indexOf('=')
  if (index === -1) return
  const key = trimmed.substring(0, index).trim()
  const val = trimmed.substring(index + 1).trim()
  env[key] = val
})

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseSecret = env['SUPABASE_SECRET_KEY']

if (!supabaseUrl || !supabaseSecret) {
  console.error('Missing Supabase variables in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseSecret)

async function getMetrics() {
  console.log('--- PromptPolish Database Telemetry Audit ---')
  
  // 1. Prompt Analyses metrics
  const { data: analyses, error: err1 } = await supabase
    .from('prompt_analyses')
    .select('*')

  if (err1) {
    console.error('Error fetching prompt_analyses:', err1)
  } else {
    const totalAnalyses = analyses?.length || 0
    console.log(`\n[prompt_analyses] Total records: ${totalAnalyses}`)
    if (totalAnalyses > 0) {
      const plCount = analyses.filter(a => a.working_language === 'pl').length
      const enCount = analyses.filter(a => a.working_language === 'en').length
      const sharedCount = analyses.filter(a => a.is_share_enabled).length
      const avgScore = analyses.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) / totalAnalyses
      
      console.log(`- Polish (pl): ${plCount}`)
      console.log(`- English (en): ${enCount}`)
      console.log(`- Shared Enabled: ${sharedCount}`)
      console.log(`- Average Score: ${avgScore.toFixed(2)}`)
    }
  }

  // 2. Usage Events metrics
  const { data: usageEvents, error: err2 } = await supabase
    .from('usage_events')
    .select('*')

  if (err2) {
    console.error('Error fetching usage_events:', err2)
  } else {
    const totalUsage = usageEvents?.length || 0
    console.log(`\n[usage_events] Total records: ${totalUsage}`)
    if (totalUsage > 0) {
      const eventCounts: Record<string, number> = {}
      usageEvents.forEach(e => {
        eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1
      })
      console.log('Event types breakdown:')
      Object.entries(eventCounts).forEach(([type, count]) => {
        console.log(`- ${type}: ${count}`)
      })
    }
  }

  // 3. Feedback Events metrics
  const { data: feedbackEvents, error: err3 } = await supabase
    .from('feedback_events')
    .select('*')

  if (err3) {
    console.error('Error fetching feedback_events:', err3)
  } else {
    const totalFeedback = feedbackEvents?.length || 0
    console.log(`\n[feedback_events] Total records: ${totalFeedback}`)
    if (totalFeedback > 0) {
      const ratingCounts: Record<string, number> = {}
      feedbackEvents.forEach(f => {
        ratingCounts[f.rating] = (ratingCounts[f.rating] || 0) + 1
      })
      console.log('Ratings breakdown:')
      Object.entries(ratingCounts).forEach(([rating, count]) => {
        console.log(`- ${rating}: ${count}`)
      })
    }
  }
}

getMetrics().catch(console.error)
