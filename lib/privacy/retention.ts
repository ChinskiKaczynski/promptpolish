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

  const rpcFn = adminClient.rpc as unknown as (
    fnName: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: unknown }>

  const { data, error } = await rpcFn('run_retention_cleanup', {
    p_analysis_cutoff: analysisCutoff,
    p_usage_cutoff: usageCutoff,
    p_feedback_cutoff: feedbackCutoff,
    p_dry_run: dryRun
  })

  if (error) {
    console.error('[Retention] Error running retention cleanup via RPC:', error)
    const msg = error && typeof error === 'object' && 'message' in error
      ? String((error as Record<string, unknown>).message)
      : String(error)
    throw new Error(`Database error: ${msg}`)
  }

  const result = data as {
    dryRun: boolean
    promptAnalysesDeleted: number
    usageEventsDeleted: number
    feedbackEventsDeleted: number
  }
  return {
    dryRun: result.dryRun,
    promptAnalysesDeleted: result.promptAnalysesDeleted,
    usageEventsDeleted: result.usageEventsDeleted,
    feedbackEventsDeleted: result.feedbackEventsDeleted
  }
}

