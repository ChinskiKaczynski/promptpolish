import {
  mvpModelProfiles,
  type ModelProfile,
} from './model-profiles'
import {
  analysisSystemInstruction,
  constructRepairPrompt,
  constructUserAnalysisPrompt,
} from './prompts'
import {
  executeGeminiAnalysis,
  type GeminiAnalysisResponse,
  type GeminiClientOptions,
} from './gemini-client'
import {
  formatValidationErrors,
  SemanticValidationError,
  validateAnalysisResult,
} from './semantic-validation'
import {
  calculateScore,
  type CalculatedScore,
} from '@/lib/scoring/calculate-score'
import {
  analysisResultSchema,
  type AnalysisResult,
} from './schemas'
import { ProviderError } from './provider-errors'

import type { ModelProfileRow } from '@/lib/supabase/types'

type SelectedProvider =
  GeminiAnalysisResponse['selectedProvider']

type AnalysisUsage =
  NonNullable<GeminiAnalysisResponse['usage']>

export interface AnalyzePromptParams {
  inputPrompt: string
  workingLanguage: 'pl' | 'en'
  selectedProfileSlug?: 'general-llm'
  auditMode?: string | null
  taskGoal?: string | null
  taskType?: string | null
  expectedOutputFormat?: string | null
  constraints?: string | null
  dbProfile?: ModelProfileRow | null
}

export type AnalysisServiceResult = {
  analysis: AnalysisResult
  scores: CalculatedScore
  usage?: AnalysisUsage
  selectedModel: string
  selectedProvider: SelectedProvider
  attempt: number
}

function sumOptionalNumbers(
  first: number | undefined,
  second: number | undefined
): number | undefined {
  if (
    first === undefined &&
    second === undefined
  ) {
    return undefined
  }

  return (first ?? 0) + (second ?? 0)
}

function mergeUsage(
  firstUsage: GeminiAnalysisResponse['usage'],
  secondUsage: GeminiAnalysisResponse['usage']
): GeminiAnalysisResponse['usage'] {
  if (!firstUsage) {
    return secondUsage
  }

  if (!secondUsage) {
    return firstUsage
  }

  return {
    promptTokens:
      firstUsage.promptTokens +
      secondUsage.promptTokens,

    completionTokens:
      firstUsage.completionTokens +
      secondUsage.completionTokens,

    totalTokens:
      firstUsage.totalTokens +
      secondUsage.totalTokens,

    reasoningTokens:
      sumOptionalNumbers(
        firstUsage.reasoningTokens,
        secondUsage.reasoningTokens
      ),

    visibleTokens:
      sumOptionalNumbers(
        firstUsage.visibleTokens,
        secondUsage.visibleTokens
      ),
  }
}

export function normalizeDbProfile(
  dbProfile: ModelProfileRow
): ModelProfile {
  return {
    slug:
      dbProfile.slug as 'general-llm',

    displayName:
      dbProfile.display_name,

    provider:
      dbProfile.provider,

    verificationStatus:
      dbProfile.verification_status,

    confidenceLevel:
      dbProfile.confidence_level,

    profileVersion:
      dbProfile.profile_version,
  }
}

function findMetadataValue(
  input: unknown,
  keys: readonly string[],
  visited = new WeakSet<object>(),
  depth = 0
): unknown {
  if (
    input === null ||
    input === undefined ||
    typeof input !== 'object' ||
    depth > 5
  ) {
    return undefined
  }

  if (visited.has(input)) {
    return undefined
  }

  visited.add(input)

  const record =
    input as Record<string, unknown>

  for (const key of keys) {
    if (
      record[key] !== undefined &&
      record[key] !== null
    ) {
      return record[key]
    }
  }

  const nestedCandidates = [
    record.cause,
    record.rawError,
    record.error,
  ]

  for (
    const candidate
    of nestedCandidates
  ) {
    const value =
      findMetadataValue(
        candidate,
        keys,
        visited,
        depth + 1
      )

    if (value !== undefined) {
      return value
    }
  }

  return undefined
}

