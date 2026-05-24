import 'server-only'
import { getSupabaseServerClient } from './server'
import { getSupabaseAdminClient } from './admin'
import { createShareToken } from '../result-access/share-token'
import type { Database, ModelProfileRow, PromptAnalysisRow, UsageEventRow, FeedbackEventRow, UserProfileRow } from './types'

function serializeDbError(error: unknown) {
  if (!error) return null

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    }
  }

  if (typeof error === 'object') {
    return {
      ...error,
      ownProperties: Object.getOwnPropertyNames(error),
      json: JSON.stringify(error),
    }
  }

  return {
    value: String(error),
  }
}

export type SharedPromptAnalysis = Pick<
  PromptAnalysisRow,
  | 'input_prompt'
  | 'working_language'
  | 'selected_profile_slug'
  | 'overall_score'
  | 'score_level'
  | 'analysis_json'
  | 'improved_prompt'
  | 'created_at'
>

/**
 * Fetches a model profile matching the slug.
 */
export async function getModelProfileBySlug(slug: string): Promise<ModelProfileRow | null> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('model_profiles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('Error fetching model profile by slug:', error)
    return null
  }
  return data ? (data as unknown as ModelProfileRow) : null
}

/**
 * Saves a new prompt analysis in the database.
 */
export async function createPromptAnalysis(
  analysis: Database['public']['Tables']['prompt_analyses']['Insert']
): Promise<PromptAnalysisRow | null> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('prompt_analyses')
    .insert(analysis)
    .select()
    .single()

  if (error) {
    console.error('Error creating prompt analysis:', error)
    return null
  }
  return data ? (data as unknown as PromptAnalysisRow) : null
}

/**
 * Retrieves a prompt analysis by UUID and owner anonymous ID or authenticated userId.
 * Enforces ownership check directly in the database query.
 */
export async function getPromptAnalysisForOwner(
  id: string,
  ownerAnonymousId: string,
  userId?: string
): Promise<PromptAnalysisRow | null> {
  const supabase = getSupabaseServerClient()
  let query = supabase
    .from('prompt_analyses')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)

  if (userId) {
    query = query.or(`owner_anonymous_id.eq.${ownerAnonymousId},user_id.eq.${userId}`)
  } else {
    query = query.eq('owner_anonymous_id', ownerAnonymousId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('Error fetching prompt analysis for owner:', error)
    return null
  }
  return data ? (data as unknown as PromptAnalysisRow) : null
}

/**
 * Links any anonymous prompt analyses owned by a secure session owner cookie
 * to the newly authenticated user_id, merging guest history transparently.
 */
export async function linkAnonymousAnalyses(
  ownerAnonymousId: string,
  userId: string
): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  const { error } = await supabase
    .from('prompt_analyses')
    .update({ user_id: userId })
    .eq('owner_anonymous_id', ownerAnonymousId)
    .is('user_id', null)

  if (error) {
    console.error('Error linking anonymous analyses:', error)
    return false
  }
  return true
}

/**
 * Retrieves the complete prompt history for a user, combining records
 * belonging to either their authenticated user_id or their current anonymous cookie.
 */
export async function getPromptAnalysesForUser(
  userId: string,
  ownerAnonymousId: string,
  filters?: {
    search?: string
    lang?: string
    profile?: string
    taskType?: string
    isFavorite?: boolean
  }
): Promise<PromptAnalysisRow[]> {
  const supabase = getSupabaseServerClient()
  let query = supabase
    .from('prompt_analyses')
    .select('*')
    .is('deleted_at', null)
    .or(`user_id.eq.${userId},owner_anonymous_id.eq.${ownerAnonymousId}`)

  if (filters?.lang && filters.lang !== 'all') {
    query = query.eq('working_language', filters.lang)
  }
  if (filters?.profile && filters.profile !== 'all') {
    query = query.eq('selected_profile_slug', filters.profile)
  }
  if (filters?.taskType && filters.taskType !== 'all') {
    query = query.eq('task_type', filters.taskType)
  }
  if (filters?.isFavorite) {
    query = query.eq('is_favorite', true)
  }
  if (filters?.search) {
    query = query.or(`input_prompt.ilike.%${filters.search}%,title.ilike.%${filters.search}%`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching prompt analyses for user:', error)
    return []
  }
  return (data ?? []) as unknown as PromptAnalysisRow[]
}

/**
 * Retrieves the user profile from the database matching the userId.
 */
export async function getUserProfile(userId: string): Promise<UserProfileRow | null> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
  return data ? (data as unknown as UserProfileRow) : null
}

/**
 * Creates or updates the user profile when a user logs in or registers.
 */
export async function createUserProfile(
  profile: Database['public']['Tables']['user_profiles']['Insert']
): Promise<UserProfileRow | null> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(profile)
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    return null
  }
  return data ? (data as unknown as UserProfileRow) : null
}

/**
 * Retrieves a prompt analysis by share token where public sharing is enabled.
 * Returns only the scrubbed fields to prevent leaking PII.
 */
export async function getSharedPromptAnalysis(
  shareToken: string
): Promise<SharedPromptAnalysis | null> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('prompt_analyses')
    .select('input_prompt, working_language, selected_profile_slug, overall_score, score_level, analysis_json, improved_prompt, created_at, is_share_enabled')
    .eq('share_token', shareToken)
    .eq('is_share_enabled', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    console.error('Error fetching shared prompt analysis:', error)
    return null
  }

  if (!data) return null

  // Build scrubbed object manually from generic row to avoid destructuring unconstrained Record<string, unknown>
  const row = data as unknown as PromptAnalysisRow
  return {
    input_prompt: row.input_prompt,
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
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('usage_events')
    .insert(event)
    .select()
    .single()

  if (error) {
    console.error('Error creating usage event:', serializeDbError(error))
    return null
  }
  return data ? (data as unknown as UsageEventRow) : null
}

