import { mvpModelProfiles } from './model-profiles'
import { analysisSystemInstruction, constructUserAnalysisPrompt } from './prompts'
import { executeOpenRouterAnalysis, type OpenRouterClientOptions } from './openrouter-client'
import { validateAnalysisResult } from './semantic-validation'
import { calculateScore, type CalculatedScore } from '@/lib/scoring/calculate-score'
import { type AnalysisResult } from './schemas'

export interface AnalyzePromptParams {
  inputPrompt: string
  workingLanguage: 'pl' | 'en'
  selectedProfileSlug?: 'general-llm' | 'google-gemini-3-5-flash'
  auditMode?: string | null
  taskGoal?: string | null
  taskType?: string | null
  expectedOutputFormat?: string | null
  constraints?: string | null
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

/**
 * High-level orchestration service that:
 * 1. Resolves the model profile.
 * 2. Builds dynamic system instructions and prompts.
 * 3. Triggers structured LLM evaluation (or returns test mocks).
 * 4. Runs full semantic integrity checks.
 * 5. Computes overall score metrics and confidence levels using standard scoring.
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
    constraints
  } = params

  // 1. Resolve model profile
  const modelProfile = mvpModelProfiles.find((p) => p.slug === selectedProfileSlug)
  if (!modelProfile) {
    throw new Error(`Invalid model profile slug: ${selectedProfileSlug}`)
  }

  // 2. Build system and user prompt
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

  // 3. Execute low-level AI structured generation
  const response = await executeOpenRouterAnalysis(systemInstruction, userPrompt, options)

  // 4. Perform strict semantic validation (Zod & custom constraints)
  const validatedResult = validateAnalysisResult(response.output)

  // 5. Compute mathematical score breakdown
  const scores = calculateScore(validatedResult.criteria_scores)

  return {
    analysis: validatedResult,
    scores,
    usage: response.usage
  }
}
