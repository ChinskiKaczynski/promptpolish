import 'server-only'

// A server-only model catalog mapping aliases to concrete provider model IDs
export const MODEL_ALIASES: Record<string, string> = {
  cheap: 'gemini-2.5-flash',
  fast: 'gemini-2.5-flash',
  quality: 'gemini-2.5-flash',
  default: 'gemini-2.5-flash',
  current: 'gemini-2.5-flash'
}

/**
 * Resolves the actual provider model ID from the environment variables and catalog.
 * Priority:
 * 1. AI_MODEL_ALIAS env variable mapped through the catalog (if valid).
 * 2. GEMINI_MODEL_ID env variable (direct model ID).
 * 3. Default fallback ('gemini-2.5-flash').
 */
export function getOwnerConfiguredModelId(): string {
  const alias = process.env.AI_MODEL_ALIAS?.trim()
  if (alias && MODEL_ALIASES[alias]) {
    return MODEL_ALIASES[alias]
  }

  const directModelId = process.env.GEMINI_MODEL_ID?.trim()
  if (directModelId) {
    return directModelId
  }

  return process.env.GEMINI_MODEL_ID || 'gemini-2.5-flash'
}
