-- PromptPolish initial schema
-- Review before applying to Supabase.

create extension if not exists pgcrypto;

create table if not exists model_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  display_name text not null,
  provider text not null,
  model_family text not null,
  profile_type text not null,
  source_type text not null,
  verification_status text not null check (verification_status in ('verified', 'unverified', 'stale')),
  confidence_level text not null check (confidence_level in ('high', 'medium', 'low')),
  source_url text null,
  source_checked_at timestamptz null,
  last_verified_at timestamptz null,
  stale_after_days int not null default 30,
  capabilities_json jsonb not null default '{}',
  prompting_recommendations_json jsonb not null default '{}',
  known_limitations_json jsonb not null default '{}',
  source_notes text null,
  profile_version text not null default '1.0.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prompt_analyses (
  id uuid primary key default gen_random_uuid(),
  owner_anonymous_id text not null,
  user_id uuid null,
  input_prompt text not null,
  working_language text not null check (working_language in ('pl', 'en')),
  selected_profile_slug text not null references model_profiles(slug),
  task_goal text null,
  task_type text null,
  expected_output_format text null,
  constraints text null,
  sensitive_data_risk_level text not null default 'none' check (sensitive_data_risk_level in ('none', 'low', 'medium', 'high')),
  sensitive_data_findings_json jsonb not null default '[]',
  overall_score int not null check (overall_score >= 0 and overall_score <= 100),
  score_level text not null check (score_level in ('weak', 'needs_work', 'decent', 'strong', 'excellent')),
  analysis_json jsonb not null,
  improved_prompt text not null,
  model_id_used text not null,
  provider_used text not null,
  analysis_schema_version text not null,
  scoring_version text not null,
  model_profile_version text not null,
  prompt_template_version text not null,
  share_token text unique null,
  is_share_enabled boolean not null default false,
  expires_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  owner_anonymous_id text not null,
  user_id uuid null,
  event_type text not null,
  metadata_json jsonb not null default '{}',
  ip_hash text null,
  user_agent_hash text null,
  created_at timestamptz not null default now()
);

create table if not exists feedback_events (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references prompt_analyses(id) on delete cascade,
  rating text not null check (rating in ('up', 'down')),
  comment text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_model_profiles_slug on model_profiles(slug);
create index if not exists idx_prompt_analyses_owner on prompt_analyses(owner_anonymous_id);
create index if not exists idx_prompt_analyses_profile on prompt_analyses(selected_profile_slug);
create index if not exists idx_prompt_analyses_created_at on prompt_analyses(created_at);
create index if not exists idx_prompt_analyses_share_token on prompt_analyses(share_token);
create index if not exists idx_prompt_analyses_sensitive_risk on prompt_analyses(sensitive_data_risk_level);
create index if not exists idx_usage_events_owner on usage_events(owner_anonymous_id);
create index if not exists idx_usage_events_type on usage_events(event_type);
create index if not exists idx_usage_events_created_at on usage_events(created_at);
create index if not exists idx_feedback_events_analysis on feedback_events(analysis_id);

alter table model_profiles enable row level security;
alter table prompt_analyses enable row level security;
alter table usage_events enable row level security;
alter table feedback_events enable row level security;

-- MVP uses server-only data access for private tables.
-- Add RLS policies only after the exact Supabase access model is reviewed.

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
  (
    'general-llm',
    'General LLM',
    'generic',
    'generic-llm',
    'general',
    'internal_policy',
    'unverified',
    'medium',
    'Generic profile for MVP. Does not claim provider-specific capabilities.',
    '1.0.0'
  ),
  (
    'google-gemini-3-5-flash',
    'Gemini 3.5 Flash profile',
    'google',
    'gemini',
    'provider_model',
    'pending_verification',
    'unverified',
    'low',
    'Model profile slug only. Verify real model id and capabilities before provider implementation.',
    '1.0.0'
  )
on conflict (slug) do update set
  display_name = excluded.display_name,
  provider = excluded.provider,
  model_family = excluded.model_family,
  profile_type = excluded.profile_type,
  source_type = excluded.source_type,
  verification_status = excluded.verification_status,
  confidence_level = excluded.confidence_level,
  source_notes = excluded.source_notes,
  profile_version = excluded.profile_version,
  updated_at = now();
