-- Migration to add identity tracking and uniqueness constraints to feedback_events.

-- 1. Add nullable identity columns if not exists
ALTER TABLE public.feedback_events
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS owner_anonymous_id TEXT;

-- Add foreign key constraint for user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedback_events_user_id_fkey') THEN
    ALTER TABLE public.feedback_events
    ADD CONSTRAINT feedback_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Backfill identity columns for existing feedback events
-- To avoid violating uniqueness constraint on existing duplicate rows,
-- we backfill only the latest feedback event for each analysis.
-- Older duplicate feedback events are left with user_id and owner_anonymous_id as NULL.
WITH ranked_feedback AS (
  SELECT f.id,
         p.user_id,
         p.owner_anonymous_id,
         ROW_NUMBER() OVER (PARTITION BY f.analysis_id ORDER BY f.created_at DESC) as rn
  FROM public.feedback_events f
  JOIN public.prompt_analyses p ON f.analysis_id = p.id
)
UPDATE public.feedback_events f
SET user_id = r.user_id,
    owner_anonymous_id = r.owner_anonymous_id
FROM ranked_feedback r
WHERE f.id = r.id AND r.rn = 1;

-- 3. Create partial unique indexes to guarantee uniqueness per analysis and identity.
-- Allows nullable columns safely by ignoring NULLs.
CREATE UNIQUE INDEX IF NOT EXISTS feedback_events_analysis_user_idx 
ON public.feedback_events (analysis_id, user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS feedback_events_analysis_anon_idx 
ON public.feedback_events (analysis_id, owner_anonymous_id) 
WHERE user_id IS NULL AND owner_anonymous_id IS NOT NULL;

-- 4. Preserve security privileges and restrict client access
REVOKE ALL PRIVILEGES ON TABLE public.feedback_events FROM "anon", "authenticated";
GRANT ALL ON TABLE public.feedback_events TO "service_role";
