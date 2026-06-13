import { getSupabaseAdminClient } from '../supabase/admin'
import { serverEnv } from '../env/server'

export interface RetentionCleanupResult {
  dryRun: boolean
  promptAnalysesDeleted: number
  usageEventsDeleted: number
  feedbackEventsDeleted: number
}

/**
 * Validates that the configured retention day value is a positive finite integer.
 * Throws a visible error if the configuration is invalid to prevent a broad delete.
 */
function validateRetentionDays(value: number, label: string): void {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      `[Retention] Invalid configuration: ${label} must be a positive integer, got: ${value}. ` +
      `Refusing to execute retention to prevent unintended data loss.`
    )
  }
}

/**
 * Runs data retention cleanup on PromptPolish database tables.
 *
 * Anonymous analysis cleanup requires ALL of:
 *   - user_id IS NULL              (authenticated analyses are NEVER deleted here)
 *   - is_favorite = false          (favorited analyses are preserved)
 *   - is_share_enabled = false     (shared analyses are preserved)
 *   - deleted_at IS NULL           (soft-deleted analyses follow their own policy)
 *   - created_at < cutoff          (only expired analyses)
 *
 * Authenticated analyses, favorites, shared analyses, and recent anonymous
 * analyses are all preserved. This function must NEVER delete them.
 *
 * Safe to run as dry-run to preview potential deletion counts.
 * Dry-run and active-delete use exactly the same predicates.
 */
export async function runRetentionCleanup(options?: {
  dryRun?: boolean
}): Promise<RetentionCleanupResult> {
  const dryRun = options?.dryRun ?? false
  const adminClient = getSupabaseAdminClient()

  // Validate configuration before computing cutoffs.
  // An invalid config throws immediately — no broad delete occurs.
  const analysisDays = serverEnv.RETENTION_ANONYMOUS_ANALYSIS_DAYS
  const usageDays = serverEnv.RETENTION_USAGE_EVENT_DAYS
  const feedbackDays = serverEnv.RETENTION_FEEDBACK_EVENT_DAYS

  validateRetentionDays(analysisDays, 'RETENTION_ANONYMOUS_ANALYSIS_DAYS')
  validateRetentionDays(usageDays, 'RETENTION_USAGE_EVENT_DAYS')
  validateRetentionDays(feedbackDays, 'RETENTION_FEEDBACK_EVENT_DAYS')

  const now = new Date()
  const analysisCutoff = new Date(now.getTime() - analysisDays * 24 * 60 * 60 * 1000).toISOString()
  const usageCutoff = new Date(now.getTime() - usageDays * 24 * 60 * 60 * 1000).toISOString()
  const feedbackCutoff = new Date(now.getTime() - feedbackDays * 24 * 60 * 60 * 1000).toISOString()

  if (dryRun) {
    // Count candidates using the exact same predicates as the active delete.
    //
    // Analysis predicate (MUST match active delete below exactly):
    //   user_id IS NULL
    //   AND is_favorite = false
    //   AND is_share_enabled = false
    //   AND deleted_at IS NULL
    //   AND created_at < analysisCutoff
    const analysisQuery = adminClient
      .from('prompt_analyses')
      .select('*', { count: 'exact', head: true })
      .is('user_id', null)
      .eq('is_favorite', false)
      .eq('is_share_enabled', false)
      .is('deleted_at', null)
      .lt('created_at', analysisCutoff)

    const usageQuery = adminClient
      .from('usage_events')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', usageCutoff)

    const feedbackQuery = adminClient
      .from('feedback_events')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', feedbackCutoff)

    const [analysisRes, usageRes, feedbackRes] = await Promise.all([
      analysisQuery,
      usageQuery,
      feedbackQuery
    ])

    // Fail visibly — never report success on DB error
    if (analysisRes.error) {
      console.error('[Retention] Error fetching prompt analyses count for dry run:', analysisRes.error)
      throw new Error(`Dry run failed for prompt analyses: ${analysisRes.error.message}`)
    }
    if (usageRes.error) {
      console.error('[Retention] Error fetching usage events count for dry run:', usageRes.error)
      throw new Error(`Dry run failed for usage events: ${usageRes.error.message}`)
    }
    if (feedbackRes.error) {
      console.error('[Retention] Error fetching feedback events count for dry run:', feedbackRes.error)
      throw new Error(`Dry run failed for feedback events: ${feedbackRes.error.message}`)
    }

    return {
      dryRun: true,
      promptAnalysesDeleted: analysisRes.count ?? 0,
      usageEventsDeleted: usageRes.count ?? 0,
      feedbackEventsDeleted: feedbackRes.count ?? 0
    }
  }

  // Active execution: delete using the exact same predicates as dry-run above.
  //
  // Analysis predicate (MUST match dry-run count above exactly):
  //   user_id IS NULL
  //   AND is_favorite = false
  //   AND is_share_enabled = false
  //   AND deleted_at IS NULL
  //   AND created_at < analysisCutoff
  const deleteAnalysis = adminClient
    .from('prompt_analyses')
    .delete()
    .is('user_id', null)
    .eq('is_favorite', false)
    .eq('is_share_enabled', false)
    .is('deleted_at', null)
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

  // Fail visibly — never silently swallow DB errors
  if (analysisRes.error) {
    console.error('[Retention] Error deleting expired prompt analyses:', analysisRes.error)
    throw new Error(`Failed to delete expired prompt analyses: ${analysisRes.error.message}`)
  }
  if (usageRes.error) {
    console.error('[Retention] Error deleting expired usage events:', usageRes.error)
    throw new Error(`Failed to delete expired usage events: ${usageRes.error.message}`)
  }
  if (feedbackRes.error) {
    console.error('[Retention] Error deleting expired feedback events:', feedbackRes.error)
    throw new Error(`Failed to delete expired feedback events: ${feedbackRes.error.message}`)
  }

  return {
    dryRun: false,
    promptAnalysesDeleted: analysisRes.data?.length ?? 0,
    usageEventsDeleted: usageRes.data?.length ?? 0,
    feedbackEventsDeleted: feedbackRes.data?.length ?? 0
  }
}
