import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('server-only', () => ({}))

describe('Strict Server Environment Parsing', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('correctly parses "true" and "false" string values', async () => {
    process.env.AI_MOCK_MODE = 'true'
    process.env.STRIPE_ENABLED = 'false'

    const { serverEnv } = await import('@/lib/env/server')
    expect(serverEnv.AI_MOCK_MODE).toBe(true)
    expect(serverEnv.STRIPE_ENABLED).toBe(false)
  })

  it('uses default values when variables are empty or missing', async () => {
    delete process.env.AI_MOCK_MODE
    process.env.STRIPE_ENABLED = ''

    const { serverEnv } = await import('@/lib/env/server')
    expect(serverEnv.AI_MOCK_MODE).toBe(false)
    expect(serverEnv.STRIPE_ENABLED).toBe(false)
  })

  it('fails validation and throws on invalid boolean values', async () => {
    process.env.AI_MOCK_MODE = 'maybe'

    await expect(import('@/lib/env/server')).rejects.toThrow(
      'Environment validation failed'
    )
  })

  it('enforces limits on AI_PROVIDER_TIMEOUT_MS', async () => {
    // Under minimum limit (1000)
    process.env.AI_PROVIDER_TIMEOUT_MS = '500'
    await expect(import('@/lib/env/server')).rejects.toThrow(
      'Environment validation failed'
    )
  })
})