function resolveMalformedSelectedModel(
  error: ProviderError,
  options?: GeminiClientOptions
): string {
  const modelValue =
    findMetadataValue(
      error.rawError,
      [
        'selectedModel',
        'modelId',
        'model_id',
      ]
    )

  if (
    typeof modelValue === 'string' &&
    modelValue.trim() !== ''
  ) {
    return modelValue.trim()
  }

  return (
    options?.runtimeConfig?.modelId ??
    'gemini-2.5-flash'
  )
}

function resolveMalformedSelectedProvider(
  error: ProviderError,
  options?: GeminiClientOptions
): SelectedProvider {
  const providerValue =
    findMetadataValue(
      error.rawError,
      [
        'selectedProvider',
        'provider',
      ]
    )

  if (
    providerValue === 'google' ||
    providerValue === 'openrouter'
  ) {
    return providerValue
  }

  return (
    options?.runtimeConfig?.provider ??
    'google'
  )
}

function resolveMalformedAttempt(
  error: ProviderError
): number {
  const attemptValue =
    findMetadataValue(
      error.rawError,
      ['attempt']
    )

  if (
    typeof attemptValue === 'number' &&
    Number.isInteger(attemptValue) &&
    attemptValue >= 1
  ) {
    return attemptValue
  }

  return 1
}

