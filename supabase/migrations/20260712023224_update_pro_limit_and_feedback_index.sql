-- New forward-only migration to fix Pro plan limit, set search_path, revoke admin function execution rights, and index feedback_events

-- 1. Update Pro plan limit
UPDATE public.plan_limits
SET max_prompt_chars = 24000
WHERE plan_slug = 'pro';

-- 2. Create index on feedback_events(user_id) if not exists
CREATE INDEX IF NOT EXISTS idx_feedback_events_user_id ON public.feedback_events(user_id);

-- 3. Set search_path and revoke execute grants on administrative functions
ALTER FUNCTION public.acquire_stripe_lock(text) SET search_path = '';
ALTER FUNCTION public.release_stripe_lock(text) SET search_path = '';
ALTER FUNCTION public.rls_auto_enable() SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.acquire_stripe_lock(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_stripe_lock(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.acquire_stripe_lock(text) TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.release_stripe_lock(text) TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role, postgres;
