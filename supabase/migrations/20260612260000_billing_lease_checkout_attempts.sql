-- Migration to introduce webhook inbox lease recovery and server-side checkout-attempt lifecycle.

-- 1. Create billing_checkout_attempts table
CREATE TABLE IF NOT EXISTS public.billing_checkout_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    price_id text NOT NULL,
    stripe_customer_id text NOT NULL,
    stripe_checkout_session_id text,
    status text NOT NULL CHECK (status IN ('creating', 'ready', 'completed', 'failed', 'expired')),
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    failure_code text
);

-- Enable RLS
ALTER TABLE public.billing_checkout_attempts ENABLE ROW LEVEL SECURITY;

-- Revoke all direct client access
REVOKE ALL PRIVILEGES ON TABLE public.billing_checkout_attempts FROM "anon", "authenticated", PUBLIC;
GRANT ALL ON TABLE public.billing_checkout_attempts TO "service_role";

-- Create unique index to enforce at most one active checkout attempt per user and product
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_checkout_attempt 
ON public.billing_checkout_attempts (user_id, price_id) 
WHERE (status IN ('creating', 'ready'));

-- Create index on user_id for querying performance
CREATE INDEX IF NOT EXISTS idx_billing_checkout_attempts_user ON public.billing_checkout_attempts (user_id);

