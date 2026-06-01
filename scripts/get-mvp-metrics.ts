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
  auth: { persistSession: false, autoRefreshToken: false },
})

function safe(n: number | null | undefined, decimals = 0): string {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return decimals > 0 ? n.toFixed(decimals) : String(Math.round(n))
}

function pct(num: number, den: number): string {
  if (den === 0) return '—'
  return ((num / den) * 100).toFixed(1) + '%'
}

async function runMetricsReport() {
  console.log('================================================')
  console.log('   PromptPolish MVP Private Beta Metrics        ')
  console.log(`   Generated on: ${new Date().toISOString()}   `)
  console.log('================================================\n')

  try {
    // Fetch all usage events
    const { data: usage, error: ue } = await supabase.from('usage_events').select('*')
    const { data: feedback, error: fe } = await supabase.from('feedback_events').select('*')
    const { data: analyses, error: ae } = await supabase.from('prompt_analyses').select('*')
    const { data: profiles, error: pe } = await supabase.from('user_profiles').select('*')

    const errors = [ue, fe, ae, pe].filter(Boolean)
    if (errors.length > 0) {
      console.warn('Warning: Some queries had errors:', errors.map(e => e?.message).join(', '))
    }

    const u = usage ?? []
    const f = feedback ?? []
    const a = analyses ?? []
    const p = profiles ?? []

    // Core Funnel
    const started = u.filter(e => e.event_type === 'analysis_started').length
    const completed = u.filter(e => e.event_type === 'analysis_completed').length
    const failed = u.filter(e => e.event_type === 'analysis_failed').length
    const copies = u.filter(e => e.event_type === 'copy_improved_prompt' || e.event_type === 'copy').length
    const shareCreated = u.filter(e => e.event_type === 'share_link_created').length
    const activeShares = a.filter(x => x.is_share_enabled).length
    const sensitiveBlocks = u.filter(e => e.event_type === 'sensitive_data_blocked').length
    const sensitiveWarnings = u.filter(e => e.event_type === 'sensitive_data_warning_shown').length
    const limitReached = u.filter(e => e.event_type === 'limit_reached').length
    const feedbackUp = f.filter(x => x.rating === 'up').length
    const feedbackDown = f.filter(x => x.rating === 'down').length

    // Plans
    const freeUsers = p.filter(x => x.plan_slug === 'free').length
    const proUsers = p.filter(x => x.plan_slug === 'pro').length

    // Owners
    const completedOwners = u.filter(e => e.event_type === 'analysis_completed' && e.owner_anonymous_id).map(e => e.owner_anonymous_id)
    const ownerCounts: Record<string, number> = {}
    completedOwners.forEach(o => { ownerCounts[o] = (ownerCounts[o] || 0) + 1 })
    const returning = Object.values(ownerCounts).filter(c => c >= 2).length
    const uniqueCompleted = Object.keys(ownerCounts).length

    // Avg score
    const scores = a.map(x => x.overall_score).filter(s => typeof s === 'number' && !isNaN(s))
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

    console.log('── Core Funnel ─────────────────────────────────')
    console.log(`  Started:              ${started}`)
    console.log(`  Completed:            ${completed}`)
    console.log(`  Failed:               ${failed}`)
    console.log(`  Completion Rate:      ${pct(completed, started)}`)
    console.log(`  Failure Rate:         ${pct(failed, started)}`)

    console.log('\n── Value Metrics ───────────────────────────────')
    console.log(`  Copy Events:          ${copies}   (${pct(copies, completed)} of completed)`)
    console.log(`  Feedback (👍):        ${feedbackUp}`)
    console.log(`  Feedback (👎):        ${feedbackDown}`)
    console.log(`  Positive Ratio:       ${pct(feedbackUp, feedbackUp + feedbackDown)}`)
    console.log(`  Share Links Created:  ${shareCreated}`)
    console.log(`  Active Public Shares: ${activeShares}`)

    console.log('\n── Retention Proxy ─────────────────────────────')
    console.log(`  Unique Owners w/ Completed: ${uniqueCompleted}`)
    console.log(`  Returning Owners (≥2):      ${returning}`)
    console.log(`  Returning Rate:             ${pct(returning, uniqueCompleted)}`)

    console.log('\n── Plans ───────────────────────────────────────')
    console.log(`  Free Users:           ${freeUsers}`)
    console.log(`  Pro Users:            ${proUsers}`)

    console.log('\n── Reliability ─────────────────────────────────')
    console.log(`  Analysis Failures:    ${failed}`)
    console.log(`  Sensitive Warnings:   ${sensitiveWarnings}`)
    console.log(`  Sensitive Blocks:     ${sensitiveBlocks}`)
    console.log(`  Limit Reached:        ${limitReached}`)

    console.log('\n── Prompt Quality ──────────────────────────────')
    console.log(`  Total Analyses:       ${a.length}`)
    console.log(`  Avg Score:            ${safe(avgScore, 1)}`)

    console.log('\n================================================')
    console.log('  Full dashboard: /admin/metrics (admin only)')
    console.log('================================================\n')
  } catch (error) {
    console.error('Failed to run metrics report:', error)
  }
}

runMetricsReport()
