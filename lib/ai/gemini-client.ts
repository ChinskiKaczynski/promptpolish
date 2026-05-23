import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { analysisResultSchema, type AnalysisResult } from './schemas'
import { normalizeProviderError, ProviderError } from './provider-errors'

export interface GeminiClientOptions {
  mockMode?: boolean
  mockResponse?: AnalysisResult
  temperature?: number
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
): Promise<AnalysisResult> {
  const { mockMode = false, mockResponse, temperature = 0.1 } = options

  // 1. Check and return Mock response if mock mode is active
  if (mockMode || mockResponse) {
    if (mockResponse) {
      return mockResponse
    }
    
    // Lazy load mockAnalysisResult to avoid circular dependency
    const { mockAnalysisResult } = await import('./mock-analysis')
    return mockAnalysisResult
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

    const { output } = await generateText({
      model: google(modelId),
      system: systemInstruction,
      prompt: userPrompt,
      temperature,
      output: Output.object({
        schema: analysisResultSchema
      })
    })

    return output
  } catch (error) {
    // Standardized provider error normalization
    throw normalizeProviderError(error)
  }
}
