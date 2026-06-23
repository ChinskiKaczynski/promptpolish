import { mvpModelProfiles, type ModelProfile } from './model-profiles'
import {
  analysisSystemInstruction,
  constructRepairPrompt,
  constructUserAnalysisPrompt
} from './prompts'
import { executeOpenRouterAnalysis, type OpenRouterClientOptions, type OpenRouterAnalysisResponse } from './openrouter-client'
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
  selectedProfileSlug?: 'general-llm' | 'openrouter-deepseek-v4-flash'
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
  firstUsage: OpenRouterAnalysisResponse['usage'],
  secondUsage: OpenRouterAnalysisResponse['usage']
): OpenRouterAnalysisResponse['usage'] {
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
    slug: dbProfile.slug as 'general-llm' | 'openrouter-deepseek-v4-flash',
    displayName: dbProfile.display_name,
    provider: dbProfile.provider,
    verificationStatus: dbProfile.verification_status,
    confidenceLevel: dbProfile.confidence_level,
    profileVersion: dbProfile.profile_version
  }
}

async function executeAndValidateWithSingleRepairRetry(
  systemInstruction: string,
  userPrompt: string,
  workingLanguage: 'pl' | 'en',
  options?: OpenRouterClientOptions
): Promise<{
  result: AnalysisResult
  usage?: AnalysisServiceResult['usage']
  selectedModel: string
  attempt: number
}> {
  const startTime = Date.now()
  let initialResponse: OpenRouterAnalysisResponse | undefined
  let isMalformed = false
  let lastError: unknown = null

  try {
    initialResponse = await executeOpenRouterAnalysis(systemInstruction, userPrompt, options)
  } catch (error) {
    if (error instanceof ProviderError && error.errorCode === 'malformed_provider_output') {
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
        // Zod validation failed (i.e. schema parse failure)
        const zodResult = analysisResultSchema.safeParse(initialResponse.output)
        if (!zodResult.success) {
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

    const retryResponse = await executeOpenRouterAnalysis(
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

    const repairedResponse = await executeOpenRouterAnalysis(
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
  options?: OpenRouterClientOptions
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
