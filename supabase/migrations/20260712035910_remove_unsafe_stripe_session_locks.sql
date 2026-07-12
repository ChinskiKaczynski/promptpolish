-- Drop old 4-argument signature of update_checkout_attempt_status to clean up overload
DROP FUNCTION IF EXISTS public.update_checkout_attempt_status(uuid, text, text, text);

-- Recreate update_checkout_attempt_status with optional stripe_customer_id update
CREATE OR REPLACE FUNCTION public.update_checkout_attempt_status(
  p_attempt_id uuid,
  p_status text,
  p_session_id text DEFAULT NULL,
  p_failure_code text DEFAULT NULL,
  p_stripe_customer_id text DEFAULT NULL
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
      stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
      updated_at = pg_catalog.now()
  WHERE id = p_attempt_id;
  
  RETURN FOUND;
END;
$$;

-- Revoke default public execution rights and grant only to service_role
REVOKE EXECUTE ON FUNCTION public.update_checkout_attempt_status(uuid, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_checkout_attempt_status(uuid, text, text, text, text) FROM "anon";
REVOKE EXECUTE ON FUNCTION public.update_checkout_attempt_status(uuid, text, text, text, text) FROM "authenticated";
GRANT EXECUTE ON FUNCTION public.update_checkout_attempt_status(uuid, text, text, text, text) TO "service_role";
