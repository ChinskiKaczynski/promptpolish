import { z } from 'zod'

export const serverEnvSchema = z.object({
  APP_URL: z.string().url().default('http://localhost:3000'),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  GEMINI_MODEL_ID: z.string().default('gemini-3.5-flash'),
  SUPABASE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  ANONYMOUS_DAILY_LIMIT: z.coerce.number().int().positive().default(3),
  MAX_PROMPT_CHARS: z.coerce.number().int().positive().default(12000),
  MIN_PROMPT_CHARS: z.coerce.number().int().positive().default(20),
  SENSITIVE_DATA_BLOCK_HIGH_RISK: z.coerce.boolean().default(true)
})

export const serverEnv = serverEnvSchema.parse(process.env)
