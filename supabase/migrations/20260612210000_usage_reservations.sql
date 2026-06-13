-- Migration to enforce atomic usage limits using a reservation ledger.

-- 1. Create usage_reservations table
CREATE TABLE IF NOT EXISTS public.usage_reservations (
    id UUID PRIMARY KEY,
    owner_anonymous_id TEXT NOT NULL,
    user_id UUID,
    status TEXT NOT NULL CHECK (status IN ('reserved', 'completed', 'released')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.usage_reservations ENABLE ROW LEVEL SECURITY;

-- Block all direct client access (read/write) for anon/authenticated roles
REVOKE ALL PRIVILEGES ON TABLE public.usage_reservations FROM "anon", "authenticated";
GRANT ALL ON TABLE public.usage_reservations TO "service_role";

-- Create indexes for performance and limit checking
CREATE INDEX IF NOT EXISTS idx_usage_reservations_owner ON public.usage_reservations (owner_anonymous_id);
CREATE INDEX IF NOT EXISTS idx_usage_reservations_user ON public.usage_reservations (user_id);
CREATE INDEX IF NOT EXISTS idx_usage_reservations_created ON public.usage_reservations (created_at);
CREATE INDEX IF NOT EXISTS idx_usage_reservations_status ON public.usage_reservations (status);

-- 2. Define acquire_usage_reservation function
CREATE OR REPLACE FUNCTION public.acquire_usage_reservation(
  p_reservation_id UUID,
  p_owner_anonymous_id TEXT,
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
  v_monthly_limit INT;
  v_daily_count INT;
  v_monthly_count INT;
  v_existing_status TEXT;
  v_now TIMESTAMP WITH TIME ZONE;
  v_start_of_day TIMESTAMP WITH TIME ZONE;
  v_start_of_month TIMESTAMP WITH TIME ZONE;
BEGIN
  v_now := now();
  v_start_of_day := date_trunc('day', v_now AT TIME ZONE 'UTC');
  v_start_of_month := date_trunc('month', v_now AT TIME ZONE 'UTC');

  -- Acquire transaction-level advisory lock based on identity to serialize concurrent limits check
  PERFORM pg_advisory_xact_lock(hashtext(COALESCE(p_user_id::text, p_owner_anonymous_id)));

  -- Check if reservation already exists (idempotency / retry)
  SELECT status INTO v_existing_status
  FROM public.usage_reservations
  WHERE id = p_reservation_id;

  IF FOUND THEN
    RETURN 'success:' || v_existing_status;
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

  -- Determine limits based on plan
  IF v_plan_slug = 'pro' THEN
    v_daily_limit := 100;
    v_monthly_limit := 500;
  ELSIF v_plan_slug = 'free' THEN
    v_daily_limit := 5;
    v_monthly_limit := 20;
  ELSE
    v_daily_limit := 3;
    v_monthly_limit := 10;
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

  -- Count usage this month (completed, or reserved in the last 5 minutes)
  SELECT COALESCE(COUNT(*), 0) INTO v_monthly_count
  FROM public.usage_reservations
  WHERE (
      (p_user_id IS NOT NULL AND user_id = p_user_id)
      OR
      (p_user_id IS NULL AND owner_anonymous_id = p_owner_anonymous_id)
    )
    AND created_at >= v_start_of_month
    AND (
      status = 'completed'
      OR (status = 'reserved' AND created_at >= v_now - INTERVAL '5 minutes')
    );

  -- Enforce daily limit
  IF v_daily_count >= v_daily_limit THEN
    RETURN 'daily_limit_reached';
  END IF;

  -- Enforce monthly limit
  IF v_monthly_count >= v_monthly_limit THEN
    RETURN 'monthly_limit_reached';
  END IF;

  -- Create reservation
  INSERT INTO public.usage_reservations (id, owner_anonymous_id, user_id, status, created_at, updated_at)
  VALUES (p_reservation_id, p_owner_anonymous_id, p_user_id, 'reserved', v_now, v_now);

  RETURN 'success:reserved';
END;
$$;

-- Revoke default public execution rights and grant only to service_role
REVOKE EXECUTE ON FUNCTION public.acquire_usage_reservation(UUID, TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.acquire_usage_reservation(UUID, TEXT, UUID) FROM "anon";
REVOKE EXECUTE ON FUNCTION public.acquire_usage_reservation(UUID, TEXT, UUID) FROM "authenticated";
GRANT EXECUTE ON FUNCTION public.acquire_usage_reservation(UUID, TEXT, UUID) TO "service_role";

-- 3. Define complete_usage_reservation function
CREATE OR REPLACE FUNCTION public.complete_usage_reservation(
  p_reservation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.usage_reservations
  SET status = 'completed',
      updated_at = now()
  WHERE id = p_reservation_id AND status = 'reserved';
  
  RETURN FOUND;
END;
$$;

-- Revoke execution rights and grant to service_role
REVOKE EXECUTE ON FUNCTION public.complete_usage_reservation(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_usage_reservation(UUID) FROM "anon";
REVOKE EXECUTE ON FUNCTION public.complete_usage_reservation(UUID) FROM "authenticated";
GRANT EXECUTE ON FUNCTION public.complete_usage_reservation(UUID) TO "service_role";

-- 4. Define release_usage_reservation function
CREATE OR REPLACE FUNCTION public.release_usage_reservation(
  p_reservation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.usage_reservations
  SET status = 'released',
      updated_at = now()
  WHERE id = p_reservation_id AND status = 'reserved';
  
  RETURN FOUND;
END;
$$;

-- Revoke execution rights and grant to service_role
REVOKE EXECUTE ON FUNCTION public.release_usage_reservation(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.release_usage_reservation(UUID) FROM "anon";
REVOKE EXECUTE ON FUNCTION public.release_usage_reservation(UUID) FROM "authenticated";
GRANT EXECUTE ON FUNCTION public.release_usage_reservation(UUID) TO "service_role";
