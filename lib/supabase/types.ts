import type { AnalysisResult } from '@/lib/ai/schemas'
import type { SensitiveDataFinding } from '@/lib/privacy/sensitive-data-detector'

export type { AnalysisResult, SensitiveDataFinding }

// ─── Application-Level Row Interfaces ───────────────────────────────────────
// These are strongly typed interfaces used in queries.ts return types.
// They are NOT used directly as Database generic Row types, because TypeScript
// requires Row types to satisfy Record<string, unknown> (index signature),
// which named interfaces don't structurally satisfy for `extends` checks.

export interface ModelProfileRow {
  id: string
  slug: string
  display_name: string
  provider: string
  model_family: string
  profile_type: string
  source_type: string
  verification_status: 'verified' | 'unverified' | 'stale'
  confidence_level: 'high' | 'medium' | 'low'
  source_url: string | null
  source_checked_at: string | null
  last_verified_at: string | null
  stale_after_days: number
  capabilities_json: Record<string, unknown>
  prompting_recommendations_json: Record<string, unknown>
  known_limitations_json: Record<string, unknown>
  source_notes: string | null
  profile_version: string
  created_at: string
  updated_at: string
}

export interface PromptAnalysisRow {
  id: string
  owner_anonymous_id: string
  user_id: string | null
  input_prompt: string
  working_language: 'pl' | 'en'
  selected_profile_slug: string
  task_goal: string | null
  task_type: string | null
  expected_output_format: string | null
  constraints: string | null
  sensitive_data_risk_level: 'none' | 'low' | 'medium' | 'high'
  sensitive_data_findings_json: SensitiveDataFinding[]
  overall_score: number
  score_level: 'weak' | 'needs_work' | 'decent' | 'strong' | 'excellent'
  analysis_json: AnalysisResult
  improved_prompt: string
  model_id_used: string
  provider_used: string
  analysis_schema_version: string
  scoring_version: string
  model_profile_version: string
  prompt_template_version: string
  share_token: string | null
  is_share_enabled: boolean
  expires_at: string | null
  title: string | null
  is_favorite: boolean
  deleted_at: string | null
  created_at: string
}

export interface UsageEventRow {
  id: string
  owner_anonymous_id: string
  user_id: string | null
  event_type: string
  metadata_json: Record<string, unknown>
  ip_hash: string | null
  user_agent_hash: string | null
  created_at: string
}

export interface FeedbackEventRow {
  id: string
  analysis_id: string
  rating: 'up' | 'down'
  comment: string | null
  created_at: string
}

export interface UserProfileRow {
  user_id: string
  email: string
  display_name: string | null
  plan_slug: string
  created_at: string
  updated_at: string
}

export interface StripeCustomerRow {
  user_id: string
  stripe_customer_id: string
  created_at: string
  updated_at: string
}

