import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText, Output } from 'ai'
import { analysisResultSchema, type AnalysisResult } from './schemas'
import { normalizeProviderError, ProviderError } from './provider-errors'
import { getOwnerConfiguredModelId } from './model-catalog'

import type { ModelProfileRow } from '@/lib/supabase/types'

import { serverEnv } from '@/lib/env/server'

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
  requestId?: string
}

export interface OpenRouterAnalysisResponse {
  output: AnalysisResult
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    reasoningTokens?: number
    visibleTokens?: number
  }
  finishReason?: string
  selectedModel: string
  attempt: number
  durationMs: number
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
  const { mockMode = false, mockResponse, temperature, abortSignal, timeoutMs, dbProfile, requestId } = options

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
        totalTokens: 370,
        reasoningTokens: 0,
        visibleTokens: 250
      },
      finishReason: 'stop',
      selectedModel: 'mock-model',
      attempt: 1,
      durationMs: 50
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
  const primaryModelId = (capabilities.model_id as string | undefined) || getOwnerConfiguredModelId()
  const fallbackModelId = (capabilities.fallback_model_id as string | undefined) ||
                          (capabilities.fallbackModelId as string | undefined) ||
                          process.env.OPENROUTER_FALLBACK_MODEL_ID ||
                          'openai/gpt-4o-mini'
  const effectiveTemperature = capabilities.temperature !== undefined ? (capabilities.temperature as number) : (temperature ?? 0.1)
  const maxTokens = capabilities.max_tokens !== undefined ? (capabilities.max_tokens as number) : 4000
  const siteUrl = process.env.OPENROUTER_SITE_URL
  const appName = process.env.OPENROUTER_APP_NAME

  const startTime = Date.now()
  const totalTimeout = timeoutMs ?? 110000 // Total operation budget (default: 110s)
  const primaryLimit = dbProfile?.capabilities_json?.timeout_ms as number ?? serverEnv.AI_PROVIDER_TIMEOUT_MS ?? 55000
  const primaryTimeoutMs = Math.min(totalTimeout, primaryLimit)

  let attempt = 1
  let lastError: unknown = null

  while (attempt <= 2) {
    const elapsed = Date.now() - startTime
    const remainingBudgetMs = totalTimeout - elapsed

    if (attempt > 1 && remainingBudgetMs <= 5000) {
      throw lastError
    }

    const selectedModel = attempt === 1 ? primaryModelId : fallbackModelId
    const attemptTimeoutMs = attempt === 1 ? primaryTimeoutMs : remainingBudgetMs

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

    if (attemptTimeoutMs > 0) {
      timeoutHandle = setTimeout(() => {
        if (!abortReason) {
          abortReason = 'provider_timeout'
          ownController.abort('provider_timeout')
        }
      }, attemptTimeoutMs)
    }

    const attemptStartTime = Date.now()

    try {
      const openrouter = createOpenRouter({
        apiKey,
        headers: {
          ...(siteUrl ? { 'HTTP-Referer': siteUrl } : {}),
          ...(appName ? { 'X-Title': appName } : {}),
        },
      })

      const supportsReasoning = capabilities.supportsReasoning as boolean | undefined
      const reasoningMode = capabilities.reasoningMode as 'enabled' | 'disabled' | 'provider-default' | undefined

      const providerMetadata: Record<string, unknown> = {}
      let finalReasoning: boolean | undefined = undefined

      if (attempt === 1) {
        if (reasoningMode === 'enabled') {
          finalReasoning = true
        } else if (reasoningMode === 'disabled') {
          finalReasoning = false
        } else if (supportsReasoning !== undefined) {
          finalReasoning = supportsReasoning
        } else if (capabilities.reasoning !== undefined) {
          finalReasoning = capabilities.reasoning as boolean
        } else {
          // Prefer disabled unless explicitly enabled
          finalReasoning = false
        }
      } else {
        // Fallback model defaults to no forced reasoning
        finalReasoning = false
      }

      if (finalReasoning !== undefined) {
        providerMetadata.openrouter = {
          reasoning: finalReasoning
        }
      }

      const { output, usage, finishReason } = await generateText({
        model: openrouter.chat(selectedModel, {
          provider: {
            require_parameters: true
          }
        }),
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

      const rawUsage = usage as {
        promptTokens?: number
        inputTokens?: number
        completionTokens?: number
        outputTokens?: number
        totalTokens?: number
        reasoningTokens?: number
        outputTokenDetails?: { reasoningTokens?: number }
      } | undefined

      const totalOutputTokens = rawUsage?.completionTokens ?? rawUsage?.outputTokens ?? 0
      const reasoningTokens = rawUsage?.outputTokenDetails?.reasoningTokens ?? rawUsage?.reasoningTokens ?? 0
      const visibleOutputTokens = Math.max(0, totalOutputTokens - reasoningTokens)
      const promptTokens = rawUsage?.promptTokens ?? rawUsage?.inputTokens ?? 0
      const totalTokens = rawUsage?.totalTokens ?? (promptTokens + totalOutputTokens)

      const durationMs = Date.now() - attemptStartTime

      // Log success attempt
      console.info('[AI Reliability Log]', JSON.stringify({
        requestId: requestId || 'N/A',
        attempt,
        selectedModel,
        provider: dbProfile?.provider || 'openrouter',
        durationMs,
        remainingBudgetMs: totalTimeout - (Date.now() - startTime),
        errorCategory: undefined,
        upstreamStatus: undefined,
        finishReason,
        promptChars: userPrompt.length + systemInstruction.length,
        visibleOutputTokens,
        reasoningTokens,
        totalOutputTokens
      }))

      return {
        output,
        usage: {
          promptTokens,
          completionTokens: totalOutputTokens,
          totalTokens,
          reasoningTokens,
          visibleTokens: visibleOutputTokens
        },
        finishReason: finishReason || 'stop',
        selectedModel,
        attempt,
        durationMs
      }
    } catch (error) {
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle)
      if (abortSignal && abortListener) {
        abortSignal.removeEventListener('abort', abortListener)
      }

      let normalizedError: ProviderError
      if (effectiveSignal.aborted) {
        const reason = abortReason || 'unknown_abort'
        if (reason === 'provider_timeout') {
          normalizedError = new ProviderError(
            `PROVIDER_TIMEOUT: Request aborted after ${attemptTimeoutMs}ms`,
            'The prompt analysis request timed out. Please try again.',
            error,
            504,
            'provider_timeout'
          )
        } else if (reason === 'client_cancelled') {
          throw new Error('CLIENT_CLOSED')
        } else {
          normalizedError = new ProviderError(
            'Request aborted due to an unknown abort.',
            'The prompt analysis request was interrupted.',
            error,
            499,
            'unknown_abort'
          )
        }
      } else {
        normalizedError = normalizeProviderError(error)
      }

      const durationMs = Date.now() - attemptStartTime
      const elapsedNow = Date.now() - startTime
      const remainingBudgetNow = totalTimeout - elapsedNow

      // Log failed attempt
      console.info('[AI Reliability Log]', JSON.stringify({
        requestId: requestId || 'N/A',
        attempt,
        selectedModel,
        provider: dbProfile?.provider || 'openrouter',
        durationMs,
        remainingBudgetMs: remainingBudgetNow,
        errorCategory: normalizedError.errorCode || 'unknown_error',
        upstreamStatus: normalizedError.statusCode,
        finishReason: undefined,
        promptChars: userPrompt.length + systemInstruction.length,
        visibleOutputTokens: 0,
        reasoningTokens: 0,
        totalOutputTokens: 0
      }))

      const isFallbackSafe =
        normalizedError.errorCode === 'provider_timeout' ||
        normalizedError.errorCode === 'upstream_provider_error' ||
        normalizedError.errorCode === 'function_platform_timeout' ||
        normalizedError.statusCode === 408 ||
        normalizedError.errorCode === 'provider_rate_limit' ||
        normalizedError.statusCode === 429 ||
        normalizedError.statusCode === 502 ||
        normalizedError.statusCode === 503 ||
        normalizedError.statusCode === 504 ||
        (normalizedError.errorCode === 'provider_unavailable' && (
          normalizedError.message.toLowerCase().includes('fetch') ||
          normalizedError.message.toLowerCase().includes('network') ||
          normalizedError.message.toLowerCase().includes('econnrefused')
        )) ||
        normalizedError.errorCode === 'malformed_provider_output'

      if (attempt === 1 && isFallbackSafe && remainingBudgetNow > 5000) {
        attempt++
        lastError = normalizedError
        console.warn(`[executeOpenRouterAnalysis] Attempt 1 failed. Error: ${normalizedError.message}. Initiating fallback to ${fallbackModelId} in ${remainingBudgetNow}ms...`)
        continue
      }

      throw normalizedError
    } finally {
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle)
      if (abortSignal && abortListener) {
        abortSignal.removeEventListener('abort', abortListener)
      }
    }
  }

  throw lastError || new Error('Unknown generation failure')
}
