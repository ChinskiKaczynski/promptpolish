-- Relational User Profiles & Indexes Migration

create table if not exists user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text null,
  plan_slug text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optimize prompt history lookup on user_id
create index if not exists idx_prompt_analyses_user_id on prompt_analyses(user_id);

-- Optimize usage event lookup on user_id
create index if not exists idx_usage_events_user_id on usage_events(user_id);

-- Optimize queries by subscription tiers
create index if not exists idx_user_profiles_plan_slug on user_profiles(plan_slug);

-- Enable RLS
alter table user_profiles enable row level security;
