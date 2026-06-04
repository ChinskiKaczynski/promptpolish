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

// Parse command line arguments
const args = process.argv.slice(2)
let days: number | undefined
let since: string | undefined
let sinceDate: Date | null = null

const daysIdx = args.findIndex(arg => arg === '--days')
if (daysIdx !== -1 && args[daysIdx + 1]) {
  const parsed = parseInt(args[daysIdx + 1], 10)
  if (!isNaN(parsed) && parsed > 0) {
    days = parsed
    sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - days)
  }
}

const sinceIdx = args.findIndex(arg => arg === '--since')
if (sinceIdx !== -1 && args[sinceIdx + 1]) {
  since = args[sinceIdx + 1].trim()
  const parsedDate = new Date(since)
  if (!isNaN(parsedDate.getTime())) {
    sinceDate = parsedDate
    if (sinceIdx > daysIdx) {
      days = undefined
    }
  }
}

async function runMetricsReport() {
  console.log('================================================')
  console.log('   PromptPolish MVP Private Beta Metrics        ')
  console.log(`   Generated on: ${new Date().toISOString()}   `)
  if (sinceDate) {
    console.log(`   Filter window: since ${sinceDate.toISOString()}${days ? ` (last ${days} days)` : ''}`)
  } else {
    console.log('   Filter window: all-time                      ')
  }
  console.log('================================================\n')

  try {
    // Build Supabase queries
    let usageQuery = supabase.from('usage_events').select('*')
    let feedbackQuery = supabase.from('feedback_events').select('*')
    let analysesQuery = supabase.from('prompt_analyses').select('*')
    let profilesQuery = supabase.from('user_profiles').select('*')

    if (sinceDate) {
      const startStr = sinceDate.toISOString()
      usageQuery = usageQuery.gte('created_at', startStr)
      feedbackQuery = feedbackQuery.gte('created_at', startStr)
      analysesQuery = analysesQuery.gte('created_at', startStr)
      profilesQuery = profilesQuery.gte('created_at', startStr)
    }

    const { data: usage, error: ue } = await usageQuery
    const { data: feedback, error: fe } = await feedbackQuery
    const { data: analyses, error: ae } = await analysesQuery
    const { data: profiles, error: pe } = await profilesQuery

    const errors = [ue, fe, ae, pe].filter(Boolean)
    if (errors.length > 0) {
      console.warn('Warning: Some queries had errors:', errors.map(e => e?.message).join(', '))
    }

    const u = (usage ?? []) as Array<{
      event_type: string
      owner_anonymous_id?: string | null
      user_id?: string | null
      created_at?: string | null
      metadata_json?: unknown
    }>
    const f = (feedback ?? []) as Array<{
      rating: 'up' | 'down'
      created_at?: string | null
    }>
    const a = (analyses ?? []) as Array<{
      is_share_enabled: boolean
      overall_score: number
      created_at?: string | null
    }>
    const p = (profiles ?? []) as Array<{
      plan_slug: string
      user_id: string
      created_at?: string | null
    }>

    // Core Funnel
    const started = u.filter(e => e.event_type === 'analysis_started').length
    const completed = u.filter(e => e.event_type === 'analysis_completed').length
    const failed = u.filter(e => e.event_type === 'analysis_failed').length
    const copies = u.filter(e => e.event_type === 'copy_improved_prompt' || e.event_type === 'copy').length
    const shareCreated = u.filter(e => e.event_type === 'share_link_created').length
    const shareDisabled = u.filter(e => e.event_type === 'share_link_disabled').length
    const exportMarkdown = u.filter(e => e.event_type === 'export_markdown').length
    const exportTxt = u.filter(e => e.event_type === 'export_txt').length
    const activeShares = a.filter(x => x.is_share_enabled).length
    const sensitiveBlocks = u.filter(e => e.event_type === 'sensitive_data_blocked').length
    const sensitiveWarnings = u.filter(e => e.event_type === 'sensitive_data_warning_shown').length
    const limitReached = u.filter(e => e.event_type === 'limit_reached').length
    const feedbackUp = f.filter(x => x.rating === 'up').length
    const feedbackDown = f.filter(x => x.rating === 'down').length

    // Stable calculations
    const isMismatch = completed > started
    const completionRateStr = isMismatch ? 'invalid/instrumentation mismatch' : pct(completed, started)
    
    const totalFinished = completed + failed
    const stableFailureRateVal = totalFinished > 0 ? (failed / totalFinished) * 100 : 0
    const stableFailureRateStr = totalFinished > 0 ? pct(failed, totalFinished) : '—'

    // Plans
    const freeUsers = p.filter(x => x.plan_slug === 'free').length
    const proUsers = p.filter(x => x.plan_slug === 'pro').length

    // Owners
    const completedOwners = u.filter(e => e.event_type === 'analysis_completed' && e.owner_anonymous_id).map(e => e.owner_anonymous_id as string)
    const ownerCounts: Record<string, number> = {}
    completedOwners.forEach(o => { ownerCounts[o] = (ownerCounts[o] || 0) + 1 })
    const returning = Object.values(ownerCounts).filter(c => c >= 2).length
    const uniqueCompleted = Object.keys(ownerCounts).length

    // Avg score
    const scores = a.map(x => x.overall_score).filter(s => typeof s === 'number' && !isNaN(s))
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

    // Beta signal calculation
    const copyRateVal = completed > 0 ? (copies / completed) * 100 : 0
    const totalFeedback = feedbackUp + feedbackDown
    const positiveFeedbackRatio = totalFeedback > 0 ? (feedbackUp / totalFeedback) * 100 : 0

    let betaSignal: 'INSUFFICIENT_DATA' | 'WEAK_SIGNAL' | 'MIXED_SIGNAL' | 'STRONG_SIGNAL' = 'INSUFFICIENT_DATA'
    if (completed < 20) {
      betaSignal = 'INSUFFICIENT_DATA'
    } else {
      if (copyRateVal < 20) {
        betaSignal = 'WEAK_SIGNAL'
      } else if (copyRateVal >= 20 && copyRateVal <= 40) {
        betaSignal = 'MIXED_SIGNAL'
      } else if (copyRateVal > 40 && positiveFeedbackRatio >= 70) {
        betaSignal = 'STRONG_SIGNAL'
      } else {
        betaSignal = 'MIXED_SIGNAL'
      }
    }

    let finalSignal = betaSignal
    const shouldDowngrade = stableFailureRateVal > 20 && betaSignal !== 'INSUFFICIENT_DATA'
    if (shouldDowngrade) {
      if (betaSignal === 'STRONG_SIGNAL') {
        finalSignal = 'MIXED_SIGNAL'
      } else if (betaSignal === 'MIXED_SIGNAL') {
        finalSignal = 'WEAK_SIGNAL'
      }
    }

    console.log('── Core Funnel ─────────────────────────────────')
    console.log(`  Started (events):     ${started}`)
    console.log(`  Completed (events):   ${completed}`)
    console.log(`  Total (analyses row): ${a.length}`)
    console.log(`  Failed (events):      ${failed}`)
    console.log(`  Completion Rate:      ${completionRateStr}`)
    console.log(`  Failure Rate (stable): ${stableFailureRateStr}`)
    if (isMismatch) {
      console.log(`  [WARNING] analysis_started is undercounted; completion rate is not reliable`)
    }

    console.log('\n── Value Metrics ───────────────────────────────')
    console.log(`  Copy Events:          ${copies}   (${pct(copies, completed)} of completed)`)
    console.log(`  Feedback (👍):        ${feedbackUp}`)
    console.log(`  Feedback (👎):        ${feedbackDown}`)
    console.log(`  Up/Down Ratio:        ${feedbackUp}:${feedbackDown} (${pct(feedbackUp, feedbackUp + feedbackDown)} positive)`)
    console.log(`  Share Links Created:  ${shareCreated}`)
    console.log(`  Share Links Disabled: ${shareDisabled}`)
    console.log(`  Active Public Shares: ${activeShares}`)
    console.log(`  Export Markdown:      ${exportMarkdown}`)
    console.log(`  Export TXT:           ${exportTxt}`)

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

    console.log('\n── Beta Signal ──────────────────────────────────')
    if (completed < 20) {
      console.log(`  [WARNING] Insufficient data to evaluate beta traction signals.`)
      console.log(`  Completed analyses (${completed}) is below the threshold of 20.`)
      console.log(`  Initial Signal:       ${betaSignal}`)
      console.log(`  Final Signal Level:   ${finalSignal}`)
    } else {
      console.log(`  Initial Signal:       ${betaSignal}`)
      if (shouldDowngrade) {
        console.log(`  Failure Rate Check:   >20% (${stableFailureRateStr}) -> Downgrade 1 level`)
        console.log(`  Final Signal Level:   ${finalSignal}`)
      } else {
        console.log(`  Final Signal Level:   ${finalSignal}`)
      }
    }

    console.log('\n================================================')
    console.log('  Full dashboard: /admin/metrics (admin only)')
    console.log('================================================\n')
  } catch (error) {
    console.error('Failed to run metrics report:', error)
  }
}

runMetricsReport()
