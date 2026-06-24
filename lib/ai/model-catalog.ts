import 'server-only'

// A server-only model catalog mapping aliases to concrete provider model IDs
export const MODEL_ALIASES: Record<string, string> = {
  cheap: 'openrouter/owl-alpha',
  fast: 'openrouter/owl-alpha',
  quality: 'openrouter/owl-alpha',
  default: 'openrouter/owl-alpha',
  current: 'openrouter/owl-alpha'
}

/**
 * Resolves the actual provider model ID from the environment variables and catalog.
 * Priority:
 * 1. AI_MODEL_ALIAS env variable mapped through the catalog (if valid).
 * 2. OPENROUTER_MODEL_ID env variable (direct model ID).
 * 3. Default fallback ('openrouter/owl-alpha').
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

  return 'openrouter/owl-alpha'
}
