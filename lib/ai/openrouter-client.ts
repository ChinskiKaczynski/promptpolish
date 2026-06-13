import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText, Output } from 'ai'
import { analysisResultSchema, type AnalysisResult } from './schemas'
import { normalizeProviderError, ProviderError } from './provider-errors'
import { getOwnerConfiguredModelId } from './model-catalog'

import type { ModelProfileRow } from '@/lib/supabase/types'

export interface OpenRouterClientOptions {
  mockMode?: boolean
  mockResponse?: AnalysisResult
  temperature?: number
  /** AbortSignal to cancel the in-flight request (e.g. from an external AbortController). */
  abortSignal?: AbortSignal
  /**
   * Hard deadline in milliseconds.  When set (and no external abortSignal is
   * provided) the client creates its own AbortController and cancels the
   * request after this many ms.  Defaults to no timeout when omitted.
   */
  timeoutMs?: number
  dbProfile?: ModelProfileRow | null
}

export interface OpenRouterAnalysisResponse {
  output: AnalysisResult
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Low-level OpenRouter client that wraps Vercel AI SDK generateText with
 * strictly typed Output.object JSON structured validation.
 * Supports mocked responses directly for testing and local environments.
 */
export async function executeOpenRouterAnalysis(
  systemInstruction: string,
  userPrompt: string,
  options: OpenRouterClientOptions = {}
): Promise<OpenRouterAnalysisResponse> {
  const { mockMode = false, mockResponse, temperature, abortSignal, timeoutMs, dbProfile } = options

  // 1. Check and return Mock response if mock mode is active
  if (mockMode || mockResponse) {
    let mockOut = mockResponse
    if (!mockOut) {
      // Lazy load mockAnalysisResult to avoid circular dependency
      const { mockAnalysisResult } = await import('./mock-analysis')
      mockOut = mockAnalysisResult
    }
    
    return {
      output: mockOut,
      usage: {
        promptTokens: 120,
        completionTokens: 250,
        totalTokens: 370
      }
    }
  }

  // 2. Validate API Key for live calls
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey || apiKey.trim() === '') {
    throw new ProviderError(
      'Missing OpenRouter API Key',
      'The prompt analysis engine is not configured with an API key. Please check your system environment.',
      new Error('OPENROUTER_API_KEY is not defined in environment variables.')
    )
  }

  // 3. Resolve model ID and additional metadata headers from environment variables / dbProfile
  const capabilities = (dbProfile?.capabilities_json || {}) as Record<string, unknown>
  const modelId = (capabilities.model_id as string | undefined) || getOwnerConfiguredModelId()
  const effectiveTemperature = capabilities.temperature !== undefined ? (capabilities.temperature as number) : (temperature ?? 0.1)
  const maxTokens = capabilities.max_tokens !== undefined ? (capabilities.max_tokens as number) : 4000
  const siteUrl = process.env.OPENROUTER_SITE_URL
  const appName = process.env.OPENROUTER_APP_NAME

  // Resolve the effective AbortSignal – link external signal and timeout into a single ownController
  const ownController = new AbortController()
  const effectiveSignal = ownController.signal
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined
  let abortListener: (() => void) | undefined
  let abortReason: 'provider_timeout' | 'client_cancelled' | 'unknown_abort' | undefined

  if (abortSignal) {
    if (abortSignal.aborted) {
      abortReason = 'client_cancelled'
      ownController.abort('client_cancelled')
    } else {
      abortListener = () => {
        if (!abortReason) {
          abortReason = 'client_cancelled'
          ownController.abort('client_cancelled')
        }
      }
      abortSignal.addEventListener('abort', abortListener)
    }
  }

  if (timeoutMs && timeoutMs > 0) {
    timeoutHandle = setTimeout(() => {
      if (!abortReason) {
        abortReason = 'provider_timeout'
        ownController.abort('provider_timeout')
      }
    }, timeoutMs)
  }

  try {
    const openrouter = createOpenRouter({
      apiKey,
      headers: {
        ...(siteUrl ? { 'HTTP-Referer': siteUrl } : {}),
        ...(appName ? { 'X-Title': appName } : {}),
      },
    })

    const providerMetadata: Record<string, unknown> = {}
    if (capabilities.reasoning !== undefined) {
      providerMetadata.openrouter = {
        reasoning: capabilities.reasoning
      }
    }

    const { output, usage } = await generateText({
      model: openrouter.chat(modelId),
      system: systemInstruction,
      prompt: userPrompt,
      temperature: effectiveTemperature,
      maxOutputTokens: maxTokens,
      abortSignal: effectiveSignal,
      output: Output.object({
        schema: analysisResultSchema
      }),
      ...(Object.keys(providerMetadata).length > 0 ? { providerMetadata } : {})
    })

    const rawUsage = usage as { promptTokens?: number; completionTokens?: number; totalTokens?: number } | undefined
    return {
      output,
      usage: rawUsage ? {
        promptTokens: rawUsage.promptTokens ?? 0,
        completionTokens: rawUsage.completionTokens ?? 0,
        totalTokens: rawUsage.totalTokens ?? ((rawUsage.promptTokens ?? 0) + (rawUsage.completionTokens ?? 0))
      } : undefined
    }
  } catch (error) {
    // If the effective signal was aborted, check our explicit abortReason
    if (effectiveSignal.aborted) {
      const reason = abortReason || 'unknown_abort'
      if (reason === 'provider_timeout') {
        throw new ProviderError(
          `PROVIDER_TIMEOUT: Request aborted after ${timeoutMs}ms`,
          'The prompt analysis request timed out. Please try again.',
          error,
          504,
          'provider_timeout'
        )
      } else if (reason === 'client_cancelled') {
        throw new Error('CLIENT_CLOSED')
      } else {
        throw new ProviderError(
          'Request aborted due to an unknown abort.',
          'The prompt analysis request was interrupted.',
          error,
          499,
          'unknown_abort'
        )
      }
    }

    // Standardized provider error normalization for all other failures (e.g. upstream timeouts, rate limits)
    throw normalizeProviderError(error)
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle)
    if (abortSignal && abortListener) {
      abortSignal.removeEventListener('abort', abortListener)
    }
  }
}
