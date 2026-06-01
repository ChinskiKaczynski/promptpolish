import 'server-only'

// A server-only model catalog mapping aliases to concrete provider model IDs
export const MODEL_ALIASES: Record<string, string> = {
  cheap: 'deepseek/deepseek-v4-flash',
  fast: 'deepseek/deepseek-v4-flash',
  quality: 'deepseek/deepseek-v4-flash',
  default: 'deepseek/deepseek-v4-flash',
  current: 'deepseek/deepseek-v4-flash'
}

/**
 * Resolves the actual provider model ID from the environment variables and catalog.
 * Priority:
 * 1. AI_MODEL_ALIAS env variable mapped through the catalog (if valid).
 * 2. OPENROUTER_MODEL_ID env variable (direct model ID).
 * 3. Default fallback ('deepseek/deepseek-v4-flash').
 */
export function getOwnerConfiguredModelId(): string {
  const alias = process.env.AI_MODEL_ALIAS?.trim()
  if (alias && MODEL_ALIASES[alias]) {
    return MODEL_ALIASES[alias]
  }

  const directModelId = process.env.OPENROUTER_MODEL_ID?.trim()
  if (directModelId) {
    return directModelId
  }

  return 'deepseek/deepseek-v4-flash'
}
