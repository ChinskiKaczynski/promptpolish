-- Check for existing duplicate share_tokens before adding constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT share_token FROM public.prompt_analyses
    WHERE share_token IS NOT NULL
    GROUP BY share_token HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate share_tokens found — cannot add unique constraint safely';
  END IF;
END $$;

-- Partial unique index: share_token must be unique when NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_analyses_share_token_unique
  ON public.prompt_analyses (share_token)
  WHERE share_token IS NOT NULL;
