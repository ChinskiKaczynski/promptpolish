-- Migration to add a server-only idempotent feedback upsert RPC.

CREATE OR REPLACE FUNCTION public.upsert_feedback_event(
  p_analysis_id UUID,
  p_rating TEXT,
  p_comment TEXT,
  p_user_id UUID,
  p_owner_anonymous_id TEXT
)
RETURNS SETOF public.feedback_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_inserted_row public.feedback_events;
BEGIN
  -- Validate rating
  IF p_rating NOT IN ('up', 'down') THEN
    RAISE EXCEPTION 'Invalid rating value. Must be either ''up'' or ''down''.';
  END IF;

  -- Enforce rating and comment character limit
  IF p_comment IS NOT NULL AND length(p_comment) > 500 THEN
    RAISE EXCEPTION 'Comment exceeds maximum allowed length of 500 characters.';
  END IF;

  -- Perform upsert based on user_id or owner_anonymous_id
  IF p_user_id IS NOT NULL THEN
    INSERT INTO public.feedback_events (analysis_id, rating, comment, user_id, owner_anonymous_id)
    VALUES (p_analysis_id, p_rating, p_comment, p_user_id, p_owner_anonymous_id)
    ON CONFLICT (analysis_id, user_id) WHERE user_id IS NOT NULL
    DO UPDATE SET rating = EXCLUDED.rating,
                  comment = EXCLUDED.comment,
                  created_at = now()
    RETURNING * INTO v_inserted_row;
  ELSE
    INSERT INTO public.feedback_events (analysis_id, rating, comment, user_id, owner_anonymous_id)
    VALUES (p_analysis_id, p_rating, p_comment, NULL, p_owner_anonymous_id)
    ON CONFLICT (analysis_id, owner_anonymous_id) WHERE user_id IS NULL AND owner_anonymous_id IS NOT NULL
    DO UPDATE SET rating = EXCLUDED.rating,
                  comment = EXCLUDED.comment,
                  created_at = now()
    RETURNING * INTO v_inserted_row;
  END IF;

  RETURN NEXT v_inserted_row;
END;
$$;

-- Revoke default public execution rights and grant only to service_role
REVOKE EXECUTE ON FUNCTION public.upsert_feedback_event(UUID, TEXT, TEXT, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.upsert_feedback_event(UUID, TEXT, TEXT, UUID, TEXT) FROM "anon";
REVOKE EXECUTE ON FUNCTION public.upsert_feedback_event(UUID, TEXT, TEXT, UUID, TEXT) FROM "authenticated";
GRANT EXECUTE ON FUNCTION public.upsert_feedback_event(UUID, TEXT, TEXT, UUID, TEXT) TO "service_role";