-- 2. RPC to atomically claim/create a checkout attempt
CREATE OR REPLACE FUNCTION public.claim_checkout_attempt(
  p_user_id uuid,
  p_price_id text,
  p_stripe_customer_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_lock_key integer;
  v_attempt_id uuid;
  v_status text;
  v_session_id text;
  v_expires_at timestamp with time zone;
BEGIN
  -- Advisory lock on user_id to serialize concurrent requests for this user
  v_lock_key := pg_catalog.hashtext(p_user_id::text);
  PERFORM pg_catalog.pg_advisory_xact_lock(v_lock_key);

  -- Find existing active attempt (creating or ready)
  SELECT id, status, stripe_checkout_session_id, expires_at 
  INTO v_attempt_id, v_status, v_session_id, v_expires_at
  FROM public.billing_checkout_attempts
  WHERE user_id = p_user_id 
    AND price_id = p_price_id 
    AND status IN ('creating', 'ready');

  IF FOUND THEN
    -- Check if expired
    IF v_expires_at < pg_catalog.now() THEN
      -- Update status to expired
      UPDATE public.billing_checkout_attempts
      SET status = 'expired',
          updated_at = pg_catalog.now()
      WHERE id = v_attempt_id;
    ELSE
      -- If active and ready, return existing ready session ID
      IF v_status = 'ready' THEN
        RETURN pg_catalog.json_build_object(
          'status', 'ready',
          'attempt_id', v_attempt_id,
          'stripe_checkout_session_id', v_session_id
        );
      END IF;
      -- If active and creating, return checkout_in_progress
      IF v_status = 'creating' THEN
        RETURN pg_catalog.json_build_object(
          'status', 'checkout_in_progress',
          'attempt_id', v_attempt_id,
          'stripe_checkout_session_id', null
        );
      END IF;
    END IF;
  END IF;

  -- Create new attempt record
  v_attempt_id := pg_catalog.gen_random_uuid();
  INSERT INTO public.billing_checkout_attempts (
    id, user_id, price_id, stripe_customer_id, status, expires_at
  ) VALUES (
    v_attempt_id, p_user_id, p_price_id, p_stripe_customer_id, 'creating', pg_catalog.now() + interval '15 minutes'
  );

  RETURN pg_catalog.json_build_object(
    'status', 'create_new',
    'attempt_id', v_attempt_id,
    'stripe_checkout_session_id', null
  );
END;
$$;

-- Revoke default public execution rights and grant only to service_role
REVOKE EXECUTE ON FUNCTION public.claim_checkout_attempt(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_checkout_attempt(uuid, text, text) FROM "anon";
REVOKE EXECUTE ON FUNCTION public.claim_checkout_attempt(uuid, text, text) FROM "authenticated";
GRANT EXECUTE ON FUNCTION public.claim_checkout_attempt(uuid, text, text) TO "service_role";

-- 3. RPC to update checkout attempt status
CREATE OR REPLACE FUNCTION public.update_checkout_attempt_status(
  p_attempt_id uuid,
  p_status text,
  p_session_id text DEFAULT NULL,
  p_failure_code text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.billing_checkout_attempts
  SET status = p_status,
      stripe_checkout_session_id = COALESCE(p_session_id, stripe_checkout_session_id),
      failure_code = COALESCE(p_failure_code, failure_code),
      updated_at = pg_catalog.now()
  WHERE id = p_attempt_id;
  
  RETURN FOUND;
END;
$$;

-- Revoke default public execution rights and grant only to service_role
REVOKE EXECUTE ON FUNCTION public.update_checkout_attempt_status(uuid, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_checkout_attempt_status(uuid, text, text, text) FROM "anon";
REVOKE EXECUTE ON FUNCTION public.update_checkout_attempt_status(uuid, text, text, text) FROM "authenticated";
GRANT EXECUTE ON FUNCTION public.update_checkout_attempt_status(uuid, text, text, text) TO "service_role";

-- 4. Re-declare claim_stripe_webhook_event with atomic lease recovery
CREATE OR REPLACE FUNCTION public.claim_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_stripe_created timestamp with time zone,
  p_customer_id text,
  p_subscription_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status text;
  v_attempts integer;
  v_updated_at timestamp with time zone;
  v_lease_duration interval := interval '10 minutes';
  v_max_attempts integer := 5;
BEGIN
  -- Advisory lock on event ID to serialize concurrent claims for the same event
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_event_id));

  SELECT status, attempt_count, updated_at 
  INTO v_status, v_attempts, v_updated_at
  FROM public.stripe_webhook_events
  WHERE event_id = p_event_id;

  IF NOT FOUND THEN
    INSERT INTO public.stripe_webhook_events (
      event_id, event_type, stripe_created, customer_id, subscription_id, status, attempt_count
    ) VALUES (
      p_event_id, p_event_type, p_stripe_created, p_customer_id, p_subscription_id, 'processing', 1
    );
    RETURN 'process';
  END IF;

  -- Processed, ignored or terminal events cannot be reclaimed
  IF v_status = 'processed' OR v_status = 'ignored' OR v_status = 'failed_terminal' THEN
    RETURN 'duplicate_success';
  END IF;

  -- Active processing check
  IF v_status = 'processing' THEN
    -- If lease is still active, return processing
    IF pg_catalog.now() < v_updated_at + v_lease_duration THEN
      RETURN 'processing';
    END IF;
    
    -- Lease expired! Try to reclaim
    IF v_attempts < v_max_attempts THEN
      UPDATE public.stripe_webhook_events
      SET status = 'processing',
          attempt_count = v_attempts + 1,
          updated_at = pg_catalog.now()
      WHERE event_id = p_event_id;
      RETURN 'process';
    ELSE
      UPDATE public.stripe_webhook_events
      SET status = 'failed_terminal',
          failure_message = 'Max reclaim attempts reached (lease expired)',
          updated_at = pg_catalog.now()
      WHERE event_id = p_event_id;
      RETURN 'failed_terminal';
    END IF;
  END IF;

  -- Retryable failed event reclaim
  IF v_status = 'failed_retryable' THEN
    IF v_attempts < v_max_attempts THEN
      UPDATE public.stripe_webhook_events
      SET status = 'processing',
          attempt_count = v_attempts + 1,
          updated_at = pg_catalog.now()
      WHERE event_id = p_event_id;
      RETURN 'process';
    ELSE
      UPDATE public.stripe_webhook_events
      SET status = 'failed_terminal',
          failure_message = 'Max reclaim attempts reached (retry limit)',
          updated_at = pg_catalog.now()
      WHERE event_id = p_event_id;
      RETURN 'failed_terminal';
    END IF;
  END IF;

  RETURN 'unknown';
END;
$$;
