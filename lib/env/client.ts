import { z } from 'zod'

/**
 * Client-side safe environment variables schema.
 * Only values prefixed with NEXT_PUBLIC_ are loaded.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().or(z.string().length(0)).default(''),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().default(''),
  NEXT_PUBLIC_ENABLE_MOCK_RESULT: z.preprocess((val) => val === 'true', z.boolean()).default(false)
})

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_ENABLE_MOCK_RESULT: process.env.NEXT_PUBLIC_ENABLE_MOCK_RESULT
})
