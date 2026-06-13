import 'server-only'

export interface ModelPricing {
  provider: string
  modelId: string
  inputCostPerMillion: number  // in micro-dollars
  outputCostPerMillion: number // in micro-dollars
}

// Trusted server-side pricing configuration keyed by provider and model
export const PRICING_CONFIG: Record<string, ModelPricing> = {
  'openrouter:deepseek/deepseek-v4-flash': {
    provider: 'openrouter',
    modelId: 'deepseek/deepseek-v4-flash',
    inputCostPerMillion: 75000,   // $0.075 per 1,000,000 tokens
    outputCostPerMillion: 300000  // $0.30 per 1,000,000 tokens
  }
}

/**
 * Calculates the exact cost in micro-dollars, then returns the cost in USD.
 * If pricing is unknown, returns null.
 */
export function calculateUsageCost(
  provider: string,
  modelId: string,
  promptTokens: number,
  completionTokens: number
): number | null {
  if (
    typeof promptTokens !== 'number' ||
    typeof completionTokens !== 'number' ||
    !Number.isFinite(promptTokens) ||
    !Number.isFinite(completionTokens) ||
    promptTokens < 0 ||
    completionTokens < 0
  ) {
    return null
  }

  const key = `${provider}:${modelId}`
  const pricing = PRICING_CONFIG[key]
  if (!pricing) return null

  // Calculate using integer arithmetic (micro-dollars)
  const inputCostMicro = BigInt(promptTokens) * BigInt(pricing.inputCostPerMillion)
  const outputCostMicro = BigInt(completionTokens) * BigInt(pricing.outputCostPerMillion)
  const totalCostMicro = inputCostMicro + outputCostMicro

  // Convert to USD: totalCostMicro is in micro-dollars * million
  return Number(totalCostMicro) / 1000000000000
}
