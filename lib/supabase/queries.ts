import 'server-only'
import { getSupabaseAdminClient } from './admin'
import { createShareToken } from '../result-access/share-token'
import type { Database, ModelProfileRow, PromptAnalysisRow, UsageEventRow, FeedbackEventRow, UserProfileRow, SensitiveDataFinding, AnalysisResult } from './types'
import { serializeDbError } from './error-serializer'

export type SharedPromptAnalysis = Pick<
  PromptAnalysisRow,
  | 'working_language'
  | 'selected_profile_slug'
  | 'overall_score'
  | 'score_level'
  | 'analysis_json'
  | 'improved_prompt'
  | 'created_at'
>

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function validateUuid(id: string, name: string): void {
  if (!UUID_REGEX.test(id)) {
    throw new Error(`Invalid UUID format for ${name}: "${id}"`)
  }
}

/**
 * Fetches a model profile matching the slug.
 */
export async function getModelProfileBySlug(slug: string): Promise<ModelProfileRow | null> {
  if (typeof slug !== 'string' || !slug.trim()) {
    throw new Error('Invalid slug parameter.')
  }
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('model_profiles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('Error fetching model profile by slug:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }
  return data ? (data as unknown as ModelProfileRow) : null
}

/**
 * Saves a new prompt analysis in the database.
 */