export interface SubscriptionRow {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  stripe_price_id: string
  plan_slug: string
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

// ─── Supabase Database Generic Type ─────────────────────────────────────────
// Row types use Record<string, unknown> to satisfy GenericTable's structural
// constraint required by SupabaseClient<Database> type inference.
// Insert types are explicit objects — used for call-site type safety.
// Returned data is cast to the strongly-typed application interfaces above.

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: Record<string, unknown>
        Insert: {
          user_id: string
          email: string
          display_name?: string | null
          plan_slug?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          email?: string
          display_name?: string | null
          plan_slug?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      model_profiles: {
        Row: Record<string, unknown>
        Insert: {
          id?: string
          slug: string
          display_name: string
          provider: string
          model_family: string
          profile_type: string
          source_type: string
          verification_status: 'verified' | 'unverified' | 'stale'
          confidence_level: 'high' | 'medium' | 'low'
          source_url?: string | null
          source_checked_at?: string | null
          last_verified_at?: string | null
          stale_after_days?: number
          capabilities_json?: unknown
          prompting_recommendations_json?: unknown
          known_limitations_json?: unknown
          source_notes?: string | null
          profile_version?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          display_name?: string
          provider?: string
          model_family?: string
          profile_type?: string
          source_type?: string
          verification_status?: 'verified' | 'unverified' | 'stale'
          confidence_level?: 'high' | 'medium' | 'low'
          source_url?: string | null
          source_checked_at?: string | null
          last_verified_at?: string | null
          stale_after_days?: number
          capabilities_json?: unknown
          prompting_recommendations_json?: unknown
          known_limitations_json?: unknown
          source_notes?: string | null
          profile_version?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompt_analyses: {
        Row: Record<string, unknown>
        Insert: {
          id?: string
          owner_anonymous_id: string
          user_id?: string | null
          input_prompt: string
          working_language: 'pl' | 'en'
          selected_profile_slug: string
          task_goal?: string | null
          task_type?: string | null
          expected_output_format?: string | null
          constraints?: string | null
          sensitive_data_risk_level?: 'none' | 'low' | 'medium' | 'high'
          sensitive_data_findings_json?: unknown
          overall_score: number
          score_level: 'weak' | 'needs_work' | 'decent' | 'strong' | 'excellent'
          analysis_json: unknown
          improved_prompt: string
          model_id_used: string
          provider_used: string
          analysis_schema_version: string
          scoring_version: string
          model_profile_version: string
          prompt_template_version: string
          share_token?: string | null
          is_share_enabled?: boolean
          expires_at?: string | null
          title?: string | null
          is_favorite?: boolean
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_anonymous_id?: string
          user_id?: string | null
          input_prompt?: string
          working_language?: 'pl' | 'en'
          selected_profile_slug?: string
          task_goal?: string | null
          task_type?: string | null
          expected_output_format?: string | null
          constraints?: string | null
          sensitive_data_risk_level?: 'none' | 'low' | 'medium' | 'high'
          sensitive_data_findings_json?: unknown
          overall_score?: number
          score_level?: 'weak' | 'needs_work' | 'decent' | 'strong' | 'excellent'
          analysis_json?: unknown
          improved_prompt?: string
          model_id_used?: string
          provider_used?: string
          analysis_schema_version?: string
          scoring_version?: string
          model_profile_version?: string
          prompt_template_version?: string
          share_token?: string | null
          is_share_enabled?: boolean
          expires_at?: string | null
          title?: string | null
          is_favorite?: boolean
          deleted_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: Record<string, unknown>
        Insert: {
          id?: string
          owner_anonymous_id: string
          user_id?: string | null
          event_type: string
          metadata_json?: unknown
          ip_hash?: string | null
          user_agent_hash?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_anonymous_id?: string
          user_id?: string | null
          event_type?: string
          metadata_json?: unknown
          ip_hash?: string | null
          user_agent_hash?: string | null
          created_at?: string
        }
        Relationships: []
      }
      feedback_events: {
        Row: Record<string, unknown>
        Insert: {
          id?: string
          analysis_id: string
          rating: 'up' | 'down'
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          analysis_id?: string
          rating?: 'up' | 'down'
          comment?: string | null
          created_at?: string
        }
        Relationships: []
      }
      stripe_customers: {
        Row: Record<string, unknown>
        Insert: {
          user_id: string
          stripe_customer_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          stripe_customer_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: Record<string, unknown>
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          stripe_price_id: string
          plan_slug: string
          status: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          stripe_price_id?: string
          plan_slug?: string
          status?: string
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ─── Convenience Insert Type Aliases ────────────────────────────────────────
export type PromptAnalysisInsert = Database['public']['Tables']['prompt_analyses']['Insert']
export type UsageEventInsert = Database['public']['Tables']['usage_events']['Insert']
export type FeedbackEventInsert = Database['public']['Tables']['feedback_events']['Insert']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type StripeCustomerInsert = Database['public']['Tables']['stripe_customers']['Insert']
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']
