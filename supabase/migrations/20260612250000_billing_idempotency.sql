-- Migration to introduce webhook inbox, subscription uniqueness, and out-of-order event metadata.

-- 1. Add ordering columns to public.subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS last_event_created timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_event_id text;

-- 2. Create stripe_webhook_events table
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
    event_id text PRIMARY KEY,
    event_type text NOT NULL,
    stripe_created timestamp with time zone NOT NULL,
    customer_id text,
    subscription_id text,
    status text NOT NULL CHECK (status IN ('received', 'processing', 'processed', 'failed_retryable', 'failed_terminal', 'ignored')),
    attempt_count integer DEFAULT 0 NOT NULL,
    failure_message text,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Revoke all direct client access
REVOKE ALL PRIVILEGES ON TABLE public.stripe_webhook_events FROM "anon", "authenticated", PUBLIC;
GRANT ALL ON TABLE public.stripe_webhook_events TO "service_role";

-- Create index on status for operational query performance
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status ON public.stripe_webhook_events (status);

-- 3. Create a unique partial index on subscriptions to enforce at most one active-equivalent subscription per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_user_subscription 
ON public.subscriptions (user_id) 
WHERE (status IN ('active', 'trialing', 'past_due'));

-- 4. RPC to atomically claim/insert webhook event
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
BEGIN
  -- Acquire an advisory lock on the event ID to serialize concurrent claims for the same event
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_event_id));

  SELECT status, attempt_count INTO v_status, v_attempts
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

  IF v_status = 'processed' OR v_status = 'ignored' OR v_status = 'failed_terminal' THEN
    RETURN 'duplicate_success';
  END IF;

  IF v_status = 'processing' THEN
    RETURN 'processing';
  END IF;

  IF v_status = 'failed_retryable' THEN
    UPDATE public.stripe_webhook_events
    SET status = 'processing',
        attempt_count = v_attempts + 1,
        updated_at = pg_catalog.now()
    WHERE event_id = p_event_id;
    RETURN 'process';
  END IF;

  RETURN 'unknown';
END;
$$;

-- Revoke default public execution rights and grant only to service_role
REVOKE EXECUTE ON FUNCTION public.claim_stripe_webhook_event(text, text, timestamp with time zone, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_stripe_webhook_event(text, text, timestamp with time zone, text, text) FROM "anon";
REVOKE EXECUTE ON FUNCTION public.claim_stripe_webhook_event(text, text, timestamp with time zone, text, text) FROM "authenticated";
GRANT EXECUTE ON FUNCTION public.claim_stripe_webhook_event(text, text, timestamp with time zone, text, text) TO "service_role";

-- 5. RPC to update webhook event status
CREATE OR REPLACE FUNCTION public.update_stripe_webhook_event_status(
  p_event_id text,
  p_status text,
  p_failure_message text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.stripe_webhook_events
  SET status = p_status,
      failure_message = p_failure_message,
      processed_at = CASE WHEN p_status = 'processed' THEN pg_catalog.now() ELSE processed_at END,
      updated_at = pg_catalog.now()
  WHERE event_id = p_event_id;
  
  RETURN FOUND;
END;
$$;

-- Revoke default public execution rights and grant only to service_role
REVOKE EXECUTE ON FUNCTION public.update_stripe_webhook_event_status(text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_stripe_webhook_event_status(text, text, text) FROM "anon";
REVOKE EXECUTE ON FUNCTION public.update_stripe_webhook_event_status(text, text, text) FROM "authenticated";
GRANT EXECUTE ON FUNCTION public.update_stripe_webhook_event_status(text, text, text) TO "service_role";
