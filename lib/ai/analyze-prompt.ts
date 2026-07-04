import { mvpModelProfiles, type ModelProfile } from './model-profiles'
import {
  analysisSystemInstruction,
  constructRepairPrompt,
  constructUserAnalysisPrompt
} from './prompts'
import { executeGeminiAnalysis, type GeminiClientOptions, type GeminiAnalysisResponse } from './gemini-client'
import {
  formatValidationErrors,
  SemanticValidationError,
  validateAnalysisResult
} from './semantic-validation'
import { calculateScore, type CalculatedScore } from '@/lib/scoring/calculate-score'
import { type AnalysisResult, analysisResultSchema } from './schemas'
import { ProviderError } from './provider-errors'

import type { ModelProfileRow } from '@/lib/supabase/types'

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
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  selectedModel: string
  attempt: number
}

function mergeUsage(
  firstUsage: GeminiAnalysisResponse['usage'],
  secondUsage: GeminiAnalysisResponse['usage']
): GeminiAnalysisResponse['usage'] {
  if (!firstUsage) return secondUsage
  if (!secondUsage) return firstUsage

  return {
    promptTokens: firstUsage.promptTokens + secondUsage.promptTokens,
    completionTokens: firstUsage.completionTokens + secondUsage.completionTokens,
    totalTokens: firstUsage.totalTokens + secondUsage.totalTokens
  }
}

export function normalizeDbProfile(dbProfile: ModelProfileRow): ModelProfile {
  return {
    slug: dbProfile.slug as 'general-llm',
    displayName: dbProfile.display_name,
    provider: dbProfile.provider,
    verificationStatus: dbProfile.verification_status,
    confidenceLevel: dbProfile.confidence_level,
    profileVersion: dbProfile.profile_version
  }
}

