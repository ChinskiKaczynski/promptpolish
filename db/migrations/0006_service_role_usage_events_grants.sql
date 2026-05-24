-- Allow server-side Supabase admin client to count, write, and clean usage telemetry.
-- Do not grant anon/public access to usage_events.
grant usage on schema public to service_role;
grant select,
    insert,
    delete on table public.usage_events to service_role;