function tryLocalJsonRepair(
  input: unknown
): AnalysisResult | null {
  if (!input) {
    return null
  }

  let rawText = ''
  let parsedObject:
    | Record<string, unknown>
    | null = null

  if (input instanceof ProviderError) {
    if (
      input.rawError &&
      typeof input.rawError === 'object'
    ) {
      const textValue =
        findMetadataValue(
          input.rawError,
          ['text']
        )

      if (typeof textValue === 'string') {
        rawText = textValue
      }
    }
  } else if (
    typeof input === 'object' &&
    'text' in input
  ) {
    const textValue =
      (
        input as Record<
          string,
          unknown
        >
      ).text

    if (typeof textValue === 'string') {
      rawText = textValue
    }
  } else if (
    typeof input === 'string'
  ) {
    rawText = input
  } else if (
    typeof input === 'object'
  ) {
    parsedObject =
      JSON.parse(
        JSON.stringify(input)
      ) as Record<string, unknown>
  }

  if (rawText.trim() !== '') {
    try {
      let jsonText =
        rawText.trim()

      if (jsonText.includes('```')) {
        const match =
          jsonText.match(
            /```(?:json)?\s*([\s\S]*?)\s*```/
          )

        if (match?.[1]) {
          jsonText =
            match[1].trim()
        }
      }

      const firstBrace =
        jsonText.indexOf('{')

      const lastBrace =
        jsonText.lastIndexOf('}')

      if (
        firstBrace !== -1 &&
        lastBrace !== -1 &&
        lastBrace > firstBrace
      ) {
        jsonText =
          jsonText.slice(
            firstBrace,
            lastBrace + 1
          )
      }

      parsedObject =
        JSON.parse(
          jsonText
        ) as Record<string, unknown>
    } catch {
      parsedObject = null
    }
  }

  if (
    !parsedObject ||
    typeof parsedObject !== 'object'
  ) {
    console.warn(
      '[local_repair_failed_missing_required_fields] ' +
      'Could not parse raw output as a JSON object.'
    )

    return null
  }

  try {
    const repaired = {
      ...parsedObject,
    } as Record<string, unknown>

    delete repaired.id
    delete repaired.overallScore
    delete repaired.scoreLevel

    /*
     * Safe contract version default.
     */
    if (
      !repaired.analysis_schema_version
    ) {
      repaired.analysis_schema_version =
        '1.0.0'
    }

    /*
     * Trim known string fields without
     * inventing missing required content.
     */
    if (
      typeof repaired.overall_summary ===
      'string'
    ) {
      repaired.overall_summary =
        repaired.overall_summary.trim()
    }

    if (
      typeof repaired.detected_task_type ===
      'string'
    ) {
      repaired.detected_task_type =
        repaired.detected_task_type.trim()
    }

    if (
      typeof repaired.improved_prompt ===
      'string'
    ) {
      repaired.improved_prompt =
        repaired.improved_prompt.trim()
    }

    /*
     * Safely normalize criterion elements.
     */
    if (
      Array.isArray(
        repaired.criteria_scores
      )
    ) {
      repaired.criteria_scores =
        repaired.criteria_scores.map(
          (item: unknown) => {
            if (
              !item ||
              typeof item !== 'object'
            ) {
              return item
            }

            const normalizedItem = {
              ...item,
            } as Record<
              string,
              unknown
            >

            if (
              typeof normalizedItem
                .raw_score_0_10 ===
              'string'
            ) {
              const numericScore =
                Number.parseFloat(
                  normalizedItem
                    .raw_score_0_10
                )

              if (
                !Number.isNaN(
                  numericScore
                )
              ) {
                normalizedItem
                  .raw_score_0_10 =
                  numericScore
              }
            }

            if (
              typeof normalizedItem
                .rationale === 'string'
            ) {
              normalizedItem.rationale =
                normalizedItem
                  .rationale
                  .trim()
            }

            if (
              typeof normalizedItem
                .improvement_suggestion ===
              'string'
            ) {
              normalizedItem
                .improvement_suggestion =
                normalizedItem
                  .improvement_suggestion
                  .trim()
            }

            return normalizedItem
          }
        )
    }

    /*
     * These arrays may be empty, but are
     * still required by the schema.
     */
    if (
      repaired.model_fit_notes ===
      undefined
    ) {
      repaired.model_fit_notes = []
    }

    if (
      repaired.uncertainty_warnings ===
      undefined
    ) {
      repaired.uncertainty_warnings = []
    }

    if (
      repaired.safety_notes ===
      undefined
    ) {
      repaired.safety_notes = []
    }

    const validation =
      analysisResultSchema.safeParse(
        repaired
      )

    if (validation.success) {
      console.info(
        '[AI Local Repair Success] ' +
        'Successfully recovered and validated object locally.'
      )

      return validation.data
    }

    console.warn(
      '[local_repair_failed_missing_required_fields] ' +
      'Zod validation failed after repair:',
      validation.error.flatten()
    )
  } catch (error) {
    console.warn(
      '[local_repair_failed_missing_required_fields] ' +
      'Error occurred during repair processing:',
      error
    )
  }

  return null
}

