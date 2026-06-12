-- Corrective migration to revoke dangerous privileges and align database access controls.

-- 1. Revoke default privileges for future tables
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLES FROM "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLES FROM "authenticated";

-- 2. Revoke references, trigger, truncate, maintain on all existing public tables
REVOKE REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON ALL TABLES IN SCHEMA "public" FROM "anon", "authenticated";

-- 3. Revoke all privileges on private application tables to prevent direct client access
REVOKE ALL PRIVILEGES ON TABLE "public"."prompt_analyses" FROM "anon", "authenticated";
REVOKE ALL PRIVILEGES ON TABLE "public"."usage_events" FROM "anon", "authenticated";
REVOKE ALL PRIVILEGES ON TABLE "public"."feedback_events" FROM "anon", "authenticated";
REVOKE ALL PRIVILEGES ON TABLE "public"."user_profiles" FROM "anon", "authenticated";

-- 4. Revoke SELECT privilege on model_profiles, stripe_customers, and subscriptions from anon and authenticated
REVOKE ALL PRIVILEGES ON TABLE "public"."model_profiles" FROM "anon", "authenticated";
REVOKE ALL PRIVILEGES ON TABLE "public"."stripe_customers" FROM "anon", "authenticated";
REVOKE ALL PRIVILEGES ON TABLE "public"."subscriptions" FROM "anon", "authenticated";

DROP POLICY IF EXISTS "allow_public_read_model_profiles" ON "public"."model_profiles";
DROP POLICY IF EXISTS "users_read_own_stripe_customer" ON "public"."stripe_customers";
DROP POLICY IF EXISTS "users_read_own_subscription" ON "public"."subscriptions";

-- 5. Define parameterized RPC for secure, sanitised history search
CREATE OR REPLACE FUNCTION public.search_user_prompt_history(
  p_user_id UUID,
  p_owner_anonymous_id UUID,
  p_search_term TEXT,
  p_lang TEXT DEFAULT 'all',
  p_profile TEXT DEFAULT 'all',
  p_task_type TEXT DEFAULT 'all',
  p_is_favorite BOOLEAN DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'newest',
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.prompt_analyses
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_search_escaped TEXT;
  v_limit INTEGER;
  v_offset INTEGER;
BEGIN
  -- Ownership validation checks
  -- Both IDs missing check
  IF p_user_id IS NULL AND p_owner_anonymous_id IS NULL THEN
    RAISE EXCEPTION 'Ownership identity missing: either p_user_id or p_owner_anonymous_id must be provided';
  END IF;

  IF p_search_term IS NOT NULL AND p_search_term <> '' THEN
    v_search_escaped := REPLACE(p_search_term, '\', '\\');
    v_search_escaped := REPLACE(v_search_escaped, '%', '\%');
    v_search_escaped := REPLACE(v_search_escaped, '_', '\_');
    v_search_escaped := '%' || v_search_escaped || '%';
  ELSE
    v_search_escaped := NULL;
  END IF;

  -- Clamp SQL pagination defensively
  v_limit := GREATEST(1, LEAST(COALESCE(p_limit, 20), 100));
  v_offset := GREATEST(0, COALESCE(p_offset, 0));

  RETURN QUERY
  SELECT *
  FROM public.prompt_analyses
  WHERE deleted_at IS NULL
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id)
      OR
      (user_id IS NULL AND owner_anonymous_id = p_owner_anonymous_id::TEXT)
    )
    AND (
      p_lang = 'all' OR working_language = p_lang
    )
    AND (
      p_profile = 'all' OR selected_profile_slug = p_profile
    )
    AND (
      p_task_type = 'all' OR task_type = p_task_type
    )
    AND (
      p_is_favorite IS NULL OR is_favorite = p_is_favorite
    )
    AND (
      v_search_escaped IS NULL
      OR input_prompt ILIKE v_search_escaped ESCAPE '\'
      OR title ILIKE v_search_escaped ESCAPE '\'
    )
  ORDER BY
    CASE WHEN p_sort_by = 'oldest' THEN created_at END ASC,
    CASE WHEN p_sort_by = 'newest' THEN created_at END DESC,
    CASE WHEN p_sort_by = 'highest_score' THEN overall_score END DESC,
    CASE WHEN p_sort_by = 'lowest_score' THEN overall_score END ASC,
    created_at DESC,
    id DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

-- Revoke default public execution rights and grant only to the server side service_role
REVOKE EXECUTE ON FUNCTION public.search_user_prompt_history(UUID, UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_user_prompt_history(UUID, UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, INTEGER, INTEGER) FROM "anon";
REVOKE EXECUTE ON FUNCTION public.search_user_prompt_history(UUID, UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, INTEGER, INTEGER) FROM "authenticated";
GRANT EXECUTE ON FUNCTION public.search_user_prompt_history(UUID, UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, INTEGER, INTEGER) TO "service_role";
