import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText, Output } from 'ai'
import { analysisResultSchema, type AnalysisResult } from './schemas'
import { normalizeProviderError, ProviderError, isNestedTimeout } from './provider-errors'
import { getOwnerConfiguredModelId } from './model-catalog'

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
  const { mockMode = false, mockResponse, temperature = 0.1, abortSignal, timeoutMs } = options

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

  // 3. Resolve model ID and additional metadata headers from environment variables
  const modelId = getOwnerConfiguredModelId()
  const siteUrl = process.env.OPENROUTER_SITE_URL
  const appName = process.env.OPENROUTER_APP_NAME

  // Resolve the effective AbortSignal – prefer an externally supplied one,
  // otherwise create our own when timeoutMs is set.
  let ownController: AbortController | undefined
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined
  let effectiveSignal: AbortSignal | undefined = abortSignal

  if (!effectiveSignal && timeoutMs && timeoutMs > 0) {
    ownController = new AbortController()
    effectiveSignal = ownController.signal
    timeoutHandle = setTimeout(() => {
      ownController!.abort(new Error(`PROVIDER_TIMEOUT: Request aborted after ${timeoutMs}ms`))
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

    const { output, usage } = await generateText({
      model: openrouter.chat(modelId),
      system: systemInstruction,
      prompt: userPrompt,
      temperature,
      abortSignal: effectiveSignal,
      output: Output.object({
        schema: analysisResultSchema
      })
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
    // Detect AbortError BEFORE normalizeProviderError so downstream callers
    // can distinguish provider_timeout from generic provider failures.
    if (isNestedTimeout(error)) {
      const ms = timeoutMs ?? 0
      if (error instanceof ProviderError) {
        throw error
      }
      throw new ProviderError(
        `PROVIDER_TIMEOUT: Request aborted after ${ms}ms`,
        'The prompt analysis request timed out. Please try again.',
        error,
        undefined,
        'provider_timeout'
      )
    }
    // Standardized provider error normalization for all other failures
    throw normalizeProviderError(error)
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle)
  }
}