async function executeAndValidateWithSingleRepairRetry(
  systemInstruction: string,
  userPrompt: string,
  workingLanguage: 'pl' | 'en',
  options?: GeminiClientOptions
): Promise<{
  result: AnalysisResult
  usage?: AnalysisUsage
  selectedModel: string
  selectedProvider: SelectedProvider
  attempt: number
}> {
  const startTime = Date.now()

  let initialResponse:
    | GeminiAnalysisResponse
    | undefined

  let isMalformed = false
  let lastError: unknown = null

  try {
    initialResponse =
      await executeGeminiAnalysis(
        systemInstruction,
        userPrompt,
        options
      )
  } catch (error) {
    if (
      error instanceof ProviderError &&
      error.errorCode ===
        'malformed_provider_output'
    ) {
      const repaired =
        tryLocalJsonRepair(error)

      if (repaired) {
        return {
          result: repaired,

          selectedModel:
            resolveMalformedSelectedModel(
              error,
              options
            ),

          selectedProvider:
            resolveMalformedSelectedProvider(
              error,
              options
            ),

          attempt:
            resolveMalformedAttempt(
              error
            ),
        }
      }

      isMalformed = true
      lastError = error
    } else {
      throw error
    }
  }

  let validatedResult:
    | AnalysisResult
    | null = null

  let isSchemaFailure = false

  if (
    !isMalformed &&
    initialResponse
  ) {
    try {
      validatedResult =
        validateAnalysisResult(
          initialResponse.output
        )
    } catch (error) {
      if (
        error instanceof
        SemanticValidationError
      ) {
        const zodResult =
          analysisResultSchema.safeParse(
            initialResponse.output
          )

        if (!zodResult.success) {
          const repaired =
            tryLocalJsonRepair(
              initialResponse.output
            )

          if (repaired) {
            return {
              result: repaired,
              usage:
                initialResponse.usage,
              selectedModel:
                initialResponse
                  .selectedModel,
              selectedProvider:
                initialResponse
                  .selectedProvider,
              attempt:
                initialResponse.attempt,
            }
          }

          isSchemaFailure = true
        }

        lastError = error
      } else {
        throw error
      }
    }
  }

  /*
   * Retry exactly once for malformed or
   * schema-invalid structured output.
   */
  if (
    isMalformed ||
    isSchemaFailure
  ) {
    console.info(
      '[AI Retry Log]',
      JSON.stringify({
        retry_reason:
          'malformed_provider_output',
        isMalformed,
        isSchemaFailure,
      })
    )

    const elapsed =
      Date.now() - startTime

    const totalTimeout =
      options?.timeoutMs ??
      90000

    const remainingTimeout =
      totalTimeout - elapsed

    if (remainingTimeout < 5000) {
      console.warn(
        '[analyzePrompt] ' +
        'Skipping structured output retry: ' +
        `insufficient remaining time (${remainingTimeout}ms)`
      )

      throw lastError
    }

    const retryInstructions =
      workingLanguage === 'pl'
        ? `

[KRYTYCZNE PONOWIENIE - BŁĄD STRUKTURY]
Poprzednia odpowiedź była nieprawidłowym JSON-em lub została ucięta. Musisz spróbować ponownie, spełniając te krytyczne warunki:
- Zwróć WYŁĄCZNIE prawidłowy obiekt JSON zgodny z wymaganym schematem.
- NIE używaj bloków kodu markdown (\`\`\`json) ani żadnego tekstu poza JSON-em.
- Pisz skrajnie zwięźle. Wszystkie wyjaśnienia, plany, uzasadnienia (rationale, suggestion, plan, explanations) mogą mieć maksymalnie 1 krótkie zdanie.
- Ulepszony prompt (improved_prompt) musi być zwięzły, użyteczny i kompaktowy. Nie kopiuj całego długiego oryginalnego promptu.
- Nie pomijaj żadnych wymaganych pól schematu JSON.
- Dbaj o to, aby odpowiedź była krótka i nie przekroczyła limitu tokenów.`
        : `

[CRITICAL RETRY - STRUCTURE ERROR]
The previous response was invalid JSON or truncated. You must retry under these strict constraints:
- Return ONLY valid JSON matching the schema exactly.
- Do NOT include any markdown code fences (like \`\`\`json) or any prose outside the JSON.
- Keep all rationales, suggestions, plans, and explanations extremely concise (maximum 1 short sentence per field).
- Keep the improved prompt (improved_prompt) concise, functional, and compact. Do not copy the entire long original prompt.
- Do not omit any required JSON schema fields.
- Keep the output short to avoid truncation.`

    const retryPrompt =
      userPrompt +
      retryInstructions

    const retryResponse =
      await executeGeminiAnalysis(
        systemInstruction,
        retryPrompt,
        {
          ...options,
          timeoutMs:
            remainingTimeout,
        }
      )

    return {
      result:
        validateAnalysisResult(
          retryResponse.output
        ),

      usage:
        isMalformed
          ? retryResponse.usage
          : mergeUsage(
              initialResponse!.usage,
              retryResponse.usage
            ),

      selectedModel:
        retryResponse.selectedModel,

      selectedProvider:
        retryResponse.selectedProvider,

      attempt:
        retryResponse.attempt,
    }
  }

  /*
   * A semantic validation error means the
   * object matched Zod but failed additional
   * analytical integrity rules.
   */
  if (
    lastError instanceof
    SemanticValidationError
  ) {
    const elapsed =
      Date.now() - startTime

    const totalTimeout =
      options?.timeoutMs ??
      90000

    const remainingTimeout =
      totalTimeout - elapsed

    if (remainingTimeout < 5000) {
      console.warn(
        '[analyzePrompt] ' +
        'Skipping repair retry: ' +
        `insufficient remaining time (${remainingTimeout}ms)`
      )

      throw lastError
    }

    const repairPrompt =
      constructRepairPrompt({
        previousOutput:
          initialResponse!.output,

        validationErrors:
          formatValidationErrors(
            lastError.errors
          ),

        workingLanguage,
      })

    const repairedResponse =
      await executeGeminiAnalysis(
        systemInstruction,
        repairPrompt,
        {
          ...options,
          timeoutMs:
            remainingTimeout,
        }
      )

    return {
      result:
        validateAnalysisResult(
          repairedResponse.output
        ),

      usage:
        mergeUsage(
          initialResponse!.usage,
          repairedResponse.usage
        ),

      selectedModel:
        repairedResponse.selectedModel,

      selectedProvider:
        repairedResponse
          .selectedProvider,

      attempt:
        repairedResponse.attempt,
    }
  }

  return {
    result: validatedResult!,
    usage:
      initialResponse!.usage,
    selectedModel:
      initialResponse!
        .selectedModel,
    selectedProvider:
      initialResponse!
        .selectedProvider,
    attempt:
      initialResponse!.attempt,
  }
}

