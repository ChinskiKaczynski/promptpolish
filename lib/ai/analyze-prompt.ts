import { mvpModelProfiles, type ModelProfile } from './model-profiles'
import {
  analysisSystemInstruction,
  constructRepairPrompt,
  constructUserAnalysisPrompt
} from './prompts'
import { executeOpenRouterAnalysis, type OpenRouterClientOptions } from './openrouter-client'
import {
  formatValidationErrors,
  SemanticValidationError,
  validateAnalysisResult
} from './semantic-validation'
import { calculateScore, type CalculatedScore } from '@/lib/scoring/calculate-score'
import { type AnalysisResult } from './schemas'

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
}

type OpenRouterAnalysisResponse = Awaited<ReturnType<typeof executeOpenRouterAnalysis>>

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
}> {
  const initialResponse = await executeOpenRouterAnalysis(systemInstruction, userPrompt, options)

  try {
    return {
      result: validateAnalysisResult(initialResponse.output),
      usage: initialResponse.usage
    }
  } catch (error) {
    if (!(error instanceof SemanticValidationError)) {
      throw error
    }

    const repairPrompt = constructRepairPrompt({
      previousOutput: initialResponse.output,
      validationErrors: formatValidationErrors(error.errors),
      workingLanguage
    })

    const repairedResponse = await executeOpenRouterAnalysis(
      systemInstruction,
      repairPrompt,
      options
    )

    return {
      result: validateAnalysisResult(repairedResponse.output),
      usage: mergeUsage(initialResponse.usage, repairedResponse.usage)
    }
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

  const { result: validatedResult, usage } = await executeAndValidateWithSingleRepairRetry(
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
    usage
  }
}