/**
 * Saves feedback for a prompt analysis.
 */
export async function createFeedbackEvent(
  event: Database['public']['Tables']['feedback_events']['Insert']
): Promise<FeedbackEventRow | null> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('feedback_events')
    .insert(event)
    .select()
    .single()

  if (error) {
    console.error('Error creating feedback event:', error)
    return null
  }
  return data ? (data as unknown as FeedbackEventRow) : null
}

/**
 * Special copy tracker helper which saves a usage event with the type 'copy'.
 */
export async function createCopyEvent(
  ownerAnonymousId: string,
  analysisId: string
): Promise<UsageEventRow | null> {
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
  ownerAnonymousId: string
): Promise<string | null> {
  const shareToken = createShareToken()
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from('prompt_analyses')
    .update({
      is_share_enabled: true,
      share_token: shareToken
    })
    .eq('id', analysisId)
    .eq('owner_anonymous_id', ownerAnonymousId)
    .select('share_token')
    .maybeSingle()

  if (error) {
    console.error('Error creating share link:', error)
    return null
  }

  const typedData = data as unknown as { share_token: string | null } | null
  return typedData?.share_token ?? null
}

/**
 * Disables public sharing by setting is_share_enabled = false and clearing the share token.
 * Verifies ownership first.
 *
 * Returns true only when a row owned by ownerAnonymousId was found and updated.
 * Returns false for non-owners, missing records, or DB errors — preventing
 * a silent false-success when the WHERE clause matches 0 rows.
 */
export async function disableShareLink(
  analysisId: string,
  ownerAnonymousId: string
): Promise<boolean> {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from('prompt_analyses')
    .update({
      is_share_enabled: false,
      share_token: null
    })
    .eq('id', analysisId)
    .eq('owner_anonymous_id', ownerAnonymousId)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Error disabling share link:', error)
    return false
  }

  const typedData = data as unknown as { id: string } | null
  // typedData is null when the WHERE clause matched 0 rows (non-owner or wrong id)
  return typedData !== null
}

/**
 * Counts successful prompt analysis executions for a given owner anonymous ID
 * in the current UTC calendar day.
 */
export async function getUsageCountToday(ownerAnonymousId: string): Promise<number> {
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
    console.error('Error counting usage events:', error)
    return 0
  }
  return count ?? 0
}

/**
 * Counts successful prompt analyses in the current UTC calendar day for a user (either logged-in or anonymous).
 */
export async function getUsageCountTodayForUser(
  ownerAnonymousId: string,
  userId?: string | null
): Promise<number> {
  const supabase = getSupabaseAdminClient()
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)

  let query = supabase
    .from('usage_events')
    .select('id', { count: 'exact' })
    .eq('event_type', 'analysis_completed')
    .gte('created_at', startOfDay.toISOString())

  if (userId) {
    query = query.eq('user_id', userId)
  } else {
    query = query.eq('owner_anonymous_id', ownerAnonymousId)
  }

  const { count, error } = await query

  if (error) {
    console.error('Error counting usage events today for user:', serializeDbError(error))
    return 0
  }
  return count ?? 0
}

/**
 * Counts successful prompt analyses in the current UTC calendar month for a user (either logged-in or anonymous).
 */
export async function getUsageCountThisMonthForUser(
  ownerAnonymousId: string,
  userId?: string | null
): Promise<number> {
  const supabase = getSupabaseAdminClient()
  const startOfMonth = new Date()
  startOfMonth.setUTCDate(1)
  startOfMonth.setUTCHours(0, 0, 0, 0)

  let query = supabase
    .from('usage_events')
    .select('id', { count: 'exact' })
    .limit(1)
    .eq('event_type', 'analysis_completed')
    .gte('created_at', startOfMonth.toISOString())

  if (userId) {
    query = query.eq('user_id', userId)
  } else {
    query = query.eq('owner_anonymous_id', ownerAnonymousId)
  }

  const { count, error } = await query

  if (error) {
    console.error('Error counting usage events this month for user:', serializeDbError(error))
    return 0
  }
  return count ?? 0
}


/**
 * Soft deletes a prompt analysis by updating deleted_at = now().
 * Enforces ownership check directly in the database.
 */
export async function softDeleteAnalysis(
  id: string,
  ownerAnonymousId: string,
  userId?: string
): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  let query = supabase
    .from('prompt_analyses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (userId) {
    query = query.or(`owner_anonymous_id.eq.${ownerAnonymousId},user_id.eq.${userId}`)
  } else {
    query = query.eq('owner_anonymous_id', ownerAnonymousId)
  }

  const { data, error } = await query.select('id').maybeSingle()

  const typedData = data as unknown as { id: string } | null

  if (error || !typedData) {
    console.error('Error soft deleting analysis:', error)
    return false
  }
  return true
}

/**
 * Toggles the favorite flag on a prompt analysis.
 * Enforces ownership check directly in the database.
 */
export async function toggleFavoriteAnalysis(
  id: string,
  ownerAnonymousId: string,
  userId: string | undefined,
  isFavorite: boolean
): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  let query = supabase
    .from('prompt_analyses')
    .update({ is_favorite: isFavorite })
    .eq('id', id)

  if (userId) {
    query = query.or(`owner_anonymous_id.eq.${ownerAnonymousId},user_id.eq.${userId}`)
  } else {
    query = query.eq('owner_anonymous_id', ownerAnonymousId)
  }

  const { data, error } = await query.select('id').maybeSingle()

  const typedData = data as unknown as { id: string } | null

  if (error || !typedData) {
    console.error('Error toggling favorite analysis:', error)
    return false
  }
  return true
}


