-- Remove unsafe session-level Stripe advisory-lock RPCs.
--
-- Separate Supabase RPC calls are not guaranteed to use the same PostgreSQL
-- connection. Checkout concurrency is handled by claim_checkout_attempt(),
-- its transaction-level lock, checkout-attempt leases, the unique active
-- attempt index, and Stripe idempotency keys.

DROP FUNCTION IF EXISTS public.acquire_stripe_lock(text);
DROP FUNCTION IF EXISTS public.release_stripe_lock(text);
