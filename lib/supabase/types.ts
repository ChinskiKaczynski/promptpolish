export type PromptAnalysisRow = {
  id: string
  owner_anonymous_id: string
  input_prompt: string
  working_language: 'pl' | 'en'
  selected_profile_slug: string
  overall_score: number
  score_level: string
  analysis_json: unknown
  improved_prompt: string
  share_token: string | null
  is_share_enabled: boolean
  created_at: string
}
