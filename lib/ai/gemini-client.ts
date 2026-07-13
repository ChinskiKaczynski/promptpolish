import { generateObject, NoObjectGeneratedError } from 'ai'
import { analysisResultSchema, type AnalysisResult } from './schemas'
import {
  normalizeProviderError,
  ProviderError,
} from './provider-errors'
import {
  createRuntimeLanguageModel,
  getRuntimeProviderOptions,
} from './provider-factory'
import {
  getActiveAIRuntimeConfig,
  type AIRuntimeConfig,
} from './runtime-config'
import type { ModelProfileRow } from '@/lib/supabase/types'

type RuntimeProvider = AIRuntimeConfig['provider']

type NormalizedUsage = {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  reasoningTokens?: number
  visibleTokens?: number
}

type RawProviderUsage = {
  inputTokens?: number
  promptTokens?: number
  outputTokens?: number
  completionTokens?: number
  totalTokens?: number
  reasoningTokens?: number
  outputTokenDetails?: {
    reasoningTokens?: number
  }
}

export type TextGenerator = (
  model: string,
  systemInstruction: string,
  userPrompt: string,
  options: {
    temperature: number
    maxTokens: number
    abortSignal: AbortSignal
    provider: RuntimeProvider
    thinkingBudget: number
  }
) => Promise<{
  output: AnalysisResult
  usage?: NormalizedUsage
  finishReason?: string
}>

function normalizeUsage(
  usage: RawProviderUsage | undefined
): NormalizedUsage | undefined {
  if (!usage) {
    return undefined
  }

  const promptTokens =
    usage.promptTokens ??
    usage.inputTokens ??
    0

  const completionTokens =
    usage.completionTokens ??
    usage.outputTokens ??
    0

  const reasoningTokens =
    usage.outputTokenDetails?.reasoningTokens ??
    usage.reasoningTokens ??
    0

  const totalTokens =
    usage.totalTokens ??
    promptTokens + completionTokens

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    reasoningTokens,
    visibleTokens: Math.max(
      0,
      completionTokens - reasoningTokens
    ),
  }
}

export const defaultTextGenerator: TextGenerator = async (
  model,
  systemInstruction,
  userPrompt,
  options
) => {
  try {
    const runtimeModel = createRuntimeLanguageModel(
      options.provider,
      model
    )

    const providerOptions =
      getRuntimeProviderOptions(
        options.provider,
        options.thinkingBudget
      )

    const {
      object,
      usage,
      finishReason,
    } = await generateObject({
      model:
        runtimeModel as Parameters<
          typeof generateObject
        >[0]['model'],

      system: systemInstruction,
      prompt: userPrompt,
      temperature: options.temperature,
      maxOutputTokens: options.maxTokens,
      abortSignal: options.abortSignal,
      schema: analysisResultSchema,
      providerOptions,
    })

    return {
      output: object,
      usage: normalizeUsage(
        usage as unknown as RawProviderUsage
      ),
      finishReason: finishReason || 'stop',
    }
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      const rawText =
        typeof error.text === 'string'
          ? error.text
          : ''

      const errorUsage =
        error.usage as unknown as
          | RawProviderUsage
          | undefined

      console.warn(
        '[NO_OBJECT_GENERATED]',
        JSON.stringify({
          provider: options.provider,
          model,
          finishReason:
            error.finishReason ?? null,
          rawTextLength: rawText.length,
          causeName:
            error.cause instanceof Error
              ? error.cause.name
              : typeof error.cause,
          inputTokens:
            errorUsage?.inputTokens ??
            errorUsage?.promptTokens ??
            null,
          outputTokens:
            errorUsage?.outputTokens ??
            errorUsage?.completionTokens ??
            null,
          totalTokens:
            errorUsage?.totalTokens ??
            null,
        })
      )
    }

    throw error
  }
}

export interface GeminiClientOptions {
  mockMode?: boolean
  mockResponse?: AnalysisResult
  temperature?: number

