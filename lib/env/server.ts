import 'server-only'
import { z } from 'zod'

const strictBool = z.preprocess(
  (value) => {
    if (
      value === undefined ||
      value === ''
    ) {
      return undefined
    }

    if (
      typeof value === 'boolean'
    ) {
      return value
    }

    if (
      typeof value === 'string'
    ) {
      const normalized =
        value
          .trim()
          .toLowerCase()

      if (normalized === 'true') {
        return true
      }

      if (normalized === 'false') {
        return false
      }

      throw new Error(
        `Invalid boolean string: "${value}"`
      )
    }

    throw new Error(
      `Invalid boolean type: ${typeof value}`
    )
  },
  z.boolean().optional()
)

export const serverEnvSchema =
  z.object({
    APP_URL:
      z.string()
        .url()
        .default(
          'http://localhost:3000'
        ),

    /*
     * Google is also the environment-level emergency fallback when the
     * database runtime configuration cannot be read.
     */
    GOOGLE_GENERATIVE_AI_API_KEY:
      z.string().optional(),

    /*
     * OpenRouter is optional and is required only when selected as the active
     * primary or fallback provider.
     */
    OPENROUTER_API_KEY:
      z.string().optional(),

    GEMINI_MODEL_ID:
      z.string().default(
        'gemini-2.5-flash'
      ),

    AI_MOCK_MODE:
      strictBool.default(false),

    SUPABASE_SECRET_KEY:
      z.string().optional(),

    NEXT_PUBLIC_SUPABASE_URL:
      z.string().optional(),

    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      z.string().optional(),

    ANONYMOUS_DAILY_LIMIT:
      z.coerce
        .number()
        .int()
        .positive()
        .max(50)
        .default(3),

    MAX_PROMPT_CHARS:
      z.coerce
        .number()
        .int()
        .positive()
        .default(12000),

    MIN_PROMPT_CHARS:
      z.coerce
        .number()
        .int()
        .positive()
        .default(20),

    SENSITIVE_DATA_BLOCK_HIGH_RISK:
      strictBool.default(true),

    RETENTION_ANONYMOUS_ANALYSIS_DAYS:
      z.coerce
        .number()
        .int()
        .positive()
        .default(30),

    RETENTION_USAGE_EVENT_DAYS:
      z.coerce
        .number()
        .int()
        .positive()
        .default(90),

    RETENTION_FEEDBACK_EVENT_DAYS:
      z.coerce
        .number()
        .int()
        .positive()
        .default(180),

    CRON_SECRET:
      z.string().optional(),

    STRIPE_SECRET_KEY:
      z.string().optional(),

    STRIPE_WEBHOOK_SECRET:
      z.string().optional(),

    STRIPE_PRICE_ID_PRO:
      z.string().optional(),

    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      z.string().optional(),

    STRIPE_ENABLED:
      strictBool.default(false),

    ADMIN_EMAILS:
      z.string().optional(),

    RATE_LIMIT_HMAC_SECRET:
      z.string().optional(),

    AI_PROVIDER_TIMEOUT_MS:
      z.coerce
        .number()
        .int()
        .min(5000)
        .max(120000)
        .default(55000),

    COOKIE_SIGNING_SECRET:
      z.string().optional(),
  })

let parsedEnv:
  z.infer<
    typeof serverEnvSchema
  >

try {
  parsedEnv =
    serverEnvSchema.parse(
      process.env
    )
} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : String(error)

  if (error instanceof z.ZodError) {
    const sanitizedIssues =
      error.issues.map(
        (issue) => ({
          path:
            issue.path.join('.'),
          code:
            issue.code,
          message:
            issue.message,
        })
      )

    console.error(
      'Environment validation failed:',
      JSON.stringify(
        sanitizedIssues
      )
    )
  } else {
    console.error(
      'Environment validation failed:',
      message
    )
  }

  throw new Error(
    'Environment validation failed. Some keys may be invalid or missing.'
  )
}

export const serverEnv =
  parsedEnv

/**
 * Checks if all critical environment variables required for production are
 * present.
 *
 * This runs at request time so Next.js builds can succeed without production
 * credentials while live production requests fail safely.
 */
export function checkProductionEnv() {
  if (
    process.env.NODE_ENV ===
    'production'
  ) {
    const missing: string[] = []

    /*
     * Google remains mandatory because getActiveAIRuntimeConfig() uses Google
     * as the environment fallback if the database configuration is
     * unavailable.
     */
    if (
      !process.env
        .GOOGLE_GENERATIVE_AI_API_KEY
    ) {
      missing.push(
        'GOOGLE_GENERATIVE_AI_API_KEY'
      )
    }

    if (
      !process.env
        .SUPABASE_SECRET_KEY
    ) {
      missing.push(
        'SUPABASE_SECRET_KEY'
      )
    }

    if (
      !process.env
        .NEXT_PUBLIC_SUPABASE_URL
    ) {
      missing.push(
        'NEXT_PUBLIC_SUPABASE_URL'
      )
    }

    if (
      !process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ) {
      missing.push(
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
      )
    }

    if (
      process.env.STRIPE_ENABLED ===
      'true'
    ) {
      if (
        !process.env
          .STRIPE_SECRET_KEY
      ) {
        missing.push(
          'STRIPE_SECRET_KEY'
        )
      }

      if (
        !process.env
          .STRIPE_WEBHOOK_SECRET
      ) {
        missing.push(
          'STRIPE_WEBHOOK_SECRET'
        )
      }

      if (
        !process.env
          .STRIPE_PRICE_ID_PRO
      ) {
        missing.push(
          'STRIPE_PRICE_ID_PRO'
        )
      }
    }

    if (
      !process.env
        .RATE_LIMIT_HMAC_SECRET
    ) {
      missing.push(
        'RATE_LIMIT_HMAC_SECRET'
      )
    }

    const cookieSecret =
      process.env
        .COOKIE_SIGNING_SECRET

    if (!cookieSecret) {
      missing.push(
        'COOKIE_SIGNING_SECRET'
      )
    } else if (
      cookieSecret.length < 32
    ) {
      return {
        valid: false,
        error:
          'Błąd konfiguracji serwera: COOKIE_SIGNING_SECRET jest zbyt krótki (wymagane minimum 32 znaki).',
        missing: [
          'COOKIE_SIGNING_SECRET',
        ],
      }
    }

    if (missing.length > 0) {
      return {
        valid: false,
        error:
          'Błąd konfiguracji serwera: brak wymaganych zmiennych środowiskowych w trybie produkcyjnym.',
        missing,
      }
    }
  }

  return {
    valid: true,
    missing: [] as string[],
  }
}