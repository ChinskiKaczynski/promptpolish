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
  capabilities_json: Record<string, any>
  prompting_recommendations_json: Record<string, any>
  known_limitations_json: Record<string, any>
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
  sensitive_data_findings_json: any
  overall_score: number
  score_level: 'weak' | 'needs_work' | 'decent' | 'strong' | 'excellent'
  analysis_json: any
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
  created_at: string
}

export interface UsageEventRow {
  id: string
  owner_anonymous_id: string
  user_id: string | null
  event_type: string
  metadata_json: Record<string, any>
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

export interface Database {
  public: {
    Tables: {
      model_profiles: {
        Row: ModelProfileRow
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
          capabilities_json?: Record<string, any>
          prompting_recommendations_json?: Record<string, any>
          known_limitations_json?: Record<string, any>
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
          capabilities_json?: Record<string, any>
          prompting_recommendations_json?: Record<string, any>
          known_limitations_json?: Record<string, any>
          source_notes?: string | null
          profile_version?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompt_analyses: {
        Row: PromptAnalysisRow
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
          sensitive_data_findings_json?: any
          overall_score: number
          score_level: 'weak' | 'needs_work' | 'decent' | 'strong' | 'excellent'
          analysis_json: any
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
          sensitive_data_findings_json?: any
          overall_score?: number
          score_level?: 'weak' | 'needs_work' | 'decent' | 'strong' | 'excellent'
          analysis_json?: any
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
          created_at?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: UsageEventRow
        Insert: {
          id?: string
          owner_anonymous_id: string
          user_id?: string | null
          event_type: string
          metadata_json?: Record<string, any>
          ip_hash?: string | null
          user_agent_hash?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_anonymous_id?: string
          user_id?: string | null
          event_type?: string
          metadata_json?: Record<string, any>
          ip_hash?: string | null
          user_agent_hash?: string | null
          created_at?: string
        }
        Relationships: []
      }
      feedback_events: {
        Row: FeedbackEventRow
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
