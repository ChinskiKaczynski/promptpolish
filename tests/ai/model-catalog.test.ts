import { describe, expect, it, beforeEach } from 'vitest'
import { getOwnerConfiguredModelId, MODEL_ALIASES } from '@/lib/ai/model-catalog'

describe('Owner Model Catalog Aliases', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset env variables before each test
    process.env = { ...originalEnv }
    delete process.env.AI_MODEL_ALIAS
    delete process.env.OPENROUTER_MODEL_ID
  })

  it('resolves mapped aliases successfully from AI_MODEL_ALIAS', () => {
    process.env.AI_MODEL_ALIAS = 'cheap'
    expect(getOwnerConfiguredModelId()).toBe(MODEL_ALIASES.cheap)

    process.env.AI_MODEL_ALIAS = 'quality'
    expect(getOwnerConfiguredModelId()).toBe(MODEL_ALIASES.quality)
  })

  it('rejects/falls back on invalid alias to OPENROUTER_MODEL_ID or default', () => {
    process.env.AI_MODEL_ALIAS = 'invalid-alias-name'
    process.env.OPENROUTER_MODEL_ID = 'openrouter/owl-alpha'

    expect(getOwnerConfiguredModelId()).toBe('openrouter/owl-alpha')
  })

  it('reverts to the absolute fallback model if all env values are empty', () => {
    expect(getOwnerConfiguredModelId()).toBe('openrouter/owl-alpha')
  })

  it('uses OPENROUTER_MODEL_ID directly if AI_MODEL_ALIAS is not specified', () => {
    process.env.OPENROUTER_MODEL_ID = 'google/gemini-2.0-flash-exp'
    expect(getOwnerConfiguredModelId()).toBe('google/gemini-2.0-flash-exp')
  })
})
