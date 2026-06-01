import 'server-only'
import { getSupabaseAdminClient } from '../supabase/admin'

export type MetricsWindow = 'allTime' | 'last30d' | 'last7d' | 'last24h'

export interface AggregatedMetrics {
  window: MetricsWindow
  startDate: string | null
  endDate: string

  coreFunnel: {
    analysis_started: number
    analysis_completed: number
    analysis_failed: number
    completion_rate: number
    failure_rate: number
    average_analyses_per_day: number
    latest_analysis_at: string | null
  }

  valueMetrics: {
    copy_improved_prompt: number
    copy_rate: number
    feedback_submitted: number
    feedback_rate: number
    feedback_up: number
    feedback_down: number
    positive_feedback_ratio: number
    share_link_created: number
    share_rate: number
    active_public_shares: number
    export_markdown: number
    export_pdf: number
  }

  retentionProxy: {
    unique_active_owners: number
    unique_owners_with_completed_analysis: number
    returning_owners_count: number
    returning_rate: number
    average_completed_analyses_per_owner: number
    median_completed_analyses_per_owner: number
    owner_usage_buckets: {
      one_analysis: number
      two_to_three: number
      four_to_ten: number
      more_than_ten: number
    }
  }

  plans: {
    free_users_count: number
    pro_users_count: number
    analyses_by_plan: {
      free: number
      pro: number
    } | null
  }

  reliability: {
    analysis_failed: number
    provider_error: number
    invalid_structured_output: number
    api_error: number
    failure_rate: number
    common_error_codes: Array<{ code: string; count: number }>
  }

  limits: {
    limit_reached: number
    limit_reached_rate: number
    owners_hitting_limit_count: number
    average_limit_reached_per_limited_owner: number
  }

  sensitiveDataSafety: {
    sensitive_data_warning_shown: number
    sensitive_data_blocked: number
    sensitive_warning_rate: number
    sensitive_block_rate: number
    risk_level_counts: {
      none: number
      low: number
      medium: number
      high: number
    }
    finding_type_counts: Record<string, number>
  }

  promptCharacteristics: {
    total_prompt_analyses: number
    analyses_by_working_language: Record<string, number>
    analyses_by_selected_profile_slug: Record<string, number>
    analyses_by_score_level: Record<string, number>
    average_overall_score: number
    median_overall_score: number
    score_distribution: {
      weak_0_39: number
      needs_work_40_59: number
      decent_60_74: number
      strong_75_89: number
      excellent_90_100: number
    }
    average_input_prompt_length: number
    average_improved_prompt_length: number
    prompt_length_buckets: {
      short: number
      medium: number
      long: number
      very_long: number
    }
  }

  costUsage: {
    ai_cost_status: string
    ai_cost_reason: string
    total_input_tokens: number | null
    total_output_tokens: number | null
    total_tokens: number | null
    average_tokens_per_completed_analysis: number | null
    estimated_total_cost: number | null
    estimated_cost_per_analysis: number | null
  }

  eventCoverage: Array<{
    eventType: string
    countAllTime: number
    status: 'present' | 'no_events_yet' | 'unknown'
  }>

  productInterpretation: {
    copy_rate_status: 'strong' | 'acceptable' | 'weak' | 'unknown'
    feedback_status: 'strong' | 'weak' | 'unknown'
    retention_status: 'strong' | 'weak' | 'unknown'
    reliability_status: 'strong' | 'warning' | 'blocking' | 'unknown'
    paid_readiness:
      | 'not_ready'
      | 'improve_product_quality_first'
      | 'add_auth_history_next'
      | 'consider_export_pro_value_layer_later'
  }
}