/**
 * High-level orchestration service that:
 * 1. Resolves the target model profile.
 * 2. Builds dynamic system instructions and prompts.
 * 3. Triggers structured LLM evaluation.
 * 4. Runs semantic integrity checks.
 * 5. Performs one repair retry when needed.
 * 6. Computes overall score metrics.
 *
 * The target model profile is separate from the
 * provider/model executing the PromptPolish analysis.
 */
export async function analyzePrompt(
  params: AnalyzePromptParams,
  options?: GeminiClientOptions
): Promise<AnalysisServiceResult> {
  const {
    inputPrompt,
    workingLanguage,
    selectedProfileSlug =
      'general-llm',
    auditMode,
    taskGoal,
    taskType,
    expectedOutputFormat,
    constraints,
    dbProfile,
  } = params

  const modelProfile =
    dbProfile
      ? normalizeDbProfile(
          dbProfile
        )
      : mvpModelProfiles.find(
          (profile) =>
            profile.slug ===
            selectedProfileSlug
        )

  if (!modelProfile) {
    throw new Error(
      `Invalid model profile slug: ${selectedProfileSlug}`
    )
  }

  const systemInstruction =
    analysisSystemInstruction

  const userPrompt =
    constructUserAnalysisPrompt({
      inputPrompt,
      workingLanguage,
      modelProfile,
      auditMode,
      taskGoal,
      taskType,
      expectedOutputFormat,
      constraints,
    })

  const {
    result: validatedResult,
    usage,
    selectedModel,
    selectedProvider,
    attempt,
  } =
    await executeAndValidateWithSingleRepairRetry(
      systemInstruction,
      userPrompt,
      workingLanguage,
      {
        ...options,
        dbProfile,
      }
    )

  const scores =
    calculateScore(
      validatedResult.criteria_scores
    )

  return {
    analysis:
      validatedResult,
    scores,
    usage,
    selectedModel,
    selectedProvider,
    attempt,
  }
}