function tryLocalJsonRepair(input: unknown): AnalysisResult | null {
  if (!input) return null

  let rawText = ''
  let parsedObj: Record<string, unknown> | null = null

  if (input instanceof ProviderError) {
    if (input.rawError && typeof input.rawError === 'object') {
      rawText = (input.rawError as Record<string, unknown>).text as string || ''
    }
  } else if (input && typeof input === 'object' && 'text' in input) {
    rawText = (input as Record<string, unknown>).text as string || ''
  } else if (typeof input === 'string') {
    rawText = input
  } else if (typeof input === 'object') {
    // If it's already parsed but failed semantic validation, clone it
    parsedObj = JSON.parse(JSON.stringify(input))
  }

  if (rawText && rawText.trim() !== '') {
    try {
      let jsonText = rawText.trim()
      if (jsonText.includes('```')) {
        const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        if (match && match[1]) {
          jsonText = match[1].trim()
        }
      }
      const firstBrace = jsonText.indexOf('{')
      const lastBrace = jsonText.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.slice(firstBrace, lastBrace + 1)
      }
      parsedObj = JSON.parse(jsonText)
    } catch {
      // Ignore parse error, parsedObj remains null
    }
  }

  if (parsedObj && typeof parsedObj === 'object') {
    try {
      const repaired: Record<string, unknown> = { ...parsedObj }
      
      // Safe coercion of version contract
      if (!repaired.analysis_schema_version) {
        repaired.analysis_schema_version = '1.0.0'
      }

      // Safe string trims
      if (typeof repaired.overall_summary === 'string') {
        repaired.overall_summary = repaired.overall_summary.trim()
      }
      if (typeof repaired.detected_task_type === 'string') {
        repaired.detected_task_type = repaired.detected_task_type.trim()
      }
      if (typeof repaired.improved_prompt === 'string') {
        repaired.improved_prompt = repaired.improved_prompt.trim()
      }

      // Coerce criteria_scores elements safely
      if (Array.isArray(repaired.criteria_scores)) {
        repaired.criteria_scores = repaired.criteria_scores.map((item: unknown) => {
          if (item && typeof item === 'object') {
            const newItem = { ...item } as Record<string, unknown>
            if (typeof newItem.raw_score_0_10 === 'string') {
              const val = parseFloat(newItem.raw_score_0_10)
              if (!isNaN(val)) newItem.raw_score_0_10 = val
            }
            if (typeof newItem.rationale === 'string') {
              newItem.rationale = newItem.rationale.trim()
            }
            if (typeof newItem.improvement_suggestion === 'string') {
              newItem.improvement_suggestion = newItem.improvement_suggestion.trim()
            }
            return newItem
          }
          return item
        })
      }

      // Safe defaults for empty-allowed optional arrays to prevent Zod failures
      if (repaired.model_fit_notes === undefined) {
        repaired.model_fit_notes = []
      }
      if (repaired.uncertainty_warnings === undefined) {
        repaired.uncertainty_warnings = []
      }
      if (repaired.safety_notes === undefined) {
        repaired.safety_notes = []
      }

      // Validate strictly against the Zod schema
      const validated = analysisResultSchema.safeParse(repaired)
      if (validated.success) {
        console.info('[AI Local Repair Success] Successfully recovered and validated object locally.')
        return validated.data
      } else {
        console.warn('[local_repair_failed_missing_required_fields] Zod validation failed after repair:', validated.error.flatten())
      }
    } catch (err) {
      console.warn('[local_repair_failed_missing_required_fields] Error occurred during repair processing:', err)
    }
  } else {
    console.warn('[local_repair_failed_missing_required_fields] Could not parse raw output as a JSON object.')
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
  usage?: AnalysisServiceResult['usage']
  selectedModel: string
  attempt: number
}> {
  const startTime = Date.now()
  let initialResponse: GeminiAnalysisResponse | undefined
  let isMalformed = false
  let lastError: unknown = null

  try {
    initialResponse = await executeGeminiAnalysis(systemInstruction, userPrompt, options)
  } catch (error) {
    if (error instanceof ProviderError && error.errorCode === 'malformed_provider_output') {
      const repaired = tryLocalJsonRepair(error)
      if (repaired) {
        return {
          result: repaired,
          selectedModel: error.rawError && typeof error.rawError === 'object' && 'modelId' in error.rawError ? ((error.rawError as Record<string, unknown>).modelId as string) : 'gemini-2.5-flash',
          attempt: 1
        }
      }
      isMalformed = true
      lastError = error
    } else {
      throw error
    }
  }

  let validatedResult: AnalysisResult | null = null
  let isSchemaFailure = false

  if (!isMalformed && initialResponse) {
    try {
      validatedResult = validateAnalysisResult(initialResponse.output)
    } catch (error) {
      if (error instanceof SemanticValidationError) {
        const zodResult = analysisResultSchema.safeParse(initialResponse.output)
        if (!zodResult.success) {
          const repaired = tryLocalJsonRepair(initialResponse.output)
          if (repaired) {
            return {
              result: repaired,
              usage: initialResponse.usage,
              selectedModel: initialResponse.selectedModel,
              attempt: initialResponse.attempt
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

  // A. Retry exactly once for malformed structured output
  if (isMalformed || isSchemaFailure) {
    console.info('[AI Retry Log]', JSON.stringify({
      retry_reason: 'malformed_provider_output',
      isMalformed,
      isSchemaFailure
    }))

    const elapsed = Date.now() - startTime
    const totalTimeout = options?.timeoutMs ?? 90000
    const remainingTimeout = totalTimeout - elapsed

    if (remainingTimeout < 5000) {
      console.warn(`[analyzePrompt] Skipping structured output retry: insufficient remaining time (${remainingTimeout}ms)`)
      throw lastError
    }

    const retryInstructions = workingLanguage === 'pl'
      ? `\n\n[KRYTYCZNE PONOWIENIE - BŁĄD STRUKTURY]\nPoprzednia odpowiedź była nieprawidłowym JSON-em lub została ucięta. Musisz spróbować ponownie, spełniając te krytyczne warunki:\n- Zwróć WYŁĄCZNIE prawidłowy obiekt JSON zgodny z wymaganym schematem.\n- NIE używaj bloków kodu markdown (\`\`\`json) ani żadnego tekstu poza JSON-em.\n- Pisz skrajnie zwięźle. Wszystkie wyjaśnienia, plany, uzasadnienia (rationale, suggestion, plan, explanations) mogą mieć maksymalnie 1 krótkie zdanie.\n- Ulepszony prompt (improved_prompt) musi być zwięzły, użyteczny i kompaktowy. Nie kopiuj całego długiego oryginalnego promptu.\n- Nie pomijaj żadnych wymaganych pól schematu JSON.\n- Dbaj o to, aby odpowiedź była krótka i nie przekroczyła limitu tokenów.`
      : `\n\n[CRITICAL RETRY - STRUCTURE ERROR]\nThe previous response was invalid JSON or truncated. You must retry under these strict constraints:\n- Return ONLY valid JSON matching the schema exactly.\n- Do NOT include any markdown code fences (like \`\`\`json) or any prose outside the JSON.\n- Keep all rationales, suggestions, plans, and explanations extremely concise (maximum 1 short sentence per field).\n- Keep the improved prompt (improved_prompt) concise, functional, and compact. Do not copy the entire long original prompt.\n- Do not omit any required JSON schema fields.\n- Keep the output short to avoid truncation.`

    const retryPrompt = userPrompt + retryInstructions

    const retryResponse = await executeGeminiAnalysis(
      systemInstruction,
      retryPrompt,
      {
        ...options,
        timeoutMs: remainingTimeout
      }
    )

    return {
      result: validateAnalysisResult(retryResponse.output),
      usage: isMalformed
        ? retryResponse.usage
        : mergeUsage(initialResponse!.usage, retryResponse.usage),
      selectedModel: retryResponse.selectedModel,
      attempt: retryResponse.attempt
    }
  }

  // If we had a semantic validation error (but Zod parsed successfully)
  if (lastError instanceof SemanticValidationError) {
    const elapsed = Date.now() - startTime
    const totalTimeout = options?.timeoutMs ?? 90000
    const remainingTimeout = totalTimeout - elapsed

    if (remainingTimeout < 5000) {
      console.warn(`[analyzePrompt] Skipping repair retry: insufficient remaining time (${remainingTimeout}ms)`)
      throw lastError
    }

    const repairPrompt = constructRepairPrompt({
      previousOutput: initialResponse!.output,
      validationErrors: formatValidationErrors(lastError.errors),
      workingLanguage
    })

    const repairedResponse = await executeGeminiAnalysis(
      systemInstruction,
      repairPrompt,
      {
        ...options,
        timeoutMs: remainingTimeout
      }
    )

    return {
      result: validateAnalysisResult(repairedResponse.output),
      usage: mergeUsage(initialResponse!.usage, repairedResponse.usage),
      selectedModel: repairedResponse.selectedModel,
      attempt: repairedResponse.attempt
    }
  }

  return {
    result: validatedResult!,
    usage: initialResponse!.usage,
    selectedModel: initialResponse!.selectedModel,
    attempt: initialResponse!.attempt
  }
}

/**
 * High-level orchestration service that:
 * 1. Resolves the model profile.
 * 2. Builds dynamic system instructions and prompts.
 * 3. Triggers structured LLM evaluation.
 * 4. Runs full semantic integrity checks.
 * 5. Performs one repair retry when semantic validation fails.
 * 6. Computes overall score metrics and confidence levels using standard scoring.
 */
export async function analyzePrompt(
  params: AnalyzePromptParams,
  options?: GeminiClientOptions
): Promise<AnalysisServiceResult> {
  const {
    inputPrompt,
    workingLanguage,
    selectedProfileSlug = 'general-llm',
    auditMode,
    taskGoal,
    taskType,
    expectedOutputFormat,
    constraints,
    dbProfile
  } = params

  const modelProfile = dbProfile
    ? normalizeDbProfile(dbProfile)
    : mvpModelProfiles.find((p) => p.slug === selectedProfileSlug)

  if (!modelProfile) {
    throw new Error(`Invalid model profile slug: ${selectedProfileSlug}`)
  }

  const systemInstruction = analysisSystemInstruction
  const userPrompt = constructUserAnalysisPrompt({
    inputPrompt,
    workingLanguage,
    modelProfile,
    auditMode,
    taskGoal,
    taskType,
    expectedOutputFormat,
    constraints
  })

  const { result: validatedResult, usage, selectedModel, attempt } = await executeAndValidateWithSingleRepairRetry(
    systemInstruction,
    userPrompt,
    workingLanguage,
    {
      ...options,
      dbProfile
    }
  )

  const scores = calculateScore(validatedResult.criteria_scores)

  return {
    analysis: validatedResult,
    scores,
    usage,
    selectedModel,
    attempt
  }
}
