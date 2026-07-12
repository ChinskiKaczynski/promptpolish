-- Hardening migration: Phase 2, 3, 4, 5, 7

-- 1. Alter usage_reservations table
-- Scrub any non-uuid values first
DELETE FROM public.usage_reservations 
WHERE owner_anonymous_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

ALTER TABLE public.usage_reservations 
  ALTER COLUMN owner_anonymous_id TYPE UUID USING owner_anonymous_id::uuid;

-- Add foreign key constraint to auth.users(id) ON DELETE CASCADE
ALTER TABLE public.usage_reservations 
  ADD CONSTRAINT fk_usage_reservations_user 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old single-column indexes on usage_reservations
DROP INDEX IF EXISTS public.idx_usage_reservations_owner;
DROP INDEX IF EXISTS public.idx_usage_reservations_user;

-- Create composite indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_usage_reservations_user_composite 
  ON public.usage_reservations (user_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_usage_reservations_owner_composite 
  ON public.usage_reservations (owner_anonymous_id, status, created_at);


-- 2. Create public.plan_limits table
CREATE TABLE IF NOT EXISTS public.plan_limits (
  plan_slug TEXT PRIMARY KEY,
  daily_analysis_limit INT NOT NULL,
  max_prompt_chars INT NOT NULL,
  min_prompt_chars INT NOT NULL
);

-- Seed plan limits
INSERT INTO public.plan_limits (plan_slug, daily_analysis_limit, max_prompt_chars, min_prompt_chars)
VALUES 
  ('anonymous', 3, 12000, 20),
  ('free', 5, 12000, 20),
  ('pro', 100, 12000, 20)
ON CONFLICT (plan_slug) DO UPDATE
SET daily_analysis_limit = EXCLUDED.daily_analysis_limit,
    max_prompt_chars = EXCLUDED.max_prompt_chars,
    min_prompt_chars = EXCLUDED.min_prompt_chars;

-- Enable RLS on public.plan_limits
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_plan_limits ON public.plan_limits;
CREATE POLICY select_plan_limits ON public.plan_limits FOR SELECT USING (true);

-- Grant select permission to anon/authenticated
REVOKE ALL PRIVILEGES ON TABLE public.plan_limits FROM "anon", "authenticated";
GRANT SELECT ON TABLE public.plan_limits TO "anon", "authenticated";
GRANT ALL ON TABLE public.plan_limits TO "service_role";


-- 3. Modify acquire_usage_reservation RPC
CREATE OR REPLACE FUNCTION public.acquire_usage_reservation(
  p_reservation_id UUID,
  p_owner_anonymous_id UUID,
  p_user_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_plan_slug TEXT;
  v_daily_limit INT;
  v_daily_count INT;
  v_existing_status TEXT;
  v_now TIMESTAMP WITH TIME ZONE;
  v_start_of_day TIMESTAMP WITH TIME ZONE;
BEGIN
  v_now := now();
  v_start_of_day := date_trunc('day', v_now AT TIME ZONE 'UTC');

  -- Proactive cleanup of timed-out reserved reservations (older than 5 minutes)
  UPDATE public.usage_reservations
  SET status = 'released',
      updated_at = v_now
  WHERE status = 'reserved'
    AND created_at < v_now - INTERVAL '5 minutes';

  -- Advisory lock on identity to serialize concurrent limits check
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(COALESCE(p_user_id::text, p_owner_anonymous_id::text)));

  -- Check if reservation already exists (idempotency / retry)
  SELECT status INTO v_existing_status
  FROM public.usage_reservations
  WHERE id = p_reservation_id;

  IF FOUND THEN
    -- If it's already completed or released, return that.
    -- If it's reserved, return success:reserved (so caller knows it is in progress / ready).
    IF v_existing_status = 'reserved' THEN
      RETURN 'success:in_progress';
    ELSE
      RETURN 'success:' || v_existing_status;
    END IF;
  END IF;

  -- Resolve plan server-side
  IF p_user_id IS NOT NULL THEN
    SELECT plan_slug INTO v_plan_slug
    FROM public.user_profiles
    WHERE user_id = p_user_id;
    
    IF NOT FOUND OR v_plan_slug IS NULL THEN
      v_plan_slug := 'free';
    END IF;
  ELSE
    v_plan_slug := 'anonymous';
  END IF;

  -- Fetch daily limit from public.plan_limits table
  SELECT daily_analysis_limit INTO v_daily_limit
  FROM public.plan_limits
  WHERE plan_slug = v_plan_slug;

  IF NOT FOUND THEN
    -- Fallback limits if not seeded
    IF v_plan_slug = 'pro' THEN
      v_daily_limit := 100;
    ELSIF v_plan_slug = 'free' THEN
      v_daily_limit := 5;
    ELSE
      v_daily_limit := 3;
    END IF;
  END IF;

  -- Count usage today (completed, or reserved in the last 5 minutes)
  SELECT COALESCE(COUNT(*), 0) INTO v_daily_count
  FROM public.usage_reservations
  WHERE (
      (p_user_id IS NOT NULL AND user_id = p_user_id)
      OR
      (p_user_id IS NULL AND owner_anonymous_id = p_owner_anonymous_id)
    )
    AND created_at >= v_start_of_day
    AND (
      status = 'completed'
      OR (status = 'reserved' AND created_at >= v_now - INTERVAL '5 minutes')
    );

  -- Enforce daily limit
  IF v_daily_count >= v_daily_limit THEN
    RETURN 'daily_limit_reached';
  END IF;

  -- Create reservation
  INSERT INTO public.usage_reservations (id, owner_anonymous_id, user_id, status, created_at, updated_at)
  VALUES (p_reservation_id, p_owner_anonymous_id, p_user_id, 'reserved', v_now, v_now);

  RETURN 'success:reserved';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.acquire_usage_reservation(UUID, UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.acquire_usage_reservation(UUID, UUID, UUID) FROM "anon";
REVOKE EXECUTE ON FUNCTION public.acquire_usage_reservation(UUID, UUID, UUID) FROM "authenticated";
GRANT EXECUTE ON FUNCTION public.acquire_usage_reservation(UUID, UUID, UUID) TO "service_role";


-- 4. Create save_analysis_and_complete_reservation RPC
CREATE OR REPLACE FUNCTION public.save_analysis_and_complete_reservation(
  p_analysis_id UUID,
  p_owner_anonymous_id TEXT,
  p_user_id UUID,
  p_input_prompt TEXT,
  p_working_language TEXT,
  p_selected_profile_slug TEXT,
  p_task_goal TEXT,
  p_task_type TEXT,
  p_expected_output_format TEXT,
  p_constraints TEXT,
  p_sensitive_data_risk_level TEXT,
  p_sensitive_data_findings_json JSONB,
  p_overall_score INT,
  p_score_level TEXT,
  p_analysis_json JSONB,
  p_improved_prompt TEXT,
  p_model_id_used TEXT,
  p_provider_used TEXT,
  p_analysis_schema_version TEXT,
  p_scoring_version TEXT,
  p_model_profile_version TEXT,
  p_prompt_template_version TEXT,
  p_title TEXT,
  p_audit_mode TEXT,
  p_reservation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_updated INT;
BEGIN
  -- Insert the analysis
  INSERT INTO public.prompt_analyses (
    id, owner_anonymous_id, user_id, input_prompt, working_language, selected_profile_slug,
    task_goal, task_type, expected_output_format, constraints, sensitive_data_risk_level,
    sensitive_data_findings_json, overall_score, score_level, analysis_json, improved_prompt,
    model_id_used, provider_used, analysis_schema_version, scoring_version, model_profile_version,
    prompt_template_version, title, audit_mode, created_at
  )
  VALUES (
    p_analysis_id, p_owner_anonymous_id, p_user_id, p_input_prompt, p_working_language, p_selected_profile_slug,
    p_task_goal, p_task_type, p_expected_output_format, p_constraints, p_sensitive_data_risk_level,
    p_sensitive_data_findings_json, p_overall_score, p_score_level, p_analysis_json, p_improved_prompt,
    p_model_id_used, p_provider_used, p_analysis_schema_version, p_scoring_version, p_model_profile_version,
    p_prompt_template_version, p_title, p_audit_mode, now()
  );

  -- Complete the reservation
  UPDATE public.usage_reservations
  SET status = 'completed',
      updated_at = now()
  WHERE id = p_reservation_id AND status = 'reserved';
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.save_analysis_and_complete_reservation FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_analysis_and_complete_reservation FROM "anon";
REVOKE EXECUTE ON FUNCTION public.save_analysis_and_complete_reservation FROM "authenticated";
GRANT EXECUTE ON FUNCTION public.save_analysis_and_complete_reservation TO "service_role";


-- 5. Create insert_usage_event_with_limit RPC (sliding window rate limiter)
CREATE OR REPLACE FUNCTION public.insert_usage_event_with_limit(
  p_event_id UUID,
  p_owner_anonymous_id UUID,
  p_user_id UUID,
  p_event_type TEXT,
  p_metadata_json JSONB,
  p_window_seconds INT,
  p_max_count INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_lock_key INT;
  v_current_count INT;
BEGIN
  -- Advisory lock on identity to serialize concurrent limit checks
  v_lock_key := pg_catalog.hashtext(COALESCE(p_user_id::text, p_owner_anonymous_id::text));
  PERFORM pg_catalog.pg_advisory_xact_lock(v_lock_key);

  -- Count existing events of this type in the sliding window
  SELECT COUNT(*) INTO v_current_count
  FROM public.usage_events
  WHERE (
      (p_user_id IS NOT NULL AND user_id = p_user_id)
      OR
      (p_user_id IS NULL AND owner_anonymous_id = p_owner_anonymous_id::text)
    )
    AND event_type = p_event_type
    AND created_at >= (now() - (p_window_seconds || ' seconds')::INTERVAL);

  IF v_current_count >= p_max_count THEN
    RETURN FALSE;
  END IF;

  -- Insert event
  INSERT INTO public.usage_events (id, owner_anonymous_id, user_id, event_type, metadata_json, created_at)
  VALUES (p_event_id, p_owner_anonymous_id::text, p_user_id, p_event_type, p_metadata_json, now());

  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.insert_usage_event_with_limit FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.insert_usage_event_with_limit FROM "anon";
REVOKE EXECUTE ON FUNCTION public.insert_usage_event_with_limit FROM "authenticated";
GRANT EXECUTE ON FUNCTION public.insert_usage_event_with_limit TO "service_role";


-- 6. Create run_retention_cleanup RPC
CREATE OR REPLACE FUNCTION public.run_retention_cleanup(
  p_analysis_cutoff TIMESTAMP WITH TIME ZONE,
  p_usage_cutoff TIMESTAMP WITH TIME ZONE,
  p_feedback_cutoff TIMESTAMP WITH TIME ZONE,
  p_dry_run BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_analyses_deleted INT := 0;
  v_soft_deleted_deleted INT := 0;
  v_usage_deleted INT := 0;
  v_feedback_deleted INT := 0;
  v_reservations_deleted INT := 0;
  v_webhooks_deleted INT := 0;
  v_checkout_attempts_deleted INT := 0;
BEGIN
  IF p_dry_run THEN
    SELECT COUNT(*) INTO v_analyses_deleted
    FROM public.prompt_analyses
    WHERE user_id IS NULL
      AND is_favorite = false
      AND is_share_enabled = false
      AND deleted_at IS NULL
      AND created_at < p_analysis_cutoff;

    SELECT COUNT(*) INTO v_soft_deleted_deleted
    FROM public.prompt_analyses
    WHERE deleted_at IS NOT NULL
      AND deleted_at < p_analysis_cutoff;

    SELECT COUNT(*) INTO v_usage_deleted
    FROM public.usage_events
    WHERE created_at < p_usage_cutoff;

    SELECT COUNT(*) INTO v_feedback_deleted
    FROM public.feedback_events
    WHERE created_at < p_feedback_cutoff;

    SELECT COUNT(*) INTO v_reservations_deleted
    FROM public.usage_reservations
    WHERE created_at < p_analysis_cutoff;

    SELECT COUNT(*) INTO v_webhooks_deleted
    FROM public.stripe_webhook_events
    WHERE created_at < p_analysis_cutoff;

    SELECT COUNT(*) INTO v_checkout_attempts_deleted
    FROM public.billing_checkout_attempts
    WHERE created_at < p_analysis_cutoff;
  ELSE
    DELETE FROM public.prompt_analyses
    WHERE user_id IS NULL
      AND is_favorite = false
      AND is_share_enabled = false
      AND deleted_at IS NULL
      AND created_at < p_analysis_cutoff;
    GET DIAGNOSTICS v_analyses_deleted = ROW_COUNT;

    DELETE FROM public.prompt_analyses
    WHERE deleted_at IS NOT NULL
      AND deleted_at < p_analysis_cutoff;
    GET DIAGNOSTICS v_soft_deleted_deleted = ROW_COUNT;

    DELETE FROM public.usage_events
    WHERE created_at < p_usage_cutoff;
    GET DIAGNOSTICS v_usage_deleted = ROW_COUNT;

    DELETE FROM public.feedback_events
    WHERE created_at < p_feedback_cutoff;
    GET DIAGNOSTICS v_feedback_deleted = ROW_COUNT;

    DELETE FROM public.usage_reservations
    WHERE created_at < p_analysis_cutoff;
    GET DIAGNOSTICS v_reservations_deleted = ROW_COUNT;

    DELETE FROM public.stripe_webhook_events
    WHERE created_at < p_analysis_cutoff;
    GET DIAGNOSTICS v_webhooks_deleted = ROW_COUNT;

    DELETE FROM public.billing_checkout_attempts
    WHERE created_at < p_analysis_cutoff;
    GET DIAGNOSTICS v_checkout_attempts_deleted = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'dryRun', p_dry_run,
    'promptAnalysesDeleted', v_analyses_deleted,
    'softDeletedAnalysesDeleted', v_soft_deleted_deleted,
    'usageEventsDeleted', v_usage_deleted,
    'feedbackEventsDeleted', v_feedback_deleted,
    'usageReservationsDeleted', v_reservations_deleted,
    'webhookEventsDeleted', v_webhooks_deleted,
    'checkoutAttemptsDeleted', v_checkout_attempts_deleted
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.run_retention_cleanup FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.run_retention_cleanup FROM "anon";
REVOKE EXECUTE ON FUNCTION public.run_retention_cleanup FROM "authenticated";
GRANT EXECUTE ON FUNCTION public.run_retention_cleanup TO "service_role";


-- 7. Create get_aggregated_metrics RPC
CREATE OR REPLACE FUNCTION public.get_aggregated_metrics(
  p_start_date TIMESTAMP WITH TIME ZONE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_started INT;
  v_completed INT;
  v_failed INT;
  v_latest_analysis_at TIMESTAMP WITH TIME ZONE;
  v_copy_count INT;
  v_feedback_submitted INT;
  v_feedback_up INT;
  v_feedback_down INT;
  v_share_created INT;
  v_share_disabled INT;
  v_active_shares INT;
  v_export_md INT;
  v_export_txt INT;
  
  v_unique_active_owners INT;
  v_unique_completed_owners INT;
  v_returning_owners INT;
  v_one_analysis INT := 0;
  v_two_to_three INT := 0;
  v_four_to_ten INT := 0;
  v_more_than_ten INT := 0;
  v_avg_completed_per_owner NUMERIC := 0;
  v_median_completed_per_owner NUMERIC := 0;

  v_free_users_count INT;
  v_pro_users_count INT;
  v_free_analyses INT := 0;
  v_pro_analyses INT := 0;

  v_provider_error INT;
  v_invalid_structured INT;
  v_api_error INT;
  v_common_errors JSONB;

  v_limit_reached INT;
  v_limited_owners_count INT;
  v_avg_limit_reached NUMERIC := 0;

  v_warnings_shown INT;
  v_blocked INT;
  v_risk_none INT;
  v_risk_low INT;
  v_risk_med INT;
  v_risk_high INT;
  v_finding_types JSONB;

  v_total_prompts INT;
  v_langs JSONB;
  v_models JSONB;
  v_score_levels JSONB;
  v_avg_score NUMERIC := 0;
  v_median_score NUMERIC := 0;
  v_score_w0_39 INT := 0;
  v_score_n40_59 INT := 0;
  v_score_d60_74 INT := 0;
  v_score_s75_89 INT := 0;
  v_score_e90_100 INT := 0;
  v_avg_input_len NUMERIC := 0;
  v_avg_improved_len NUMERIC := 0;
  v_len_short INT := 0;
  v_len_med INT := 0;
  v_len_long INT := 0;
  v_len_vlong INT := 0;

  v_input_tokens BIGINT := 0;
  v_output_tokens BIGINT := 0;
  v_total_tokens BIGINT := 0;
  v_estimated_cost NUMERIC := 0;
  
  v_events_coverage JSONB;
BEGIN
  -- 1. Core Funnel
  SELECT 
    COUNT(*) FILTER (WHERE event_type = 'analysis_started'),
    COUNT(*) FILTER (WHERE event_type = 'analysis_completed'),
    COUNT(*) FILTER (WHERE event_type = 'analysis_failed'),
    MAX(created_at) FILTER (WHERE event_type = 'analysis_completed')
  INTO v_started, v_completed, v_failed, v_latest_analysis_at
  FROM public.usage_events
  WHERE created_at >= p_start_date;

  -- 2. Value Metrics
  SELECT 
    COUNT(*) FILTER (WHERE event_type IN ('copy_improved_prompt', 'copy')),
    COUNT(*) FILTER (WHERE event_type = 'share_link_created'),
    COUNT(*) FILTER (WHERE event_type = 'share_link_disabled'),
    COUNT(*) FILTER (WHERE event_type = 'export_markdown'),
    COUNT(*) FILTER (WHERE event_type = 'export_txt')
  INTO v_copy_count, v_share_created, v_share_disabled, v_export_md, v_export_txt
  FROM public.usage_events
  WHERE created_at >= p_start_date;

  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE rating = 'up'),
    COUNT(*) FILTER (WHERE rating = 'down')
  INTO v_feedback_submitted, v_feedback_up, v_feedback_down
  FROM public.feedback_events
  WHERE created_at >= p_start_date;

  SELECT COUNT(*) INTO v_active_shares
  FROM public.prompt_analyses
  WHERE is_share_enabled = true AND created_at >= p_start_date;

  -- 3. Retention Proxy
  SELECT COUNT(DISTINCT owner_anonymous_id)
  INTO v_unique_active_owners
  FROM public.usage_events
  WHERE owner_anonymous_id IS NOT NULL AND created_at >= p_start_date;

  -- Temp table for ownercompleted counts
  CREATE TEMP TABLE owner_completed_counts ON COMMIT DROP AS
  SELECT owner_anonymous_id, COUNT(*) as c
  FROM public.usage_events
  WHERE event_type = 'analysis_completed' AND owner_anonymous_id IS NOT NULL AND created_at >= p_start_date
  GROUP BY owner_anonymous_id;

  SELECT COUNT(*) INTO v_unique_completed_owners
  FROM owner_completed_counts;

  SELECT COUNT(*) INTO v_returning_owners
  FROM owner_completed_counts
  WHERE c >= 2;

  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE c = 1), 0),
    COALESCE(COUNT(*) FILTER (WHERE c IN (2, 3)), 0),
    COALESCE(COUNT(*) FILTER (WHERE c >= 4 AND c <= 10), 0),
    COALESCE(COUNT(*) FILTER (WHERE c > 10), 0),
    COALESCE(AVG(c), 0),
    COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY c), 0)
  INTO v_one_analysis, v_two_to_three, v_four_to_ten, v_more_than_ten, v_avg_completed_per_owner, v_median_completed_per_owner
  FROM owner_completed_counts;

  -- 4. Plans
  SELECT 
    COUNT(*) FILTER (WHERE plan_slug = 'free'),
    COUNT(*) FILTER (WHERE plan_slug = 'pro')
  INTO v_free_users_count, v_pro_users_count
  FROM public.user_profiles
  WHERE created_at >= p_start_date;

  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE COALESCE(up.plan_slug, 'free') = 'free'), 0),
    COALESCE(COUNT(*) FILTER (WHERE up.plan_slug = 'pro'), 0)
  INTO v_free_analyses, v_pro_analyses
  FROM public.usage_events ue
  LEFT JOIN public.user_profiles up ON ue.user_id = up.user_id
  WHERE ue.event_type = 'analysis_completed' AND ue.created_at >= p_start_date;

  -- 5. Reliability
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'provider_error'),
    COUNT(*) FILTER (WHERE event_type = 'invalid_structured_output'),
    COUNT(*) FILTER (WHERE event_type = 'api_error')
  INTO v_provider_error, v_invalid_structured, v_api_error
  FROM public.usage_events
  WHERE created_at >= p_start_date;

  -- Common error codes aggregation from metadata_json
  SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) INTO v_common_errors
  FROM (
    SELECT COALESCE(metadata_json->>'error_code', metadata_json->>'code', 'UNKNOWN_ERROR') as code, COUNT(*)::int as count
    FROM public.usage_events
    WHERE event_type IN ('analysis_failed', 'provider_error', 'api_error') AND created_at >= p_start_date
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 5
  ) r;

  -- 6. Limits
  SELECT COUNT(*) INTO v_limit_reached
  FROM public.usage_events
  WHERE event_type = 'limit_reached' AND created_at >= p_start_date;

  SELECT COUNT(DISTINCT owner_anonymous_id) INTO v_limited_owners_count
  FROM public.usage_events
  WHERE event_type = 'limit_reached' AND owner_anonymous_id IS NOT NULL AND created_at >= p_start_date;

  IF v_limited_owners_count > 0 THEN
    SELECT AVG(c) INTO v_avg_limit_reached
    FROM (
      SELECT owner_anonymous_id, COUNT(*) as c
      FROM public.usage_events
      WHERE event_type = 'limit_reached' AND owner_anonymous_id IS NOT NULL AND created_at >= p_start_date
      GROUP BY owner_anonymous_id
    ) r;
  END IF;

  -- 7. Sensitive Data Safety
  SELECT 
    COUNT(*) FILTER (WHERE event_type = 'sensitive_data_warning_shown'),
    COUNT(*) FILTER (WHERE event_type = 'sensitive_data_blocked')
  INTO v_warnings_shown, v_blocked
  FROM public.usage_events
  WHERE created_at >= p_start_date;

  SELECT
    COUNT(*) FILTER (WHERE sensitive_data_risk_level = 'none'),
    COUNT(*) FILTER (WHERE sensitive_data_risk_level = 'low'),
    COUNT(*) FILTER (WHERE sensitive_data_risk_level = 'medium'),
    COUNT(*) FILTER (WHERE sensitive_data_risk_level = 'high')
  INTO v_risk_none, v_risk_low, v_risk_med, v_risk_high
  FROM public.prompt_analyses
  WHERE created_at >= p_start_date;

  -- Finding type counts (flatten findings JSON arrays)
  SELECT COALESCE(jsonb_object_agg(type, count), '{}'::jsonb) INTO v_finding_types
  FROM (
    SELECT (finding->>'ruleId') as type, COUNT(*)::int as count
    FROM public.prompt_analyses,
         jsonb_array_elements(sensitive_data_findings_json) as finding
    WHERE created_at >= p_start_date
    GROUP BY 1
  ) r;

  -- 8. Prompt Characteristics
  SELECT COUNT(*) INTO v_total_prompts
  FROM public.prompt_analyses
  WHERE created_at >= p_start_date;

  SELECT COALESCE(jsonb_object_agg(lang, count), '{}'::jsonb) INTO v_langs
  FROM (
    SELECT working_language as lang, COUNT(*)::int as count
    FROM public.prompt_analyses
    WHERE created_at >= p_start_date
    GROUP BY 1
  ) r;

  SELECT COALESCE(jsonb_object_agg(slug, count), '{}'::jsonb) INTO v_models
  FROM (
    SELECT selected_profile_slug as slug, COUNT(*)::int as count
    FROM public.prompt_analyses
    WHERE created_at >= p_start_date
    GROUP BY 1
  ) r;

  SELECT COALESCE(jsonb_object_agg(lvl, count), '{}'::jsonb) INTO v_score_levels
  FROM (
    SELECT score_level as lvl, COUNT(*)::int as count
    FROM public.prompt_analyses
    WHERE created_at >= p_start_date
    GROUP BY 1
  ) r;

  SELECT 
    COALESCE(AVG(overall_score), 0),
    COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY overall_score), 0),
    COUNT(*) FILTER (WHERE overall_score BETWEEN 0 AND 39),
    COUNT(*) FILTER (WHERE overall_score BETWEEN 40 AND 59),
    COUNT(*) FILTER (WHERE overall_score BETWEEN 60 AND 74),
    COUNT(*) FILTER (WHERE overall_score BETWEEN 75 AND 89),
    COUNT(*) FILTER (WHERE overall_score BETWEEN 90 AND 100),
    COALESCE(AVG(octet_length(input_prompt)), 0),
    COALESCE(AVG(octet_length(improved_prompt)), 0),
    COUNT(*) FILTER (WHERE octet_length(input_prompt) < 150),
    COUNT(*) FILTER (WHERE octet_length(input_prompt) BETWEEN 150 AND 1000),
    COUNT(*) FILTER (WHERE octet_length(input_prompt) BETWEEN 1001 AND 4000),
    COUNT(*) FILTER (WHERE octet_length(input_prompt) > 4000)
  INTO v_avg_score, v_median_score, v_score_w0_39, v_score_n40_59, v_score_d60_74, v_score_s75_89, v_score_e90_100,
       v_avg_input_len, v_avg_improved_len, v_len_short, v_len_med, v_len_long, v_len_vlong
  FROM public.prompt_analyses
  WHERE created_at >= p_start_date;

  -- 9. Cost / Tokens
  SELECT 
    COALESCE(SUM((metadata_json->>'input_tokens')::bigint), 0),
    COALESCE(SUM((metadata_json->>'output_tokens')::bigint), 0)
  INTO v_input_tokens, v_output_tokens
  FROM public.usage_events
  WHERE event_type = 'analysis_completed' AND created_at >= p_start_date;

  v_total_tokens := v_input_tokens + v_output_tokens;
  
  -- Estimate cost: $0.075 per million input tokens, $0.30 per million output tokens for Gemini 2.5 Flash
  v_estimated_cost := (v_input_tokens::numeric * 0.000000075) + (v_output_tokens::numeric * 0.00000030);

  -- 10. Event Coverage
  SELECT COALESCE(jsonb_agg(jsonb_build_object('eventType', t.event_type, 'countAllTime', t.count, 'status', CASE WHEN t.count > 0 THEN 'present' ELSE 'no_events_yet' END)), '[]'::jsonb)
  INTO v_events_coverage
  FROM (
    SELECT event_type, COUNT(*)::int as count
    FROM public.usage_events
    GROUP BY event_type
  ) t;

  RETURN jsonb_build_object(
    'coreFunnel', jsonb_build_object(
      'analysis_started', v_started,
      'analysis_completed', v_completed,
      'analysis_failed', v_failed,
      'completion_rate', CASE WHEN v_started > 0 AND v_completed <= v_started THEN (v_completed::numeric / v_started::numeric)*100 ELSE 0 END,
      'completion_rate_invalid', v_completed > v_started,
      'failure_rate', CASE WHEN v_started > 0 THEN (v_failed::numeric / v_started::numeric)*100 ELSE 0 END,
      'average_analyses_per_day', v_completed::numeric,
      'latest_analysis_at', v_latest_analysis_at
    ),
    'valueMetrics', jsonb_build_object(
      'copy_improved_prompt', v_copy_count,
      'copy_rate', CASE WHEN v_completed > 0 THEN (v_copy_count::numeric / v_completed::numeric)*100 ELSE 0 END,
      'feedback_submitted', v_feedback_submitted,
      'feedback_rate', CASE WHEN v_completed > 0 THEN (v_feedback_submitted::numeric / v_completed::numeric)*100 ELSE 0 END,
      'feedback_up', v_feedback_up,
      'feedback_down', v_feedback_down,
      'feedback_up_down_ratio', v_feedback_up || ':' || v_feedback_down,
      'positive_feedback_ratio', CASE WHEN v_feedback_submitted > 0 THEN (v_feedback_up::numeric / v_feedback_submitted::numeric)*100 ELSE 0 END,
      'share_link_created', v_share_created,
      'share_link_disabled', v_share_disabled,
      'share_rate', CASE WHEN v_completed > 0 THEN (v_share_created::numeric / v_completed::numeric)*100 ELSE 0 END,
      'active_public_shares', v_active_shares,
      'export_markdown', v_export_md,
      'export_txt', v_export_txt
    ),
    'retentionProxy', jsonb_build_object(
      'unique_active_owners', v_unique_active_owners,
      'unique_owners_with_completed_analysis', v_unique_completed_owners,
      'returning_owners_count', v_returning_owners,
      'returning_rate', CASE WHEN v_unique_completed_owners > 0 THEN (v_returning_owners::numeric / v_unique_completed_owners::numeric)*100 ELSE 0 END,
      'average_completed_analyses_per_owner', v_avg_completed_per_owner,
      'median_completed_analyses_per_owner', v_median_completed_per_owner,
      'owner_usage_buckets', jsonb_build_object(
        'one_analysis', v_one_analysis,
        'two_to_three', v_two_to_three,
        'four_to_ten', v_four_to_ten,
        'more_than_ten', v_more_than_ten
      )
    ),
    'plans', jsonb_build_object(
      'free_users_count', v_free_users_count,
      'pro_users_count', v_pro_users_count,
      'analyses_by_plan', jsonb_build_object(
        'free', v_free_analyses,
        'pro', v_pro_analyses
      )
    ),
    'reliability', jsonb_build_object(
      'analysis_failed', v_failed,
      'provider_error', v_provider_error,
      'invalid_structured_output', v_invalid_structured,
      'api_error', v_api_error,
      'failure_rate', CASE WHEN v_started > 0 THEN (v_failed::numeric / v_started::numeric)*100 ELSE 0 END,
      'common_error_codes', v_common_errors
    ),
    'limits', jsonb_build_object(
      'limit_reached', v_limit_reached,
      'limit_reached_rate', CASE WHEN v_unique_active_owners > 0 THEN (v_limit_reached::numeric / v_unique_active_owners::numeric)*100 ELSE 0 END,
      'owners_hitting_limit_count', v_limited_owners_count,
      'average_limit_reached_per_limited_owner', v_avg_limit_reached
    ),
    'sensitiveDataSafety', jsonb_build_object(
      'sensitive_data_warning_shown', v_warnings_shown,
      'sensitive_data_blocked', v_blocked,
      'sensitive_warning_rate', CASE WHEN v_completed > 0 THEN (v_warnings_shown::numeric / v_completed::numeric)*100 ELSE 0 END,
      'sensitive_block_rate', CASE WHEN v_started > 0 THEN (v_blocked::numeric / v_started::numeric)*100 ELSE 0 END,
      'risk_level_counts', jsonb_build_object(
        'none', v_risk_none,
        'low', v_risk_low,
        'medium', v_risk_med,
        'high', v_risk_high
      ),
      'finding_type_counts', v_finding_types
    ),
    'promptCharacteristics', jsonb_build_object(
      'total_prompt_analyses', v_total_prompts,
      'analyses_by_working_language', v_langs,
      'analyses_by_selected_profile_slug', v_models,
      'analyses_by_score_level', v_score_levels,
      'average_overall_score', v_avg_score,
      'median_overall_score', v_median_score,
      'score_distribution', jsonb_build_object(
        'weak_0_39', v_score_w0_39,
        'needs_work_40_59', v_score_n40_59,
        'decent_60_74', v_score_d60_74,
        'strong_75_89', v_score_s75_89,
        'excellent_90_100', v_score_e90_100
      ),
      'average_input_prompt_length', v_avg_input_len,
      'average_improved_prompt_length', v_avg_improved_len,
      'prompt_length_buckets', jsonb_build_object(
        'short', v_len_short,
        'medium', v_len_med,
        'long', v_len_long,
        'very_long', v_len_vlong
      )
    ),
    'costUsage', jsonb_build_object(
      'ai_cost_status', 'OK',
      'ai_cost_reason', 'Estimated based on API tokens usage.',
      'total_input_tokens', v_input_tokens,
      'total_output_tokens', v_output_tokens,
      'total_tokens', v_total_tokens,
      'average_tokens_per_completed_analysis', CASE WHEN v_completed > 0 THEN v_total_tokens / v_completed ELSE 0 END,
      'estimated_total_cost', v_estimated_cost,
      'estimated_cost_per_analysis', CASE WHEN v_completed > 0 THEN v_estimated_cost / v_completed::numeric ELSE 0 END
    ),
    'eventCoverage', v_events_coverage
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_aggregated_metrics FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_aggregated_metrics FROM "anon";
REVOKE EXECUTE ON FUNCTION public.get_aggregated_metrics FROM "authenticated";
GRANT EXECUTE ON FUNCTION public.get_aggregated_metrics TO "service_role";


-- 8. Scrub redactedValue from existing databases (Faza 5)
-- We will search for any keys in JSONB objects of prompt_analyses and usage_events and remove/redact redactedValue.
-- Specifically, sensitive_data_findings_json is a JSONB array. Let's update findings to remove/strip redactedValue.
CREATE OR REPLACE FUNCTION public.scrub_redacted_values_from_jsonb(p_findings JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_elem JSONB;
  v_new_array JSONB := '[]'::jsonb;
BEGIN
  IF p_findings IS NULL OR jsonb_typeof(p_findings) != 'array' THEN
    RETURN p_findings;
  END IF;
  
  FOR v_elem IN SELECT * FROM jsonb_array_elements(p_findings) LOOP
    v_new_array := v_new_array || (v_elem - 'redactedValue');
  END LOOP;
  
  RETURN v_new_array;
END;
$$;

UPDATE public.prompt_analyses 
SET sensitive_data_findings_json = public.scrub_redacted_values_from_jsonb(sensitive_data_findings_json)
WHERE sensitive_data_findings_json IS NOT NULL;

-- Scrub usage_events.metadata_json if it contains redactedValue
UPDATE public.usage_events
SET metadata_json = metadata_json - 'redactedValue'
WHERE metadata_json ? 'redactedValue';

DROP FUNCTION public.scrub_redacted_values_from_jsonb(JSONB);
