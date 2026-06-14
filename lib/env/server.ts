import 'server-only'
import { z } from 'zod'

const strictBool = z.preprocess((val) => {
  if (val === undefined || val === '') return undefined
  if (typeof val === 'boolean') return val
  if (typeof val === 'string') {
    const trimmed = val.trim().toLowerCase()
    if (trimmed === 'true') return true
    if (trimmed === 'false') return false
    throw new Error(`Invalid boolean string: "${val}"`)
  }
  throw new Error(`Invalid boolean type: ${typeof val}`)
}, z.boolean().optional())

export const serverEnvSchema = z.object({
  APP_URL: z.string().url().default('http://localhost:3000'),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL_ID: z.string().default('deepseek/deepseek-v4-flash'),
  OPENROUTER_FALLBACK_MODEL_ID: z.string().optional(),
  OPENROUTER_SITE_URL: z.string().optional(),
  OPENROUTER_APP_NAME: z.string().optional(),
  AI_MOCK_MODE: strictBool.default(false),
  SUPABASE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  ANONYMOUS_DAILY_LIMIT: z.coerce.number().int().positive().default(3),
  MAX_PROMPT_CHARS: z.coerce.number().int().positive().default(12000),
  MIN_PROMPT_CHARS: z.coerce.number().int().positive().default(20),
  SENSITIVE_DATA_BLOCK_HIGH_RISK: strictBool.default(true),
  RETENTION_ANONYMOUS_ANALYSIS_DAYS: z.coerce.number().int().positive().default(30),
  RETENTION_USAGE_EVENT_DAYS: z.coerce.number().int().positive().default(90),
  RETENTION_FEEDBACK_EVENT_DAYS: z.coerce.number().int().positive().default(180),
  CRON_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_PRO: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_ENABLED: strictBool.default(false),
  ADMIN_EMAILS: z.string().optional(),
  RATE_LIMIT_HMAC_SECRET: z.string().optional(),
  AI_PROVIDER_TIMEOUT_MS: z.coerce.number().int().min(5000).max(120000).default(55000)
})

let parsedEnv: z.infer<typeof serverEnvSchema>
try {
  parsedEnv = serverEnvSchema.parse(process.env)
} catch (err) {
  const message = err instanceof Error ? err.message : String(err)
  if (err instanceof z.ZodError) {
    const sanitizedIssues = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      code: issue.code,
      message: issue.message
    }))
    console.error('Environment validation failed:', JSON.stringify(sanitizedIssues))
  } else {
    console.error('Environment validation failed:', message)
  }
  throw new Error('Environment validation failed. Some keys may be invalid or missing.')
}

export const serverEnv = parsedEnv

/**
 * Checks if all critical environment variables required for production are present.
 * This runs at request-time (or within page loads) to ensure Next.js builds can
 * succeed without production credentials being forced, while safely failing
 * live requests if they are missing in production.
 */
export function checkProductionEnv() {
  if (process.env.NODE_ENV === 'production') {
    const missing: string[] = []
    if (!process.env.OPENROUTER_API_KEY) {
      missing.push('OPENROUTER_API_KEY')
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
    if (process.env.STRIPE_ENABLED === 'true') {
      if (!process.env.STRIPE_SECRET_KEY) {
        missing.push('STRIPE_SECRET_KEY')
      }
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        missing.push('STRIPE_WEBHOOK_SECRET')
      }
      if (!process.env.STRIPE_PRICE_ID_PRO) {
        missing.push('STRIPE_PRICE_ID_PRO')
      }
    }
    if (!process.env.RATE_LIMIT_HMAC_SECRET) {
      missing.push('RATE_LIMIT_HMAC_SECRET')
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