  /**
   * Signal from the calling HTTP request.
   */
  abortSignal?: AbortSignal

  /**
   * Total generation budget, including a possible fallback attempt.
   */
  timeoutMs?: number

  /**
   * Retained temporarily for compatibility with existing callers.
   *
   * This profile describes the model targeted by the user's prompt.
   * It no longer selects the model that executes PromptPolish analysis.
   */
  dbProfile?: ModelProfileRow | null

  /**
   * Resolved once by the route and shared through all retries.
   * When omitted, the client reads the active database configuration.
   */
  runtimeConfig?: AIRuntimeConfig

  requestId?: string
  textGenerator?: TextGenerator
}

export interface GeminiAnalysisResponse {
  output: AnalysisResult
  usage?: NormalizedUsage
  finishReason: string
  selectedModel: string
  selectedProvider: RuntimeProvider
  attempt: number
  durationMs: number
}

/**
 * Low-level structured analysis client.
 *
 * The historical function name is retained to avoid a broad refactor, but the
 * client can now execute through Google or OpenRouter depending on the active
 * server-side runtime configuration.
 */
export async function executeGeminiAnalysis(
  systemInstruction: string,
  userPrompt: string,
  options: GeminiClientOptions = {}
): Promise<GeminiAnalysisResponse> {
  const {
    mockMode = false,
    mockResponse,
    temperature,
    abortSignal,
    timeoutMs,
    runtimeConfig,
    requestId,
  } = options

  /*
   * 1. Mock response
   */
  if (mockMode || mockResponse) {
    let mockOutput = mockResponse

    if (!mockOutput) {
      const { mockAnalysisResult } =
        await import('./mock-analysis')

      mockOutput = mockAnalysisResult
    }

    const cleanMockOutput = {
      ...mockOutput,
    } as Record<string, unknown>

    delete cleanMockOutput.id
    delete cleanMockOutput.overallScore
    delete cleanMockOutput.scoreLevel

    return {
      output:
        cleanMockOutput as AnalysisResult,

      usage: {
        promptTokens: 120,
        completionTokens: 250,
        totalTokens: 370,
        reasoningTokens: 0,
        visibleTokens: 250,
      },

      finishReason: 'stop',
      selectedModel: 'mock-model',
      selectedProvider:
        runtimeConfig?.provider ??
        'google',
      attempt: 1,
      durationMs: 50,
    }
  }

  /*
   * 2. Resolve active execution configuration.
   *
   * dbProfile is deliberately not used here. It describes the target prompt
   * profile and must not decide which provider executes the analysis.
   */
  const resolvedRuntimeConfig =
    runtimeConfig ??
    await getActiveAIRuntimeConfig()

  const primaryProvider =
    resolvedRuntimeConfig.provider

  const primaryModelId =
    resolvedRuntimeConfig.modelId

  const fallbackProvider =
    resolvedRuntimeConfig.fallbackProvider

  const fallbackModelId =
    resolvedRuntimeConfig.fallbackModelId

  const isFallbackEnabled =
    fallbackProvider !== null &&
    fallbackModelId !== null &&
    (
      fallbackProvider !== primaryProvider ||
      fallbackModelId !== primaryModelId
    )

  const effectiveTemperature =
    temperature ??
    resolvedRuntimeConfig.temperature

  const maxTokens =
    resolvedRuntimeConfig.maxOutputTokens

  const totalTimeout =
    timeoutMs ??
    resolvedRuntimeConfig.timeoutMs

  const primaryTimeoutMs = Math.min(
    totalTimeout,
    resolvedRuntimeConfig.timeoutMs
  )

  const startTime = Date.now()

  let attempt = 1
  let lastError: unknown = null

  while (attempt <= 2) {
    const elapsed =
      Date.now() - startTime

    const remainingBudgetMs =
      totalTimeout - elapsed

    if (
      attempt > 1 &&
      remainingBudgetMs <= 5000
    ) {
      throw (
        lastError ??
        new ProviderError(
          'Insufficient timeout budget for fallback attempt.',
          'The prompt analysis request timed out. Please try again.',
          new Error(
            'Less than 5000ms remained for the fallback attempt.'
          ),
          504,
          'provider_timeout'
        )
      )
    }

    if (
      attempt === 2 &&
      (
        fallbackProvider === null ||
        fallbackModelId === null
      )
    ) {
      throw (
        lastError ??
        new ProviderError(
          'Fallback attempt reached without a complete fallback configuration.',
          'The prompt analysis engine encountered an error. Please try again.',
          new Error(
            'Fallback provider or fallback model is missing.'
          ),
          500,
          'provider_configuration_error'
        )
      )
    }

    const selectedProvider =
      attempt === 1
        ? primaryProvider
        : fallbackProvider!

    const selectedModel =
      attempt === 1
        ? primaryModelId
        : fallbackModelId!

    const attemptTimeoutMs =
      attempt === 1
        ? primaryTimeoutMs
        : Math.min(
            remainingBudgetMs,
            resolvedRuntimeConfig.timeoutMs
          )

    const ownController =
      new AbortController()

    const effectiveSignal =
      ownController.signal

    let timeoutHandle:
      | ReturnType<typeof setTimeout>
      | undefined

    let abortListener:
      | (() => void)
      | undefined

    let abortReason:
      | 'provider_timeout'
      | 'client_cancelled'
      | 'unknown_abort'
      | undefined

    /*
     * Forward cancellation from the incoming HTTP request.
     */
    if (abortSignal) {
      if (abortSignal.aborted) {
        abortReason =
          'client_cancelled'

        ownController.abort(
          'client_cancelled'
        )
      } else {
        abortListener = () => {
          if (!abortReason) {
            abortReason =
              'client_cancelled'

            ownController.abort(
              'client_cancelled'
            )
          }
        }

        abortSignal.addEventListener(
          'abort',
          abortListener
        )
      }
    }

    /*
     * Per-attempt provider timeout.
     */
    if (attemptTimeoutMs > 0) {
      timeoutHandle = setTimeout(() => {
        if (!abortReason) {
          abortReason =
            'provider_timeout'

          ownController.abort(
            'provider_timeout'
          )
        }
      }, attemptTimeoutMs)
    }

    const attemptStartTime =
      Date.now()

    try {
      const generator =
        options.textGenerator ??
        defaultTextGenerator

      const {
        output,
        usage,
        finishReason,
      } = await generator(
        selectedModel,
        systemInstruction,
        userPrompt,
        {
          temperature:
            effectiveTemperature,

          maxTokens,

          abortSignal:
            effectiveSignal,

          provider:
            selectedProvider,

          thinkingBudget:
            selectedProvider === 'google'
              ? resolvedRuntimeConfig
                  .thinkingBudget
              : 0,
        }
      )

      const normalizedUsage =
        normalizeUsage(
          usage as RawProviderUsage | undefined
        )

      const durationMs =
        Date.now() -
        attemptStartTime

      console.info(
        '[AI Reliability Log]',
        JSON.stringify({
          requestId:
            requestId || 'N/A',

          attempt,
          selectedModel,
          provider:
            selectedProvider,

          durationMs,

          remainingBudgetMs:
            totalTimeout -
            (
              Date.now() -
              startTime
            ),

          errorCategory:
            undefined,

          upstreamStatus:
            undefined,

          finishReason:
            finishReason ||
            'stop',

          promptChars:
            userPrompt.length +
            systemInstruction.length,

          visibleOutputTokens:
            normalizedUsage
              ?.visibleTokens ??
            0,

          reasoningTokens:
            normalizedUsage
              ?.reasoningTokens ??
            0,

          totalOutputTokens:
            normalizedUsage
              ?.completionTokens ??
            0,
        })
      )

      return {
        output,
        usage:
          normalizedUsage,
        finishReason:
          finishReason ||
          'stop',
        selectedModel,
        selectedProvider,
        attempt,
        durationMs,
      }
    } catch (error) {
      let normalizedError:
        ProviderError

      if (effectiveSignal.aborted) {
        const reason =
          abortReason ??
          'unknown_abort'

        if (
          reason ===
          'provider_timeout'
        ) {
          normalizedError =
            new ProviderError(
              `PROVIDER_TIMEOUT: Request aborted after ${attemptTimeoutMs}ms`,
              'The prompt analysis request timed out. Please try again.',
              error,
              504,
              'provider_timeout'
            )
        } else if (
          reason ===
          'client_cancelled'
        ) {
          throw new Error(
            'CLIENT_CLOSED'
          )
        } else {
          normalizedError =
            new ProviderError(
              'Request aborted due to an unknown abort.',
              'The prompt analysis request was interrupted.',
              error,
              499,
              'unknown_abort'
            )
        }
      } else {
        normalizedError =
          normalizeProviderError(error)
      }

      const durationMs =
        Date.now() -
        attemptStartTime

      const elapsedNow =
        Date.now() -
        startTime

      const remainingBudgetNow =
        totalTimeout -
        elapsedNow

      console.info(
        '[AI Reliability Log]',
        JSON.stringify({
          requestId:
            requestId || 'N/A',

          attempt,
          selectedModel,
          provider:
            selectedProvider,

          durationMs,

          remainingBudgetMs:
            remainingBudgetNow,

          errorCategory:
            normalizedError.errorCode ||
            'unknown_error',

          upstreamStatus:
            normalizedError.statusCode,

          finishReason:
            undefined,

          promptChars:
            userPrompt.length +
            systemInstruction.length,

          visibleOutputTokens: 0,
          reasoningTokens: 0,
          totalOutputTokens: 0,
        })
      )

      const normalizedMessage =
        normalizedError.message
          .toLowerCase()

      const isFallbackSafe =
        normalizedError.errorCode ===
          'provider_timeout' ||

        normalizedError.errorCode ===
          'upstream_provider_error' ||

        normalizedError.errorCode ===
          'function_platform_timeout' ||

        normalizedError.errorCode ===
          'provider_rate_limit' ||

        normalizedError.errorCode ===
          'malformed_provider_output' ||

        normalizedError.statusCode ===
          408 ||

        normalizedError.statusCode ===
          429 ||

        normalizedError.statusCode ===
          502 ||

        normalizedError.statusCode ===
          503 ||

        normalizedError.statusCode ===
          504 ||

        (
          normalizedError.errorCode ===
            'provider_unavailable' &&
          (
            normalizedMessage.includes(
              'fetch'
            ) ||
            normalizedMessage.includes(
              'network'
            ) ||
            normalizedMessage.includes(
              'econnrefused'
            ) ||
            normalizedMessage.includes(
              'econnreset'
            )
          )
        )

      if (
        attempt === 1 &&
        isFallbackEnabled &&
        isFallbackSafe &&
        remainingBudgetNow > 5000
      ) {
        attempt += 1
        lastError =
          normalizedError

        console.warn(
          '[executeGeminiAnalysis] ' +
          `Primary provider failed: ${selectedProvider}/${selectedModel}. ` +
          `Error: ${normalizedError.message}. ` +
          `Falling back to ${fallbackProvider}/${fallbackModelId}. ` +
          `Remaining budget: ${remainingBudgetNow}ms.`
        )

        continue
      }

      throw normalizedError
    } finally {
      if (
        timeoutHandle !== undefined
      ) {
        clearTimeout(
          timeoutHandle
        )
      }

      if (
        abortSignal &&
        abortListener
      ) {
        abortSignal.removeEventListener(
          'abort',
          abortListener
        )
      }
    }
  }

  throw (
    lastError ??
    new ProviderError(
      'Unknown generation failure.',
      'The prompt analysis engine encountered an unexpected error.',
      new Error(
        'Generation loop completed without a result or explicit error.'
      ),
      500,
      'provider_unavailable'
    )
  )
}