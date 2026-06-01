-- Security cleanup after switching private server-side operations to service_role.
-- Keep model_profiles publicly readable.
-- Keep private/user tables inaccessible to anon/authenticated.
-- Stripe tables are optional because they may not exist in every environment yet.
grant usage on schema public to anon,
    authenticated,
    service_role;
-- Public configuration table.
grant select on table public.model_profiles to anon,
    authenticated,
    service_role;
-- Remove dangerous public policies from private tables.
drop policy if exists "allow_public_select_prompt_analyses" on public.prompt_analyses;
drop policy if exists "allow_public_insert_prompt_analyses" on public.prompt_analyses;
drop policy if exists "allow_public_update_prompt_analyses" on public.prompt_analyses;
drop policy if exists "allow_public_select_usage_events" on public.usage_events;
drop policy if exists "allow_public_insert_usage_events" on public.usage_events;
drop policy if exists "allow_public_select_feedback_events" on public.feedback_events;
drop policy if exists "allow_public_insert_feedback_events" on public.feedback_events;
drop policy if exists "allow_public_all_user_profiles" on public.user_profiles;
-- Explicitly keep private tables closed to client roles.
revoke all on table public.prompt_analyses
from anon,
    authenticated;
revoke all on table public.usage_events
from anon,
    authenticated;
revoke all on table public.feedback_events
from anon,
    authenticated;
revoke all on table public.user_profiles
from anon,
    authenticated;
-- Server-side access for active MVP private tables.
grant select,
    insert,
    update,
    delete on table public.prompt_analyses to service_role;
grant select,
    insert,
    update,
    delete on table public.usage_events to service_role;
grant select,
    insert,
    update,
    delete on table public.feedback_events to service_role;
grant select,
    insert,
    update,
    delete on table public.user_profiles to service_role;
-- Optional billing tables.
-- These may not exist in the anonymous MVP database yet, so guard them with to_regclass.
do $$ begin if to_regclass('public.stripe_customers') is not null then revoke all on table public.stripe_customers
from anon,
    authenticated;
grant select,
    insert,
    update,
    delete on table public.stripe_customers to service_role;
end if;
if to_regclass('public.subscriptions') is not null then revoke all on table public.subscriptions
from anon,
    authenticated;
grant select,
    insert,
    update,
    delete on table public.subscriptions to service_role;
end if;
end $$;