export async function fetchAggregatedMetrics(
  window: MetricsWindow
): Promise<AggregatedMetrics> {
  const supabase = getSupabaseAdminClient()
  const now = new Date()

  let startDate: Date | null = null
  if (window === 'last30d') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  } else if (window === 'last7d') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (window === 'last24h') {
    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  }

  // 1. Fetch tables
  let usageQuery = supabase.from('usage_events').select('*')
  let feedbackQuery = supabase.from('feedback_events').select('*')
  let analysesQuery = supabase.from('prompt_analyses').select('*')
  let profilesQuery = supabase.from('user_profiles').select('*')

  if (startDate) {
    const startStr = startDate.toISOString()
    usageQuery = usageQuery.gte('created_at', startStr)
    feedbackQuery = feedbackQuery.gte('created_at', startStr)
    analysesQuery = analysesQuery.gte('created_at', startStr)
    profilesQuery = profilesQuery.gte('created_at', startStr)
  }

  const [
    { data: usageEvents, error: usageErr },
    { data: feedbackEvents, error: feedbackErr },
    { data: promptAnalyses, error: analysesErr },
    { data: userProfiles, error: profilesErr }
  ] = await Promise.all([
    usageQuery,
    feedbackQuery,
    analysesQuery,
    profilesQuery
  ])

  // Aggregate errors for safe reporting
  const errors: string[] = []
  if (usageErr) errors.push(`usage_events: ${usageErr.message}`)
  if (feedbackErr) errors.push(`feedback_events: ${feedbackErr.message}`)
  if (analysesErr) errors.push(`prompt_analyses: ${analysesErr.message}`)
  if (profilesErr) errors.push(`user_profiles: ${profilesErr.message}`)

  if (errors.length > 0) {
    console.warn('[Metrics aggregation warning]: DB queries encountered errors:', errors.join('; '))
  }

  // Fallbacks to empty arrays with explicit type casting to prevent Type '{}' or 'unknown' errors
  const usage = (usageEvents ?? []) as {
    event_type: string
    owner_anonymous_id?: string | null
    user_id?: string | null
    created_at?: string | Date | null
    metadata_json?: unknown
  }[]
  const feedback = (feedbackEvents ?? []) as {
    rating?: string | null
    created_at?: string | Date | null
  }[]
  const analyses = (promptAnalyses ?? []) as {
    is_share_enabled?: boolean | null
    sensitive_data_risk_level?: string | null
    sensitive_data_findings_json?: unknown
    overall_score?: number | null
    working_language?: string | null
    selected_profile_slug?: string | null
    input_prompt?: string | null
    improved_prompt?: string | null
    score_level?: string | null
  }[]
  const profiles = (userProfiles ?? []) as { user_id?: string | null; plan_slug?: string | null }[]

  // Fetch all-time usage event types for the event coverage audit
  const { data: allUsageEventTypes } = await supabase
    .from('usage_events')
    .select('event_type')

  const allEvents = (allUsageEventTypes ?? []) as { event_type: string }[]

  // Do NOT query subscriptions table. STRIPE_ENABLED check is enforced by NOT querying subscriptions.

  // Time window duration in days
  let durationInDays = 1
  if (window === 'last30d') {
    durationInDays = 30
  } else if (window === 'last7d') {
    durationInDays = 7
  } else if (window === 'last24h') {
    durationInDays = 1
  } else {
    // allTime duration: from earliest usage event or 1 day
    if (usage.length > 0) {
      const timestamps = usage
        .map((e) => new Date(e.created_at as string).getTime())
        .filter((t) => !isNaN(t))
      if (timestamps.length > 0) {
        const earliest = Math.min(...timestamps)
        durationInDays = Math.max(1, (now.getTime() - earliest) / (1000 * 60 * 60 * 24))
      }
    }
  }

  // --- 1. CORE FUNNEL ---
  const analysis_started = usage.filter((e) => e.event_type === 'analysis_started').length
  const analysis_completed = usage.filter((e) => e.event_type === 'analysis_completed').length
  const analysis_failed = usage.filter((e) => e.event_type === 'analysis_failed').length

  const completion_rate = analysis_started > 0 ? (analysis_completed / analysis_started) * 100 : 0
  const failure_rate = analysis_started > 0 ? (analysis_failed / analysis_started) * 100 : 0
  const average_analyses_per_day = analysis_completed / durationInDays

  const completedEvents = usage.filter((e) => e.event_type === 'analysis_completed')
  let latest_analysis_at: string | null = null
  if (completedEvents.length > 0) {
    const timestamps = completedEvents
      .map((e) => new Date(e.created_at as string).getTime())
      .filter((t) => !isNaN(t))
    if (timestamps.length > 0) {
      latest_analysis_at = new Date(Math.max(...timestamps)).toISOString()
    }
  }

  // --- 2. VALUE METRICS ---
  const copy_improved_prompt = usage.filter((e) => e.event_type === 'copy_improved_prompt' || e.event_type === 'copy').length
  const copy_rate = analysis_completed > 0 ? (copy_improved_prompt / analysis_completed) * 100 : 0

  const feedback_submitted = feedback.length
  const feedback_rate = analysis_completed > 0 ? (feedback_submitted / analysis_completed) * 100 : 0
  const feedback_up = feedback.filter((f) => f.rating === 'up').length
  const feedback_down = feedback.filter((f) => f.rating === 'down').length
  const positive_feedback_ratio = feedback_submitted > 0 ? (feedback_up / feedback_submitted) * 100 : 0

  const share_link_created = usage.filter((e) => e.event_type === 'share_link_created').length
  const share_rate = analysis_completed > 0 ? (share_link_created / analysis_completed) * 100 : 0
  const active_public_shares = analyses.filter((a) => a.is_share_enabled === true).length

  const export_markdown = usage.filter((e) => e.event_type === 'export_markdown').length
  const export_pdf = usage.filter((e) => e.event_type === 'export_pdf').length

  // --- 3. RETENTION PROXY ---
  const allOwners = new Set(usage.map((e) => e.owner_anonymous_id).filter(Boolean).map(String))
  const unique_active_owners = allOwners.size

  const completedOwners = usage
    .filter((e) => e.event_type === 'analysis_completed' && e.owner_anonymous_id)
    .map((e) => String(e.owner_anonymous_id))
  const unique_owners_with_completed_analysis = new Set(completedOwners).size

  // Group by owner
  const completedCountByOwner: Record<string, number> = {}
  completedOwners.forEach((owner) => {
    completedCountByOwner[owner] = (completedCountByOwner[owner] || 0) + 1
  })

  const completedCounts = Object.values(completedCountByOwner)
  const returning_owners_count = completedCounts.filter((c) => c >= 2).length
  const returning_rate =
    unique_owners_with_completed_analysis > 0
      ? (returning_owners_count / unique_owners_with_completed_analysis) * 100
      : 0

  const average_completed_analyses_per_owner =
    unique_owners_with_completed_analysis > 0
      ? analysis_completed / unique_owners_with_completed_analysis
      : 0

  let median_completed_analyses_per_owner = 0
  if (completedCounts.length > 0) {
    const sorted = [...completedCounts].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    median_completed_analyses_per_owner =
      sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }

  const owner_usage_buckets = {
    one_analysis: completedCounts.filter((c) => c === 1).length,
    two_to_three: completedCounts.filter((c) => c === 2 || c === 3).length,
    four_to_ten: completedCounts.filter((c) => c >= 4 && c <= 10).length,
    more_than_ten: completedCounts.filter((c) => c > 10).length
  }

  // --- 4. PLANS ---
  // If window is allTime we want total counts. If it's a specific window we fetch signups in that window
  // For safety and correctness, we report the plan slug counts of the user profiles that exist in the active set
  const free_users_count = profiles.filter((p) => p.plan_slug === 'free').length
  const pro_users_count = profiles.filter((p) => p.plan_slug === 'pro').length

  // Analyses by plan: completed analyses mapping to profiles.plan_slug
  // Map user_id to plan_slug
  const profilePlanMap: Record<string, string> = {}
  profiles.forEach((p) => {
    if (p.user_id) {
      profilePlanMap[p.user_id] = (p.plan_slug as string) || 'free'
    }
  })

  let analyses_by_plan: { free: number; pro: number } | null = { free: 0, pro: 0 }
  try {
    usage
      .filter((e) => e.event_type === 'analysis_completed')
      .forEach((e) => {
        const plan = e.user_id ? profilePlanMap[String(e.user_id)] || 'free' : 'free'
        if (plan === 'pro') {
          analyses_by_plan!.pro++
        } else {
          analyses_by_plan!.free++
        }
      })
  } catch {
    analyses_by_plan = null
  }

  // --- 5. RELIABILITY ---
  const provider_error = usage.filter((e) => e.event_type === 'provider_error').length
  const invalid_structured_output = usage.filter((e) => e.event_type === 'invalid_structured_output').length
  const api_error = usage.filter((e) => e.event_type === 'api_error').length

  const errorMetadataList = usage
    .filter((e) => ['analysis_failed', 'provider_error', 'api_error'].includes(e.event_type))
    .map((e) => e.metadata_json)
    .filter(Boolean) as Record<string, unknown>[]

  const errorCodeCounts: Record<string, number> = {}
  errorMetadataList.forEach((meta) => {
    const code = String(meta.error_code || meta.code || 'UNKNOWN_ERROR')
    errorCodeCounts[code] = (errorCodeCounts[code] || 0) + 1
  })

  const common_error_codes = Object.entries(errorCodeCounts)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // --- 6. LIMITS ---
  const limit_reached = usage.filter((e) => e.event_type === 'limit_reached').length
  const limit_reached_rate = unique_active_owners > 0 ? (limit_reached / unique_active_owners) * 100 : 0

  const limitedOwners = usage
    .filter((e) => e.event_type === 'limit_reached' && e.owner_anonymous_id)
    .map((e) => e.owner_anonymous_id)
  const owners_hitting_limit_count = new Set(limitedOwners).size

  const average_limit_reached_per_limited_owner =
    owners_hitting_limit_count > 0 ? limit_reached / owners_hitting_limit_count : 0

  // --- 7. SENSITIVE DATA SAFETY ---
  const sensitive_data_warning_shown = usage.filter((e) => e.event_type === 'sensitive_data_warning_shown').length
  const sensitive_data_blocked = usage.filter((e) => e.event_type === 'sensitive_data_blocked').length

  const sensitive_warning_rate = analysis_started > 0 ? (sensitive_data_warning_shown / analysis_started) * 100 : 0
  const sensitive_block_rate = analysis_started > 0 ? (sensitive_data_blocked / analysis_started) * 100 : 0

  const risk_level_counts = {
    none: analyses.filter((a) => a.sensitive_data_risk_level === 'none' || !a.sensitive_data_risk_level).length,
    low: analyses.filter((a) => a.sensitive_data_risk_level === 'low').length,
    medium: analyses.filter((a) => a.sensitive_data_risk_level === 'medium').length,
    high: analyses.filter((a) => a.sensitive_data_risk_level === 'high').length
  }

  const finding_type_counts: Record<string, number> = {}
  analyses.forEach((a) => {
    const findings = a.sensitive_data_findings_json as unknown[] | null
    if (Array.isArray(findings)) {
      findings.forEach((f) => {
        if (f && typeof f === 'object' && 'type' in f) {
          const type = String((f as { type?: unknown }).type)
          if (type) {
            finding_type_counts[type] = (finding_type_counts[type] || 0) + 1
          }
        }
      })
    }
  })

  // --- 8. PROMPT CHARACTERISTICS ---
  const total_prompt_analyses = analyses.length

  const analyses_by_working_language: Record<string, number> = {}
  const analyses_by_selected_profile_slug: Record<string, number> = {}
  const analyses_by_score_level: Record<string, number> = {}

  let totalScore = 0
  let validScoresCount = 0
  const scores: number[] = []

  let totalInputLength = 0
  let totalImprovedLength = 0

  const prompt_length_buckets = {
    short: 0,
    medium: 0,
    long: 0,
    very_long: 0
  }

  const score_distribution = {
    weak_0_39: 0,
    needs_work_40_59: 0,
    decent_60_74: 0,
    strong_75_89: 0,
    excellent_90_100: 0
  }

  analyses.forEach((a) => {
    // Lang
    const lang = a.working_language || 'unknown'
    analyses_by_working_language[lang] = (analyses_by_working_language[lang] || 0) + 1

    // Profile slug
    const profile = a.selected_profile_slug || 'unknown'
    analyses_by_selected_profile_slug[profile] = (analyses_by_selected_profile_slug[profile] || 0) + 1

    // Score level
    const level = a.score_level || 'unknown'
    analyses_by_score_level[level] = (analyses_by_score_level[level] || 0) + 1

    // Score distributions
    const score = a.overall_score
    if (typeof score === 'number' && !isNaN(score)) {
      totalScore += score
      validScoresCount++
      scores.push(score)

      if (score >= 0 && score <= 39) score_distribution.weak_0_39++
      else if (score >= 40 && score <= 59) score_distribution.needs_work_40_59++
      else if (score >= 60 && score <= 74) score_distribution.decent_60_74++
      else if (score >= 75 && score <= 89) score_distribution.strong_75_89++
      else if (score >= 90 && score <= 100) score_distribution.excellent_90_100++
    }

    // Input prompt length (strictly character count, never return prompt text)
    const inputPromptStr = a.input_prompt || ''
    const inputLen = inputPromptStr.length
    totalInputLength += inputLen

    if (inputLen <= 100) prompt_length_buckets.short++
    else if (inputLen <= 500) prompt_length_buckets.medium++
    else if (inputLen <= 2000) prompt_length_buckets.long++
    else prompt_length_buckets.very_long++

    // Improved prompt length
    const improvedPromptStr = a.improved_prompt || ''
    totalImprovedLength += improvedPromptStr.length
  })

  const average_overall_score = validScoresCount > 0 ? totalScore / validScoresCount : 0
  let median_overall_score = 0
  if (scores.length > 0) {
    const sorted = [...scores].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    median_overall_score = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }

  const average_input_prompt_length = total_prompt_analyses > 0 ? totalInputLength / total_prompt_analyses : 0
  const average_improved_prompt_length = total_prompt_analyses > 0 ? totalImprovedLength / total_prompt_analyses : 0

  // --- 9. COST / USAGE ---
  // Token data is not stored explicitly in PromptAnalysisRow, return unknown
  const costUsage = {
    ai_cost_status: 'unknown',
    ai_cost_reason: 'Reliable token/cost metadata not found',
    total_input_tokens: null,
    total_output_tokens: null,
    total_tokens: null,
    average_tokens_per_completed_analysis: null,
    estimated_total_cost: null,
    estimated_cost_per_analysis: null
  }

  // --- 10. EVENT COVERAGE AUDIT ---
  const expectedEvents = [
    'analysis_started',
    'analysis_completed',
    'analysis_failed',
    'copy_improved_prompt',
    'copy',
    'feedback_submitted',
    'share_link_created',
    'share_link_disabled',
    'limit_reached',
    'sensitive_data_warning_shown',
    'sensitive_data_blocked',
    'provider_error',
    'invalid_structured_output',
    'api_error',
    'export_markdown',
    'export_pdf'
  ]

  const eventCountsAllTime: Record<string, number> = {}
  allEvents.forEach((e) => {
    eventCountsAllTime[e.event_type] = (eventCountsAllTime[e.event_type] || 0) + 1
  })

  // Add feedback count separately
  // Since feedback_submitted maps to entries in feedback_events, count feedback_events table size for all time
  let feedbackAllTimeCount = 0
  try {
    const { count } = await supabase.from('feedback_events').select('id', { count: 'exact', head: true })
    feedbackAllTimeCount = count ?? 0
  } catch {
    // Ignore error
  }

  const eventCoverage = expectedEvents.map((type) => {
    let count = 0
    if (type === 'feedback_submitted') {
      count = feedbackAllTimeCount
    } else {
      count = eventCountsAllTime[type] || 0
      // Support double copy event name mapping
      if (type === 'copy_improved_prompt') {
        count += eventCountsAllTime['copy'] || 0
      }
    }

    return {
      eventType: type,
      countAllTime: count,
      status: (count > 0 ? 'present' : 'no_events_yet') as 'present' | 'no_events_yet' | 'unknown'
    }
  })

  // --- 11. PRODUCT INTERPRETATION ---
  let copy_rate_status: 'strong' | 'acceptable' | 'weak' | 'unknown' = 'unknown'
  if (analysis_completed >= 5) {
    if (copy_rate >= 40) copy_rate_status = 'strong'
    else if (copy_rate >= 20) copy_rate_status = 'acceptable'
    else copy_rate_status = 'weak'
  }

  let feedback_status: 'strong' | 'weak' | 'unknown' = 'unknown'
  if (feedback_submitted >= 3) {
    if (positive_feedback_ratio >= 70) feedback_status = 'strong'
    else feedback_status = 'weak'
  }

  let retention_status: 'strong' | 'weak' | 'unknown' = 'unknown'
  if (unique_owners_with_completed_analysis >= 5) {
    if (returning_rate >= 25) retention_status = 'strong'
    else retention_status = 'weak'
  }

  let reliability_status: 'strong' | 'warning' | 'blocking' | 'unknown' = 'unknown'
  if (analysis_started > 0) {
    if (failure_rate < 5) reliability_status = 'strong'
    else if (failure_rate <= 15) reliability_status = 'warning'
    else reliability_status = 'blocking'
  }

  let paid_readiness: AggregatedMetrics['productInterpretation']['paid_readiness'] = 'not_ready'
  if (reliability_status === 'blocking' || reliability_status === 'warning') {
    paid_readiness = 'improve_product_quality_first'
  } else if (unique_owners_with_completed_analysis < 10) {
    paid_readiness = 'not_ready'
  } else if (returning_rate < 15) {
    paid_readiness = 'improve_product_quality_first'
  } else {
    paid_readiness = 'consider_export_pro_value_layer_later'
  }

  return {
    window,
    startDate: startDate ? startDate.toISOString() : null,
    endDate: now.toISOString(),
    coreFunnel: {
      analysis_started,
      analysis_completed,
      analysis_failed,
      completion_rate,
      failure_rate,
      average_analyses_per_day,
      latest_analysis_at
    },
    valueMetrics: {
      copy_improved_prompt,
      copy_rate,
      feedback_submitted,
      feedback_rate,
      feedback_up,
      feedback_down,
      positive_feedback_ratio,
      share_link_created,
      share_rate,
      active_public_shares,
      export_markdown,
      export_pdf
    },
    retentionProxy: {
      unique_active_owners,
      unique_owners_with_completed_analysis,
      returning_owners_count,
      returning_rate,
      average_completed_analyses_per_owner,
      median_completed_analyses_per_owner,
      owner_usage_buckets
    },
    plans: {
      free_users_count,
      pro_users_count,
      analyses_by_plan
    },
    reliability: {
      analysis_failed,
      provider_error,
      invalid_structured_output,
      api_error,
      failure_rate,
      common_error_codes
    },
    limits: {
      limit_reached,
      limit_reached_rate,
      owners_hitting_limit_count,
      average_limit_reached_per_limited_owner
    },
    sensitiveDataSafety: {
      sensitive_data_warning_shown,
      sensitive_data_blocked,
      sensitive_warning_rate,
      sensitive_block_rate,
      risk_level_counts,
      finding_type_counts
    },
    promptCharacteristics: {
      total_prompt_analyses,
      analyses_by_working_language,
      analyses_by_selected_profile_slug,
      analyses_by_score_level,
      average_overall_score,
      median_overall_score,
      score_distribution,
      average_input_prompt_length,
      average_improved_prompt_length,
      prompt_length_buckets
    },
    costUsage,
    eventCoverage,
    productInterpretation: {
      copy_rate_status,
      feedback_status,
      retention_status,
      reliability_status,
      paid_readiness
    }
  }
}
