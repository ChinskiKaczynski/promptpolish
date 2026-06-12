-- Seed file for PromptPolish Supabase database
INSERT INTO public.model_profiles (
  slug,
  display_name,
  provider,
  model_family,
  profile_type,
  source_type,
  verification_status,
  confidence_level,
  source_notes,
  profile_version
) VALUES
  ('general-llm', 'General LLM', 'generic', 'generic-llm', 'general', 'internal_policy', 'unverified', 'medium', 'Generic MVP profile.', '1.0.0'),
  ('openrouter-deepseek-v4-flash', 'DeepSeek v4 Flash Profile', 'openrouter', 'deepseek', 'provider_model', 'pending_verification', 'unverified', 'low', 'Verify before provider implementation.', '1.0.0')
ON CONFLICT (slug) DO NOTHING;
