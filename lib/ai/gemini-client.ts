import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { analysisResultSchema, type AnalysisResult } from './schemas'
import { normalizeProviderError, ProviderError } from './provider-errors'

export interface GeminiClientOptions {
  mockMode?: boolean
  mockResponse?: AnalysisResult
  temperature?: number
}

export interface GeminiAnalysisResponse {
  output: AnalysisResult
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Low-level Gemini client that wraps Vercel AI SDK generateText with
 * strictly typed Output.object JSON structured validation.
 * Supports mocked responses directly for testing and local environments.
 */
export async function executeGeminiAnalysis(
  systemInstruction: string,
  userPrompt: string,
  options: GeminiClientOptions = {}
): Promise<GeminiAnalysisResponse> {
  const { mockMode = false, mockResponse, temperature = 0.1 } = options

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
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey || apiKey.trim() === '') {
    throw new ProviderError(
      'Missing Google Generative AI API Key',
      'The prompt analysis engine is not configured with an API key. Please check your system environment.',
      new Error('GOOGLE_GENERATIVE_AI_API_KEY is not defined in environment variables.')
    )
  }

  // 3. Resolve model ID from environment variables
  const modelId = process.env.GEMINI_MODEL_ID || 'gemini-3.5-flash'

  try {
    const google = createGoogleGenerativeAI({
      apiKey
    })

    const { output, usage } = await generateText({
      model: google(modelId),
      system: systemInstruction,
      prompt: userPrompt,
      temperature,
      output: Output.object({
        schema: analysisResultSchema
      })
    })

    const rawUsage = usage as any
    return {
      output,
      usage: usage ? {
        promptTokens: rawUsage.promptTokens,
        completionTokens: rawUsage.completionTokens,
        totalTokens: rawUsage.totalTokens ?? (rawUsage.promptTokens + rawUsage.completionTokens)
      } : undefined
    }
  } catch (error) {
    // Standardized provider error normalization
    throw normalizeProviderError(error)
  }
}
