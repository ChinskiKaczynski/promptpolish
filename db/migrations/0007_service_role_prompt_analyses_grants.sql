-- Allow server-side Supabase admin client to manage private prompt analyses.
-- Do not grant anon/public access to prompt_analyses.
grant usage on schema public to service_role;
grant select,
    insert,
    update,
    delete on table public.prompt_analyses to service_role;