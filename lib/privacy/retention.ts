import { getSupabaseAdminClient } from '../supabase/admin'
import { serverEnv } from '../env/server'

export interface RetentionCleanupResult {
  dryRun: boolean
  promptAnalysesDeleted: number
  usageEventsDeleted: number
  feedbackEventsDeleted: number
}

/**
 * Runs data retention cleanup on PromptPolish database tables.
 * Safe to run as dry-run to preview potential deletion counts.
 * Excludes active shared records (is_share_enabled = true) from deletion.
 */
export async function runRetentionCleanup(options?: {
  dryRun?: boolean
}): Promise<RetentionCleanupResult> {
  const dryRun = options?.dryRun ?? false
  const adminClient = getSupabaseAdminClient()

  const now = new Date()
  const analysisDays = serverEnv.RETENTION_ANONYMOUS_ANALYSIS_DAYS
  const usageDays = serverEnv.RETENTION_USAGE_EVENT_DAYS
  const feedbackDays = serverEnv.RETENTION_FEEDBACK_EVENT_DAYS

  // Compute UTC timestamp cutoffs
  const analysisCutoff = new Date(now.getTime() - analysisDays * 24 * 60 * 60 * 1000).toISOString()
  const usageCutoff = new Date(now.getTime() - usageDays * 24 * 60 * 60 * 1000).toISOString()
  const feedbackCutoff = new Date(now.getTime() - feedbackDays * 24 * 60 * 60 * 1000).toISOString()

  if (dryRun) {
    // 1. Query count of unshared prompt analyses older than cutoff
    const analysisQuery = adminClient
      .from('prompt_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('is_share_enabled', false)
      .lt('created_at', analysisCutoff)

    // 2. Query count of usage events older than cutoff
    const usageQuery = adminClient
      .from('usage_events')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', usageCutoff)

    // 3. Query count of feedback events older than cutoff
    const feedbackQuery = adminClient
      .from('feedback_events')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', feedbackCutoff)

    const [analysisRes, usageRes, feedbackRes] = await Promise.all([
      analysisQuery,
      usageQuery,
      feedbackQuery
    ])

    if (analysisRes.error) {
      console.error('Error fetching prompt analyses count for dry run:', analysisRes.error)
      throw new Error(`Dry run failed for prompt analyses: ${analysisRes.error.message}`)
    }
    if (usageRes.error) {
      console.error('Error fetching usage events count for dry run:', usageRes.error)
      throw new Error(`Dry run failed for usage events: ${usageRes.error.message}`)
    }
    if (feedbackRes.error) {
      console.error('Error fetching feedback events count for dry run:', feedbackRes.error)
      throw new Error(`Dry run failed for feedback events: ${feedbackRes.error.message}`)
    }

    return {
      dryRun: true,
      promptAnalysesDeleted: analysisRes.count ?? 0,
      usageEventsDeleted: usageRes.count ?? 0,
      feedbackEventsDeleted: feedbackRes.count ?? 0
    }
  }

  // Active execution: delete and count deleted records via .select('id')
  const deleteAnalysis = adminClient
    .from('prompt_analyses')
    .delete()
    .eq('is_share_enabled', false)
    .lt('created_at', analysisCutoff)
    .select('id')

  const deleteUsage = adminClient
    .from('usage_events')
    .delete()
    .lt('created_at', usageCutoff)
    .select('id')

  const deleteFeedback = adminClient
    .from('feedback_events')
    .delete()
    .lt('created_at', feedbackCutoff)
    .select('id')

  const [analysisRes, usageRes, feedbackRes] = await Promise.all([
    deleteAnalysis,
    deleteUsage,
    deleteFeedback
  ])

  if (analysisRes.error) {
    console.error('Error deleting expired prompt analyses:', analysisRes.error)
    throw new Error(`Failed to delete expired prompt analyses: ${analysisRes.error.message}`)
  }
  if (usageRes.error) {
    console.error('Error deleting expired usage events:', usageRes.error)
    throw new Error(`Failed to delete expired usage events: ${usageRes.error.message}`)
  }
  if (feedbackRes.error) {
    console.error('Error deleting expired feedback events:', feedbackRes.error)
    throw new Error(`Failed to delete expired feedback events: ${feedbackRes.error.message}`)
  }

  return {
    dryRun: false,
    promptAnalysesDeleted: analysisRes.data?.length ?? 0,
    usageEventsDeleted: usageRes.data?.length ?? 0,
    feedbackEventsDeleted: feedbackRes.data?.length ?? 0
  }
}
