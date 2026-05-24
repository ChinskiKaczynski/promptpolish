-- Migration: 0005_rls_policies.sql
-- Purpose: Define Row Level Security (RLS) policies for core MVP tables to allow the server-side public client to query and insert data.

-- 1. Policies for model_profiles
create policy "allow_public_read_model_profiles" on public.model_profiles
  for select to public using (true);

-- 2. Policies for prompt_analyses
create policy "allow_public_select_prompt_analyses" on public.prompt_analyses
  for select to public using (true);

create policy "allow_public_insert_prompt_analyses" on public.prompt_analyses
  for insert to public with check (true);

create policy "allow_public_update_prompt_analyses" on public.prompt_analyses
  for update to public using (true);

-- 3. Policies for usage_events
create policy "allow_public_select_usage_events" on public.usage_events
  for select to public using (true);

create policy "allow_public_insert_usage_events" on public.usage_events
  for insert to public with check (true);

-- 4. Policies for feedback_events
create policy "allow_public_select_feedback_events" on public.feedback_events
  for select to public using (true);

create policy "allow_public_insert_feedback_events" on public.feedback_events
  for insert to public with check (true);

-- 5. Policies for user_profiles
create policy "allow_public_all_user_profiles" on public.user_profiles
  for all to public using (true);
