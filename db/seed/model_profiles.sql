-- Optional standalone seed. The initial migration already contains this seed.

insert into model_profiles (
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
) values
  ('general-llm', 'General LLM', 'generic', 'generic-llm', 'general', 'internal_policy', 'unverified', 'medium', 'Generic MVP profile.', '1.0.0')
on conflict (slug) do nothing;
