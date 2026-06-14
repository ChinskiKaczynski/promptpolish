import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

describe('Reliability Runner Production Guards', () => {
  const originalEnv = { ...process.env }
  const originalExit = process.exit
  const originalArgv = process.argv

  beforeEach(() => {
    process.env = { ...originalEnv }
    // Mock process.exit to prevent the test runner itself from exiting
    process.exit = vi.fn() as unknown as (code?: number | string | null | undefined) => never
    process.argv = [...originalArgv, '--dry-run']
  })

  afterEach(() => {
    process.env = originalEnv
    process.exit = originalExit
    process.argv = originalArgv
    vi.clearAllMocks()
  })

  it('exits if Supabase URL matches the production database reference', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://uddpuxpdoctgaqabenol.supabase.co'
    process.env.SUPABASE_SECRET_KEY = 'mock-secret'
    process.env.NODE_ENV = 'development'

    // Reset module cache and import script
    vi.resetModules()
    try {
      await import('../../scripts/run-reliability-suite')
    } catch {
      // Ignored: importing might throw since we mock process.exit and don't actually stop execution
    }

    expect(process.exit).toHaveBeenCalledWith(1)
  })

  it('exits if NODE_ENV is set to production', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://local-test.supabase.co'
    process.env.SUPABASE_SECRET_KEY = 'mock-secret'
    process.env.NODE_ENV = 'production'

    vi.resetModules()
    try {
      await import('../../scripts/run-reliability-suite')
    } catch {
      // Ignored
    }

    expect(process.exit).toHaveBeenCalledWith(1)
  })
})
