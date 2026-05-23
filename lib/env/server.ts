import 'server-only'
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
  SENSITIVE_DATA_BLOCK_HIGH_RISK: z.coerce.boolean().default(true),
  RETENTION_ANONYMOUS_ANALYSIS_DAYS: z.coerce.number().int().positive().default(30),
  RETENTION_USAGE_EVENT_DAYS: z.coerce.number().int().positive().default(90),
  RETENTION_FEEDBACK_EVENT_DAYS: z.coerce.number().int().positive().default(180),
  CRON_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_PRO: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional()
})

export const serverEnv = serverEnvSchema.parse(process.env)

/**
 * Checks if all critical environment variables required for production are present.
 * This runs at request-time (or within page loads) to ensure Next.js builds can
 * succeed without production credentials being forced, while safely failing
 * live requests if they are missing in production.
 */
export function checkProductionEnv() {
  if (process.env.NODE_ENV === 'production') {
    const missing: string[] = []
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      missing.push('GOOGLE_GENERATIVE_AI_API_KEY')
    }
    if (!process.env.SUPABASE_SECRET_KEY) {
      missing.push('SUPABASE_SECRET_KEY')
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      missing.push('NEXT_PUBLIC_SUPABASE_URL')
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      missing.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      missing.push('STRIPE_SECRET_KEY')
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      missing.push('STRIPE_WEBHOOK_SECRET')
    }
    if (!process.env.STRIPE_PRICE_ID_PRO) {
      missing.push('STRIPE_PRICE_ID_PRO')
    }

    if (missing.length > 0) {
      return {
        valid: false,
        error: `Błąd konfiguracji serwera: brak wymaganych zmiennych środowiskowych w trybie produkcyjnym.`,
        missing
      }
    }
  }
  return { valid: true, missing: [] }
}
