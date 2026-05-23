import 'server-only'
import { getSupabaseServerClient } from './server'
import { createShareToken } from '../result-access/share-token'
import type { Database, ModelProfileRow, PromptAnalysisRow, UsageEventRow, FeedbackEventRow } from './types'

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
  const supabase = getSupabaseServerClient() as any
  const { data, error } = await supabase
    .from('model_profiles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('Error fetching model profile by slug:', error)
    return null
  }
  return data
}

/**
 * Saves a new prompt analysis in the database.
 */
export async function createPromptAnalysis(
  analysis: Database['public']['Tables']['prompt_analyses']['Insert']
): Promise<PromptAnalysisRow | null> {
  const supabase = getSupabaseServerClient() as any
  const { data, error } = await supabase
    .from('prompt_analyses')
    .insert(analysis)
    .select()
    .single()

  if (error) {
    console.error('Error creating prompt analysis:', error)
    return null
  }
  return data
}

/**
 * Retrieves a prompt analysis by UUID and owner anonymous ID.
 * Enforces ownership check directly in the database query.
 */
export async function getPromptAnalysisForOwner(
  id: string,
  ownerAnonymousId: string
): Promise<PromptAnalysisRow | null> {
  const supabase = getSupabaseServerClient() as any
  const { data, error } = await supabase
    .from('prompt_analyses')
    .select('*')
    .eq('id', id)
    .eq('owner_anonymous_id', ownerAnonymousId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching prompt analysis for owner:', error)
    return null
  }
  return data
}

/**
 * Retrieves a prompt analysis by share token where public sharing is enabled.
 * Returns only the scrubbed fields to prevent leaking PII.
 */
export async function getSharedPromptAnalysis(
  shareToken: string
): Promise<SharedPromptAnalysis | null> {
  const supabase = getSupabaseServerClient() as any
  const { data, error } = await supabase
    .from('prompt_analyses')
    .select('input_prompt, working_language, selected_profile_slug, overall_score, score_level, analysis_json, improved_prompt, created_at, is_share_enabled')
    .eq('share_token', shareToken)
    .eq('is_share_enabled', true)
    .maybeSingle()

  if (error) {
    console.error('Error fetching shared prompt analysis:', error)
    return null
  }

  if (!data) return null

  // Destructure and omit is_share_enabled to ensure safe scrubbed output
  const { is_share_enabled, ...safeData } = data
  return safeData
}

/**
 * Saves a usage event record for tracking metrics.
 */
export async function createUsageEvent(
  event: Database['public']['Tables']['usage_events']['Insert']
): Promise<UsageEventRow | null> {
  const supabase = getSupabaseServerClient() as any
  const { data, error } = await supabase
    .from('usage_events')
    .insert(event)
    .select()
    .single()

  if (error) {
    console.error('Error creating usage event:', error)
    return null
  }
  return data
}

/**
 * Saves feedback for a prompt analysis.
 */
export async function createFeedbackEvent(
  event: Database['public']['Tables']['feedback_events']['Insert']
): Promise<FeedbackEventRow | null> {
  const supabase = getSupabaseServerClient() as any
  const { data, error } = await supabase
    .from('feedback_events')
    .insert(event)
    .select()
    .single()

  if (error) {
    console.error('Error creating feedback event:', error)
    return null
  }
  return data
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
  const supabase = getSupabaseServerClient() as any

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

  return data?.share_token || null
}

/**
 * Disables public sharing by setting is_share_enabled = false and clearing the share token.
 * Verifies ownership first.
 */
export async function disableShareLink(
  analysisId: string,
  ownerAnonymousId: string
): Promise<boolean> {
  const supabase = getSupabaseServerClient() as any

  const { error } = await supabase
    .from('prompt_analyses')
    .update({
      is_share_enabled: false,
      share_token: null
    })
    .eq('id', analysisId)
    .eq('owner_anonymous_id', ownerAnonymousId)

  if (error) {
    console.error('Error disabling share link:', error)
    return false
  }

  return true
}

/**
 * Counts successful prompt analysis executions for a given owner anonymous ID
 * in the current UTC calendar day.
 */
export async function getUsageCountToday(ownerAnonymousId: string): Promise<number> {
  const supabase = getSupabaseServerClient() as any
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)
  
  const { count, error } = await supabase
    .from('usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('owner_anonymous_id', ownerAnonymousId)
    .eq('event_type', 'analyze')
    .gte('created_at', startOfDay.toISOString())

  if (error) {
    console.error('Error counting usage events:', error)
    return 0
  }
  return count ?? 0
}

