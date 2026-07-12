-- Migration to add cancellation fields to subscriptions table for scheduled cancellation support.
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS cancel_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS canceled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ended_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS cancellation_feedback text;
