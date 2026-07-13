import 'server-only'

import { z } from 'zod'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { serializeDbError } from '@/lib/supabase/error-serializer'
import { serverEnv } from '@/lib/env/server'

export const aiProviderSchema = z.enum([
  'google',
  'openrouter',
])

export type AIProvider = z.infer<typeof aiProviderSchema>

export interface AIRuntimeConfig {
  provider: AIProvider
  modelId: string
  fallbackProvider: AIProvider | null
  fallbackModelId: string | null
  temperature: number
  maxOutputTokens: number
  timeoutMs: number
  thinkingBudget: number
  source: 'database' | 'environment_fallback'
}

const runtimeConfigRowSchema = z.object({
  id: z.literal('active'),
  provider: aiProviderSchema,
  model_id: z.string().trim().min(1).max(200),
  fallback_provider: aiProviderSchema.nullable(),
  fallback_model_id: z.string().trim().min(1).max(200).nullable(),
  temperature: z.number().min(0).max(2),
  max_output_tokens: z.number().int().min(512).max(32768),
  timeout_ms: z.number().int().min(5000).max(120000),
  thinking_budget: z.number().int().min(0).max(32768),
}).superRefine((value, context) => {
  const hasFallbackProvider = value.fallback_provider !== null
  const hasFallbackModel = value.fallback_model_id !== null

  if (hasFallbackProvider !== hasFallbackModel) {
    context.addIssue({
      code: 'custom',
      message:
        'fallback_provider and fallback_model_id must both be set or both be null.',
      path: ['fallback_provider'],
    })
  }
})

function getSafeThinkingBudget(): number {
  const value = Number(process.env.GEMINI_THINKING_BUDGET ?? 0)

  if (!Number.isInteger(value) || value < 0 || value > 32768) {
    return 0
  }

  return value
}

export function getEnvironmentFallbackAIRuntimeConfig(): AIRuntimeConfig {
  return {
    provider: 'google',
    modelId: serverEnv.GEMINI_MODEL_ID,
    fallbackProvider: null,
    fallbackModelId: null,
    temperature: 0.1,
    maxOutputTokens: 6000,
    timeoutMs: serverEnv.AI_PROVIDER_TIMEOUT_MS,
    thinkingBudget: getSafeThinkingBudget(),
    source: 'environment_fallback',
  }
}

/**
 * Reads the active execution model for PromptPolish.
 *
 * This deliberately performs a fresh database read on every analysis request,
 * so changes made by the administrator take effect immediately.
 */
export async function getActiveAIRuntimeConfig(): Promise<AIRuntimeConfig> {
  const environmentFallback =
    getEnvironmentFallbackAIRuntimeConfig()

  try {
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('ai_runtime_config')
      .select(`
        id,
        provider,
        model_id,
        fallback_provider,
        fallback_model_id,
        temperature,
        max_output_tokens,
        timeout_ms,
        thinking_budget
      `)
      .eq('id', 'active')
      .maybeSingle()

    if (error) {
      console.error(
        '[AI Runtime Config] Database read failed. Using environment fallback:',
        serializeDbError(error)
      )

      return environmentFallback
    }

    if (!data) {
      console.error(
        '[AI Runtime Config] Active configuration is missing. Using environment fallback.'
      )

      return environmentFallback
    }

    const parsed = runtimeConfigRowSchema.safeParse(data)

    if (!parsed.success) {
      console.error(
        '[AI Runtime Config] Invalid database configuration. Using environment fallback:',
        parsed.error.flatten()
      )

      return environmentFallback
    }

    return {
      provider: parsed.data.provider,
      modelId: parsed.data.model_id,
      fallbackProvider: parsed.data.fallback_provider,
      fallbackModelId: parsed.data.fallback_model_id,
      temperature: parsed.data.temperature,
      maxOutputTokens: parsed.data.max_output_tokens,
      timeoutMs: parsed.data.timeout_ms,
      thinkingBudget: parsed.data.thinking_budget,
      source: 'database',
    }
  } catch (error) {
    console.error(
      '[AI Runtime Config] Unexpected error. Using environment fallback:',
      error
    )

    return environmentFallback
  }
}