export async function createPromptAnalysis(
  analysis: Database['public']['Tables']['prompt_analyses']['Insert']
): Promise<PromptAnalysisRow | null> {
  validateUuid(analysis.owner_anonymous_id, 'owner_anonymous_id')
  if (analysis.user_id) {
    validateUuid(analysis.user_id, 'user_id')
  }

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('prompt_analyses')
    .insert(analysis)
    .select()
    .single()

  if (error) {
    console.error('Error creating prompt analysis:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }
  return data ? (data as unknown as PromptAnalysisRow) : null
}

/**
 * Atomically saves prompt analysis and completes the reservation in a database transaction.
 */
export async function saveAnalysisAndCompleteReservation(params: {
  id: string
  owner_anonymous_id: string
  user_id: string | null
  input_prompt: string
  working_language: string
  selected_profile_slug: string
  task_goal?: string | null
  task_type?: string | null
  expected_output_format?: string | null
  constraints?: string | null
  sensitive_data_risk_level: string
  sensitive_data_findings_json: SensitiveDataFinding[]
  overall_score: number
  score_level: string
  analysis_json: AnalysisResult
  improved_prompt: string
  model_id_used: string
  provider_used: string
  analysis_schema_version: string
  scoring_version: string
  model_profile_version: string
  prompt_template_version: string
  title: string
  audit_mode: string | null
  reservation_id: string
}): Promise<boolean> {
  validateUuid(params.id, 'id')
  validateUuid(params.owner_anonymous_id, 'owner_anonymous_id')
  if (params.user_id) {
    validateUuid(params.user_id, 'user_id')
  }
  validateUuid(params.reservation_id, 'reservation_id')

  const supabase = getSupabaseAdminClient()
  const rpcClient = supabase as unknown as {
    rpc: (
      fnName: string,
      args: Record<string, unknown>
    ) => Promise<{
      data: unknown
      error: {
        message: string
        code?: string
        details?: string
        hint?: string
      } | null
    }>
  }

  const { data, error } = await rpcClient.rpc('save_analysis_and_complete_reservation', {
    p_analysis_id: params.id,
    p_owner_anonymous_id: params.owner_anonymous_id,
    p_user_id: params.user_id,
    p_input_prompt: params.input_prompt,
    p_working_language: params.working_language,
    p_selected_profile_slug: params.selected_profile_slug,
    p_task_goal: params.task_goal,
    p_task_type: params.task_type,
    p_expected_output_format: params.expected_output_format,
    p_constraints: params.constraints,
    p_sensitive_data_risk_level: params.sensitive_data_risk_level,
    p_sensitive_data_findings_json: params.sensitive_data_findings_json,
    p_overall_score: params.overall_score,
    p_score_level: params.score_level,
    p_analysis_json: params.analysis_json,
    p_improved_prompt: params.improved_prompt,
    p_model_id_used: params.model_id_used,
    p_provider_used: params.provider_used,
    p_analysis_schema_version: params.analysis_schema_version,
    p_scoring_version: params.scoring_version,
    p_model_profile_version: params.model_profile_version,
    p_prompt_template_version: params.prompt_template_version,
    p_title: params.title,
    p_audit_mode: params.audit_mode,
    p_reservation_id: params.reservation_id
  })

  if (error) {
    console.error('Error saving analysis and completing reservation:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }

  return data === true
}


/**
 * Retrieves a prompt analysis by UUID and owner anonymous ID or authenticated userId.
 * Enforces ownership check directly in the database query.
 */
export async function getPromptAnalysisForOwner(
  id: string,
  ownerAnonymousId?: string | null,
  userId?: string
): Promise<PromptAnalysisRow | null> {
  validateUuid(id, 'id')
  if (userId) {
    validateUuid(userId, 'userId')
  }
  if (ownerAnonymousId !== undefined && ownerAnonymousId !== null) {
    validateUuid(ownerAnonymousId, 'ownerAnonymousId')
  } else if (!userId) {
    throw new Error('Anonymous access requires a valid owner UUID')
  }

  const supabase = getSupabaseAdminClient()
  let query = supabase
    .from('prompt_analyses')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)

  if (userId) {
    const hasValidAnonId = ownerAnonymousId !== undefined && ownerAnonymousId !== null && UUID_REGEX.test(ownerAnonymousId)
    if (hasValidAnonId) {
      query = query.or(`user_id.eq.${userId},and(user_id.is.null,owner_anonymous_id.eq.${ownerAnonymousId})`)
    } else {
      query = query.eq('user_id', userId)
    }
  } else {
    query = query.is('user_id', null).eq('owner_anonymous_id', ownerAnonymousId!)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('Error fetching prompt analysis for owner:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }

  if (!data) return null

  const analysis = data as unknown as PromptAnalysisRow

  // Defensive double-check in JS
  if (analysis.user_id) {
    if (analysis.user_id !== userId) {
      return null // Access Denied
    }
  } else {
    if (!ownerAnonymousId || analysis.owner_anonymous_id !== ownerAnonymousId) {
      return null // Access Denied
    }
  }

  return analysis
}

/**
 * Links any anonymous prompt analyses owned by a secure session owner cookie
 * to the newly authenticated user_id, merging guest history transparently.
 */
export async function linkAnonymousAnalyses(
  ownerAnonymousId: string,
  userId: string
): Promise<boolean> {
  validateUuid(ownerAnonymousId, 'ownerAnonymousId')
  validateUuid(userId, 'userId')

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from('prompt_analyses')
    .update({ user_id: userId })
    .eq('owner_anonymous_id', ownerAnonymousId)
    .is('user_id', null)

  if (error) {
    console.error('Error linking anonymous analyses:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }
  return true
}

/**
 * Retrieves the complete prompt history for a user, combining records
 * belonging to either their authenticated user_id or their current anonymous cookie.
 */
export async function getPromptAnalysesForUser(
  userId: string | null | undefined,
  ownerAnonymousId: string | null | undefined,
  filters?: {
    search?: string
    lang?: string
    profile?: string
    taskType?: string
    isFavorite?: boolean
    sortBy?: 'newest' | 'oldest' | 'highest_score' | 'lowest_score'
    limit?: number
    offset?: number
  }
): Promise<PromptAnalysisRow[]> {
  if (userId === '') {
    throw new Error('Invalid UUID format for userId: ""')
  }
  if (ownerAnonymousId === '') {
    throw new Error('Invalid UUID format for ownerAnonymousId: ""')
  }

  const parsedUserId = userId || null
  const parsedOwnerAnonymousId = ownerAnonymousId || null

  if (!parsedUserId && !parsedOwnerAnonymousId) {
    throw new Error('Ownership identity missing: either userId or ownerAnonymousId must be provided')
  }

  if (parsedUserId) {
    validateUuid(parsedUserId, 'userId')
  }

  if (parsedOwnerAnonymousId) {
    validateUuid(parsedOwnerAnonymousId, 'ownerAnonymousId')
  } else if (!parsedUserId) {
    throw new Error('Anonymous access requires a valid owner UUID')
  }

  // Verify the sort parameter uses a strict allowlist
  const allowedSorts = ['newest', 'oldest', 'highest_score', 'lowest_score'] as const
  const sortBy = filters?.sortBy && allowedSorts.includes(filters.sortBy)
    ? filters.sortBy
    : 'newest'

  // Clamp pagination boundaries defensively
  const rawLimit = filters?.limit ?? 20
  const limit = Math.max(1, Math.min(rawLimit, 100))
  const rawOffset = filters?.offset ?? 0
  const offset = Math.max(0, rawOffset)

  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase.rpc('search_user_prompt_history', {
    p_user_id: parsedUserId,
    p_owner_anonymous_id: parsedOwnerAnonymousId ?? null,
    p_search_term: filters?.search || '',
    p_lang: filters?.lang || 'all',
    p_profile: filters?.profile || 'all',
    p_task_type: filters?.taskType || 'all',
    p_is_favorite: filters?.isFavorite ?? null,
    p_sort_by: sortBy,
    p_limit: limit,
    p_offset: offset
  })

  if (error) {
    console.error('Error fetching prompt analyses for user via RPC:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }

  const rows = (data ?? []) as unknown as PromptAnalysisRow[]

  // Defensive post-filter to prevent cross-user leakage on shared owner_anonymous_id session
  const hasValidAnonId = parsedOwnerAnonymousId !== null && UUID_REGEX.test(parsedOwnerAnonymousId)
  return rows.filter(row => {
    if (row.user_id) {
      return parsedUserId ? row.user_id === parsedUserId : false
    }
    return hasValidAnonId ? row.owner_anonymous_id === parsedOwnerAnonymousId : false
  })
}

/**
 * Retrieves the user profile from the database matching the userId.
 */
export async function getUserProfile(userId: string): Promise<UserProfileRow | null> {
  validateUuid(userId, 'userId')
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching user profile:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }
  return data ? (data as unknown as UserProfileRow) : null
}

/**
 * Legacy helper for direct profile upserts.
 *
 * Do not use this for auth/session sync because it may overwrite plan_slug.
 * Prefer ensureUserProfile() for login/session flows.
 * Prefer setUserPlanSlug() for entitlement/billing changes.
 */
export async function createUserProfile(
  profile: Database['public']['Tables']['user_profiles']['Insert']
): Promise<UserProfileRow | null> {
  validateUuid(profile.user_id, 'user_id')
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(profile, {
      onConflict: 'user_id',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }
  return data ? (data as unknown as UserProfileRow) : null
}

/**
 * Ensures a user profile exists without changing the user's plan.
 *
 * Use this for auth/session sync.
 * It creates a Free profile only if the profile does not exist yet.
 * If the profile already exists, it updates safe identity fields only
 * and preserves the current plan_slug.
 */
export async function ensureUserProfile(profile: {
  user_id: string
  email: string
  display_name?: string | null
}): Promise<UserProfileRow | null> {
  validateUuid(profile.user_id, 'user_id')
  const supabase = getSupabaseAdminClient()
  const existing = await getUserProfile(profile.user_id)

  const fallbackDisplayName = profile.email
    ? profile.email.split('@')[0]
    : null

  const displayName =
    profile.display_name ??
    existing?.display_name ??
    fallbackDisplayName

  if (existing) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        email: profile.email,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.user_id)
      .select()
      .single()

    if (error) {
      console.error('Error ensuring existing user profile:', serializeDbError(error))
      throw new Error(`Database error: ${error.message}`)
    }

    return data ? (data as unknown as UserProfileRow) : null
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: profile.user_id,
      email: profile.email,
      display_name: displayName,
      plan_slug: 'free',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating initial user profile:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }

  return data ? (data as unknown as UserProfileRow) : null
}

/**
 * Updates a user's plan explicitly.
 *
 * Use this only from trusted server-side entitlement/billing code.
 * Auth/session sync must never call this.
 */
export async function setUserPlanSlug(profile: {
  user_id: string
  email: string
  display_name?: string | null
  plan_slug: 'free' | 'pro'
}): Promise<UserProfileRow | null> {
  validateUuid(profile.user_id, 'user_id')
  const supabase = getSupabaseAdminClient()
  const existing = await getUserProfile(profile.user_id)

  const fallbackDisplayName = profile.email
    ? profile.email.split('@')[0]
    : null

  const displayName =
    profile.display_name ??
    existing?.display_name ??
    fallbackDisplayName

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: profile.user_id,
        email: profile.email,
        display_name: displayName,
        plan_slug: profile.plan_slug,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      },
    )
    .select()
    .single()

  if (error) {
    console.error('Error setting user plan slug:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }

  const row = data ? (data as unknown as UserProfileRow) : null

  if (!row || row.plan_slug !== profile.plan_slug) {
    console.error('User plan slug update did not persist expected value.')
    return null
  }

  return row
}

/**
 * Retrieves a prompt analysis by share token where public sharing is enabled.
 * Returns only the scrubbed fields to prevent leaking PII.
 */
export async function getSharedPromptAnalysis(
  shareToken: string
): Promise<SharedPromptAnalysis | null> {
  if (!shareToken) return null
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('prompt_analyses')
    .select('working_language, selected_profile_slug, overall_score, score_level, analysis_json, improved_prompt, created_at, is_share_enabled')
    .eq('share_token', shareToken)
    .eq('is_share_enabled', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    console.error('Error fetching shared prompt analysis:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }

  if (!data) return null

  // Build scrubbed object manually from generic row to avoid destructuring unconstrained Record<string, unknown>
  // input_prompt is intentionally excluded from the public share payload.
  // The public share page does not display the original prompt text.
  const row = data as unknown as PromptAnalysisRow
  return {
    working_language: row.working_language,
    selected_profile_slug: row.selected_profile_slug,
    overall_score: row.overall_score,
    score_level: row.score_level,
    analysis_json: row.analysis_json,
    improved_prompt: row.improved_prompt,
    created_at: row.created_at
  }
}

/**
 * Saves a usage event record for tracking metrics.
 */
export async function createUsageEvent(
  event: Database['public']['Tables']['usage_events']['Insert']
): Promise<UsageEventRow | null> {
  validateUuid(event.owner_anonymous_id, 'owner_anonymous_id')
  if (event.user_id) {
    validateUuid(event.user_id, 'user_id')
  }
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('usage_events')
    .insert(event)
    .select()
    .single()

  if (error) {
    console.error('Error creating usage event:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }
  return data ? (data as unknown as UsageEventRow) : null
}

/**
 * Saves or updates feedback for a prompt analysis.
 * Enforces at most one feedback record per analysis and identity.
 */
export async function createFeedbackEvent(
  event: Database['public']['Tables']['feedback_events']['Insert']
): Promise<FeedbackEventRow | null> {
  validateUuid(event.analysis_id, 'analysis_id')
  if (event.user_id) {
    validateUuid(event.user_id, 'user_id')
  }
  if (event.owner_anonymous_id) {
    validateUuid(event.owner_anonymous_id, 'owner_anonymous_id')
  } else if (!event.user_id) {
    throw new Error('Ownership identity missing: either user_id or owner_anonymous_id must be provided')
  }

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.rpc('upsert_feedback_event', {
    p_analysis_id: event.analysis_id,
    p_rating: event.rating,
    p_comment: event.comment ?? null,
    p_user_id: event.user_id || null,
    p_owner_anonymous_id: event.owner_anonymous_id || ''
  })

  if (error) {
    console.error('Error upserting feedback event:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }

  const rows = data as unknown as FeedbackEventRow[]
  return rows && rows.length > 0 ? rows[0] : null
}


/**
 * Special copy tracker helper which saves a usage event with the type 'copy'.
 */
export async function createCopyEvent(
  ownerAnonymousId: string,
  analysisId: string
): Promise<UsageEventRow | null> {
  validateUuid(ownerAnonymousId, 'ownerAnonymousId')
  validateUuid(analysisId, 'analysisId')
  return createUsageEvent({
    owner_anonymous_id: ownerAnonymousId,
    event_type: 'copy',
    metadata_json: { analysis_id: analysisId }
  })
}

/**
 * Enables public sharing for a prompt analysis by setting is_share_enabled = true
 * and generating a secure share token. Verifies ownership first.
 */
export async function createShareLink(
  analysisId: string,
  ownerAnonymousId?: string | null,
  userId?: string
): Promise<string | null> {
  validateUuid(analysisId, 'analysisId')
  if (userId) {
    validateUuid(userId, 'userId')
  }
  if (ownerAnonymousId !== undefined && ownerAnonymousId !== null) {
    validateUuid(ownerAnonymousId, 'ownerAnonymousId')
  } else if (!userId) {
    throw new Error('Anonymous access requires a valid owner UUID')
  }

  const shareToken = createShareToken()
  const supabase = getSupabaseAdminClient()
  let query = supabase
    .from('prompt_analyses')
    .update({
      is_share_enabled: true,
      share_token: shareToken
    })
    .eq('id', analysisId)
    .is('deleted_at', null)

  if (userId) {
    const hasValidAnonId = ownerAnonymousId !== undefined && ownerAnonymousId !== null && UUID_REGEX.test(ownerAnonymousId)
    if (hasValidAnonId) {
      query = query.or(`user_id.eq.${userId},and(user_id.is.null,owner_anonymous_id.eq.${ownerAnonymousId})`)
    } else {
      query = query.eq('user_id', userId)
    }
  } else {
    query = query.is('user_id', null).eq('owner_anonymous_id', ownerAnonymousId!)
  }

  const { data, error } = await query.select('share_token').maybeSingle()

  if (error) {
    console.error('Error creating share link:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }

  const typedData = data as unknown as { share_token: string | null } | null
  return typedData?.share_token ?? null
}

/**
 * Disables public sharing by setting is_share_enabled = false and clearing the share token.
 * Verifies ownership first.
 *
 * Returns true only when a row owned by the owner was found and updated.
 * Returns false for non-owners, missing records, or DB errors — preventing
 * a silent false-success.
 */
export async function disableShareLink(
  analysisId: string,
  ownerAnonymousId?: string | null,
  userId?: string
): Promise<boolean> {
  validateUuid(analysisId, 'analysisId')
  if (userId) {
    validateUuid(userId, 'userId')
  }
  if (ownerAnonymousId !== undefined && ownerAnonymousId !== null) {
    validateUuid(ownerAnonymousId, 'ownerAnonymousId')
  } else if (!userId) {
    throw new Error('Anonymous access requires a valid owner UUID')
  }

  const supabase = getSupabaseAdminClient()
  let query = supabase
    .from('prompt_analyses')
    .update({
      is_share_enabled: false,
      share_token: null
    })
    .eq('id', analysisId)

  if (userId) {
    const hasValidAnonId = ownerAnonymousId !== undefined && ownerAnonymousId !== null && UUID_REGEX.test(ownerAnonymousId)
    if (hasValidAnonId) {
      query = query.or(`user_id.eq.${userId},and(user_id.is.null,owner_anonymous_id.eq.${ownerAnonymousId})`)
    } else {
      query = query.eq('user_id', userId)
    }
  } else {
    query = query.is('user_id', null).eq('owner_anonymous_id', ownerAnonymousId!)
  }

  const { data, error } = await query.select('id').maybeSingle()

  if (error) {
    console.error('Error disabling share link:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }

  const typedData = data as unknown as { id: string } | null
  return typedData !== null
}

/**
 * Counts successful prompt analysis executions for a given owner anonymous ID
 * in the current UTC calendar day.
 */
export async function getUsageCountToday(ownerAnonymousId: string): Promise<number> {
  validateUuid(ownerAnonymousId, 'ownerAnonymousId')
  const supabase = getSupabaseAdminClient()
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('usage_events')
    .select('id', { count: 'exact' })
    .limit(1)
    .eq('owner_anonymous_id', ownerAnonymousId)
    .eq('event_type', 'analysis_completed')
    .gte('created_at', startOfDay.toISOString())

  if (error) {
    console.error('Error counting usage events:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }
  return count ?? 0
}

/**
 * Counts successful prompt analyses in the current UTC calendar day for a user (either logged-in or anonymous).
 */
export async function getUsageCountTodayForUser(
  ownerAnonymousId?: string | null,
  userId?: string | null
): Promise<number> {
  if (userId) {
    validateUuid(userId, 'userId')
  }
  if (ownerAnonymousId !== undefined && ownerAnonymousId !== null) {
    validateUuid(ownerAnonymousId, 'ownerAnonymousId')
  } else if (!userId) {
    throw new Error('Anonymous access requires a valid owner UUID')
  }
  const supabase = getSupabaseAdminClient()
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

  let query = supabase
    .from('usage_reservations')
    .select('id, status, created_at')
    .gte('created_at', startOfDay.toISOString())

  if (userId) {
    query = query.eq('user_id', userId)
  } else {
    query = query.eq('owner_anonymous_id', ownerAnonymousId!)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error counting usage events today for user:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }

  const count = (data as unknown as { status: string; created_at: string }[] ?? []).filter((row) => {
    return row.status === 'completed' || (row.status === 'reserved' && new Date(row.created_at) >= fiveMinutesAgo)
  }).length

  return count
}

/**
 * Counts successful prompt analyses in the current UTC calendar month for a user (either logged-in or anonymous).
 */
export async function getUsageCountThisMonthForUser(
  ownerAnonymousId?: string | null,
  userId?: string | null
): Promise<number> {
  if (userId) {
    validateUuid(userId, 'userId')
  }
  if (ownerAnonymousId !== undefined && ownerAnonymousId !== null) {
    validateUuid(ownerAnonymousId, 'ownerAnonymousId')
  } else if (!userId) {
    throw new Error('Anonymous access requires a valid owner UUID')
  }
  const supabase = getSupabaseAdminClient()
  const startOfMonth = new Date()
  startOfMonth.setUTCDate(1)
  startOfMonth.setUTCHours(0, 0, 0, 0)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

  let query = supabase
    .from('usage_reservations')
    .select('id, status, created_at')
    .gte('created_at', startOfMonth.toISOString())

  if (userId) {
    query = query.eq('user_id', userId)
  } else {
    query = query.eq('owner_anonymous_id', ownerAnonymousId!)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error counting usage events this month for user:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }

  const count = (data as unknown as { status: string; created_at: string }[] ?? []).filter((row) => {
    return row.status === 'completed' || (row.status === 'reserved' && new Date(row.created_at) >= fiveMinutesAgo)
  }).length

  return count
}

/**
 * Soft deletes a prompt analysis by updating deleted_at = now().
 * Enforces ownership check first.
 */
export async function softDeleteAnalysis(
  id: string,
  ownerAnonymousId?: string | null,
  userId?: string
): Promise<boolean> {
  validateUuid(id, 'id')
  if (userId) {
    validateUuid(userId, 'userId')
  }
  if (ownerAnonymousId !== undefined && ownerAnonymousId !== null) {
    validateUuid(ownerAnonymousId, 'ownerAnonymousId')
  } else if (!userId) {
    throw new Error('Anonymous access requires a valid owner UUID')
  }

  const supabase = getSupabaseAdminClient()
  let query = supabase
    .from('prompt_analyses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (userId) {
    const hasValidAnonId = ownerAnonymousId !== undefined && ownerAnonymousId !== null && UUID_REGEX.test(ownerAnonymousId)
    if (hasValidAnonId) {
      query = query.or(`user_id.eq.${userId},and(user_id.is.null,owner_anonymous_id.eq.${ownerAnonymousId})`)
    } else {
      query = query.eq('user_id', userId)
    }
  } else {
    query = query.is('user_id', null).eq('owner_anonymous_id', ownerAnonymousId!)
  }

  const { data, error } = await query.select('id').maybeSingle()

  if (error) {
    console.error('Error soft deleting analysis:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }

  const typedData = data as unknown as { id: string } | null
  return typedData !== null
}

/**
 * Toggles the favorite flag on a prompt analysis.
 * Enforces ownership check first.
 */
export async function toggleFavoriteAnalysis(
  id: string,
  ownerAnonymousId: string | null | undefined,
  userId: string | undefined,
  isFavorite: boolean
): Promise<boolean> {
  validateUuid(id, 'id')
  if (userId) {
    validateUuid(userId, 'userId')
  }
  if (ownerAnonymousId !== undefined && ownerAnonymousId !== null) {
    validateUuid(ownerAnonymousId, 'ownerAnonymousId')
  } else if (!userId) {
    throw new Error('Anonymous access requires a valid owner UUID')
  }

  const supabase = getSupabaseAdminClient()
  let query = supabase
    .from('prompt_analyses')
    .update({ is_favorite: isFavorite })
    .eq('id', id)

  if (userId) {
    const hasValidAnonId = ownerAnonymousId !== undefined && ownerAnonymousId !== null && UUID_REGEX.test(ownerAnonymousId)
    if (hasValidAnonId) {
      query = query.or(`user_id.eq.${userId},and(user_id.is.null,owner_anonymous_id.eq.${ownerAnonymousId})`)
    } else {
      query = query.eq('user_id', userId)
    }
  } else {
    query = query.is('user_id', null).eq('owner_anonymous_id', ownerAnonymousId!)
  }

  const { data, error } = await query.select('id').maybeSingle()

  if (error) {
    console.error('Error toggling favorite analysis:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }

  const typedData = data as unknown as { id: string } | null
  return typedData !== null
}

/**
 * Counts usage events recorded for an identity in the last N seconds.
 */
export async function getRecentEventsCount(
  ownerAnonymousId: string | null | undefined,
  userId: string | null,
  seconds: number
): Promise<number> {
  if (userId) {
    validateUuid(userId, 'userId')
  }
  if (ownerAnonymousId !== undefined && ownerAnonymousId !== null) {
    validateUuid(ownerAnonymousId, 'ownerAnonymousId')
  } else if (!userId) {
    throw new Error('Anonymous access requires a valid owner UUID')
  }

  const supabase = getSupabaseAdminClient()
  const cutoff = new Date(Date.now() - seconds * 1000)

  let query = supabase
    .from('usage_events')
    .select('id', { count: 'exact' })
    .gte('created_at', cutoff.toISOString())

  if (userId) {
    query = query.eq('user_id', userId)
  } else {
    query = query.eq('owner_anonymous_id', ownerAnonymousId!)
  }

  const { count, error } = await query

  if (error) {
    console.error('Error counting recent events:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }
  return count ?? 0
}

/**
 * Atomically acquires a usage reservation in the database, checking plan limits.
 * Returns a status string: 'success:reserved', 'success:completed', 'daily_limit_reached', or 'monthly_limit_reached'.
 */
export async function acquireReservation(
  reservationId: string,
  ownerAnonymousId: string,
  userId: string | null
): Promise<string> {
  validateUuid(reservationId, 'reservationId')
  validateUuid(ownerAnonymousId, 'ownerAnonymousId')
  if (userId) {
    validateUuid(userId, 'userId')
  }

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.rpc('acquire_usage_reservation', {
    p_reservation_id: reservationId,
    p_owner_anonymous_id: ownerAnonymousId,
    p_user_id: userId
  })

  if (error) {
    console.error('Error acquiring usage reservation:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }

  return data as string
}

/**
 * Completes a usage reservation (status = 'completed').
 */
export async function completeReservation(reservationId: string): Promise<boolean> {
  validateUuid(reservationId, 'reservationId')
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.rpc('complete_usage_reservation', {
    p_reservation_id: reservationId
  })

  if (error) {
    console.error('Error completing usage reservation:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }

  return !!data
}

/**
 * Releases/cancels a usage reservation (status = 'released').
 */
export async function releaseReservation(reservationId: string): Promise<boolean> {
  validateUuid(reservationId, 'reservationId')
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.rpc('release_usage_reservation', {
    p_reservation_id: reservationId
  })

  if (error) {
    console.error('Error releasing usage reservation:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }

  return !!data
}

/**
 * Counts feedback_submitted events recorded for an identity in the last N seconds.
 */
export async function getRecentFeedbackCount(
  ownerAnonymousId: string | null | undefined,
  userId: string | null,
  seconds: number
): Promise<number> {
  if (userId) {
    validateUuid(userId, 'userId')
  }
  if (ownerAnonymousId !== undefined && ownerAnonymousId !== null) {
    validateUuid(ownerAnonymousId, 'ownerAnonymousId')
  } else if (!userId) {
    throw new Error('Anonymous access requires a valid owner UUID')
  }

  const supabase = getSupabaseAdminClient()
  const cutoff = new Date(Date.now() - seconds * 1000)

  let query = supabase
    .from('usage_events')
    .select('id', { count: 'exact' })
    .eq('event_type', 'feedback_submitted')
    .gte('created_at', cutoff.toISOString())

  if (userId) {
    query = query.eq('user_id', userId)
  } else {
    query = query.eq('owner_anonymous_id', ownerAnonymousId!)
  }

  const { count, error } = await query

  if (error) {
    console.error('Error counting recent feedback events:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }
  return count ?? 0
}

/**
 * Atomically checks a sliding time-window limit and inserts a usage event if allowed.
 */
export async function insertUsageEventWithLimit(params: {
  eventId: string
  ownerAnonymousId: string
  userId: string | null
  eventType: string
  metadataJson: Record<string, unknown>
  windowSeconds: number
  maxCount: number
}): Promise<boolean> {
  validateUuid(params.eventId, 'eventId')
  validateUuid(params.ownerAnonymousId, 'ownerAnonymousId')
  if (params.userId) {
    validateUuid(params.userId, 'userId')
  }

  const supabase = getSupabaseAdminClient()
  const rpcClient = supabase as unknown as {
    rpc: (
      fnName: string,
      args: Record<string, unknown>
    ) => Promise<{
      data: unknown
      error: {
        message: string
        code?: string
        details?: string
        hint?: string
      } | null
    }>
  }

  const { data, error } = await rpcClient.rpc('insert_usage_event_with_limit', {
    p_event_id: params.eventId,
    p_owner_anonymous_id: params.ownerAnonymousId,
    p_user_id: params.userId,
    p_event_type: params.eventType,
    p_metadata_json: params.metadataJson,
    p_window_seconds: params.windowSeconds,
    p_max_count: params.maxCount
  })

  if (error) {
    console.error('Error inserting usage event with limit:', serializeDbError(error))
    throw new Error(`Database error: ${error.message}`)
  }

  return !!data
}